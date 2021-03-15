import { ApiPromise, WsProvider } from "@polkadot/api";
import { getCustomRepository } from "typeorm";
import env from "../env";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import type {
  Header,
  DigestItem,
  Moment,
} from "@polkadot/types/interfaces/runtime";
import type { EventRecord, Event } from "@polkadot/types/interfaces/system";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { GenericExtrinsic, Vec } from "@polkadot/types";
import { u8aToHex } from "@polkadot/util";

import BlockRepository from "../repositories/public/blockRepository";
import EventRepository from "../repositories/public/eventRepository";
import LogRepository from "../repositories/public/logRepository";
import ExtrinsicRepository from "../repositories/public/extrinsicRepository";

const provider = new WsProvider(env.WS_PROVIDER);

async function getApi(): Promise<ApiPromise> {
  return ApiPromise.create({
    provider,
    types: {
      CertificateId: "AccountId",
      Application: {
        candidate: "AccountId",
        candidate_deposit: "Balance",
        metadata: "Vec<u8>",
        challenger: "Option<AccountId>",
        challenger_deposit: "Option<Balance>",
        votes_for: "Option<Balance>",
        voters_for: "Vec<(AccountId, Balance)>",
        votes_against: "Option<Balance>",
        voters_against: "Vec<(AccountId, Balance)>",
        created_block: "BlockNumber",
        challenged_block: "BlockNumber",
      },
      RootCertificate: {
        owner: "AccountId",
        key: "CertificateId",
        created: "BlockNumber",
        renewed: "BlockNumber",
        revoked: "bool",
        validity: "BlockNumber",
        child_revocations: "Vec<CertificateId>",
      },
      Amendment: "Call",
      VestingScheduleOf: {
        start: "BlockNumber",
        period: "BlockNumber",
        period_count: "u32",
        per_period: "Balance",
      },
    },
    rpc: {
      rootOfTrust: {
        isRootCertificateValid: {
          description: "Verify if a root certificate is valid",
          params: [
            {
              name: "cert",
              type: "CertificateId",
            },
          ],
          type: "bool",
        },
        isChildCertificateValid: {
          description: "Verify if a child and root certificates are valid",
          params: [
            {
              name: "root",
              type: "CertificateId",
            },
            {
              name: "child",
              type: "CertificateId",
            },
          ],
          type: "bool",
        },
      },
    },
  });
}

export async function subscribe() {
  const api: ApiPromise = await getApi();
  await api.rpc.chain.subscribeNewHeads(async (header: Header) => {
    // ws subscription
    console.log(`Chain is at block: #${header.number.toString()}`);

    const blockNumber: BlockNumber = header.number.unwrap();
    const blockHash: BlockHash = await api.rpc.chain.getBlockHash(blockNumber);

    const [{ block }, timestamp, events, { specVersion }] = await Promise.all([
      api.rpc.chain.getBlock(blockHash),
      api.query.timestamp.now.at(blockHash),
      api.query.system.events.at(blockHash),
      api.rpc.state.getRuntimeVersion(blockHash),
    ]);

    // 1. Block
    const newBlockId = await handleNewBlock(
      block.header,
      timestamp,
      specVersion.toNumber()
    );

    // 2.Events
    handleEvents(events, block.extrinsics, newBlockId);

    // 3.Logs
    handleLogs(block.header.digest.logs, newBlockId);

    // 4. Extrinsics
    handleExtrinsics(block.extrinsics, events, api, newBlockId);
  });
}

async function handleNewBlock(
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

async function handleEvents(
  events: EventRecord[],
  extrinsics: GenericExtrinsic[],
  blockId: number
): Promise<void> {
  const eventRepository = getCustomRepository(EventRepository);

  const extrinsicsWithBoundedEvents = boundEventsToExtrinsics(
    extrinsics,
    events
  );

  events.forEach(async (eventRecord, index) => {
    const { method, section, typeDef } = eventRecord.event;
    const extrinsicHash = findExtrinsicsWithEventsHash(
      extrinsicsWithBoundedEvents,
      eventRecord
    );

    await eventRepository.add({
      index, // TODO : index of event in events array || `${blockNum}-${index}`
      type: JSON.stringify(typeDef), // TODO What is type of event? typeDef is an array | Is it event_id ? (event_id === eventName === method)
      extrinsicHash,
      moduleName: section,
      eventName: method,
      blockId,
    });
  });
}

async function handleLogs(
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

async function handleExtrinsics(
  extrinsics: GenericExtrinsic[],
  events: EventRecord[],
  api: ApiPromise,
  blockId: number
): Promise<void> {
  const extrinsicRepository = getCustomRepository(ExtrinsicRepository);

  await extrinsicRepository.addList(
    extrinsics.map((extrinsic: GenericExtrinsic, index: number) => ({
      index,
      length: extrinsic.length,
      versionInfo: extrinsic.version.toString(),
      callCode: `${extrinsic.method.section.toString()}.${extrinsic.method.method.toString()}`, // extrinsic.callIndex [0, 1] ??
      callModule: extrinsic.method.section,
      callModuleFunction: extrinsic.method.method,
      params: JSON.stringify(extrinsic.method.toJSON().args),
      nonce: extrinsic.nonce.toNumber(),
      era: extrinsic.era.toString(),
      hash: extrinsic.hash.toHex(),
      isSigned: extrinsic.isSigned,
      signature: extrinsic.isSigned ? extrinsic.signature.toString() : null,
      success: getExtrinsicSuccess(index, events, api),
      account: null,
      fee: 0, //seems like coming from transactions, not on creation
      blockId,
    }))
  );
}

  // Bounding events to Extrinsics with 'phase.asApplyExtrinsic.eq(----))'
function boundEventsToExtrinsics(
  extrinsics: any[],
  events: EventRecord[]
): { hash: string; boundedEvents: Event[] }[] {
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
function findExtrinsicsWithEventsHash(
  extrinsicsWithBoundedEvents: { hash: string; boundedEvents: Event[] }[],
  eventRecord: EventRecord
): string | null {
  return (
    extrinsicsWithBoundedEvents.find((extrinsic) =>
      extrinsic.boundedEvents.some(
        (event) => event.hash.toHex() === eventRecord.event.hash.toHex()
      )
    ).hash || null
  );
}
function getExtrinsicSuccess(
  extrinsicIndex: number,
  events: EventRecord[],
  api: ApiPromise
): boolean {
  return events
    .filter(
      ({ phase }: any) =>
        phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(extrinsicIndex)
    )
    .some(({ event }: any) => api.events.system.ExtrinsicSuccess.is(event));
}
