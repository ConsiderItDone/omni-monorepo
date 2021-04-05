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

import {
  startMetricsServer,
  addBlockToCounter,
  blockProcessingHistogram,
  setGauge,
} from "./metrics";
import Logger from "@nodle/utils/src/logger";

const logger = new Logger();

export async function subscribe(connection: Connection): Promise<void> {
  startMetricsServer();

  const api = await getApi();

  await api.rpc.chain.subscribeNewHeads(async (header: Header) => {
    // ws subscription
    logger.info(`Chain is at block: #${header.number.toString()}`);

    const endMetricsTimer = blockProcessingHistogram.startTimer();

    const blockNumber: BlockNumber = header.number.unwrap();
    const blockHash: BlockHash = await api.rpc.chain.getBlockHash(blockNumber);

    const [{ block }, timestamp, events, { specVersion }] = await Promise.all([
      api.rpc.chain.getBlock(blockHash),
      api.query.timestamp.now.at(blockHash),
      api.query.system.events.at(blockHash),
      api.rpc.state.getRuntimeVersion(blockHash),
    ]);

    // 1. Block
    const newBlockId = await handleNewBlock(
      connection,
      block.header,
      timestamp,
      specVersion.toNumber()
    );

    // 2. Extrinsics
    const extrinsicsWithBoundedEvents = await handleExtrinsics(
      connection,
      block.extrinsics,
      events,
      newBlockId,
      blockNumber
    );
    // 3.Logs
    await handleLogs(
      connection,
      block.header.digest.logs,
      newBlockId,
      blockNumber
    );

    // 4.Events
    const trackedEvents = await handleEvents(
      connection,
      events,
      extrinsicsWithBoundedEvents,
      newBlockId,
      blockNumber
    );

    //5. Handling custom events
    await handleTrackedEvents(
      connection,
      trackedEvents,
      api,
      newBlockId,
      blockHash,
      blockNumber
    );

    //const seconds = endMetricsTimer();
    //addBlockToCounter(blockNumber.toString(), seconds)
    endMetricsTimer();
    addBlockToCounter();
    setGauge(blockNumber.toNumber());
  });
}
