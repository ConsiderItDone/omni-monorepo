import { ApiPromise } from "@polkadot/api";
import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";

import { CustomEventSection } from "@nodle/utils/src/types";
import { logger, LOGGER_INFO_CONST } from "@nodle/utils/src/logger";
import { Account, Balance } from "@nodle/db/src/models";

import { handleApplication } from "./applicationHandler";
import { handleBalance } from "./balanceHandler";
import { handleRootOfTrust } from "./rootOfTrustHandler";
import { handleVestingSchedule } from "./vestingScheduleHandler";
import { handleAllocation } from "./allocationHandler";

export async function handleTrackedEvents(
  manager: EntityManager,
  trackedEvents: Event[],
  api: ApiPromise,
  blockId: number,
  blockHash: BlockHash,
  blockNumber: BlockNumber
): Promise<{
  accountWithBalances: [
    { savedAccount: Account; savedBalance?: Balance },
    { savedAccount: Account; savedBalance?: Balance }
  ];
}> {
  try {
    if (trackedEvents.length < 1) {
      return;
    }
    logger.info(LOGGER_INFO_CONST.CUSTOM_EVENTS_RECEIVED(trackedEvents.length, blockNumber?.toNumber()));
    for (const event of trackedEvents) {
      switch (event.section) {
        case CustomEventSection.RootOfTrust:
          await handleRootOfTrust(manager, event, api, blockId, blockNumber, blockHash);
          break;
        case CustomEventSection.VestingSchedule:
          await handleVestingSchedule(manager, event, blockId, api, blockNumber, blockHash);
          break;
        case CustomEventSection.Application:
          await handleApplication(manager, event, blockId, api, blockNumber, blockHash);
          break;
        case CustomEventSection.Balance:
          const accountWithBalances = await handleBalance(manager, event, blockId, api, blockHash, blockNumber);
          return { accountWithBalances };
        case CustomEventSection.Allocation:
          await handleAllocation(manager, event, blockId, api, blockHash, blockNumber);
          break;
        default:
          return;
      }
    }
  } catch (error) {
    logger.error(error);
  }
}

export { handleNewBlock } from "./blockHandler";
export { handleEvents } from "./eventHandler";
export { handleExtrinsics } from "./extrinsicHandler";
export { handleLogs } from "./logHandler";
export { handleApplication, handleBalance, handleRootOfTrust, handleVestingSchedule };
