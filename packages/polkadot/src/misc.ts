import type {
  EventRecord,
  Event,
  AccountInfo,
  AccountInfoWithProviders,
} from "@polkadot/types/interfaces/system";
import type { GenericEventData, GenericExtrinsic, Vec } from "@polkadot/types";
import { AccountId, BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import {
  ExtrinsicWithBoundedEvents,
  Application as ApplicationType,
  RootCertificate as RootCertificateType,
  ApplicationStatus,
  VestingScheduleOf as VestingScheduleType,
} from "@nodle/utils/src/types";
import { getCustomRepository, EntityManager } from "typeorm";
import ApplicationRepository from "@nodle/db/src/repositories/public/applicationRepository";
import RootCertificateRepository from "@nodle/db/src/repositories/public/rootCertificateRepository";
import BlockRepository from "@nodle/db/src/repositories/public/blockRepository";
import AccountRepository from "@nodle/db/src/repositories/public/accountRepository";
import ValidatorRepository from "@nodle/db/src/repositories/public/validatorRepository";
import BalanceRepository from "@nodle/db/src/repositories/public/balanceRepository";
import {
  Application as ApplicationModel,
  RootCertificate as RootCertificateModel,
  VestingSchedule as VestingScheduleModel,
  Account as AccountModel,
  Validator,
} from "@nodle/db/src/models";
import { ApiPromise } from "@polkadot/api";
import { logger, LOGGER_ERROR_CONST } from "@nodle/utils/src/logger";

// Bounding events to Extrinsics with 'phase.asApplyExtrinsic.eq(----))'
export function boundEventsToExtrinsics(
  extrinsics: Vec<GenericExtrinsic>,
  events: Vec<EventRecord>
): ExtrinsicWithBoundedEvents[] {
  return extrinsics.map(({ hash }, index) => {
    const boundedEvents: Event[] = events
      .filter(
        ({ phase }: EventRecord) =>
          phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index)
      )
      .map(({ event }: EventRecord) => event);

    return { hash: hash.toHex(), boundedEvents };
  });
}
export function findExtrinsicsWithEventsHash(
  extrinsicsWithBoundedEvents: ExtrinsicWithBoundedEvents[],
  eventRecord: EventRecord
): string | null {
  return (
    extrinsicsWithBoundedEvents.find((extrinsic) =>
      extrinsic.boundedEvents.some(
        (event) => event.hash.toHex() === eventRecord.event.hash.toHex()
      )
    )?.hash || null
  );
}
export function getExtrinsicSuccess(
  extrinsic: GenericExtrinsic,
  extrinsicsWithBoundedEvents: ExtrinsicWithBoundedEvents[]
  //extrinsicIndex: number,
  //events: EventRecord[],
  //api: ApiPromise
): boolean {
  const extr = extrinsicsWithBoundedEvents.find(
    (e) => e.hash === extrinsic.hash.toHex()
  );
  return extr.boundedEvents.some(
    (event) => event.method === "ExtrinsicSuccess"
  );
}

export function extractArgs(data: GenericEventData): string[] {
  const {
    meta: { documentation },
  } = data;

  let args = documentation[0]?.toString()?.match(/(?<=\[)(.*?)(?=\])/g);

  if (!args) {
    return [];
  }

  args = args[0]?.split(",")?.map((i) => i.replace(/\\/g, "").trim());

  return args;
}

export function transformEventData(data: GenericEventData): string | unknown {
  const args = extractArgs(data);
  if (args.length > 0) {
    //eslint-disable-next-line
    const res: any = {};
    args.map((arg, index) => (res[arg] = data[index].toHuman()));
    return res;
  }
  return data.toHuman();
}

