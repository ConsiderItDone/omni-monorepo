import { ApiPromise } from "@polkadot/api";
import { Connection } from "typeorm";
import type {
  Header,
  DigestItem,
  Moment,
  Balance,
} from "@polkadot/types/interfaces/runtime";
import type { EventRecord, Event } from "@polkadot/types/interfaces/system";
import type { GenericExtrinsic, Vec } from "@polkadot/types";
import { u8aToHex } from "@polkadot/util";

import BlockRepository from "@nodle/db/src/repositories/public/blockRepository";
import EventRepository from "@nodle/db/src/repositories/public/eventRepository";
import ExtrinsicRepository from "@nodle/db/src/repositories/public/extrinsicRepository";
import LogRepository from "@nodle/db/src/repositories/public/logRepository";
import VestingScheduleRepository from "@nodle/db/src/repositories/public/vestingScheduleRepository";

import MQ from "@nodle/utils/src/mq";

import {
  boundEventsToExtrinsics,
  findExtrinsicsWithEventsHash,
  getExtrinsicSuccess,
  upsertApplication,
  changeApplicationStatus,
  upsertRootCertificate,
  recordVote,
  addChallenger,
} from "./misc";

import {
  ExtrinsicWithBoundedEvents,
  CustomEventSection,
  VestingScheduleOf,
  Application as ApplicationType,
  ApplicationStatus,
  RootCertificate,
} from "@nodle/utils/src/types";

import AccountId from "@polkadot/types/generic/AccountId";
import { Codec } from "@polkadot/types/types";

import Extrinsic from "@nodle/db/src/models/public/extrinsic";
import Log from "@nodle/db/src/models/public/log";
import Block from "@nodle/db/src/models/public/block";
import * as EventModel from "@nodle/db/src/models/public/event";
import ApplicationRepository from "@nodle/db/src/repositories/public/applicationRepository";

/******************** BASE HANDLERS **********************/

export async function handleNewBlock(
  connection: Connection,
  blockHeader: Header,
  timestamp: Moment,
  specVersion: number
): Promise<number> {
  const blockRepository = connection.getCustomRepository(BlockRepository);

  const { parentHash, number, stateRoot, extrinsicsRoot, hash } = blockHeader;
  const block = await blockRepository.add({
    number: number.toString(),
    timestamp: new Date(timestamp.toNumber()),
    hash: hash.toHex(),
    parentHash: parentHash.toString(),
    stateRoot: u8aToHex(stateRoot),
    extrinsicsRoot: u8aToHex(extrinsicsRoot),
    specVersion,
    finalized: false,
  });

  MQ.getMQ().emit<Block>("newBlock", block);

  return block.blockId;
}

export async function handleEvents(
  connection: Connection,
  events: Vec<EventRecord>,
  extrinsics: Vec<GenericExtrinsic>,
  blockId: number
): Promise<[ExtrinsicWithBoundedEvents[], Event[]]> {
  const eventRepository = connection.getCustomRepository(EventRepository);

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

    const event = await eventRepository.add({
      index,
      data: data.toHuman() as string,
      extrinsicHash,
      moduleName: section,
      eventName: method,
      blockId,
    });

    MQ.getMQ().emit<EventModel.default>("newEvent", event);
  }

  return [extrinsicsWithBoundedEvents, trackedEvents];
}

export async function handleLogs(
  connection: Connection,
  logs: Vec<DigestItem>,
  blockId: number
): Promise<void> {
  const logRepository = connection.getCustomRepository(LogRepository);

  const newLogs = await logRepository.addList(
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

  for (const log of newLogs) {
    MQ.getMQ().emit<Log>("newLog", log);
  }
}

export async function handleExtrinsics(
  connection: Connection,
  extrinsics: Vec<GenericExtrinsic>,
  extrinsicsWithBoundedEvents: ExtrinsicWithBoundedEvents[],
  blockId: number
  //events: EventRecord[],
): Promise<void> {
  const extrinsicRepository = connection.getCustomRepository(
    ExtrinsicRepository
  );

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
  const newExtrinsics = await extrinsicRepository.addList(processedExtrinsics);

  for (const extrinsic of newExtrinsics) {
    MQ.getMQ().emit<Extrinsic>("newExtrinsic", extrinsic);
  }
}

/******************** CUSTOM EVENTS HANDLERS **********************/

export async function handleTrackedEvents(
  connection: Connection,
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
        handleRootOfTrust(connection, event, api, blockId);
        break;
      case CustomEventSection.VestingSchedule:
        handleVestingSchedule(connection, event, blockId, api);
        break;
      case CustomEventSection.Application:
        handleApplication(connection, event, blockId, api);
        break;
      default:
        return;
    }
  }
}

