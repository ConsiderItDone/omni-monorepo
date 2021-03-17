import { ApiPromise } from "@polkadot/api";
import { getCustomRepository } from "typeorm";
import type {
  Header,
  DigestItem,
  Moment,
} from "@polkadot/types/interfaces/runtime";
import type { EventRecord } from "@polkadot/types/interfaces/system";
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
} from "./misc";
import { ExtrinsicWithBoundedEvents, CustomExtrinsicSection } from "./types";
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
): Promise<ExtrinsicWithBoundedEvents[]> {
  const eventRepository = getCustomRepository(EventRepository);

  const extrinsicsWithBoundedEvents = boundEventsToExtrinsics(
    extrinsics,
    events
  );

  events.forEach(async (eventRecord: EventRecord, index: number) => {
    const { method, section, typeDef } = eventRecord.event;
    const extrinsicHash = findExtrinsicsWithEventsHash(
      extrinsicsWithBoundedEvents,
      eventRecord
    );
    /* console.log("meta", eventRecord.event.meta.toHuman());
      console.log(JSON.stringify(eventRecord.event));
      console.log(eventRecord.event.method); */

    /* await eventRepository.add({
        index, // TODO ? : index of event in events array || `${blockNum}-${index}`
        type: typeDef ? JSON.stringify(typeDef) : "error", // TODO What is type of event? typeDef is an array | Is it event_id ? (event_id === eventName === method)
        extrinsicHash,
        moduleName: section,
        eventName: method,
        blockId,
      }); */
  });
  return extrinsicsWithBoundedEvents;
}

export async function handleLogs(
  logs: Vec<DigestItem>,
  blockId: number
): Promise<void> {
  const logRepository = getCustomRepository(LogRepository);

  await logRepository.addList(
    logs.map((log: any, index: number) => {
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
): Promise<GenericExtrinsic[]> {
  const extrinsicRepository = getCustomRepository(ExtrinsicRepository);

  const trackedExtrinsics: GenericExtrinsic[] = [];
  const processedExtrinsics = extrinsics.map(
    (extrinsic: GenericExtrinsic, index: number) => {
      if (extrinsic.method.section === "pkiRootOfTrust") {
        trackedExtrinsics.push(extrinsic);
      }
      if (extrinsic.method.section === "grants") {
        trackedExtrinsics.push(extrinsic);
      }
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
        success: getExtrinsicSuccess(extrinsic, extrinsicsWithBoundedEvents), // TODO find a new way to find extrinsic success
        account: null,
        fee: 0, //seems like coming from transactions, not on creation
        blockId,
      };
    }
  );
  await extrinsicRepository.addList(processedExtrinsics);
  return trackedExtrinsics;
}

/******************** CUSTOM EXTRINSIC HANDLERS **********************/

export async function handleTrackedExtrinsics(
  trackedExtrinsics: GenericExtrinsic[],
  api: ApiPromise,
  blockId: number
) {
  if (trackedExtrinsics.length < 1) {
    return;
  }
  for (const extrinsic of trackedExtrinsics) {
    switch (extrinsic.method.section) {
      case CustomExtrinsicSection.RootOfTrust:
        handleRootOfTrust(extrinsic.signer.toHuman() as string, api, blockId);
        break;
      case CustomExtrinsicSection.VestingSchedule:
        handleVestingSchedule(extrinsic, api);
        break;
      default:
        return;
    }
  }
}

async function handleRootOfTrust(
  signer: string,
  api: ApiPromise,
  blockId: number
) {
  const rootCertificateRepository = getCustomRepository(
    RootCertificateRepository
  );

  const slot = await api.query.pkiRootOfTrust.slots(signer);

  const {
    owner,
    key,
    revoked,
    renewed, // TODO 0 while not created
    created, // TODO 0 while not created
    child_revocations,
  } = slot as any;

  await rootCertificateRepository.add({
    owner: owner.toHuman(),
    key: key.toHuman(),
    created: new Date(created.toNumber()),
    renewed: new Date(renewed.toNumber()),
    revoked: revoked.toHuman(),
    childRevocations:
      child_revocations.length > 0
        ? child_revocations.map((revokation: any) => revokation.toString())
        : null,
    blockId,
  });
}
async function handleVestingSchedule(
  extrinsic: GenericExtrinsic,
  api: ApiPromise
) {
  const vestingTargetAccountId: any = extrinsic.args[0].toHuman();
  const vestingData: any = extrinsic.args[1];
  console.log(vestingData.start);
  //console.log(JSON.stringify(extrinsic.args));
  const grant = await api.query.grants.vestingSchedules(vestingTargetAccountId);
  console.log("grant", JSON.stringify(grant));
}
async function handleApplication(params: any) {}
