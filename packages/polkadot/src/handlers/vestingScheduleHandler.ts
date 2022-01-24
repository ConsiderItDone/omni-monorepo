import { ApiPromise } from "@polkadot/api";
import { EntityManager } from "typeorm";
import type { AccountId, BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import { VestingScheduleRepository } from "@nodle/db/index";
import { VestingScheduleOf } from "@nodle/utils/index";
import { logger as Logger } from "@nodle/utils/index";
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
      case "VestingScheduleAdded": {
        targetAccount = event.data[1];
        // const vestingScheduleData = (event.data[2] as undefined) as VestingScheduleOf;
        break;
      }
      case "VestingSchedulesCanceled": {
        /* removes vesting schedule. move remain coins to another account. It Does trigger Claim and balance transfer events */
        // await vestingScheduleRepository.cancelSchedules(targetAccount);
        break;
      }
      case "Claimed": {
        //balance resolved by claim extrinsic signer
        break;
      }
      default:
        return;
    }
    let grants: VestingScheduleOf[];

    const accountInfo = await tryFetchAccount(api, targetAccount as AccountId, blockHash, blockNumber);
    const {
      savedAccount: { accountId },
    } = await saveAccount(manager, accountInfo, blockId);

    try {
      grants = ((await api.query.grants.vestingSchedules(targetAccount)) as undefined) as VestingScheduleOf[];
    } catch (grantsFetchError) {
      logger.error(
        LOGGER_ERROR_CONST.VESTING_SCHEDULE_FETCH_ERROR(targetAccount.toString(), blockNumber.toNumber()),
        grantsFetchError
      );
    }

    if (grants) {
      await vestingScheduleRepository.removeSchedulesByAccount(accountId);

      for (const grant of grants) {
        const { start, period, period_count, per_period } = grant;
        try {
          await vestingScheduleRepository.add({
            accountId,
            start: start.toString(),
            period: period.toString(),
            periodCount: period_count.toNumber(),
            perPeriod: per_period.toString(),
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
