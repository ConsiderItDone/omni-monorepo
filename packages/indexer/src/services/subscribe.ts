import { ApiPromise, WsProvider } from "@polkadot/api";
import env from "../env";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import type { Header } from "@polkadot/types/interfaces/runtime";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";

import {
  handleNewBlock,
  handleEvents,
  handleLogs,
  handleExtrinsics,
  handleTrackedExtrinsics,
} from "../utils";

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
export async function subscribe(): Promise<void> {
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
    const extrinsicsWithBoundedEvents = await handleEvents(
      events,
      block.extrinsics,
      newBlockId
    );

    // 3.Logs
    handleLogs(block.header.digest.logs, newBlockId);

    // 4. Extrinsics
    const trackedExtrinsics = await handleExtrinsics(
      block.extrinsics,
      extrinsicsWithBoundedEvents,
      newBlockId
    );
    //5. Root of trust, vesting schedule, ...
    handleTrackedExtrinsics(trackedExtrinsics, api, newBlockId);
  });
}
