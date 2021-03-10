import { ApiPromise, WsProvider } from "@polkadot/api";
import { getCustomRepository } from "typeorm";
import env from "../env";
import type { BlockHash } from '@polkadot/types/interfaces/chain';
import type { Header, DigestItem, Moment } from '@polkadot/types/interfaces/runtime';
import type { EventRecord, Event } from '@polkadot/types/interfaces/system';
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import type { GenericExtrinsic, Vec } from '@polkadot/types';
import { u8aToHex } from '@polkadot/util';

import BlockRepository from '../repositories/public/blockRepository'
import EventRepository from '../repositories/public/eventRepository'
import LogRepository from '../repositories/public/logRepository'
import ExtrinsicRepository from '../repositories/public/ExtrinsicRepository'

const provider = new WsProvider(env.WS_PROVIDER);


async function getApi(): Promise<ApiPromise> {
    return ApiPromise.create({
        provider,
        types: {
            "CertificateId": "AccountId",
            "Application": {
                "candidate": "AccountId",
                "candidate_deposit": "Balance",
                "metadata": "Vec<u8>",
                "challenger": "Option<AccountId>",
                "challenger_deposit": "Option<Balance>",
                "votes_for": "Option<Balance>",
                "voters_for": "Vec<(AccountId, Balance)>",
                "votes_against": "Option<Balance>",
                "voters_against": "Vec<(AccountId, Balance)>",
                "created_block": "BlockNumber",
                "challenged_block": "BlockNumber"
            },
            "RootCertificate": {
                "owner": "AccountId",
                "key": "CertificateId",
                "created": "BlockNumber",
                "renewed": "BlockNumber",
                "revoked": "bool",
                "validity": "BlockNumber",
                "child_revocations": "Vec<CertificateId>"
            },
            "Amendment": "Call",
            "VestingScheduleOf": {
                "start": "BlockNumber",
                "period": "BlockNumber",
                "period_count": "u32",
                "per_period": "Balance"
            }
        }
    })
}

export async function subscribe() {
    const api: ApiPromise = await getApi();

    await api.rpc.chain.subscribeNewHeads(async (header: Header) => { // ws subscription
        console.log(`Chain is at block: #${header.number.toString()}`);

        const blockNumber: BlockNumber = header.number.unwrap();
        const blockHash = await api.rpc.chain.getBlockHash(blockNumber);

        const [{ block }, timestamp, events] = await Promise.all([
            api.rpc.chain.getBlock(blockHash),
            api.query.timestamp.now.at(blockHash),
            api.query.system.events.at(blockHash),
        ]);

        // 1. Block
        const newBlockId = await handleNewBlock(block.header, timestamp)

        // 2.Events
        handleEvents(events, block.extrinsics, newBlockId)

        // 3.Logs
        handleLogs(block.header.digest.logs, newBlockId)

        // 4. Extrinsics
        handleExtrinsics(block.extrinsics, events, api, newBlockId)

    })
}

async function handleNewBlock(blockHeader: Header, timestamp: Moment) {
    const blockRepository = getCustomRepository(BlockRepository);
    const { parentHash, number, stateRoot, extrinsicsRoot, hash } = blockHeader;

    const newBlock = await blockRepository.add({
        number: number.toString(),
        timestamp: new Date(timestamp.toNumber()),
        hash: hash.toHex(),
        parentHash: parentHash.toString(),
        stateRoot: u8aToHex(stateRoot),
        extrinsicsRoot: u8aToHex(extrinsicsRoot),
        // TODO Find out
        specVersion: 1,
        finalized: false
    });
    return newBlock.blockId
}

async function handleEvents(events: EventRecord[], extrinsics: GenericExtrinsic[], blockId: number) {
    const eventRepository = getCustomRepository(EventRepository);

    // Bounding events to Extrinsics with 'phase.asApplyExtrinsic.eq(----))'
    const extrinsicsWithBoundedEvents = extrinsics.map(({ method: { method, section }, hash }, index) => {
        const boundedEvents: Event[] = events
            .filter(({ phase }: EventRecord) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index))
            .map(({ event }: EventRecord) => event);

        return ({ hash: hash.toHex(), boundedEvents })
    });
    for (const event of events) {
        const { index, method, section, typeDef } = event.event

        // Finds the extrinsic, which has an event with same hash as current event's
        const extrinsicHash = extrinsicsWithBoundedEvents.find(extr => extr.boundedEvents.some(evt => evt.hash.toHex() === event.event.hash.toHex())).hash || null

        await eventRepository.add({
            // TODO string or number ??? always 0x0000 for new blocks
            index: index.toHex(),
            // TODO store type as first item of an array ?
            type: typeDef[0].type,
            extrinsicHash,
            moduleName: section,
            eventName: method,
            blockId,
        });
    }
}

