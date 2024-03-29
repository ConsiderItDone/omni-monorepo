import { EntityManager } from "typeorm";
import type { Header, Moment } from "@polkadot/types/interfaces/runtime";
import { u8aToHex } from "@polkadot/util";
import { logger as Logger } from "@omni/utils";
const { logger, LOGGER_ERROR_CONST, LOGGER_INFO_CONST } = Logger;
import {
  BlockRepository,
  EventRepository,
  ExtrinsicRepository,
  LogRepository,
  BalanceRepository,
  Block,
} from "@omni/db";

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

export async function handleBlockReorg(manager: EntityManager, blockHeader: Header): Promise<boolean> {
  try {
    logger.info(LOGGER_INFO_CONST.REORG_CHECK(blockHeader.number.toNumber()));

    const blockRepository = manager.getCustomRepository(BlockRepository);
    const eventRepository = manager.getCustomRepository(EventRepository);
    const balanceRepository = manager.getCustomRepository(BalanceRepository);
    const extrinsicRepository = manager.getCustomRepository(ExtrinsicRepository);
    const logRepository = manager.getCustomRepository(LogRepository);

    const { number, hash } = blockHeader;
    const existingBlock = await blockRepository.findByNumber(number.toNumber());

    if (existingBlock.hash != hash.toString()) {
      // we have existing block with different hash
      logger.info(LOGGER_INFO_CONST.REORG(blockHeader.number.toNumber(), existingBlock.hash, hash.toString()));

      // this block if finalized
      if (existingBlock.finalized) {
        logger.warn(LOGGER_INFO_CONST.REORG_WARNING(blockHeader.number.toNumber()));

        return false;
      }

      // remove existing block information
      const existingBlockId = existingBlock.blockId;

      await balanceRepository.deleteByBlockId(existingBlockId);
      await eventRepository.deleteByBlockId(existingBlockId);
      await extrinsicRepository.deleteByBlockId(existingBlockId);
      await logRepository.deleteByBlockId(existingBlockId);
      await blockRepository.deleteByBlockId(existingBlockId);

      return true;
    }
  } catch (error) {
    logger.error(error);

    return false;
  }
}
