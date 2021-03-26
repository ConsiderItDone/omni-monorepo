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

export async function subscribe(connection: Connection): Promise<void> {
  const api = await getApi();

  await api.rpc.chain.subscribeNewHeads(async (header: Header) => {
    // ws subscription
    console.log(`Chain is at block: #${header.number.toString()}`);

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

    // 2.Events
    const [extrinsicsWithBoundedEvents, trackedEvents] = await handleEvents(
      connection,
      events,
      block.extrinsics,
      newBlockId
    );

    // 3.Logs
    handleLogs(connection, block.header.digest.logs, newBlockId);

    // 4. Extrinsics
    handleExtrinsics(
      connection,
      block.extrinsics,
      extrinsicsWithBoundedEvents,
      newBlockId
    );
    //5. Handling custom events
    handleTrackedEvents(connection, trackedEvents, api, newBlockId);
  });
}
