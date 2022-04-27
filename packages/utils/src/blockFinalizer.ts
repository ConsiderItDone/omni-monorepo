import { Connection } from "typeorm";
import { BlockRepository } from "@nodle/db";
import { logger } from "./logger";
import { getApi } from "@nodle/polkadot";

export async function finalizeBlocks(ws: string, connection: Connection): Promise<void> {
  const api = await getApi(ws);
  logger.info("Finalizer started");
  const lastFinalizedHash = await api.rpc.chain.getFinalizedHead();
  const { number: lastFinalizedBlockNumber } = await api.rpc.chain.getHeader(lastFinalizedHash);
  logger.info(`Last finalized block №: ${lastFinalizedBlockNumber}`);

  const blockRepository = connection.getCustomRepository(BlockRepository);
  const result = await blockRepository.finalizeBlocks(lastFinalizedBlockNumber.toNumber());
  logger.info(`Found ${result.affected} unfinalized block. Finalization done`);
  await api.disconnect();
}
