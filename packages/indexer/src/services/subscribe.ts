import type { Header } from "@polkadot/types/interfaces/runtime";
import { getApi } from "@omni/polkadot";
import { MQ } from "@omni/utils";

import { logger as Logger, services } from "@omni/utils";
const { logger } = Logger;
const MetricsService = services.MetricsService;
import express from "express";

const indexerServer = express();

export async function subscribe(ws: string): Promise<void> {
  const api = await getApi(ws);

  const metrics = new MetricsService(indexerServer, 3050, "omni_indexer_subscriber_");

  await api.rpc.chain.subscribeNewHeads(async (header: Header) => {
    // ws subscription
    const blockNum: string = header.number.toString();
    logger.info(`Chain is at block: #${blockNum}`);

    metrics.startTimer();
    await MQ.getMQ().publish("indexer", Buffer.from(blockNum));
    metrics.endTimer();
  });
}
