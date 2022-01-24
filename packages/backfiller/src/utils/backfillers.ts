import { Between, EntityManager } from "typeorm";
import { ApiPromise } from "@polkadot/api";
import type { AccountId, BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { Event, AccountInfoWithProviders } from "@polkadot/types/interfaces/system";
import type { BlockHash } from "@polkadot/types/interfaces/chain";

import {
  upsertApplication,
  changeApplicationStatus,
  applicationIsEmpty,
  tryFetchApplication,
  ApplicationFetchMethods,
  saveAccount,
  saveValidator,
  tryFetchAccount,
} from "@nodle/polkadot/misc";
import { CustomEventSection, Application as ApplicationType, ApplicationStatus } from "@nodle/utils/index";
import { logger as Logger } from "@nodle/utils/index";
const { logger } = Logger;
import { ApplicationRepository, AccountRepository, BlockRepository } from "@nodle/db/index";
import { handleBalance, handleRootOfTrust, handleVestingSchedule } from "@nodle/polkadot/index";
import { Connection } from "typeorm";

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
          await handleRootOfTrust(manager, event, api, blockId, blockNumber, blockHash);
          break;
        case CustomEventSection.VestingSchedule:
          await handleVestingSchedule(manager, event, blockId, api, blockNumber, blockHash);
          break;
        case CustomEventSection.Application:
          await backfillApplication(manager, event, blockId, api, blockNumber, blockHash);
          break;
        case CustomEventSection.Balance:
          await handleBalance(event, blockId, blockHash, blockNumber, true);
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
  blockNumber: BlockNumber,
  blockHash: BlockHash
): Promise<void> {
  try {
    const accountId = event.data[0].toString();
    let applicationData: ApplicationType;
    let applicationStatus = ApplicationStatus.pending;
    const applicationRepository = manager.getCustomRepository(ApplicationRepository);
    const accountRepository = manager.getCustomRepository(AccountRepository);
    switch (event.method) {
      case "NewApplication": {
        applicationData = await tryFetchApplication(api, ApplicationFetchMethods.Applications, accountId, blockNumber);
        if (applicationIsEmpty(applicationData)) return;

        const account = await accountRepository.findByAddress(accountId);
        const existingApplication = await applicationRepository.findCandidate(account.accountId);
        if (existingApplication) return;
        break;
      }
      case "ApplicationPassed": {
        applicationData = await tryFetchApplication(api, ApplicationFetchMethods.Members, accountId, blockNumber);

        if (applicationIsEmpty(applicationData)) return;

        const candidateAcc = await accountRepository.findByAddress(applicationData.candidate.toString());

        const candidate = await applicationRepository.findCandidate(candidateAcc.accountId);
        if (candidate) return;
        else applicationStatus = ApplicationStatus.accepted;
        break;
      }
      case "ApplicationCountered": {
        const counteredAcc = await accountRepository.findByAddress(event.data[0].toString());
        const acceptedApplication = await tryFetchApplication(
          api,
          ApplicationFetchMethods.Challenges,
          accountId,
          blockNumber
        );
        const existingApp = await applicationRepository.findCandidate(counteredAcc.accountId);
        if (!applicationIsEmpty(acceptedApplication)) return;
        if (existingApp.status === ApplicationStatus.pending) {
          await changeApplicationStatus(manager, counteredAcc.accountId, ApplicationStatus.countered);
        }
        return;
      }
      case "ApplicationChallenged": {
        //const challengedAcc = event.data[0].toString();
        //const challengerAcc = event.data[1].toString();
        //const challengerDeposit = event.data[2] as Balance;
        applicationData = await tryFetchApplication(api, ApplicationFetchMethods.Challenges, accountId, blockNumber);
        applicationStatus = ApplicationStatus.challenged;
        break;
      }
      case "VoteRecorded": {
        //const voteTarget = event.data[0] as AccountId;
        //const voteInitiator = event.data[1] as AccountId;
        //const voteValue = event.data[3].toHuman() as boolean;
        applicationData = await tryFetchApplication(api, ApplicationFetchMethods.Challenges, accountId, blockNumber);
        applicationStatus = ApplicationStatus.challenged;
        break;
      }

      /// A challenge killed the given application ChallengeRefusedApplication(AccountId),
      case "ChallengeRefusedApplication": {
        applicationData = await tryFetchApplication(api, ApplicationFetchMethods.Challenges, accountId, blockNumber);
        applicationStatus = ApplicationStatus.refused;
        break;
      }
      /// A challenge accepted the application  ChallengeAcceptedApplication(AccountId),
      case "ChallengeAcceptedApplication": {
        applicationData = await tryFetchApplication(api, ApplicationFetchMethods.Challenges, accountId, blockNumber);
        applicationStatus = ApplicationStatus.accepted;
        break;
      }

      default:
        return;
    }
    await upsertApplication(
      api,
      manager,
      accountId,
      (applicationData as undefined) as ApplicationType,
      blockHash,
      blockNumber,
      blockId,
      applicationStatus
    );
  } catch (error) {
    logger.error(error);
  }
}

export async function backfillAccounts(connection: Connection, api: ApiPromise): Promise<void> {
  const accounts = await api.query.system.account.entries();
  const { number } = await api.rpc.chain.getHeader();

  const blockRepository = connection.getCustomRepository(BlockRepository);
  const { blockId } = await blockRepository.findOne({
    number: number.toString(),
  });

  for (const account of accounts) {
    const entityManager = await connection.createEntityManager();
    await saveAccount(entityManager, { address: account[0].toString(), data: account[1] }, blockId);
  }
}

export async function backfillAccountsFromDB(
  connection: Connection,
  api: ApiPromise,
  isRunning: boolean
): Promise<void> {
  if (isRunning) {
    logger.info("Backfill accounts cron already running");
    return;
  }
  isRunning = true;

  logger.info("Backfill accounts running");
  const accountRepository = await connection.getCustomRepository(AccountRepository);

  const count = await accountRepository.count();
  const limit = 500;
  const lastPage = Math.ceil(count / limit) || 1;

  for (let page = 1; page <= lastPage; page++) {
    const firstAtPage = (page - 1) * limit + 1;
    const lastAtPage = page * limit;

    const accounts = await accountRepository.find({
      where: {
        accountId: Between(firstAtPage, lastAtPage),
      },
    });
    const { hash, number } = await api.rpc.chain.getHeader();

    const blockRepository = connection.getCustomRepository(BlockRepository);
    const currentBlock = await blockRepository.findOne({
      number: number.toString(),
    });

    for (const account of accounts) {
      logger.info(`backfilling account: ${account.address}`);
      const accountInfo = await tryFetchAccount(api, account.address, hash, number.unwrap());
      const entityManager = await connection.createEntityManager();
      await saveAccount(entityManager, accountInfo, currentBlock?.blockId);
    }
  }
  isRunning = false;
}

export async function backfillValidators(connection: Connection, api: ApiPromise): Promise<void> {
  const validators = await api.query.session.validators();

  if (validators && validators.length > 0) {
    const validatorDatas = await Promise.all(validators.map((authorityId) => api.query.system.account(authorityId)));
    for (const [index, validator] of validators.entries()) {
      const entityManager = await connection.createEntityManager();
      const { savedAccount: validatorAccount } = await saveAccount(entityManager, {
        address: validator,
        data: validatorDatas[index],
      });
      await saveValidator(
        entityManager,
        validatorAccount.accountId,
        validator as AccountId,
        (validatorDatas[index] as unknown) as AccountInfoWithProviders
      );
    }
  }
}
