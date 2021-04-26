import type { BlockHash } from "@polkadot/types/interfaces/chain";
import type { Header, BlockNumber } from "@polkadot/types/interfaces/runtime";
import { Connection } from "typeorm";
import { getApi } from "@nodle/polkadot/src/api";
import {
  handleNewBlock,
  handleEvents,
  handleLogs,
  handleExtrinsics,
  handleTrackedEvents,
} from "@nodle/polkadot/src";
import MQ from "@nodle/utils/src/mq";

import Block from "@nodle/db/src/models/public/block";
import Log from "@nodle/db/src/models/public/log";
import { default as EventModel } from "@nodle/db/src/models/public/event";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import { logger } from "@nodle/utils/src/logger";
import MetricsService from "@nodle/utils/src/services/metricsService";
import express from "express";

const indexerServer = express();

export async function subscribe(
  ws: string,
  connection: Connection
): Promise<void> {
  const api = await getApi(ws);

  const metrics = new MetricsService(indexerServer, 3050, "nodle_indexer_");

  await api.rpc.chain.subscribeNewHeads(async (header: Header) => {
    // ws subscription
    logger.info(`Chain is at block: #${header.number.toString()}`);

    metrics.startTimer();

    const blockNumber: BlockNumber = header.number.unwrap();
    const blockHash: BlockHash = await api.rpc.chain.getBlockHash(blockNumber);

    const [{ block }, timestamp, events, { specVersion }] = await Promise.all([
      api.rpc.chain.getBlock(blockHash),
      api.query.timestamp.now.at(blockHash),
      api.query.system.events.at(blockHash),
      api.rpc.state.getRuntimeVersion(blockHash),
    ]);

    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Block
      const newBlock = await handleNewBlock(
        queryRunner.manager,
        block.header,
        timestamp,
        specVersion.toNumber()
      );
      if (!newBlock) return;

      const { blockId } = newBlock;
      // 2. Extrinsics
      const [
        newExtrinsics,
        extrinsicsWithBoundedEvents,
      ] = await handleExtrinsics(
        queryRunner.manager,
        block.extrinsics,
        events,
        blockId,
        blockNumber
      );

      // 3.Logs
      const newLogs = await handleLogs(
        queryRunner.manager,
        block.header.digest.logs,
        blockId,
        blockNumber
      );

      // 4.Events
      const [newEvents, trackedEvents] = await handleEvents(
        queryRunner.manager,
        events,
        extrinsicsWithBoundedEvents,
        blockId,
        blockNumber
      );

      //5. Handling custom events
      await handleTrackedEvents(
        queryRunner.manager,
        trackedEvents,
        api,
        blockId,
        blockHash,
        blockNumber
      );

      await queryRunner.commitTransaction();

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
      logger.info(
        `------Finished processing block №: ${header.number.toString()}------`
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  });
}
