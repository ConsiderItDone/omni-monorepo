import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import { GenericAccountId } from "@polkadot/types";

import { logger, LOGGER_ERROR_CONST } from "@nodle/utils/src/logger";
import { getAccountBlockBuffer } from "../misc";
import MQ from "@nodle/utils/src/mq";

export async function handleBalance(
  event: Event,
  blockId: number,
  blockHash: BlockHash,
  blockNumber: BlockNumber,
  isBackfiller = false
): Promise<void> {
  try {
    switch (event.method) {
      case "Transfer": {
        try {
          await MQ.getMQ().publish(
            isBackfiller ? "backfill_account" : "account_indexer",
            getAccountBlockBuffer(event.data[0] as GenericAccountId, blockId, blockHash, blockNumber)
          );
          await MQ.getMQ().publish(
            isBackfiller ? "backfill_account" : "account_indexer",
            getAccountBlockBuffer(event.data[1] as GenericAccountId, blockId, blockHash, blockNumber)
          );
        } catch (accountSaveError) {
          logger.error(LOGGER_ERROR_CONST.ACCOUNT_SAVE_ERROR(blockNumber.toNumber()), accountSaveError);
        }
        break;
      }
      case "DustLost": {
        await MQ.getMQ().publish(
          isBackfiller ? "backfill_account" : "account_indexer",
          getAccountBlockBuffer(event.data[0] as GenericAccountId, blockId, blockHash, blockNumber)
        );
        break;
      }
      case "Unreserved":
      case "Reserved": {
        try {
          await MQ.getMQ().publish(
            "account_indexer",
            getAccountBlockBuffer(event.data[1] as GenericAccountId, blockId, blockHash, blockNumber)
          );
        } catch (accountSaveError) {
          logger.error(LOGGER_ERROR_CONST.ACCOUNT_SAVE_ERROR(blockNumber.toNumber()), accountSaveError);
        }
        break;
      }
      default:
        return;
    }
  } catch (error) {
    logger.error(error);
  }
}
