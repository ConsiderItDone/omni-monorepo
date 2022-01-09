import { Between, Connection } from "typeorm";
import type { AccountId } from "@polkadot/types/interfaces/runtime";
import { getApi } from "@nodle/polkadot/src/api";
import { handleNewBlock, handleEvents, handleLogs, handleExtrinsics } from "@nodle/polkadot/src";
import { backfillTrackedEvents, backfillValidators } from "@nodle/backfiller/src/utils/backfillers";
import BlockRepository from "@nodle/db/src/repositories/public/blockRepository";
import BackfillProgressRepository from "@nodle/db/src/repositories/public/backfillProgressRepository";
const { CronJob } = require("cron"); // eslint-disable-line
import { logger } from "@nodle/utils/src/logger";
import { finalizeBlocks } from "@nodle/utils/src/blockFinalizer";
import MetricsService from "@nodle/utils/src/services/metricsService";
import express from "express";
import { ApiPromise } from "@polkadot/api";
import MQ from "@nodle/utils/src/mq";
import { ConsumeMessage } from "amqplib/properties";
import { Channel } from "amqplib";
import { AccountBlockData } from "@nodle/utils/src/types";
import { handleAccountBalance } from "@nodle/polkadot/src/handlers";
import { IAccount } from "@nodle/polkadot/src/misc";
import { PaginationOptions } from "@polkadot/api/types/base";
const backfillServer = express();
const metrics = new MetricsService(backfillServer, 3001, "backfiller_");

export async function blockBackfill(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);

  // init MQ connection
  await MQ.init(process.env.RABBIT_MQ_URL);

  const crontabJob = new CronJob("0 */5 * * * *", () => blockBackfillPublish(api, connection));
  crontabJob.start();
}

export async function blockBackfillDaemon(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);

  // init MQ connection
  await MQ.init(process.env.RABBIT_MQ_URL);

  MQ.getMQ().consume("backfill_block", (msg: ConsumeMessage, channel: Channel) => {
    const blockNumber = Number(msg.content.toString());

    logger.info(`Backfilling block #${blockNumber}`);

    metrics.startTimer();
    try {
      blockBackfillConsume(blockNumber, api, connection, metrics, msg, channel);
    } catch (error) {
      logger.error(error);
      channel.ack(msg);
      metrics.resetTimer();
    }
  });
}

async function blockBackfillPublish(api: ApiPromise, connection: Connection) {
  logger.info("Backfill started");
  const backfillProgressRepository = connection.getCustomRepository(BackfillProgressRepository);
  const blockRepository = connection.getCustomRepository(BlockRepository);

  const backfillProgress = await backfillProgressRepository.getProgress();
  const limit = backfillProgress ? backfillProgress.perPage : 1000;

  const {
    block: {
      header: { number: lastBlockNumberInChain },
    },
  } = await api.rpc.chain.getBlock();

  const startBlock = parseInt(backfillProgress.lastBlockNumber as string, 10);
  const lastBlock = lastBlockNumberInChain.toNumber();

  logger.info(`Progress`, { startBlock, lastBlock });

  const maxPage = Math.ceil((lastBlock - startBlock) / limit) || 1;

  for (let page = 1; page <= maxPage; page++) {
    const start = startBlock + (page - 1) * limit; // start block for current page
    const max = Math.min(lastBlock, page * limit + startBlock); // max block for current page

    const blocks = await blockRepository.find({
      number: Between(start, max + 1),
    });
    const blockNumbers = blocks.map(
      (block) => parseInt(block.number as string, 10) // Parsing because returns as string
    );

    const missingBlocksNumbers = Array.from(Array(max + 1 - start), (v, i) => i + start).filter(
      (i: number) => !blockNumbers.includes(i)
    );

    logger.info(`Going to backfill ${missingBlocksNumbers.length} missing blocks from ${start} to ${max}`);

    for (const blockNum of missingBlocksNumbers) {
      logger.info(`Publishing block №: ${blockNum} to backfiller queue`);

      //Metrics timer start
      metrics.startTimer();
      await MQ.getMQ().publish("backfill_block", Buffer.from(blockNum.toString()));
      metrics.endTimer();
    }
  }
}

