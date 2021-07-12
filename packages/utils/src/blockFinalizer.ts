import { ApiPromise } from "@polkadot/api";
import { Connection } from "typeorm";
import BlockRepository from "@nodle/db/repositories/public/blockRepository";
import { logger } from "./logger";

export async function finalizeBlocks(api: ApiPromise, connection: Connection): Promise<void> {
  logger.info("Finalizer started");
  const lastFinalizedHash = await api.rpc.chain.getFinalizedHead();
  const { number: lastFinalizedBlockNumber } = await api.rpc.chain.getHeader(lastFinalizedHash);
  logger.info(`Last finalized block №: ${lastFinalizedBlockNumber}`);

  const blockRepository = connection.getCustomRepository(BlockRepository);
  const result = await blockRepository.finalizeBlocks(lastFinalizedBlockNumber.toNumber());
  logger.info(`Found ${result.affected} unfinalized block. Finalization done`);
}
