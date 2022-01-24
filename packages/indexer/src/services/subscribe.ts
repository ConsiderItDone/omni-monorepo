import type { Header } from "@polkadot/types/interfaces/runtime";
import { getApi } from "@nodle/polkadot/index";
import { MQ } from "@nodle/utils/index";

import { logger as Logger, services } from "@nodle/utils/index";
const { logger } = Logger;
const MetricsService = services.MetricsService;
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
