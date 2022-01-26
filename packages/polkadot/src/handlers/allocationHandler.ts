import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";

import { getAccountBlockBuffer } from "../misc";

import { GenericAccountId } from "@polkadot/types";
import { logger as Logger } from "@nodle/utils";
const { logger, LOGGER_ERROR_CONST } = Logger;
import { MQ } from "@nodle/utils";

export async function handleAllocation(
  event: Event,
  blockId: number,
  blockHash: BlockHash,
  blockNumber: BlockNumber
): Promise<void> {
  try {
    switch (event.method) {
      case "NewAllocation": {
        try {
          await MQ.getMQ().publish(
            "account_indexer",
            getAccountBlockBuffer(event.data[0] as GenericAccountId, blockId, blockHash, blockNumber)
          );
        } catch (accountSaveError) {
          logger.error(LOGGER_ERROR_CONST.ACCOUNT_SAVE_ERROR(blockNumber.toNumber()), accountSaveError);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    logger.error(error);
  }
}
