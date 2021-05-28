import { EntityManager } from "typeorm";
import { ApiPromise } from "@polkadot/api";
import type {
  AccountId,
  BlockNumber,
} from "@polkadot/types/interfaces/runtime";
import type {
  Event,
  AccountInfoWithProviders,
} from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";

import {
  upsertApplication,
  changeApplicationStatus,
  applicationIsEmpty,
  tryFetchApplication,
  ApplicationFetchMethods,
  saveAccount,
  saveValidator,
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
import { Connection } from "typeorm";
import BlockRepository from "@nodle/db/src/repositories/public/blockRepository";

export async function backfillTrackedEvents(
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
    for (const event of trackedEvents) {
      switch (event.section) {
        case CustomEventSection.RootOfTrust:
          handleRootOfTrust(manager, event, api, blockId, blockNumber);
          break;
        case CustomEventSection.VestingSchedule:
          handleVestingSchedule(
            manager,
            event,
            blockId,
            api,
            blockNumber,
            blockHash
          );
          break;
        case CustomEventSection.Application:
          backfillApplication(manager, event, blockId, api, blockNumber);
          break;
        case CustomEventSection.Balance:
          handleBalance(manager, event, blockId, api, blockHash, blockNumber);
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
  manager: EntityManager,
  event: Event,
  blockId: number,
  api: ApiPromise,
  blockNumber: BlockNumber
): Promise<void> {
  try {
    const accountId = event.data[0].toString();
    let applicationData: ApplicationType;
    let applicationStatus = ApplicationStatus.pending;
    const applicationRepository = manager.getCustomRepository(
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
            manager,
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

      /// A challenge killed the given application ChallengeRefusedApplication(AccountId),
      case "ChallengeRefusedApplication": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountId,
          blockNumber
        );
        applicationStatus = ApplicationStatus.refused;
        break;
      }
      /// A challenge accepted the application  ChallengeAcceptedApplication(AccountId),
      case "ChallengeAcceptedApplication": {
        applicationData = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountId,
          blockNumber
        );
        applicationStatus = ApplicationStatus.accepted;
        break;
      }

      default:
        return;
    }
    await upsertApplication(
      manager,
      accountId,
      (applicationData as undefined) as ApplicationType,
      blockId,
      applicationStatus
    );
  } catch (error) {
    logger.error(error);
  }
}

export async function backfillAccounts(
  connection: Connection,
  api: ApiPromise
): Promise<void> {
  const accounts = await api.query.system.account.entries();
  const { number } = await api.rpc.chain.getHeader();

  const entityManager = connection.createEntityManager();
  const blockRepository = entityManager.getCustomRepository(BlockRepository);
  const { blockId } = await blockRepository.findOne({
    number: number.toString(),
  });

  for (const account of accounts) {
    saveAccount(
      entityManager,
      (account[0].toHuman() as undefined) as AccountId,
      account[1],
      blockId
    );
  }
}

export async function backfillValidators(
  connection: Connection,
  api: ApiPromise
): Promise<void> {
  const validators = await api.query.session.validators();

  if (validators && validators.length > 0) {
    const validatorDatas = await Promise.all(
      validators.map((authorityId) => api.query.system.account(authorityId))
    );
    for (const [index, validator] of validators.entries()) {
      const entityManager = await connection.createEntityManager();
      const validatorAccount = await saveAccount(
        entityManager,
        validator as AccountId,
        validatorDatas[index]
      );
      await saveValidator(
        entityManager,
        validatorAccount.accountId,
        validator as AccountId,
        (validatorDatas[index] as unknown) as AccountInfoWithProviders
      );
    }
  }
}
