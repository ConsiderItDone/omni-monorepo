import type { Header } from "@polkadot/types/interfaces/runtime";
import { getApi } from "@nodle/polkadot/api";
import MQ from "@nodle/utils/mq";

import { logger } from "@nodle/utils/logger";
import MetricsService from "@nodle/utils/services/metricsService";
import express from "express";

const indexerServer = express();

export async function subscribe(ws: string): Promise<void> {
  const api = await getApi(ws);

  const metrics = new MetricsService(indexerServer, 3050, "nodle_indexer_subscriber_");

  await api.rpc.chain.subscribeNewHeads(async (header: Header) => {
    // ws subscription
    const blockNum: string = header.number.toString();
    logger.info(`Chain is at block: #${blockNum}`);

    metrics.startTimer();
    await MQ.getMQ().publish("indexer", Buffer.from(blockNum));
    metrics.endTimer();
  });
}
