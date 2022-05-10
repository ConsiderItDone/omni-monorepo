import { Between, Connection } from "typeorm";
import { handleNewBlock, handleEvents, handleLogs, handleExtrinsics } from "@nodle/polkadot";
import { backfillTrackedEvents, backfillValidators } from "../utils";
import { BlockRepository, BackfillProgressRepository } from "@nodle/db";
import type { AccountInfo } from "@polkadot/types/interfaces/system";
import type { AccountId } from "@polkadot/types/interfaces/runtime";
const { CronJob } = require("cron"); // eslint-disable-line
import { services, blockFinalizer, logger as Logger } from "@nodle/utils";
type MetricsService = services.MetricsService;
const { logger } = Logger;
import express from "express";
import { ApiPromise } from "@polkadot/api";
import { MQ } from "@nodle/utils";
import { ConsumeMessage } from "amqplib/properties";
import { Channel } from "amqplib";
import { AccountBlockData } from "@nodle/utils";
import { handleAccountBalance, getApi } from "@nodle/polkadot";
import { PaginationOptions } from "@polkadot/api/types";
import { IAccount } from "@nodle/polkadot";
const backfillServer = express();
const metrics = new services.MetricsService(backfillServer, 3001, "backfiller_");

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
    //eslint-disable-next-line
    //@ts-ignore
    const newBlock = await handleNewBlock(queryRunner.manager, block.header, timestamp, specVersion.toNumber());
    const { blockId } = newBlock;
    // 2. Extrinsics
    const [, extrinsicsWithBoundedEvents] = await handleExtrinsics(
      queryRunner.manager,
      api,
      block.extrinsics,
      //eslint-disable-next-line
      //@ts-ignore
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
      //eslint-disable-next-line
      //@ts-ignore
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
    console.log("parsed", account);
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
      logger.error("backfill_account error");
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
      args: [],
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
      const info = account[1] as AccountInfo;
      const balance = {};

      for (const key of info.data.keys()) {
        // eslint-disable-next-line
        //@ts-ignore
        balance[key] = info.data[key].toString();
      }

      const dataToSend = {
        account: { 0: address, 1: { ...info.toHuman(), data: balance } },
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
  try {
    console.log(`Consuming ${prefetched.address}`);
    await handleAccountBalance(api, connection, data, prefetched);
    console.log(`${prefetched.address} consumed`);
  } catch (e) {
    logger.error("Error consuming account,", e.message);
    throw Error(e?.message)
  }
}

export async function backfiller(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);

  // eslint-disable-next-line
  //let backfillAccountRunning = false;

  // "00 */5 * * * *" to start every 5 minutes
  const blockFinalizerJob = new CronJob("00 */1 * * * *", () => blockFinalizer.finalizeBlocks(api, connection));
  // const backfillAccountsJob = new CronJob("00 */30 * * * *", () =>
  //   backfillAccountsFromDB(connection, api, backfillAccountRunning)
  // );

  const backfillValidatorsJob = new CronJob("00 */30 * * * *", () => backfillValidators(connection, api));

  logger.info("Backfiller started");
  blockFinalizerJob.start();
  // backfillAccountsJob.start();
  backfillValidatorsJob.start();
}
