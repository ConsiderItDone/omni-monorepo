// Required imports
const {ApiPromise, WsProvider} = require('@polkadot/api');
const { u8aToHex, u8aToString, compactToU8a } = require('@polkadot/util');
const { blake2AsU8a } =require('@polkadot/util-crypto');

async function main() {
    // Initialise the provider to connect to the local node
    const provider = new WsProvider('ws://195.201.97.114:9944');
    // const provider = new WsProvider('wss://crab.darwinia.network');

    // Create the API and wait until ready
    const api = await ApiPromise.create({
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
    });

    // We only display a couple, then unsubscribe
    let count = 0;

    // Subscribe to the new headers on-chain. The callback is fired when new headers
    // are found, the call itself returns a promise with a subscription that can be
    // used to unsubscribe from the newHead subscription
    const unsubscribe = await api.rpc.chain.subscribeNewHeads(async (header) => {
        console.log(`Chain is at block: #${header.number}`);

        const blockHash = await api.rpc.chain.getBlockHash(header.number);

        const [{block}, events] = await Promise.all([
            api.rpc.chain.getBlock(blockHash),
            fetchEvents(api, blockHash),
        ]);

        // console.log(block, events);


        const {parentHash, number, stateRoot, extrinsicsRoot} = block.header;

        console.log(number.toString(), parentHash.toString(), u8aToHex(parentHash), u8aToHex(stateRoot), u8aToHex(extrinsicsRoot));
        return;

        const logs = block.header.digest.logs.map((log) => {
            const {type, index, value, data} = log;

            return {type, index, value};
        });

        const defaultSuccess = typeof events === 'string' ? events : false;
        const extrinsics = block.extrinsics.map((extrinsic) => {
            const {method, nonce, signature, signer, isSigned, tip, args} = extrinsic;
            const hash = u8aToString(blake2AsU8a(extrinsic.toU8a(), 256));

            return {
                method,
                signature: isSigned ? {signature, signer} : null,
                nonce,
                args,
                tip,
                hash,
                info: {},
                events: [],
                success: defaultSuccess,
                // paysFee overrides to bool if `system.ExtrinsicSuccess|ExtrinsicFailed` event is present
                paysFee: null,
            };
        });

        // const onInitialize = {events: []};
        // const onFinalize = {events: []};
        //
        // if (Array.isArray(events)) {
        //     for (const record of events) {
        //         const {event, phase} = record;
        //         const sanitizedEvent = {
        //             method: `${event.section}.${event.method}`,
        //             data: event.data,
        //         };
        //
        //         if (phase.isApplyExtrinsic) {
        //             const extrinsicIdx = phase.asApplyExtrinsic.toNumber();
        //             const extrinsic = extrinsics[extrinsicIdx];
        //
        //             if (!extrinsic) {
        //                 throw new Error(`Missing extrinsic ${extrinsicIdx} in block ${hash}`);
        //             }
        //
        //             const method = `${event.section}.${event.method}`;
        //
        //             if (method === 'system.ExtrinsicSuccess') {
        //                 extrinsic.success = true;
        //             }
        //
        //             if (method === 'system.ExtrinsicSuccess' || method === 'system.ExtrinsicFailed') {
        //                 const sanitizedData = event.data.toJSON();
        //
        //                 for (const data of sanitizedData) {
        //                     if (data && data.paysFee) {
        //                         extrinsic.paysFee =
        //                             data.paysFee === true ||
        //                             data.paysFee === 'Yes';
        //
        //                         break;
        //                     }
        //                 }
        //             }
        //
        //             extrinsic.events.push(sanitizedEvent);
        //         } else if (phase.isFinalization) {
        //             onFinalize.events.push(sanitizedEvent);
        //         } else if (phase.isInitialization) {
        //             onInitialize.events.push(sanitizedEvent);
        //         }
        //     }
        // }
        //
        // for (let idx = 0; idx < block.extrinsics.length; ++idx) {
        //     if (!extrinsics[idx].paysFee || !block.extrinsics[idx].isSigned) {
        //         continue;
        //     }
        //
        //     try {
        //         // This is only a temporary solution. This runtime RPC will not work if types or logic
        //         // involved in fee calculation changes in a runtime upgrade. For a long-term solution,
        //         // we need to calculate fees based on the metadata constants and fee multiplier.
        //         // https://github.com/paritytech/substrate-api-sidecar/issues/45
        //         extrinsics[idx].info = api.createType(
        //             'RuntimeDispatchInfo',
        //             await api.rpc.payment.queryInfo(block.extrinsics[idx].toHex(), parentHash)
        //         );
        //     } catch (err) {
        //         console.error(err);
        //         extrinsics[idx].info = {error: 'Unable to fetch fee info'};
        //     }
        // }
        //
        // console.log(extrinsics, logs);
        // 	// return {
        // 	// 	number,
        // 	// 	hash,
        // 	// 	parentHash,
        // 	// 	stateRoot,
        // 	// 	extrinsicsRoot,
        // 	// 	logs,
        // 	// 	onInitialize,
        // 	// 	extrinsics,
        // 	// 	onFinalize,
        // 	// };
        //
        // if (++count === 256) {
        //     unsubscribe();
        //     process.exit(0);
        // }
    });

    // Retrieve the chain & node information information via rpc calls
    const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version()
    ]);

    console.log(`You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`);
}

async function fetchEvents(api, hash) {
    try {
        return await api.query.system.events.at(hash);
    } catch (e) {
        console.error(e);
        return 'Unable to fetch Events, cannot confirm extrinsic status. Check pruning settings on the node.';
    }
}

main().catch(console.error);

