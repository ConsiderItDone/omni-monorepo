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
import express from 'express';

const indexerServer = express();

export async function subscribe(
  ws: string,
  connection: Connection
): Promise<void> {

  const api = await getApi(ws);

  const metrics = new MetricsService(
    indexerServer,
    3050,
    "nodle_indexer_"
  );

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
    
    // 1. Block
    const newBlock = await handleNewBlock(
      connection,
      block.header,
      timestamp,
      specVersion.toNumber()
    );
    MQ.getMQ().emit<Block>("newBlock", newBlock);

    const { blockId } = newBlock;
    // 2. Extrinsics
    const [newExtrinsics, extrinsicsWithBoundedEvents] = await handleExtrinsics(
      connection,
      block.extrinsics,
      events,
      blockId,
      blockNumber
    );
    for (const extrinsic of newExtrinsics) {
      MQ.getMQ().emit<Extrinsic>("newExtrinsic", extrinsic);
    }

    // 3.Logs
    const newLogs = await handleLogs(
      connection,
      block.header.digest.logs,
      blockId,
      blockNumber
    );
    for (const log of newLogs) {
      MQ.getMQ().emit<Log>("newLog", log);
    }

    // 4.Events
    const [newEvents, trackedEvents] = await handleEvents(
      connection,
      events,
      extrinsicsWithBoundedEvents,
      blockId,
      blockNumber
    );
    for (const event of newEvents) {
      MQ.getMQ().emit<EventModel>("newEvent", event);
    }

    //5. Handling custom events
    await handleTrackedEvents(
      connection,
      trackedEvents,
      api,
      blockId,
      blockHash,
      blockNumber
    );

    //const seconds = endMetricsTimer();
    //addBlockToCounter(blockNumber.toString(), seconds)
    metrics.endTimer();
    metrics.addBlockToCounter();
    metrics.setBlockNumber(blockNumber.toNumber());
  });
}
