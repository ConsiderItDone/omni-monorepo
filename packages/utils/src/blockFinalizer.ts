import { ApiPromise } from "@polkadot/api";
import { Connection, LessThanOrEqual } from "typeorm";
import BlockRepository from "@nodle/db/src/repositories/public/blockRepository";
import { logger } from "@nodle/utils/src/logger";

export async function finalizeBlocks(
  api: ApiPromise,
  connection: Connection
): Promise<void> {
  logger.info("Finalizer started");
  const lastFinalizedHash = await api.rpc.chain.getFinalizedHead();
  const { number: lastFinalizedBlockNumber } = await api.rpc.chain.getHeader(
    lastFinalizedHash
  );
  logger.info(`Last finalized block №: ${lastFinalizedBlockNumber}`);

  const blockRepository = connection.getCustomRepository(BlockRepository);

  const unfinalizedBlocks = await blockRepository.find({
    where: {
      finalized: false,
      number: LessThanOrEqual(lastFinalizedBlockNumber.toNumber()),
    },
    take: 500, // 50 unfinalized blocks in 5 minutes comes from chain (1 block per 6 second). Finalizing with limit of 500 // finalization rate is ~2 blocks/second
  });
  logger.info(
    `Found ${unfinalizedBlocks.length} unfinalized block. Finalization started`
  );

  for (const block of unfinalizedBlocks) {
    logger.info(`Finalizing block ${block.blockId}`);
    block.finalized = true;
    await blockRepository.save(block);
  }
  logger.info(`Finalization done`);
}
