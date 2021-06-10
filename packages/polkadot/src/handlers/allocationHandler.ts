import { ApiPromise } from "@polkadot/api";
import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import { AccountInfo } from "@polkadot/types/interfaces/system";

import { saveAccount, tryFetchAccount } from "../misc";

import { GenericAccountId } from "@polkadot/types";
import { logger, LOGGER_ERROR_CONST } from "@nodle/utils/src/logger";

export async function handleAllocation(
  manager: EntityManager,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockHash: BlockHash,
  blockNumber: BlockNumber
): Promise<void> {
  try {
    switch (event.method) {
      case "NewAllocation": {
        const accFrom = [
          event.data[0],
          await tryFetchAccount(api, event.data[0] as GenericAccountId, blockHash, blockNumber),
        ];
        try {
          await saveAccount(manager, accFrom[0] as GenericAccountId, accFrom[1] as AccountInfo, blockId);
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
