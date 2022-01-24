import { EntityManager } from "typeorm";
import type { DigestItem, BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Vec } from "@polkadot/types";

import { LogRepository, Log } from "@nodle/db/index";
import { logger as Logger } from "@nodle/utils/index";
const { logger, LOGGER_ERROR_CONST, LOGGER_INFO_CONST } = Logger;

export async function handleLogs(
  manager: EntityManager,
  logs: Vec<DigestItem>,
  blockId: number,
  blockNumber: BlockNumber
): Promise<Log[]> {
  try {
    logger.info(LOGGER_INFO_CONST.LOGS_RECEIVED(logs.length, blockNumber?.toNumber()));
    const logRepository = manager.getCustomRepository(LogRepository);

    try {
      const newLogs = await logRepository.addList(
        logs.map((log: DigestItem, index: number) => {
          const { type, value } = log;
          return {
            index: `${blockId}-${index}`,
            type,
            data: value.toHuman().toString().split(",")[1], // value is always ['BABE':u32, hash:Bytes]
            isFinalized: false, // TODO finalized what ? suggestion is 'preruntime' === false, seal === true
            blockId,
          };
        })
      );

      logger.info(
        LOGGER_INFO_CONST.LOGS_SAVED({
          blockId,
          blockNumber: blockNumber.toNumber(),
          length: logs.length,
          savedLength: newLogs.length,
        })
      );

      return newLogs;
    } catch (logsSaveError) {
      logger.error(LOGGER_ERROR_CONST.LOGS_SAVE_ERROR(blockNumber?.toNumber()), logsSaveError);
    }
  } catch (error) {
    logger.error(error);
  }
}
