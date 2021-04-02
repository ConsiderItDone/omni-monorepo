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
import BackfillProgressRepository from "@nodle/db/src/repositories/public/backfillProgressRepository";

const CronJob = require("cron").CronJob;

export async function backfiller(connection: Connection): Promise<void> {
  const api = await getApi();

  // "00 00 00 * * *" to start every midnight
  // "00 */5 * * * *" to start every 5 minutes
  const job = new CronJob("00 00 00 * * *", backfill);
  console.log("Backfiller started");
  job.start();

  async function backfill() {
    const backfillProgressRepository = connection.getCustomRepository(
      BackfillProgressRepository
    );
    const blockRepository = connection.getCustomRepository(BlockRepository);

    const backfillProgress = await backfillProgressRepository.getProgress();

    const {
      block: {
        header: { number: lastBlockNumberInChain },
      },
    } = await api.rpc.chain.getBlock();

    const startBlock = parseInt(backfillProgress.lastBlockNumber as string, 10); // Block number to search from; TODO handle bigInt
    const limit = backfillProgress.perPage; // Amount of block to check
    const endBlock = await getEndBlock(
      blockRepository,
      startBlock,
      limit,
      lastBlockNumberInChain.toString()
    );

    const blocks = await blockRepository.find({
      number: Between(startBlock, endBlock + 1),
    });
    const blockNumbers = blocks.map(
      (block) => parseInt(block.number as string, 10) // Parsing because returns as string
    );

    const missingBlocksNumbers = Array.from(
      Array(endBlock + 1 - startBlock),
      (v, i) => i + startBlock
    ).filter((i: number) => !blockNumbers.includes(i));

    console.log(
      `Going to backfill ${missingBlocksNumbers.length} missing blocks from ${startBlock} to ${endBlock}`
    );
    //console.log(missingBlocksNumbers);

    for (const blockNumber of missingBlocksNumbers) {
      console.log("Backfilling block: ", blockNumber);
      const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
      const [
        { block },
        timestamp,
        events,
        { specVersion },
      ] = await Promise.all([
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
      backfillTrackedEvents(connection, trackedEvents, api, newBlockId, blockHash);
    }
    console.log(`Backfiller finished succesfully with last block ${endBlock}`);
    backfillProgressRepository.updateProgress(endBlock.toString());
  }
}

async function getEndBlock(
  blockRepository: BlockRepository,
  startBlock: number,
  limit: number,
  lastBlockInAChainNumber: string
) {
  let endBlock = startBlock + limit;
  // will increase last block to check, so if limit is 1000 blocks, will make so AT LEAST 1000 block should be backfilled
  for (let i = 1; ; i++) {
    if (startBlock + limit * i >= parseInt(lastBlockInAChainNumber, 10))
      return parseInt(lastBlockInAChainNumber, 10);
    const blocks = await blockRepository.find({
      number: Between(startBlock, startBlock + limit * i),
    });
    if (limit * i - blocks.length >= limit) {
      endBlock = startBlock + limit * i;
      break;
    }
  }
  return endBlock;
}
