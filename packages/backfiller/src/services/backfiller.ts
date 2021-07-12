import { Between, Connection } from "typeorm";
import { getApi } from "@nodle/polkadot/api";
import { handleNewBlock, handleEvents, handleLogs, handleExtrinsics } from "@nodle/polkadot/index";
import { backfillAccounts, backfillTrackedEvents, backfillValidators } from "@nodle/backfiller/src/utils/backfillers";
import BlockRepository from "@nodle/db/repositories/public/blockRepository";
import BackfillProgressRepository from "@nodle/db/repositories/public/backfillProgressRepository";
const { CronJob } = require("cron"); // eslint-disable-line
import { logger } from "@nodle/utils/logger";
import { finalizeBlocks } from "@nodle/utils/blockFinalizer";
import MetricsService from "@nodle/utils/services/metricsService";
import express from "express";

const backfillServer = express();
const metrics = new MetricsService(backfillServer, 3001, "nodle_backfiller_");

export async function backfiller(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);

  // "00 */5 * * * *" to start every 5 minutes
  const backfillJob = new CronJob("00 */5 * * * *", backfill);
  const blockFinalizerJob = new CronJob("00 */1 * * * *", () => finalizeBlocks(api, connection));
  const backfillAccountsJob = new CronJob("00 */30 * * * *", () => backfillAccounts(connection, api));

  const backfillValidatorsJob = new CronJob("00 */30 * * * *", () => backfillValidators(connection, api));

  logger.info("Backfiller started");
  let backfillJobStatus = "waiting";
  backfillJob.start();
  blockFinalizerJob.start();
  backfillAccountsJob.start();
  backfillValidatorsJob.start();

  async function backfill() {
    if (backfillJobStatus !== "waiting") {
      console.log("Backfill cron already running");
      return;
    }
    backfillJobStatus = "running";

    logger.info("Backfill started");
    const backfillProgressRepository = connection.getCustomRepository(BackfillProgressRepository);
    const blockRepository = connection.getCustomRepository(BlockRepository);

    const backfillProgress = await backfillProgressRepository.getProgress();
    const limit = backfillProgress ? backfillProgress.perPage : 1000;

    const {
      block: {
        header: { number: lastBlockNumberInChain },
      },
    } = await api.rpc.chain.getBlock();

    const startBlock = parseInt(backfillProgress.lastBlockNumber as string, 10);
    const lastBlock = lastBlockNumberInChain.toNumber();

    const maxPage = Math.ceil((lastBlock - startBlock) / limit) || 1;

    for (let page = 1; page <= maxPage; page++) {
      const start = startBlock + (page - 1) * limit; // start block for current page
      const max = Math.min(lastBlock, page * limit + startBlock); // max block for current page

      const blocks = await blockRepository.find({
        number: Between(start, max + 1),
      });
      const blockNumbers = blocks.map(
        (block) => parseInt(block.number as string, 10) // Parsing because returns as string
      );

      const missingBlocksNumbers = Array.from(Array(max + 1 - start), (v, i) => i + start).filter(
        (i: number) => !blockNumbers.includes(i)
      );

      logger.info(`Going to backfill ${missingBlocksNumbers.length} missing blocks from ${start} to ${max}`);

      for (const blockNum of missingBlocksNumbers) {
        logger.info(`Backfilling block №: ${blockNum}`);

        //Metrics timer start
        metrics.startTimer();

        const blockHash = await api.rpc.chain.getBlockHash(blockNum);
        const [{ block }, timestamp, events, { specVersion }] = await Promise.all([
          api.rpc.chain.getBlock(blockHash),
          api.query.timestamp.now.at(blockHash),
          api.query.system.events.at(blockHash),
          api.rpc.state.getRuntimeVersion(blockHash),
        ]);
        const blockNumber = block.header.number.unwrap();

        const queryRunner = connection.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
          // 1. Block
          const newBlock = await handleNewBlock(queryRunner.manager, block.header, timestamp, specVersion.toNumber());
          const { blockId } = newBlock;
          // 2. Extrinsics
          const [, extrinsicsWithBoundedEvents] = await handleExtrinsics(
            queryRunner.manager,
            api,
            block.extrinsics,
            events,
            blockId,
            blockNumber,
            blockHash
          );

          // 3.Logs
          await handleLogs(queryRunner.manager, block.header.digest.logs, blockId, blockNumber);

          // 4.Events
          const [, trackedEvents] = await handleEvents(
            queryRunner.manager,
            events,
            extrinsicsWithBoundedEvents,
            blockId,
            blockNumber
          );

          //5. Backfilling custom events
          await backfillTrackedEvents(queryRunner.manager, trackedEvents, api, blockId, blockHash, blockNumber);

          await backfillProgressRepository.updateProgress(blockNumber.toString());

          await queryRunner.commitTransaction();

          // Metrics after block process
          metrics.endTimer();
          metrics.addBlockToCounter();
          metrics.setBlockNumber(blockNumber.toNumber());
        } catch (error) {
          await queryRunner.rollbackTransaction();
        } finally {
          await queryRunner.release();
        }
      }
      logger.info(`Backfiller finished succesfully with last block ${max}`);
      await backfillProgressRepository.updateProgress(max.toString());
      backfillJobStatus = "waiting";
    }
  }
}
