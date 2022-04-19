import { ApiPromise } from "@polkadot/api";
import { EntityManager } from "typeorm";
import type { AccountId, BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import { VestingScheduleRepository } from "@nodle/db";
import { VestingScheduleOf } from "@nodle/utils";
import { logger as Logger } from "@nodle/utils";
const { logger, LOGGER_ERROR_CONST } = Logger;
import { saveAccount, tryFetchAccount } from "../misc";

export async function handleVestingSchedule(
  manager: EntityManager,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockNumber: BlockNumber,
  blockHash: BlockHash
): Promise<void> {
  try {
    let targetAccount = event.data[0];
    const vestingScheduleRepository = manager.getCustomRepository(VestingScheduleRepository);

    switch (event.method) {
      case "VestingScheduleAdded":
      case "VestingSchedulesCanceled":
      case "VestingOverwritten":
      case "Claimed":
        break;
      default:
        return;
    }
    let grants: VestingScheduleOf[];

    const accountInfo = await tryFetchAccount(api, targetAccount as AccountId, blockHash, blockNumber);
    const {
      savedAccount: { accountId },
    } = await saveAccount(manager, accountInfo, blockId);

    try {
      grants = ((await api.query.vesting.vestingSchedules(targetAccount)) as undefined) as VestingScheduleOf[];
    } catch (grantsFetchError) {
      logger.error(
        LOGGER_ERROR_CONST.VESTING_SCHEDULE_FETCH_ERROR(targetAccount.toString(), blockNumber.toNumber()),
        grantsFetchError
      );
    }

    if (grants) {
      await vestingScheduleRepository.removeSchedulesByAccount(accountId);

      for (const grant of grants) {
        const { start, period, periodCount, perPeriod } = grant;
        try {
          await vestingScheduleRepository.add({
            accountId,
            start: start.toString(),
            period: period.toString(),
            periodCount: Number(periodCount.toString()),
            perPeriod: perPeriod.toString(),
            blockId,
          });
        } catch (grantSaveError) {
          logger.error(
            LOGGER_ERROR_CONST.VESTING_SCHEDULE_SAVE_ERROR(targetAccount.toString(), blockNumber.toNumber()),
            grantSaveError
          );
        }
      }
    }
  } catch (error) {
    logger.error(error);
  }
}