async function blockBackfillConsume(
  blockNum: number,
  api: ApiPromise,
  connection: Connection,
  metrics: MetricsService,
  msg: ConsumeMessage,
  channel: Channel
) {
  const blockHash = await api.rpc.chain.getBlockHash(blockNum);
  const [{ block }, timestamp, events, { specVersion }] = await Promise.all([
    api.rpc.chain.getBlock(blockHash),
    api.query.timestamp.now.at(blockHash),
    api.query.system.events.at(blockHash),
    api.rpc.state.getRuntimeVersion(blockHash),
  ]);
  const blockNumber = block.header.number.unwrap();

  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Block
    const newBlock = await handleNewBlock(queryRunner.manager, block.header, timestamp, specVersion.toNumber());
    const { blockId } = newBlock;
    // 2. Extrinsics
    const [, extrinsicsWithBoundedEvents] = await handleExtrinsics(
      queryRunner.manager,
      api,
      block.extrinsics,
      events,
      blockId,
      blockNumber,
      blockHash
    );

    // 3.Logs
    await handleLogs(queryRunner.manager, block.header.digest.logs, blockId, blockNumber);

    // 4.Events
    const [, trackedEvents] = await handleEvents(
      queryRunner.manager,
      events,
      extrinsicsWithBoundedEvents,
      blockId,
      blockNumber
    );

    //5. Backfilling custom events
    await backfillTrackedEvents(queryRunner.manager, trackedEvents, api, blockId, blockHash, blockNumber);

    await queryRunner.commitTransaction();

    channel.ack(msg);

    // Metrics after block process
    metrics.endTimer();
    metrics.addBlockToCounter();
    metrics.setBlockNumber(blockNumber.toNumber());
  } catch (error) {
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
}

export async function accountBackfill(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);

  // init MQ connection
  await MQ.init(process.env.RABBIT_MQ_URL);
  accountBackfillPublish(api, connection);
  // const crontabJob = new CronJob("0 */12 * * *", () => accountBackfillPublish(api, connection));
  // crontabJob.start();
}

export async function accountBackfillDaemon(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);

  // init MQ connection
  await MQ.init(process.env.RABBIT_MQ_URL);

  MQ.getMQ().consume("backfill_account", async (msg: ConsumeMessage, channel: Channel) => {
    const parsed = JSON.parse(msg.content.toString());

    const { account, blockHash, blockId, blockNumber } = parsed;
    const address = account[0];
    try {
      console.log(`Processing account: ${address}`);
      console.time(`Account ${address} processing time`);
      await accountBackfillConsume(
        api,
        connection,
        { address, blockHash, blockId: Number(blockId), blockNumber: Number(blockNumber) },
        { address, data: account[1] }
      );
      console.timeEnd(`Account ${address} processing time`);
      channel.ack(msg);
    } catch (error) {
      logger.error(error);
      channel.ack(msg);
    }
  });
}

async function accountBackfillPublish(api: ApiPromise, connection: Connection) {
  logger.info("Backfill started");

  console.time("Get accounts from chain");

  const { blockId, hash, number: blockNumber } = await connection
    .getCustomRepository(BlockRepository)
    .findOne({ order: { number: "DESC" } });

  const limit = 500;
  let lastKey: AccountId = null;
  let pages = 0;
  //eslint-disable-next-line
  while (true) {
    console.log(`Querying ${pages + 1} page`);
    console.time("Process page");
    const opts: PaginationOptions = {
      pageSize: limit,
    };
    if (lastKey !== null) {
      opts.startKey = String(lastKey);
    }
    const query = await api.query.system.account.entriesPaged(opts);
    if (query.length == 0) {
      break;
    }
    pages++;

    for (const account of query) {
      const address = account[0].toHuman().toString();

      const dataToSend = {
        account: { ...account, 0: address },
        blockHash: hash,
        blockId,
        blockNumber,
      };
      const encodedData = Buffer.from(JSON.stringify(dataToSend));

      await MQ.getMQ().publish("backfill_account", encodedData);

      lastKey = account[0] as AccountId;
    }

    console.timeEnd("Process page");
  }
  console.timeEnd("Get accounts from chain");
}

async function accountBackfillConsume(
  api: ApiPromise,
  connection: Connection,
  data: AccountBlockData,
  prefetched?: IAccount
) {
  console.log(`Consuming ${prefetched.address}`);
  await handleAccountBalance(api, connection, data, prefetched);
  console.log(`${prefetched.address} consumed`);
}

export async function backfiller(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);

  // eslint-disable-next-line
  //let backfillAccountRunning = false;

  // "00 */5 * * * *" to start every 5 minutes
  const blockFinalizerJob = new CronJob("00 */1 * * * *", () => finalizeBlocks(api, connection));
  // const backfillAccountsJob = new CronJob("00 */30 * * * *", () =>
  //   backfillAccountsFromDB(connection, api, backfillAccountRunning)
  // );

  const backfillValidatorsJob = new CronJob("00 */30 * * * *", () => backfillValidators(connection, api));

  logger.info("Backfiller started");
  blockFinalizerJob.start();
  // backfillAccountsJob.start();
  backfillValidatorsJob.start();
}
