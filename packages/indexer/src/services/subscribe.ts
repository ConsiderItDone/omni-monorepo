import { ApiPromise, WsProvider } from "@polkadot/api";
import { createConnection, getCustomRepository, getRepository } from "typeorm";
import env from "../env";
import BlockRepository from '../repositories/public/blockRepository'
const { u8aToHex, u8aToString, compactToU8a, extractTime } = require('@polkadot/util');
const { blake2AsU8a } = require('@polkadot/util-crypto');

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

async function fetchEvents(api: any, hash: any) {
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

    let count = 0;

    const unsubscribe = await api.rpc.chain.subscribeNewHeads(async (header: any) => { // ws subscription
        console.log(`Chain is at block: #${header.number}`);

        const blockHash = await api.rpc.chain.getBlockHash(header.number);

        const [{ block }, timestamp, events] = await Promise.all([
            api.rpc.chain.getBlock(blockHash),
            api.query.timestamp.now.at(blockHash),
            fetchEvents(api, blockHash),
        ]);

        const { parentHash, number, stateRoot, extrinsicsRoot, hash } = block.header;

        await blockRepository.add({
            number: number.toString(),
            timestamp: new Date(timestamp.toNumber()),
            hash: hash.toHex(),
            parentHash: parentHash.toString(),
            stateRoot: u8aToHex(stateRoot),
            extrinsicsRoot: u8aToHex(extrinsicsRoot),
            // TO Find out
            specVersion: 1,
            finalized: false
        })

        // DEBUG (unsubcribe after 10 blocks)
        if (++count === 10) {
            unsubscribe();
            process.exit(0);
        }
    }

    );
}

