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
  handleTrackedEvents,
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
      VestingSchedule: {
        start: "BlockNumber",
        period: "BlockNumber",
        period_count: "u32",
        per_period: "Balance",
      },
      VestingScheduleOf: "VestingSchedule",
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
    const [extrinsicsWithBoundedEvents, trackedEvents] = await handleEvents(
      events,
      block.extrinsics,
      newBlockId
    );

    // 3.Logs
    handleLogs(block.header.digest.logs, newBlockId);

    // 4. Extrinsics
    handleExtrinsics(block.extrinsics, extrinsicsWithBoundedEvents, newBlockId);
    //5. Handling custom events
    handleTrackedEvents(trackedEvents, api, newBlockId);
  });
}
