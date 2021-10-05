import type { BlockHash } from "@polkadot/types/interfaces/chain";
import type { Header, BlockNumber } from "@polkadot/types/interfaces/runtime";
import { Connection } from "typeorm";
import { getApi } from "@nodle/polkadot/src/api";
import { handleNewBlock, handleEvents, handleLogs, handleExtrinsics, handleTrackedEvents } from "@nodle/polkadot/src";
import MQ from "@nodle/utils/src/mq";

import Block from "@nodle/db/src/models/public/block";
import Log from "@nodle/db/src/models/public/log";
import { default as EventModel } from "@nodle/db/src/models/public/event";
import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import { logger } from "@nodle/utils/src/logger";
import MetricsService from "@nodle/utils/src/services/metricsService";
import express from "express";

const indexerServer = express();

export async function subscribe(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);

  const metrics = new MetricsService(indexerServer, 3050, "nodle_indexer_subscriber_");

  await api.rpc.chain.subscribeNewHeads((header: Header) => {
    // ws subscription
    const blockNum: string = header.number.toString();
    logger.info(`Chain is at block: #${blockNum}`);

    metrics.startTimer();
    MQ.getMQ().publish("indexer", Buffer.from(blockNum));
    metrics.endTimer();
  });
}
