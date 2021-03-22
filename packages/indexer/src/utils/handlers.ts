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
  RootCertificateRepository,
  VestingScheduleRepository,
} from "../repositories";

import {
  boundEventsToExtrinsics,
  findExtrinsicsWithEventsHash,
  getExtrinsicSuccess,
  addOrReplaceApplication,
} from "./misc";

import {
  ExtrinsicWithBoundedEvents,
  CustomEventSection,
  VestingScheduleOf,
  Application as ApplicationType,
  ApplicationStatus,
} from "./types";

import AccountId from "@polkadot/types/generic/AccountId";
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
    const { method, section, typeDef } = eventRecord.event;
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
      index, // TODO ? : index of event in events array || `${blockNum}-${index}`
      type: typeDef ? JSON.stringify(typeDef) : "error", // TODO What is type of event? typeDef is an array | Is it event_id ? (event_id === eventName === method)
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
  //signer: string,
  api: ApiPromise,
  blockId: number
) {
  const rootCertificateRepository = getCustomRepository(
    RootCertificateRepository
  );
  switch (event.method) {
    // Book a certificate slot (AccountId, CertificateId)
    case "SlotTaken":
      break;
    // Renew a non expired slot and make it valid for a longer time (CertificateId)
    case "SlotRenewed":
      break;
    //Revoke a slot before it is expired thus invalidating all child certificates  (CertificateId)
    case "SlotRevoked":
      break;
    // Mark a slot's child as revoked thus invalidating it  (CertificateId, CertificateId)
    case "ChildSlotRevoked":
      break;
  }

  //const slot = await api.query.pkiRootOfTrust.slots(signer);

  /* const {
    owner,
    key,
    revoked,
    renewed, // TODO 0 while not created
    created, // TODO 0 while not created
    child_revocations,
  } = slot as any; // eslint-disable-line
  if (owner !== "5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM") {
    await rootCertificateRepository.add({
      owner: owner.toHuman(),
      key: key.toHuman(),
      created: new Date(created.toNumber()),
      renewed: new Date(renewed.toNumber()),
      revoked: revoked.toHuman(),
      childRevocations:
        child_revocations.length > 0
          ? child_revocations.map((revokation: string) => revokation.toString())
          : null,
      blockId,
    });
  } else {
    console.log("Skipping empty rootCertificate");
  } */
}
async function handleVestingSchedule(
  event: Event,
  blockId: number,
  api: ApiPromise
) {
  let targetAccount: AccountId = event.data[0] as AccountId; // default
  switch (event.method) {
    // Added new vesting schedule (from, to, vesting_schedule)
    case "VestingScheduleAdded": {
      targetAccount = event.data[1] as AccountId;
      break;
    }
    /// Canceled all vesting schedules (who)
    case "VestingSchedulesCanceled": {
      targetAccount = event.data[0] as AccountId; // event.data[1]
      break;
    }
    /// Claimed vesting (who, locked_amount)
    case "Claimed": {
      targetAccount = event.data[0] as AccountId;
      break;
    }
    default:
      return;
  }
  const grants = ((await api.query.grants.vestingSchedules(
    targetAccount
  )) as any) as VestingScheduleOf[];
  const vestingScheduleRepository = getCustomRepository(
    VestingScheduleRepository
  );
  for (const vestingSchedule of grants) {
    const { start, period, period_count, per_period } = vestingSchedule;
    await vestingScheduleRepository.add({
      start: start.toString(),
      period: period.toString(),
      periodCount: period_count.toNumber(),
      perPeriod: per_period.toString(),
      blockId,
    });
  }
}
async function handleApplication(
  event: Event,
  blockId: number,
  api: ApiPromise
) {
  switch (event.method) {
    /// Someone applied to join the registry  NewApplication(AccountId, Balance)
    case "NewApplication": {
      const accountId = event.data[0].toString();
      // Getting information about applicant & his application
      const applicationData: ApplicationType = ((await api.query.pkiTcr.applications(
        accountId
      )) as any) as ApplicationType;
      await addOrReplaceApplication(
        accountId,
        applicationData,
        blockId,
        ApplicationStatus.pending
      );
      break;
    }
    /// An application passed without being countered  ApplicationPassed(AccountId)
    case "ApplicationPassed": {
      const accountId = event.data[0].toString();
      // Getting information about 'member'(applied user) & his application
      const applicationData: ApplicationType = ((await api.query.pkiTcr.members(
        accountId
      )) as any) as ApplicationType;
      // Will reset previous information and replace it with response
      await addOrReplaceApplication(
        accountId,
        applicationData,
        blockId,
        ApplicationStatus.accepted
      );
      break;
    }
    /// A member's application is being challenged ApplicationChallenged(AccountId, AccountId, Balance)
    case "ApplicationChallenged": {
      const accountId = event.data[0].toString();
      const challengerAcc = event.data[1];
      const balance = event.data[2];
      const applicationData: ApplicationType = ((await api.query.pkiTcr.challenges(
        accountId
      )) as any) as ApplicationType;
      await addOrReplaceApplication(accountId, applicationData, blockId);
      break;
    }

    /// Someone countered an application ApplicationCountered(AccountId, AccountId, Balance)
    case "ApplicationCountered": {
      const counteredAcc = event.data[0];
      const counterAcc = event.data[1];
      const balance = event.data[2];
      break;
    }
    /// A new vote for an application has been recorded VoteRecorded(AccountId, AccountId, Balance, bool)
    case "VoteRecorded": {
      const acc1 = event.data[0];
      const acc2 = event.data[1];
      const balance = event.data[2];
      const bool = event.data[3];
      break;
    }
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
    default:
      return;
  }
}
