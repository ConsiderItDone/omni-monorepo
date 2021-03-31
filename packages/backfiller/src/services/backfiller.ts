import { Between, Connection } from "typeorm";
import { getApi } from "@nodle/polkadot/src/api";
import {
  handleNewBlock,
  handleEvents,
  handleLogs,
  handleExtrinsics,
  backfillTrackedEvents,
} from "@nodle/polkadot/src";
import BlockRepository from "@nodle/db/src/repositories/public/blockRepository";

export async function backfiller(connection: Connection): Promise<void> {
  const api = await getApi();

  console.log("Backfiller mock");
  // TODO: work with historical blocks

  const limit = 10; // Amount of block to check
  const startBlock = 100528; // Block number to search from
  const endBlock = startBlock + limit + 1; // Last block

  const blockRepository = connection.getCustomRepository(BlockRepository);

  const blocks = await blockRepository.find({
    number: Between(startBlock, startBlock + limit),
  });
  const blockNumbers = blocks.map(
    (block) => parseInt(block.number as string, 10) // Parsing because returns as string
  );

  const missingBlocksNumbers = Array.from(
    Array(endBlock - startBlock),
    (v, i) => i + startBlock
  ).filter((i: number) => !blockNumbers.includes(i));

  for (const blockNumber of missingBlocksNumbers) {
    console.log("Backfilling block: ", blockNumber);
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
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
      newBlockId
    );

    // 3.Logs
    handleLogs(connection, block.header.digest.logs, newBlockId);

    // 4.Events
    const trackedEvents = await handleEvents(
      connection,
      events,
      extrinsicsWithBoundedEvents,
      newBlockId
    );

    //5. Backfilling custom events
    backfillTrackedEvents(connection, trackedEvents, api, newBlockId);
  }
}
