import type { BlockHash } from "@polkadot/types/interfaces/chain";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { handleEvents, handleExtrinsics, handleLogs, handleNewBlock, handleTrackedEvents } from "@nodle/polkadot";
import { MQ } from "@nodle/utils";
import { Block, Extrinsic, Log, Event as EventModel } from "@nodle/db";
import { logger as Logger, services } from "@nodle/utils";
const { logger } = Logger;
type MetricsService = services.MetricsService;
import { ApiPromise } from "@polkadot/api";
import { Connection } from "typeorm";
import { getApi, handleBlockReorg } from "@nodle/polkadot";
import express from "express";
import { ConsumeMessage } from "amqplib/properties";
import { Channel } from "amqplib";
import type { Moment } from "@polkadot/types/interfaces/runtime";

const indexerServer = express();

export async function processBlock(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);
  const metrics = new services.MetricsService(indexerServer, 3051, "nodle_indexer_processor_");

  MQ.getMQ().consume("indexer", (msg: ConsumeMessage, channel: Channel) => {
    const blockNumber = Number(msg.content.toString());

    logger.info(`Processing block #${blockNumber}`);

    metrics.startTimer();
    try {
      consume(blockNumber, api, connection, metrics, msg, channel);
    } catch (error) {
      logger.error(error);
      logger.error(`Error while consuming block ${blockNumber}`);
      channel.ack(msg);
      metrics.resetTimer();
    }
  });
}

async function consume(
  blockNum: number,
  api: ApiPromise,
  connection: Connection,
  metrics: MetricsService,
  msg: ConsumeMessage,
  channel: Channel
) {
  const blockHash: BlockHash = await api.rpc.chain.getBlockHash(blockNum);

  //eslint-disable-next-line
  //@ts-ignore
  const [{ block }, timestamp, events, { specVersion }] = await Promise.all([
    api.rpc.chain.getBlock(blockHash),
    api.query.timestamp.now.at(blockHash),
    api.query.system.events.at(blockHash),
    api.rpc.state.getRuntimeVersion(blockHash),
  ]);

  const blockNumber: BlockNumber = block.header.number.unwrap();

  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Block
    let newBlock = await handleNewBlock(queryRunner.manager, block.header, timestamp as Moment, specVersion.toNumber());
    // block already exists
    if (!newBlock) {
      // it is possible chain was reorg'ed
      const isReorg = await handleBlockReorg(queryRunner.manager, block.header);

      if (!isReorg) {
        channel.ack(msg);

        if (queryRunner.isTransactionActive) {
          await queryRunner.rollbackTransaction();
        }
        return;
      }

      // we are in reorg and deleted old
      //eslint-disable-next-line
      //@ts-ignore
      newBlock = await handleNewBlock(queryRunner.manager, block.header, timestamp, specVersion.toNumber());
    }

    const { blockId } = newBlock;
    // 2. Extrinsics
    const [newExtrinsics, extrinsicsWithBoundedEvents] = await handleExtrinsics(
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
    const newLogs = await handleLogs(queryRunner.manager, block.header.digest.logs, blockId, blockNumber);

    // 4.Events
    const [newEvents, trackedEvents] = await handleEvents(
      queryRunner.manager,
      //eslint-disable-next-line
      //@ts-ignore
      events,
      extrinsicsWithBoundedEvents,
      blockId,
      blockNumber
    );

    //5. Handling custom events
    await handleTrackedEvents(queryRunner.manager, trackedEvents, api, blockId, blockHash, blockNumber);

    console.time("commit");
    await queryRunner.commitTransaction();
    console.timeEnd("commit");

    channel.ack(msg);

    MQ.getMQ().emit<Block>("newBlock", newBlock);
    for (const extrinsic of newExtrinsics) {
      MQ.getMQ().emit<Extrinsic>("newExtrinsic", extrinsic);
    }
    for (const log of newLogs) {
      MQ.getMQ().emit<Log>("newLog", log);
    }
    for (const event of newEvents) {
      MQ.getMQ().emit<EventModel>("newEvent", event);
    }

    //const seconds = endMetricsTimer();
    //addBlockToCounter(blockNumber.toString(), seconds)
    metrics.endTimer();
    metrics.addBlockToCounter();
    metrics.setBlockNumber(blockNumber.toNumber());
    logger.info(`------Finished processing block №: ${blockNumber.toString()}------`);
  } catch (error) {
    logger.error(error);
    logger.error(`Error while processing block ${blockNumber}`);
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
    if (!api.isConnected) {
      logger.info("Api disconnected, reconnecting...");
      api.connect();
    }
  } finally {
    await queryRunner.release();
  }
}
