import type { EventRecord, Event, AccountInfo, AccountInfoWithProviders } from "@polkadot/types/interfaces/system";
import type { GenericEventData, GenericExtrinsic, Vec } from "@polkadot/types";
import { AccountId, BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import { GenericAccountId } from "@polkadot/types";
import { Connection, EntityManager } from "typeorm";
import {
  ApplicationRepository,
  RootCertificateRepository,
  AccountRepository,
  ValidatorRepository,
  BalanceRepository,
  VoteRepository,
  Application as ApplicationModel,
  RootCertificate as RootCertificateModel,
  VestingSchedule as VestingScheduleModel,
  Account as AccountModel,
  Validator,
  Balance as BalanceModel,
} from "@nodle/db";

import { ApiPromise } from "@polkadot/api";
import {
  ExtrinsicWithBoundedEvents,
  Application as ApplicationType,
  RootCertificate as RootCertificateType,
  VestingScheduleOf as VestingScheduleType,
} from "@nodle/utils";
import { types, logger as Logger } from "@nodle/utils";
type ApplicationStatus = types.ApplicationStatus;
const { logger, LOGGER_ERROR_CONST } = Logger;

// import { cacheService } from "@nodle/utils/services/cacheService";

// Bounding events to Extrinsics with 'phase.asApplyExtrinsic.eq(----))'
export function boundEventsToExtrinsics(
  extrinsics: Vec<GenericExtrinsic>,
  events: Vec<EventRecord>
): ExtrinsicWithBoundedEvents[] {
  try {
    return extrinsics.map(({ hash }, index) => {
      const boundedEvents: Event[] = events
        .filter(({ phase }: EventRecord) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index))
        .map(({ event }: EventRecord) => event);

      return { hash: hash.toHex(), boundedEvents };
    });
  } catch (e) {
    logger.error("Error bounding events to extrinsics");
  }
}
export function findExtrinsicsWithEventsHash(
  extrinsicsWithBoundedEvents: ExtrinsicWithBoundedEvents[],
  eventRecord: EventRecord
): string | null {
  return (
    extrinsicsWithBoundedEvents.find((extrinsic) =>
      extrinsic.boundedEvents.some((event) => event.hash.toHex() === eventRecord.event.hash.toHex())
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
  const extr = extrinsicsWithBoundedEvents.find((e) => e.hash === extrinsic.hash.toHex());
  return extr.boundedEvents.some((event) => event.method === "ExtrinsicSuccess");
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

export function transformEventData(
  data: GenericEventData | any //eslint-disable-line
): string | unknown {
  const args = extractArgs(data);
  if (args.length > 0) {
    //eslint-disable-next-line
    const res: any = {};
    args.map(
      (arg, index) =>
        (res[arg] = data?.typeDef[index]?.type === "Balance" ? data[index]?.toString(10) : data[index].toHuman())
    );
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
        return (await api.query.pkiTcr.applications(accountAddress)) as undefined;
      case ApplicationFetchMethods.Members:
        return (await api.query.pkiTcr.members(accountAddress)) as undefined;
      case ApplicationFetchMethods.Challenges:
        return (await api.query.pkiTcr.challenges(accountAddress)) as undefined;
      default:
        return;
    }
  } catch (applicationFetchError) {
    logger.error(
      LOGGER_ERROR_CONST.APPLICATION_FETCH_ERROR(method, accountAddress, blockNumber.toNumber()),
      applicationFetchError
    );
  }
}
export async function upsertApplication(
  api: ApiPromise,
  manager: EntityManager,
  accountAddress: string,
  applicationData: ApplicationType,
  blockHash: BlockHash,
  blockNumber: BlockNumber,
  blockId: number,
  status?: string
): Promise<void> {
  const applicationRepository = manager.getCustomRepository(ApplicationRepository);
  const { challenger } = applicationData;
  const voteRepository = manager.getCustomRepository(VoteRepository);

  const candidateAccount = await getOrCreateAccount(api, manager, accountAddress, blockHash, blockNumber, blockId);
  const challengerAccount = await getOrCreateAccount(
    api,
    manager,
    challenger.toString(),
    blockHash,
    blockNumber,
    blockId
  );

  const transformedApplicationData = transformApplicationData(
    blockId,
    candidateAccount.accountId,
    challengerAccount.accountId,
    applicationData,
    status
  );

  const applicationId = await applicationRepository.upsert(transformedApplicationData);

  const votersAgainst = applicationData.voters_against.map((v) => v[0].toString());
  const votersFor = applicationData.voters_for.map((v) => v[0].toString());

  for (const addr of votersFor) {
    const initiator = await getOrCreateAccount(api, manager, addr, blockHash, blockNumber, blockId);
    await voteRepository.changeCandidateVote(applicationId, initiator.accountId, candidateAccount.accountId, true);
  }

  for (const addr of votersAgainst) {
    const initiator = await getOrCreateAccount(api, manager, addr, blockHash, blockNumber, blockId);
    await voteRepository.changeCandidateVote(applicationId, initiator.accountId, candidateAccount.accountId, false);
  }
}

function transformApplicationData(
  blockId: number,
  candidateId: number,
  challengerId: number,
  application: ApplicationType,
  status?: string
): ApplicationModel {
  const { candidate_deposit, metadata, challenger_deposit, created_block, challenged_block } = application;

  return {
    blockId,
    status,
    candidateId,
    candidateDeposit: candidate_deposit.toNumber(),
    metadata: metadata.toString(),
    challengerId,
    challengerDeposit: challenger_deposit?.toNumber() || null,
    createdBlock: created_block.toString(),
    challengedBlock: challenged_block.toString(),
  } as ApplicationModel;
}

export async function changeApplicationStatus(
  manager: EntityManager,
  accountId: number,
  status: ApplicationStatus
): Promise<void> {
  const applicationRepository = manager.getCustomRepository(ApplicationRepository);
  const existingApplication = await applicationRepository.findCandidate(accountId);
  if (existingApplication) {
    existingApplication.status = status;
    applicationRepository.save(existingApplication);
  }
}

export function applicationIsEmpty(applicationData: ApplicationType): boolean {
  return applicationData.candidate.toString() === "4h8QZi2vDmMtnAyAWhYsyLqiuxHt2nJFyoVrmHo98e13RHqC";
}

/******************* Root Certificate utils *************************************/
export async function upsertRootCertificate(
  api: ApiPromise,
  manager: EntityManager,
  certificateId: number,
  certificateData: RootCertificateType,
  blockHash: BlockHash,
  blockNumber: BlockNumber,
  blockId: number
): Promise<void> {
  const rootCertificateRepository = manager.getCustomRepository(RootCertificateRepository);
  const transformedCertificateData = await transformCertificateData(
    api,
    manager,
    blockHash,
    blockNumber,
    blockId,
    certificateData
  );
  await rootCertificateRepository.upsert(certificateId, transformedCertificateData);
}
async function transformCertificateData(
  api: ApiPromise,
  manager: EntityManager,
  blockHash: BlockHash,
  blockNumber: BlockNumber,
  blockId: number,
  certificateData: RootCertificateType
): Promise<RootCertificateModel> {
  const { owner, key, revoked, renewed, created, validity, child_revocations } = certificateData;

  const keyAccount = await getOrCreateAccount(api, manager, key.toHuman(), blockHash, blockNumber, blockId);

  const ownerAccount = await getOrCreateAccount(api, manager, owner.toHuman(), blockHash, blockNumber, blockId);

  return {
    ownerId: ownerAccount.accountId,
    keyId: keyAccount.accountId,
    created: created.toString(),
    renewed: renewed.toString(),
    revoked: revoked.toHuman(),
    validity: validity.toNumber(),
    childRevocations:
      child_revocations.length > 0 ? child_revocations.map((revokation: AccountId) => revokation.toString()) : null,
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
export interface IAccount {
  address: AccountId | string;
  data: AccountInfo;
}
export async function tryFetchAccount(
  api: ApiPromise,
  accountAddress: AccountId | string,
  blockHash: BlockHash,
  blockNumber?: number | BlockNumber
): Promise<IAccount> {
  try {
    const data = await api.query.system.account.at(blockHash, accountAddress);
    return { address: accountAddress, data };
  } catch (accountFetchError) {
    logger.error(
      LOGGER_ERROR_CONST.ACCOUNT_FETCH_ERROR(
        accountAddress.toString(),
        typeof blockNumber === "number" ? blockNumber : blockNumber?.toNumber()
      ),
      accountFetchError
    );
  }
}
export async function saveAccount(
  manager: EntityManager | Connection,
  account: IAccount,
  blockId?: number,
  options: { accountId?: number; balanceId?: number } = {}
): Promise<{ savedAccount: AccountModel; savedBalance?: BalanceModel }> {
  const accountRepository = manager.getCustomRepository(AccountRepository);
  const balanceRepository = manager.getCustomRepository(BalanceRepository);

  const address = account.address.toString();
  const { nonce, refcount = null, data: balance } = account.data;

  const accountData = {
    address: address,
    nonce: typeof nonce === "number" ? nonce : nonce?.toNumber(),
    refcount: refcount?.toNumber(),
  };
  const savedAccount = await accountRepository.upsert(options?.accountId, accountData);

  const { free, reserved, miscFrozen, feeFrozen } = balance;
  const balanceData = {
    accountId: savedAccount.accountId,
    free: free.toString(),
    reserved: reserved.toString(),
    miscFrozen: miscFrozen.toString(),
    feeFrozen: feeFrozen.toString(),
    blockId,
  };
  const savedBalance = await balanceRepository.upsert(options?.balanceId, balanceData);
  // cacheService.del(address);

  return { savedAccount, savedBalance };
}

export async function saveValidator(
  entityManager: EntityManager,
  accountId: number,
  accountAddress: AccountId,
  accountInfo: AccountInfoWithProviders
): Promise<void | Validator> {
  const validatorRepository = entityManager.getCustomRepository(ValidatorRepository);
  const { consumers, providers } = accountInfo;

  return await validatorRepository.upsert({
    accountId,
    consumers: consumers.toNumber(),
    providers: providers.toNumber(),
  });
}

export async function getOrCreateAccount(
  api: ApiPromise,
  entityManager: EntityManager,
  accountAddress: string,
  blockHash: BlockHash,
  blockNumber: BlockNumber,
  blockId: number
): Promise<AccountModel> {
  const accountRepository = entityManager.getCustomRepository(AccountRepository);

  const account = await accountRepository.findByAddress(accountAddress);
  if (account) {
    return account;
  } else {
    const account = await tryFetchAccount(api, accountAddress, blockHash, blockNumber);
    const { savedAccount } = await saveAccount(entityManager, account, blockId);

    return savedAccount;
  }
}

export const getAccountBlockBuffer = (
  address: string | GenericAccountId,
  blockId: number,
  blockHash: BlockHash,
  blockNumber: BlockNumber
): Buffer => {
  return Buffer.from(
    JSON.stringify({ address: address.toString(), blockId, blockHash, blockNumber: blockNumber.toNumber() })
  );
};