/******************* Application utils *************************************/
export enum ApplicationFetchMethods {
  Applications = "applications",
  Members = "members",
  Challenges = "challenges",
}
export async function tryFetchApplication(
  api: ApiPromise,
  method: string,
  accountAddress: string,
  blockNumber: BlockNumber
): Promise<ApplicationType> {
  try {
    switch (method) {
      case ApplicationFetchMethods.Applications:
        return (await api.query.pkiTcr.applications(
          accountAddress
        )) as undefined;
      case ApplicationFetchMethods.Members:
        return (await api.query.pkiTcr.members(accountAddress)) as undefined;
      case ApplicationFetchMethods.Challenges:
        return (await api.query.pkiTcr.challenges(accountAddress)) as undefined;
      default:
        return;
    }
  } catch (applicationFetchError) {
    logger.error(
      LOGGER_ERROR_CONST.APPLICATION_FETCH_ERROR(
        method,
        accountAddress,
        blockNumber.toNumber()
      ),
      applicationFetchError
    );
  }
}
export async function upsertApplication(
  manager: EntityManager,
  accountAddress: string,
  applicationData: ApplicationType,
  blockId: number,
  status?: string
): Promise<void> {
  const applicationRepository = manager.getCustomRepository(
    ApplicationRepository
  );

  const accountRepository = manager.getCustomRepository(AccountRepository);

  const account = await accountRepository.findByAddress(accountAddress);

  const transformedApplicationData = transformApplicationData(
    blockId,
    account.accountId,
    applicationData,
    status
  );
  applicationRepository.upsert(transformedApplicationData);
}

function transformApplicationData(
  blockId: number,
  accountId: number,
  application: ApplicationType,
  status?: string
): ApplicationModel {
  const {
    candidate_deposit,
    metadata,
    challenger,
    challenger_deposit,
    votes_for,
    voters_for,
    votes_against,
    voters_against,
    created_block,
    challenged_block,
  } = application;

  return {
    blockId,
    status,
    accountId,
    candidateDeposit: candidate_deposit.toNumber(),
    metadata: metadata.toString(),
    challenger: challenger?.toString() || null,
    challengerDeposit: challenger_deposit?.toNumber() || null,
    votesFor: votes_for?.toString() || null,
    votersFor: voters_for.map((v) => JSON.stringify(v)),
    votesAgainst: votes_against?.toString() || null,
    votersAgainst: voters_against.map((v) => JSON.stringify(v)),
    createdBlock: created_block.toString(),
    challengedBlock: challenged_block.toString(),
  } as ApplicationModel;
}

export async function changeApplicationStatus(
  manager: EntityManager,
  accountId: number,
  status: ApplicationStatus
): Promise<void> {
  const applicationRepository = manager.getCustomRepository(
    ApplicationRepository
  );
  const existingApplication = await applicationRepository.findCandidate(
    accountId
  );
  if (existingApplication) {
    existingApplication.status = status;
    applicationRepository.save(existingApplication);
  }
}

export async function recordVote(
  manager: EntityManager,
  initiatorId: number,
  targetId: number,
  targetAddress: AccountId,
  value: boolean,
  blockId: number,
  targetData?: ApplicationType
): Promise<void> {
  const applicationRepository = getCustomRepository(ApplicationRepository);

  const targetInDB = await applicationRepository.findCandidate(targetId);

  if (!targetInDB && !targetData) {
    logger.error(
      "Error! Trying to record vote with no data about target(in db and from response)"
    );
  }
  if (targetData) {
    await upsertApplication(
      manager,
      targetAddress.toString(),
      (targetData as undefined) as ApplicationType,
      blockId,
      ApplicationStatus.accepted
    );
  }

  await applicationRepository.changeCandidateVote(initiatorId, targetId, value);
}

export async function addChallenger(
  challengedAcc: string,
  challengerAcc: string,
  challengerDeposit: number,
  blockId: number,
  challengedAppData: ApplicationType
): Promise<void> {
  const applicationRepository = getCustomRepository(ApplicationRepository);
  const accountRepository = getCustomRepository(AccountRepository);
  const blockRepository = getCustomRepository(BlockRepository);

  const account = await accountRepository.findByAddress(challengedAcc);
  const candidate = await applicationRepository.findCandidate(
    account.accountId
  );
  if (candidate) {
    const challengedBlock = await blockRepository.findOne({ blockId: blockId });
    await applicationRepository.addChallenger(
      account.accountId,
      challengerAcc,
      challengerDeposit,
      challengedBlock?.number as string
    );
  } else {
    const transformedApplicationData = transformApplicationData(
      blockId,
      account.accountId,
      challengedAppData,
      ApplicationStatus.accepted
    );
    await applicationRepository.upsert(transformedApplicationData);
  }
}

