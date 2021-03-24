import { ApiPromise } from "@polkadot/api";
import { getCustomRepository } from "typeorm";
import type {
  Header,
  DigestItem,
  Moment,
} from "@polkadot/types/interfaces/runtime";
import type { EventRecord, Event } from "@polkadot/types/interfaces/system";
import type { GenericExtrinsic, Vec } from "@polkadot/types";
import { u8aToHex } from "@polkadot/util";

import {
  BlockRepository,
  EventRepository,
  ExtrinsicRepository,
  LogRepository,
  VestingScheduleRepository,
} from "../repositories";

import {
  boundEventsToExtrinsics,
  findExtrinsicsWithEventsHash,
  getExtrinsicSuccess,
  upsertApplication,
  changeApplicationStatus,
  upsertRootCertificate,
  recordVote,
} from "./misc";

import {
  ExtrinsicWithBoundedEvents,
  CustomEventSection,
  VestingScheduleOf,
  Application as ApplicationType,
  ApplicationStatus,
  RootCertificate,
} from "./types";

import AccountId from "@polkadot/types/generic/AccountId";
import { Codec } from "@polkadot/types/types";
/******************** BASE HANDLERS **********************/

export async function handleNewBlock(
  blockHeader: Header,
  timestamp: Moment,
  specVersion: number
): Promise<number> {
  const blockRepository = getCustomRepository(BlockRepository);

  const { parentHash, number, stateRoot, extrinsicsRoot, hash } = blockHeader;
  const newBlock = await blockRepository.add({
    number: number.toString(),
    timestamp: new Date(timestamp.toNumber()),
    hash: hash.toHex(),
    parentHash: parentHash.toString(),
    stateRoot: u8aToHex(stateRoot),
    extrinsicsRoot: u8aToHex(extrinsicsRoot),
    specVersion,
    finalized: false,
  });
  return newBlock.blockId;
}

export async function handleEvents(
  events: Vec<EventRecord>,
  extrinsics: Vec<GenericExtrinsic>,
  blockId: number
): Promise<[ExtrinsicWithBoundedEvents[], Event[]]> {
  const eventRepository = getCustomRepository(EventRepository);

  const extrinsicsWithBoundedEvents = boundEventsToExtrinsics(
    extrinsics,
    events
  );

  const trackedEvents: Event[] = [];

  for (const [index, eventRecord] of events.entries()) {
    const { method, section, data } = eventRecord.event;
    if (
      (Object.values(CustomEventSection) as string[]).includes(
        eventRecord.event.section
      )
    ) {
      trackedEvents.push(eventRecord.event);
    }
    const extrinsicHash = findExtrinsicsWithEventsHash(
      extrinsicsWithBoundedEvents,
      eventRecord
    );
    await eventRepository.add({
      index,
      data: data.toHuman(),
      extrinsicHash,
      moduleName: section,
      eventName: method,
      blockId,
    });
  }

  return [extrinsicsWithBoundedEvents, trackedEvents];
}

export async function handleLogs(
  logs: Vec<DigestItem>,
  blockId: number
): Promise<void> {
  const logRepository = getCustomRepository(LogRepository);

  await logRepository.addList(
    logs.map((log: DigestItem, index: number) => {
      const { type, value } = log;
      return {
        index: `${blockId}-${index}`,
        type,
        data: value.toHuman().toString().split(",")[1], // value is always ['BABE':u32, hash:Bytes]
        isFinalized: false, // TODO finalized what ? suggestion is 'preruntime' === false, seal === true
        blockId,
      };
    })
  );
}

export async function handleExtrinsics(
  extrinsics: Vec<GenericExtrinsic>,
  extrinsicsWithBoundedEvents: ExtrinsicWithBoundedEvents[],
  blockId: number
  //events: EventRecord[],
): Promise<void> {
  const extrinsicRepository = getCustomRepository(ExtrinsicRepository);

  const processedExtrinsics = extrinsics.map(
    (extrinsic: GenericExtrinsic, index: number) => {
      return {
        index,
        length: extrinsic.length,
        versionInfo: extrinsic.version.toString(),
        callCode: `${extrinsic.method.section.toString()}.${extrinsic.method.method.toString()}`, // extrinsic.callIndex [0, 1] ??
        callModule: extrinsic.method.section,
        callModuleFunction: extrinsic.method.method,
        params: JSON.stringify(extrinsic.method.args), // TODO changed after downgrade
        nonce: extrinsic.nonce.toNumber(),
        era: extrinsic.era.toString(),
        hash: extrinsic.hash.toHex(),
        isSigned: extrinsic.isSigned,
        signature: extrinsic.isSigned ? extrinsic.signature.toString() : null,
        success: getExtrinsicSuccess(extrinsic, extrinsicsWithBoundedEvents),
        account: null,
        fee: 0, //seems like coming from transactions, not on creation
        blockId,
      };
    }
  );
  await extrinsicRepository.addList(processedExtrinsics);
}

/******************** CUSTOM EVENTS HANDLERS **********************/

