import { ApiPromise, WsProvider } from "@polkadot/api";
import { getCustomRepository } from "typeorm";
import env from "../env";
import type { BlockHash } from '@polkadot/types/interfaces/chain';
import type { EventRecord } from '@polkadot/types/interfaces/system';
import BlockRepository from '../repositories/public/blockRepository'
import EventRepository from '../repositories/public/eventRepository'
import { u8aToHex, u8aToString, compactToU8a } from '@polkadot/util';
import { blake2AsU8a } from '@polkadot/util-crypto';

const provider = new WsProvider(env.WS_PROVIDER);


async function getApi() {
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

async function fetchEvents(api: any, hash: BlockHash) {
    try {
        return await api.query.system.events.at(hash);
    } catch (e) {
        console.error(e);
        return 'Unable to fetch Events, cannot confirm extrinsic status. Check pruning settings on the node.';
    }
}

export async function subscribe() {
    const api = await getApi();
    const blockRepository = getCustomRepository(BlockRepository)
    const eventRepository = getCustomRepository(EventRepository)

    await api.rpc.chain.subscribeNewHeads(async (header: any) => { // ws subscription
        console.log(`Chain is at block: #${header.number}`);

        const blockHash = await api.rpc.chain.getBlockHash(header.number);

        const [{ block }, timestamp, events] = await Promise.all([
            api.rpc.chain.getBlock(blockHash),
            api.query.timestamp.now.at(blockHash),
            fetchEvents(api, blockHash),
        ]);

        const { parentHash, number, stateRoot, extrinsicsRoot, hash } = block.header;

        await blockRepository.add({
            number: number.toNumber(), // TODO toNumber or toBigInt
            timestamp: new Date(timestamp.toNumber()),
            hash: hash.toHex(),
            parentHash: parentHash.toString(),
            stateRoot: u8aToHex(stateRoot),
            extrinsicsRoot: u8aToHex(extrinsicsRoot),
            // TODO Find out
            specVersion: 1,
            finalized: false
        })

        // Bounding events to Extrinsics with 'phase.asApplyExtrinsic.eq(----))'
        const extrinsicsWithBoundedEvents = block.extrinsics.map(({ method: { method, section }, hash }, index) => {
            const boundedEvents: EventRecord[] = events
                .filter(({ phase }: EventRecord) => phase.isApplyExtrinsic && phase.asApplyExtrinsic.eq(index))
                .map(({ event }: EventRecord) => event);

            return ({ hash: hash.toHex(), boundedEvents })
        });

        Promise.all(events.map(async (event: EventRecord) => {
            const { index, method, section, typeDef } = event.event
            // Checks if block exists in DB
            const existingBlock = await blockRepository.findByNumber(number.toNumber())

            if (existingBlock) {
                const { blockId } = existingBlock

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
                })
            }
            else console.log("Referenced block was't found in DB")
        }))
    })
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
