import type { EventRecord, Event } from "@polkadot/types/interfaces/system";
import type { GenericExtrinsic, Vec } from "@polkadot/types";
import { AccountId } from "@polkadot/types/interfaces/runtime";
import {
  ExtrinsicWithBoundedEvents,
  Application as ApplicationType,
  RootCertificate as RootCertificateType,
  ApplicationStatus,
  VestingScheduleOf as VestingScheduleType,
} from "@nodle/utils/src/types";
import { Connection, getCustomRepository } from "typeorm";
import ApplicationRepository from "@nodle/db/src/repositories/public/applicationRepository";
import RootCertificateRepository from "@nodle/db/src/repositories/public/rootCertificateRepository";
import BlockRepository from "@nodle/db/src/repositories/public/blockRepository";

import {
  Application as ApplicationModel,
  RootCertificate as RootCertificateModel,
  VestingSchedule as VestingScheduleModel,
} from "@nodle/db/src/models";

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
  ); // !!! DANGER ZONE

  /* return events  // TODO find a new way to find extrinsic success
      .filter(
        ({ phase }: EventRecord) =>
          phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(extrinsicIndex)
      )
      .some(({ event }: EventRecord) => api.events.system.ExtrinsicSuccess.is(event)); */
}

/******************* Application utils *************************************/
export async function upsertApplication(
  connection: Connection,
  accountId: string,
  applicationData: ApplicationType,
  blockId: number,
  status?: string
): Promise<void> {
  const applicationRepository = connection.getCustomRepository(
    ApplicationRepository
  );

  const transformedApplicationData = transformApplicationData(
    blockId,
    applicationData,
    status
  );
  applicationRepository.upsert(accountId, transformedApplicationData);
}

function transformApplicationData(
  blockId: number,
  application: ApplicationType,
  status?: string
): ApplicationModel {
  const {
    candidate,
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
    candidate: candidate.toString(),
    candidateDeposit: candidate_deposit.toNumber(),
    metadata: metadata.toString(),
    challenger: challenger.unwrapOr(null),
    challengerDeposit:
      challenger_deposit.unwrapOr(null) &&
      challenger_deposit.unwrap().toNumber(),
    votesFor: votes_for.unwrapOr(null) && votes_for.unwrap().toString(),
    votersFor: voters_for.map((v) => JSON.stringify(v)),
    votesAgainst:
      votes_against.unwrapOr(null) && votes_against.unwrap().toString(),
    votersAgainst: voters_against.map((v) => JSON.stringify(v)),
    createdBlock: created_block.toString(),
    challengedBlock: challenged_block.toString(),
  } as ApplicationModel;
}

export async function changeApplicationStatus(
  connection: Connection,
  accountId: string,
  status: ApplicationStatus
): Promise<void> {
  const applicationRepository = connection.getCustomRepository(
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
  connection: Connection,
  initiatorId: AccountId,
  targetId: AccountId,
  value: boolean,
  blockId: number,
  targetData?: ApplicationType
): Promise<void> {
  const applicationRepository = getCustomRepository(ApplicationRepository);

  const targetInDB = await applicationRepository.findCandidate(
    targetId.toString()
  );

  if (!targetInDB && !targetData) {
    console.log(
      "Error! Trying to record vote with no data about target(in db and from response)"
    );
  }
  if (targetData) {
    await upsertApplication(
      connection,
      targetId.toString(),
      (targetData as undefined) as ApplicationType,
      blockId,
      ApplicationStatus.accepted
    );
  }

  await applicationRepository.changeCandidateVote(
    initiatorId.toString(),
    targetId.toString(),
    value
  );
}

export async function addChallenger(
  challengedAcc: string,
  challengerAcc: string,
  challengerDeposit: number,
  blockId: number,
  challengedAppData: ApplicationType
): Promise<void> {
  const applicationRepository = getCustomRepository(ApplicationRepository);
  const blockRepository = getCustomRepository(BlockRepository);
  const candidate = await applicationRepository.findOne({
    candidate: challengedAcc,
  });
  if (candidate) {
    const challengedBlock = await blockRepository.findOne({ blockId: blockId });
    applicationRepository.addChallenger(
      challengedAcc,
      challengerAcc,
      challengerDeposit,
      challengedBlock?.number as string
    );
  } else {
    const transformedApplicationData = transformApplicationData(
      blockId,
      challengedAppData,
      ApplicationStatus.accepted
    );
    applicationRepository.upsert(challengedAcc, transformedApplicationData);
  }
}

export function applicationIsEmpty(applicationData: ApplicationType) {
  console.log("application is empty");
  return (
    applicationData.candidate.toString() ===
    "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM"
  );
}

/******************* Root Certificate utils *************************************/
export async function upsertRootCertificate(
  connection: Connection,
  certificateId: string,
  certificateData: RootCertificateType,
  blockId: number
): Promise<void> {
  const rootCertificateRepository = connection.getCustomRepository(
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
  accountId: string,
  schedulesData: VestingScheduleType[],
  blockId: number
): VestingScheduleModel[] {
  return schedulesData.map((schedule) => {
    const { start, period, period_count, per_period } = schedule;
    return {
      accountAddress: accountId,
      start: start.toString(),
      period: period.toString(),
      periodCount: period_count.toNumber(),
      perPeriod: per_period.toString(),
      blockId,
    } as VestingScheduleModel;
  });
}
