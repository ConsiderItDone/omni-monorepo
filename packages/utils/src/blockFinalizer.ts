import { Connection } from "typeorm";
import { BlockRepository } from "@nodle/db";
import { logger } from "./logger";
import { ApiPromise } from "@polkadot/api";

export async function finalizeBlocks(
  createApiConnection: () => Promise<ApiPromise>,
  connection: Connection
): Promise<void> {
  const api = await createApiConnection();
  try {
    logger.info("Finalizer started");
    const lastFinalizedHash = await api.rpc.chain.getFinalizedHead();
    logger.info(`Last finalized block №: ${lastFinalizedHash.toHuman()}`)
    const { number: lastFinalizedBlockNumber } = await api.rpc.chain.getHeader(lastFinalizedHash);
    logger.info(`Last finalized block №: ${lastFinalizedBlockNumber}`);

    const blockRepository = connection.getCustomRepository(BlockRepository);
    const result = await blockRepository.finalizeBlocks(lastFinalizedBlockNumber.toNumber());
    logger.info(`Found ${result.affected} unfinalized block. Finalization done`);
  } catch (e) {
    logger.error(e);
  } finally {
    await api.disconnect();
  }
}