async function handleLogs(logs: Vec<DigestItem>, blockId: number) {
    const logRepository = getCustomRepository(LogRepository);

    await logRepository.addList(logs.map((log: any, index: number) => {
        const { type, value } = log;
        return {
            index: `${blockId}-${index}`,
            type,
            data: value.toHuman().toString().split(',')[1], // value is always ['BABE':u32, hash:Bytes]
            isFinalized: false, // TODO finalized what ? suggestion is 'preruntime' === false, seal === true
            blockId,
        }
    }));
}



async function handleExtrinsics(extrinsics: GenericExtrinsic[], events: EventRecord[], api: ApiPromise, blockId: number) {
    const extrinsicRepository = getCustomRepository(ExtrinsicRepository)

    await extrinsicRepository.addList(extrinsics.map((extrinsic: GenericExtrinsic, index: number) => ({
        index, //what kind of index? Index of extrisic in block array or some of 'The actual [sectionIndex, methodIndex] as used in the Call'
        params: extrinsic.args.toString(),
        account: null, //seems like coming from transactions, not on creation(e.g.balances.Endowed, )
        fee: 0, //seems like coming from transactions, not on creation
        length: extrinsic.length,
        versionInfo: extrinsic.version.toString(),
        callCode: `${extrinsic.method.section.toString()}.${extrinsic.method.method.toString()}`, // extrinsic.callIndex [0, 1] ??
        callModuleFunction: extrinsic.method.method,
        callModule: extrinsic.method.section,
        nonce: extrinsic.nonce.toNumber(),
        era: extrinsic.era.toString(), //saves as 'era.type: era.value'
        hash: extrinsic.hash.toHex(),
        isSigned: extrinsic.isSigned,
        signature: extrinsic.isSigned ? JSON.stringify({ signature: extrinsic.signature, signer: extrinsic.signer }) : null, //{ signature, signer } = extrinsic
        success: events.filter(({ phase }: any) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index))
            .some(({ event }: any) => api.events.system.ExtrinsicSuccess.is(event)), //typeof events === 'string' ? events : false;
        blockId,
    })));
}

/************* Querying the system events and extract information from them

    events.forEach((record: EventRecord, index:number) => {
        // Extract the phase, event and the event types
        const { event, phase } = record;
        const types = event.typeDef;


        // Show what we are busy with
        // console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
        // console.log(`\t\t${event.meta.documentation.toString()}`);

        // Loop through each of the parameters, displaying the type and data
        event.data.forEach((data: any, index: any) => {
            console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
        });
    });
********************************************/


/******* Mapping extrinsics to their events

            _Mike: extrinsics also have method:event.module_name & section:event.event_name,
                extrinsic have hash, event - don't have extrinsicHash

 signedBlock.block.extrinsics.forEach(({ method: { method, section } }, index) => {
  // filter the specific events based on the phase and then the
  // index of our extrinsic in the block
  const events = allRecords
    .filter(({ phase }) =>
      phase.isApplyExtrinsic &&
      phase.asApplyExtrinsic.eq(index)
    )
    .map(({ event }) => `${event.section}.${event.method}`);

  console.log(`${section}.${method}:: ${events.join(', ') || 'no events'}`);
});


*/
/***** Determining if an extrinsic succeeded/failed

block.extrinsics.forEach(({ method: { method, section } }, index) => {
    events.filter(({ phase }: any) =>
        phase.isApplyExtrinsic &&
        phase.asApplyExtrinsic.eq(index)
    ).forEach(({ event }: any) => {// test the events against the specific types we are looking for
        if (api.events.system.ExtrinsicSuccess.is(event)) {
            // extract the data for this event
            // (In TS, because of the guard above, these will be typed)
            const [dispatchInfo] = event.data;
            console.log(`${section}.${method}:: ExtrinsicSuccess:: ${ JSON.stringify(dispatchInfo.toHuman(), null, 2)}`);
        } else if (api.events.system.ExtrinsicFailed.is(event)) {
            // extract the data for this event
            const [dispatchError, dispatchInfo] = event.data;
            let errorInfo;

            // decode the error
            if (dispatchError.isModule) {
                // for module errors, we have the section indexed, lookup
                // (For specific known errors, we can also do a check against the
                // api.errors.<module>.<ErrorName>.is(dispatchError.asModule) guard)
                const decoded = api.registry.findMetaError(dispatchError.asModule);

                errorInfo = `${decoded.section}.${decoded.name}`;
            } else {
                // Other, CannotLookup, BadOrigin, no extra info
                errorInfo = dispatchError.toString();
            }

            console.log(`${section}.${method}:: ExtrinsicFailed:: ${errorInfo}`);
        }
    });
}) */
