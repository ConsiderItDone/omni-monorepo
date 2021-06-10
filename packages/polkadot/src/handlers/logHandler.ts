import { EntityManager } from "typeorm";
import type { DigestItem, BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Vec } from "@polkadot/types";

import LogRepository from "@nodle/db/src/repositories/public/logRepository";
import { logger, LOGGER_INFO_CONST, LOGGER_ERROR_CONST } from "@nodle/utils/src/logger";
import Log from "@nodle/db/src/models/public/log";

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