export function applicationIsEmpty(applicationData: ApplicationType): boolean {
  return (
    applicationData.candidate.toString() ===
    "4h8QZi2vDmMtnAyAWhYsyLqiuxHt2nJFyoVrmHo98e13RHqC"
  );
}

/******************* Root Certificate utils *************************************/
export async function upsertRootCertificate(
  manager: EntityManager,
  certificateId: string,
  certificateData: RootCertificateType,
  blockId: number
): Promise<void> {
  const rootCertificateRepository = manager.getCustomRepository(
    RootCertificateRepository
  );
  const transformedCertificateData = transformCertificateData(
    blockId,
    certificateData
  );
  rootCertificateRepository.upsert(certificateId, transformedCertificateData);
}
function transformCertificateData(
  blockId: number,
  certificateData: RootCertificateType
): RootCertificateModel {
  const {
    owner,
    key,
    revoked,
    renewed,
    created,
    validity,
    child_revocations,
  } = certificateData;

  return {
    owner: owner.toHuman(),
    key: key.toHuman(),
    created: created.toString(),
    renewed: renewed.toString(),
    revoked: revoked.toHuman(),
    validity: validity.toNumber(),
    childRevocations:
      child_revocations.length > 0
        ? child_revocations.map((revokation: AccountId) =>
            revokation.toString()
          )
        : null,
    blockId,
  } as RootCertificateModel;
}

/******************* Vesting Schedules utils *************************************/

export function transformVestingSchedules(
  accountId: number,
  schedulesData: VestingScheduleType[],
  blockId: number
): VestingScheduleModel[] {
  return schedulesData.map((schedule) => {
    const { start, period, period_count, per_period } = schedule;
    return {
      accountId,
      start: start.toString(),
      period: period.toString(),
      periodCount: period_count.toNumber(),
      perPeriod: per_period.toString(),
      blockId,
    } as VestingScheduleModel;
  });
}

/******************* Account utils ****************************/

export async function tryFetchAccount(
  api: ApiPromise,
  accountAddress: AccountId | string,
  blockHash: BlockHash,
  blockNumber: BlockNumber
): Promise<AccountInfo> {
  try {
    return await api.query.system.account.at(blockHash, accountAddress);
  } catch (accountFetchError) {
    logger.error(
      LOGGER_ERROR_CONST.ACCOUNT_FETCH_ERROR(
        accountAddress.toString(),
        blockNumber.toNumber()
      ),
      accountFetchError
    );
  }
}
export async function saveAccount(
  manager: EntityManager,
  accountAddress: AccountId | string,
  accountInfo: AccountInfo,
  blockId?: number
): Promise<AccountModel> {
  const accountRepository = manager.getCustomRepository(AccountRepository);
  const balanceRepository = manager.getCustomRepository(BalanceRepository);

  const address = accountAddress.toString();
  const { nonce, refcount = null, data: balance } = accountInfo;

  const accountData = {
    address: address,
    nonce: nonce?.toNumber(),
    refcount: refcount?.toNumber(),
  };
  const savedAccount = await accountRepository.upsert(address, accountData);

  const { free, reserved, miscFrozen, feeFrozen } = balance;
  const balanceData = {
    accountId: savedAccount.accountId,
    free: free.toString(),
    reserved: reserved.toString(),
    miscFrozen: miscFrozen.toString(),
    feeFrozen: feeFrozen.toString(),
    blockId,
  };
  await balanceRepository.add(balanceData);
  return savedAccount;
}

export async function saveValidator(
  entityManager: EntityManager,
  accountId: number,
  accountAddress: AccountId,
  accountInfo: AccountInfoWithProviders
): Promise<Validator> {
  const validatorRepository = entityManager.getCustomRepository(
    ValidatorRepository
  );
  const { consumers, providers } = accountInfo;

  return await validatorRepository.upsert(accountAddress.toString(), {
    accountId,
    consumers: consumers.toNumber(),
    providers: providers.toNumber(),
  });
}