async function handleRootOfTrust(
  connection: Connection,
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
    case "SlotRenewed":
    case "SlotRevoked":
    case "ChildSlotRevoked":
      break;
  }
  const certificateData: RootCertificate = ((await api.query.pkiRootOfTrust.slots(
    certificateId
  )) as undefined) as RootCertificate;
  await upsertRootCertificate(
    connection,
    certificateId,
    certificateData,
    blockId
  );
}
async function handleVestingSchedule(
  connection: Connection,
  event: Event,
  blockId: number,
  api: ApiPromise // eslint-disable-line
) {
  let targetAccount: string = event.data[0].toString(); // default
  const vestingScheduleRepository = connection.getCustomRepository(
    VestingScheduleRepository
  );

  /* //GET all vesting schedules for account
  const grants = ((await api.query.grants.vestingSchedules(
    account
  )) as any) as VestingScheduleOf[]; */

  switch (event.method) {
    // Added new vesting schedule (from, to, vesting_schedule)
    case "VestingScheduleAdded": {
      targetAccount = event.data[1].toString();
      const vestingScheduleData = (event
        .data[2] as undefined) as VestingScheduleOf;
      const { start, period, period_count, per_period } = vestingScheduleData;
      await vestingScheduleRepository.add({
        accountAddress: targetAccount,
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
      await vestingScheduleRepository.cancelSchedules(targetAccount);
      break;
    }
    /// Claimed vesting (who, locked_amount) DOES NOTHING WITH VESTING SCHEDULES
    case "Claimed":
    default:
      return;
  }
}
async function handleApplication(
  connection: Connection,
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
      const challengedAcc = event.data[0].toString();
      const challengerAcc = event.data[1].toString();
      const challengerDeposit = event.data[2] as Balance;
      const challengedAppData = ((await api.query.pkiTcr.members(
        accountId
      )) as undefined) as ApplicationType;
      addChallenger(
        challengedAcc,
        challengerAcc,
        challengerDeposit.toNumber(),
        blockId,
        challengedAppData
      );
      return;
    }
    /// Someone countered an application ApplicationCountered(AccountId, AccountId, Balance)
    case "ApplicationCountered": {
      const counteredAcc = event.data[0].toString();
      //applicationData = await api.query.pkiTcr.members(counteredAcc);
      changeApplicationStatus(
        connection,
        counteredAcc,
        ApplicationStatus.countered
      );
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
      recordVote(
        connection,
        voteInitiator,
        voteTarget,
        voteValue,
        blockId,
        targetData
      );
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
}

/******************** BACKFILL CUSTOM EVENTS **********************/

export async function backfillTrackedEvents(
  connection: Connection,
  trackedEvents: Event[],
  api: ApiPromise,
  blockId: number
) {
  if (trackedEvents.length < 1) {
    return;
  }
  for (const event of trackedEvents) {
    switch (event.section) {
      case CustomEventSection.RootOfTrust:
        handleRootOfTrust(connection, event, api, blockId);
        break;
      case CustomEventSection.VestingSchedule:
        handleVestingSchedule(connection, event, blockId, api);
        break;
      case CustomEventSection.Application:
        backfillApplication(connection, event, blockId, api);
        break;
      default:
        return;
    }
  }
}

async function backfillApplication(
  connection: Connection,
  event: Event,
  blockId: number,
  api: ApiPromise
) {
  const accountId = event.data[0].toString();
  let applicationData;
  let applicationStatus = ApplicationStatus.pending;
  const applicationRepository = connection.getCustomRepository(
    ApplicationRepository
  );
  switch (event.method) {
    case "NewApplication": {
      applicationData = ((await api.query.pkiTcr.applications(
        accountId
      )) as undefined) as ApplicationType;
      if (applicationIsEmpty(applicationData)) return;
    }
    case "ApplicationPassed": {
      applicationData = ((await api.query.pkiTcr.members(
        accountId
      )) as undefined) as ApplicationType;

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
      const acceptedApplication = ((await api.query.pkiTcr.members(
        accountId
      )) as undefined) as ApplicationType;
      const existingApp = await applicationRepository.findCandidate(
        counteredAcc
      );
      if(!applicationIsEmpty(acceptedApplication)) return
      if (
        existingApp.status === ApplicationStatus.pending
      ) {
        changeApplicationStatus(
          connection,
          counteredAcc,
          ApplicationStatus.countered
        );
      }
      return;
    }
    case "ApplicationChallenged": {
      const challengedAcc = event.data[0].toString();
      const challengerAcc = event.data[1].toString();
      const challengerDeposit = event.data[2] as Balance;
      const challengedAppData = ((await api.query.pkiTcr.members(
        accountId
      )) as undefined) as ApplicationType;
      addChallenger(
        challengedAcc,
        challengerAcc,
        challengerDeposit.toNumber(),
        blockId,
        challengedAppData
      );
      return;
    }
    case "VoteRecorded": {
      const voteTarget = event.data[0] as AccountId;
      const voteInitiator = event.data[1] as AccountId;
      const voteValue = event.data[3].toHuman() as boolean;

      const targetData = ((await api.query.pki.members(
        voteTarget.toString()
      )) as undefined) as ApplicationType;
      recordVote(
        connection,
        voteInitiator,
        voteTarget,
        voteValue,
        blockId,
        targetData
      );
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
}

function applicationIsEmpty(applicationData: ApplicationType) {
  console.log("application is empty");
  return (
    applicationData.candidate.toString() ===
    "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM"
  );
}
