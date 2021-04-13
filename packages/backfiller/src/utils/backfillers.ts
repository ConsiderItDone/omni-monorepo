import { Connection } from "typeorm";
import { ApiPromise } from "@polkadot/api";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";

import {
  upsertApplication,
  changeApplicationStatus,
  applicationIsEmpty,
  tryFetchApplication,
  ApplicationFetchMethods,
} from "@nodle/polkadot/src/misc";
import {
  CustomEventSection,
  Application as ApplicationType,
  ApplicationStatus,
} from "@nodle/utils/src/types";
import { logger } from "@nodle/utils/src/logger";
import ApplicationRepository from "@nodle/db/src/repositories/public/applicationRepository";
import {
  handleBalance,
  handleRootOfTrust,
  handleVestingSchedule,
} from "@nodle/polkadot/src/handlers";

export async function backfillTrackedEvents(
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
    for (const event of trackedEvents) {
      switch (event.section) {
        case CustomEventSection.RootOfTrust:
          handleRootOfTrust(connection, event, api, blockId, blockNumber);
          break;
        case CustomEventSection.VestingSchedule:
          handleVestingSchedule(connection, event, blockId, api, blockNumber);
          break;
        case CustomEventSection.Application:
          backfillApplication(connection, event, blockId, api, blockNumber);
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

export async function backfillApplication(
  connection: Connection,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockNumber: BlockNumber
): Promise<void> {
  try {
    const accountId = event.data[0].toString();
    let applicationData: ApplicationType;
    let applicationStatus = ApplicationStatus.pending;
    const applicationRepository = connection.getCustomRepository(
      ApplicationRepository
    );
    switch (event.method) {
      case "NewApplication": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Applications,
          accountId,
          blockNumber
        );
        if (applicationIsEmpty(applicationData)) return;
        const existingApplication = await applicationRepository.findCandidate(
          accountId
        );
        if (existingApplication) return;
        break;
      }
      case "ApplicationPassed": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Members,
          accountId,
          blockNumber
        );

        if (applicationIsEmpty(applicationData)) return;

        const candidate = await applicationRepository.findOne({
          candidate: applicationData.candidate.toString(),
        });
        if (candidate) return;
        else applicationStatus = ApplicationStatus.accepted;
        break;
      }
      case "ApplicationCountered": {
        const counteredAcc = event.data[0].toString();
        const acceptedApplication = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountId,
          blockNumber
        );
        const existingApp = await applicationRepository.findCandidate(
          counteredAcc
        );
        if (!applicationIsEmpty(acceptedApplication)) return;
        if (existingApp.status === ApplicationStatus.pending) {
          changeApplicationStatus(
            connection,
            counteredAcc,
            ApplicationStatus.countered
          );
        }
        return;
      }
      case "ApplicationChallenged": {
        //const challengedAcc = event.data[0].toString();
        //const challengerAcc = event.data[1].toString();
        //const challengerDeposit = event.data[2] as Balance;
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountId,
          blockNumber
        );
        applicationStatus = ApplicationStatus.challenged;
        break;
      }
      case "VoteRecorded": {
        //const voteTarget = event.data[0] as AccountId;
        //const voteInitiator = event.data[1] as AccountId;
        //const voteValue = event.data[3].toHuman() as boolean;
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountId,
          blockNumber
        );
        applicationStatus = ApplicationStatus.challenged;
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
    await upsertApplication(
      connection,
      accountId,
      (applicationData as undefined) as ApplicationType,
      blockId,
      applicationStatus
    );
  } catch (error) {
    logger.error(error);
  }
}
