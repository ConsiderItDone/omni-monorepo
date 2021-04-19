import { ApiPromise } from "@polkadot/api";
import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";

import VestingScheduleRepository from "@nodle/db/src/repositories/public/vestingScheduleRepository";
import { VestingScheduleOf } from "@nodle/utils/src/types";
import { logger, LOGGER_ERROR_CONST } from "@nodle/utils/src/logger";

export async function handleVestingSchedule(
  manager: EntityManager,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockNumber: BlockNumber
): Promise<void> {
  try {
    let targetAccount: string = event.data[0].toString(); // default
    const vestingScheduleRepository = manager.getCustomRepository(
      VestingScheduleRepository
    );

    switch (event.method) {
      case "VestingScheduleAdded": {
        targetAccount = event.data[1].toString();
        // const vestingScheduleData = (event.data[2] as undefined) as VestingScheduleOf;
        break;
      }
      case "VestingSchedulesCanceled": {
        // await vestingScheduleRepository.cancelSchedules(targetAccount);
        break;
      }
      case "Claimed":
      default:
        return;
    }
    let grants: VestingScheduleOf[];
    try {
      grants = ((await api.query.grants.vestingSchedules(
        targetAccount
      )) as undefined) as VestingScheduleOf[];
    } catch (grantsFetchError) {
      logger.error(
        LOGGER_ERROR_CONST.VESTING_SCHEDULE_FETCH_ERROR(
          targetAccount,
          blockNumber.toNumber()
        ),
        grantsFetchError
      );
    }

    if (grants) {
      await vestingScheduleRepository.removeSchedulesByAccount(targetAccount);

      for (const grant of grants) {
        const { start, period, period_count, per_period } = grant;
        try {
          await vestingScheduleRepository.add({
            accountAddress: targetAccount,
            start: start.toString(),
            period: period.toString(),
            periodCount: period_count.toNumber(),
            perPeriod: per_period.toString(),
            blockId,
            status: "active",
          });
        } catch (grantSaveError) {
          logger.error(
            LOGGER_ERROR_CONST.VESTING_SCHEDULE_SAVE_ERROR(
              targetAccount,
              blockNumber.toNumber()
            ),
            grantSaveError
          );
        }
      }
    }
  } catch (error) {
    logger.error(error);
  }
}
