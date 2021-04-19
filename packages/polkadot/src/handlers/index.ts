import { ApiPromise } from "@polkadot/api";
import { Connection } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";

import { CustomEventSection } from "@nodle/utils/src/types";
import { logger, LOGGER_INFO_CONST } from "@nodle/utils/src/logger";

import { handleApplication } from "./applicationHandler";
import { handleBalance } from "./balanceHandler";
import { handleRootOfTrust } from "./rootOfTrustHandler";
import { handleVestingSchedule } from "./vestingScheduleHandler";

export async function handleTrackedEvents(
  connection: Connection,
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
    logger.info(
      LOGGER_INFO_CONST.CUSTOM_EVENTS_RECEIVED(
        trackedEvents.length,
        blockNumber?.toNumber()
      )
    );
    for (const event of trackedEvents) {
      switch (event.section) {
        case CustomEventSection.RootOfTrust:
          handleRootOfTrust(connection, event, api, blockId, blockNumber);
          break;
        case CustomEventSection.VestingSchedule:
          handleVestingSchedule(
            connection,
            event,
            blockId,
            api,
            blockNumber,
            blockHash
          );
          break;
        case CustomEventSection.Application:
          handleApplication(connection, event, blockId, api, blockNumber);
          break;
        case CustomEventSection.Balance:
          handleBalance(
            connection,
            event,
            blockId,
            api,
            blockHash,
            blockNumber
          );
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
export {
  handleApplication,
  handleBalance,
  handleRootOfTrust,
  handleVestingSchedule,
};
