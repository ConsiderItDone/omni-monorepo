import { EntityManager } from "typeorm";
import type { Header, Moment } from "@polkadot/types/interfaces/runtime";
import { u8aToHex } from "@polkadot/util";

import BlockRepository from "@nodle/db/src/repositories/public/blockRepository";
import Block from "@nodle/db/src/models/public/block";
import { logger, LOGGER_INFO_CONST, LOGGER_ERROR_CONST } from "@nodle/utils/src/logger";

export async function handleNewBlock(
  manager: EntityManager,
  blockHeader: Header,
  timestamp: Moment,
  specVersion: number
): Promise<Block> {
  try {
    logger.info(LOGGER_INFO_CONST.BLOCK_RECEIVED(blockHeader.number.toNumber()));

    const blockRepository = manager.getCustomRepository(BlockRepository);

    const { parentHash, number, stateRoot, extrinsicsRoot, hash } = blockHeader;
    try {
      const block = await blockRepository.add({
        number: number.toString(),
        timestamp: new Date(timestamp.toNumber()),
        hash: hash.toHex(),
        parentHash: parentHash.toString(),
        stateRoot: u8aToHex(stateRoot),
        extrinsicsRoot: u8aToHex(extrinsicsRoot),
        specVersion,
        finalized: false,
      });
      if (block.blockId) {
        logger.info(
          LOGGER_INFO_CONST.BLOCK_SAVED({
            blockId: block.blockId,
            blockNumber: number.toNumber(),
          })
        );
        return block;
      } else {
        logger.info(LOGGER_INFO_CONST.BLOCK_DUPLICATE({ blockNumber: number.toNumber() }));
      }
    } catch (blockSaveError) {
      logger.error(LOGGER_ERROR_CONST.BLOCK_SAVE_ERROR(number.toNumber()), blockSaveError);
    }
  } catch (error) {
    logger.error(error);
  }
}
