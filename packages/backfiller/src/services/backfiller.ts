import { ApiPromise, WsProvider } from "@polkadot/api";
import type { BlockHash } from "@polkadot/types/interfaces/chain";
import type { Header } from "@polkadot/types/interfaces/runtime";
import { BlockNumber } from "@polkadot/types/interfaces/runtime";
import { Between, Connection, MoreThanOrEqual } from "typeorm";

import {
  handleNewBlock,
  handleEvents,
  handleLogs,
  handleExtrinsics,
  handleTrackedEvents,
} from "@nodle/polkadot/src";
import BlockRepository from "@nodle/db/src/repositories/public/blockRepository";

// TODO: fix param
const provider = new WsProvider(
  process.env.WS_PROVIDER || "ws://3.217.156.114:9944"
);

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

export async function backfiller(connection: Connection): Promise<void> {
  const api: ApiPromise = await getApi();

  console.log("Backfiller mock");
  // TODO: work with historical blocks

  const limit = 50; // Amount of block to check
  const startBlock = 1500; // Block number to search from
  const endBlock = startBlock + limit + 1; // Last block

  const blockRepository = connection.getCustomRepository(BlockRepository);

  const blocks = await blockRepository.find({
    number: Between(startBlock, startBlock + limit),
  });
  const blockNumbers = blocks.map(
    (block) => parseInt(block.number as string, 10) // Parsing because returns as string
  );

  const missingBlocksNumbers = Array.from(
    Array(endBlock - startBlock),
    (v, i) => i + startBlock
  ).filter((i: number) => !blockNumbers.includes(i));

  for (const blockNumber of missingBlocksNumbers) {
    console.log('Backfilling block: ', blockNumber)
    const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
    const [{ block }, timestamp, events, { specVersion }] = await Promise.all([
      api.rpc.chain.getBlock(blockHash),
      api.query.timestamp.now.at(blockHash),
      api.query.system.events.at(blockHash),
      api.rpc.state.getRuntimeVersion(blockHash),
    ]);

    // 3. Blocks
    const newBlockId = await handleNewBlock(
      connection,
      block.header,
      timestamp,
      specVersion.toNumber()
    );

    // 2.Events
    const [extrinsicsWithBoundedEvents, trackedEvents] = await handleEvents(
      connection,
      events,
      block.extrinsics,
      newBlockId
    );

    // 3.Logs
    handleLogs(connection, block.header.digest.logs, newBlockId);

    // 4. Extrinsics
    handleExtrinsics(
      connection,
      block.extrinsics,
      extrinsicsWithBoundedEvents,
      newBlockId
    );
  }

  /* await api.rpc.chain.subscribeNewHeads(async (header: Header) => {
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
      connection,
      block.header,
      timestamp,
      specVersion.toNumber()
    );

    // 2.Events
    const [extrinsicsWithBoundedEvents, trackedEvents] = await handleEvents(
      connection,
      events,
      block.extrinsics,
      newBlockId
    );

    // 3.Logs
    handleLogs(connection, block.header.digest.logs, newBlockId);

    // 4. Extrinsics
    handleExtrinsics(
      connection,
      block.extrinsics,
      extrinsicsWithBoundedEvents,
      newBlockId
    );
    //5. Handling custom events
    handleTrackedEvents(connection, trackedEvents, api, newBlockId);
  }); */
}
