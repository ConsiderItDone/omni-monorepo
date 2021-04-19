import { ApiPromise } from "@polkadot/api";
import { EntityManager } from "typeorm";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";

import {
  upsertApplication,
  tryFetchApplication,
  ApplicationFetchMethods,
} from "../misc";

import {
  Application as ApplicationType,
  ApplicationStatus,
} from "@nodle/utils/src/types";

import { logger, LOGGER_ERROR_CONST } from "@nodle/utils/src/logger";

export async function handleApplication(
  manager: EntityManager,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockNumber: BlockNumber
): Promise<void> {
  try {
    const accountAddress = event.data[0].toString(); // may be reassigned
    let applicationData;
    let applicationStatus = ApplicationStatus.pending;

    switch (event.method) {
      case "NewApplication": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Applications,
          accountAddress,
          blockNumber
        );
        applicationStatus = ApplicationStatus.pending;
        break;
      }
      case "ApplicationPassed": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Members,
          accountAddress,
          blockNumber
        );
        applicationStatus = ApplicationStatus.accepted;
        break;
      }
      case "ApplicationChallenged": {
        //const challengedAcc = event.data[0].toString();
        //const challengerAcc = event.data[1].toString();
        //const challengerDeposit = event.data[2] as Balance;
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountAddress,
          blockNumber
        );
        applicationStatus = ApplicationStatus.challenged;
        //addChallenger(challengedAcc,challengerAcc,challengerDeposit.toNumber(),blockId,challengedAppData);
        break;
      }
      case "ApplicationCountered": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountAddress,
          blockNumber
        );
        applicationStatus = ApplicationStatus.countered;
        break;
      }
      case "VoteRecorded": {
        //const voteTarget = event.data[0].toString();
        //const voteInitiator = event.data[1];
        //const voteValue = event.data[3].toHuman() as boolean;
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountAddress,
          blockNumber
        );
        applicationStatus = ApplicationStatus.challenged;
        // recordVote(connection,voteInitiator,voteTarget,voteValue,blockId,targetData);
        break;
      }
      /* 
    /// A challenge killed the given application ChallengeRefusedApplication(AccountId),
    case "ChallengeRefusedApplication": {
      const acc = event.data[0];
      break;
    }
    /// A challenge accepted the application  ChallengeAcceptedApplication(AccountId),
    case "ChallengeAcceptedApplication": {
      const acc = event.data[0];
      break;
    } 
    */
      default:
        return;
    }
    try {
      await upsertApplication(
        manager,
        accountAddress,
        (applicationData as undefined) as ApplicationType,
        blockId,
        applicationStatus
      );
    } catch (applicationUpsertError) {
      logger.error(
        LOGGER_ERROR_CONST.APPLICATION_UPSERT_ERROR(
          accountAddress,
          blockNumber.toNumber()
        ),
        applicationUpsertError
      );
    }
  } catch (error) {
    logger.error(error);
  }
}