export async function handleTrackedEvents(
  trackedEvents: Event[],
  api: ApiPromise,
  blockId: number
): Promise<void> {
  if (trackedEvents.length < 1) {
    return;
  }
  for (const event of trackedEvents) {
    switch (event.section) {
      case CustomEventSection.RootOfTrust:
        handleRootOfTrust(event, api, blockId);
        break;
      case CustomEventSection.VestingSchedule:
        handleVestingSchedule(event, blockId, api);
        break;
      case CustomEventSection.Application:
        handleApplication(event, blockId, api);
        break;
      default:
        return;
    }
  }
}

async function handleRootOfTrust(
  event: Event,
  api: ApiPromise,
  blockId: number
) {
  let certificateId = event?.data[0]?.toString() || "";
  switch (event.method) {
    // Book a certificate slot (AccountId, CertificateId)
    case "SlotTaken":
      certificateId = event.data[1].toString();
      break;
    // Renew a non expired slot and make it valid for a longer time (CertificateId)
    case "SlotRenewed":
      certificateId = event.data[0].toString();
      break;
    //Revoke a slot before it is expired thus invalidating all child certificates  (CertificateId)
    case "SlotRevoked":
      certificateId = event.data[0].toString();
      break;
    // Mark a slot's child as revoked thus invalidating it  (CertificateId, CertificateId)
    case "ChildSlotRevoked":
      certificateId = event.data[0].toString();
      break;
  }
  const certificateData: RootCertificate = ((await api.query.pkiRootOfTrust.slots(
    certificateId
  )) as undefined) as RootCertificate;
  await upsertRootCertificate(certificateId, certificateData, blockId);
}
async function handleVestingSchedule(
  event: Event,
  blockId: number,
  api: ApiPromise // eslint-disable-line
) {
  let targetAccount: AccountId = event.data[0] as AccountId; // default
  const vestingScheduleRepository = getCustomRepository(
    VestingScheduleRepository
  );

  /* //GET all vesting schedules for account
  const grants = ((await api.query.grants.vestingSchedules(
    account
  )) as any) as VestingScheduleOf[]; */

  switch (event.method) {
    // Added new vesting schedule (from, to, vesting_schedule)
    case "VestingScheduleAdded": {
      targetAccount = event.data[1] as AccountId;
      const vestingScheduleData = (event
        .data[2] as undefined) as VestingScheduleOf;
      const { start, period, period_count, per_period } = vestingScheduleData;
      await vestingScheduleRepository.add({
        accountAddress: targetAccount.toString(),
        start: start.toString(),
        period: period.toString(),
        periodCount: period_count.toNumber(),
        perPeriod: per_period.toString(),
        blockId,
      });
      break;
    }
    /// Canceled all vesting schedules (who)
    case "VestingSchedulesCanceled": {
      const accountSchedules = await vestingScheduleRepository.find({
        accountAddress: targetAccount.toString(),
      });
      vestingScheduleRepository.remove(accountSchedules);
      break;
    }
    /// Claimed vesting (who, locked_amount) DOES NOTHING WITH VESTING SCHEDULES
    case "Claimed":
    default:
      return;
  }
}
async function handleApplication(
  event: Event,
  blockId: number,
  api: ApiPromise
) {
  const accountId = event.data[0].toString(); // may be reassigned
  let applicationData: Codec;
  let applicationStatus = ApplicationStatus.pending;

  switch (event.method) {
    /// Someone applied to join the registry  NewApplication(AccountId, Balance)
    case "NewApplication": {
      applicationData = await api.query.pkiTcr.applications(accountId);
      applicationStatus = ApplicationStatus.pending;
      break;
    }
    /// An application passed without being countered  ApplicationPassed(AccountId)
    case "ApplicationPassed": {
      applicationData = await api.query.pkiTcr.members(accountId);
      applicationStatus = ApplicationStatus.accepted;
      break;
    }
    /// A member's application is being challenged ApplicationChallenged(AccountId, AccountId, Balance)
    case "ApplicationChallenged": {
      applicationData = await api.query.pkiTcr.challenges(accountId);
      applicationStatus = ApplicationStatus.accepted;
      break;
    }
    /// Someone countered an application ApplicationCountered(AccountId, AccountId, Balance)
    case "ApplicationCountered": {
      const counteredAcc = event.data[0].toString();
      //applicationData = await api.query.pkiTcr.members(counteredAcc);
      changeApplicationStatus(counteredAcc, ApplicationStatus.countered);
      return;
    }
    /// A new vote for an application has been recorded VoteRecorded(AccountId, AccountId, Balance, bool)
    case "VoteRecorded": {
      const voteTarget = event.data[0] as AccountId;
      const voteInitiator = event.data[1] as AccountId;
      const voteValue = event.data[3].toHuman() as boolean;

      const targetData = ((await api.query.pki.members(
        voteTarget.toString()
      )) as undefined) as ApplicationType;
      recordVote(voteInitiator, voteTarget, voteValue, blockId, targetData);
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
    accountId,
    (applicationData as undefined) as ApplicationType,
    blockId,
    applicationStatus
  );
}
