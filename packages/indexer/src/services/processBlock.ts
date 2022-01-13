import type { BlockHash } from "@polkadot/types/interfaces/chain";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { handleEvents, handleExtrinsics, handleLogs, handleNewBlock, handleTrackedEvents } from "@nodle/polkadot";
import MQ from "@nodle/utils/src/mq";
import Block from "@nodle/db/src/models/public/block";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import Log from "@nodle/db/src/models/public/log";
import { default as EventModel } from "@nodle/db/src/models/public/event";
import { logger } from "@nodle/utils/src/logger";
import { ApiPromise } from "@polkadot/api";
import { Connection } from "typeorm";
import { getApi } from "@nodle/polkadot/src/api";
import MetricsService from "@nodle/utils/src/services/metricsService";
import express from "express";
import { ConsumeMessage } from "amqplib/properties";
import { Channel } from "amqplib";
import { handleBlockReorg } from "@nodle/polkadot/src/handlers/blockHandler";

const indexerServer = express();

export async function processBlock(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);
  const metrics = new MetricsService(indexerServer, 3051, "nodle_indexer_processor_");

  MQ.getMQ().consume("indexer", (msg: ConsumeMessage, channel: Channel) => {
    const blockNumber = Number(msg.content.toString());

    logger.info(`Processing block #${blockNumber}`);

    metrics.startTimer();
    try {
      consume(blockNumber, api, connection, metrics, msg, channel);
    } catch (error) {
      logger.error(error);
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
    let newBlock = await handleNewBlock(queryRunner.manager, block.header, timestamp, specVersion.toNumber());
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
      newBlock = await handleNewBlock(queryRunner.manager, block.header, timestamp, specVersion.toNumber());
    }

    const { blockId } = newBlock;
    // 2. Extrinsics
    const [newExtrinsics, extrinsicsWithBoundedEvents] = await handleExtrinsics(
      queryRunner.manager,
      api,
      block.extrinsics,
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
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
  } finally {
    await queryRunner.release();
  }
}
