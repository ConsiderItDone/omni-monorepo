import { ApiPromise } from "@polkadot/api";
import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";

import { CustomEventSection } from "@nodle/utils/types";
import { logger, LOGGER_INFO_CONST } from "@nodle/utils/logger";

import { handleApplication } from "./applicationHandler";
import { handleBalance } from "./balanceHandler";
import { handleRootOfTrust } from "./rootOfTrustHandler";
import { handleVestingSchedule } from "./vestingScheduleHandler";
import { handleAllocation } from "./allocationHandler";
import { handleNewBlock } from "./blockHandler";
import { handleEvents } from "./eventHandler";
import { handleExtrinsics } from "./extrinsicHandler";
import { handleLogs } from "./logHandler";

export async function handleTrackedEvents(
  manager: EntityManager,
  trackedEvents: Event[],
  api: ApiPromise,
  blockId: number,
  blockHash: BlockHash,
  blockNumber: BlockNumber
): Promise<void> {
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
          await handleBalance(manager, event, blockId, api, blockHash, blockNumber);
          break;
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

export {
  handleNewBlock,
  handleEvents,
  handleExtrinsics,
  handleLogs,
  handleApplication,
  handleBalance,
  handleRootOfTrust,
  handleVestingSchedule,
};

export * as misc from "../misc";
