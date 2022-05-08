import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}
import * as readline from "readline";
import { handleNewBlock, handleEvents, handleLogs, handleExtrinsics, getApi } from "@nodle/polkadot";
import { backfillTrackedEvents } from "../utils";
import { connectionOptions } from "../utils";
import { connect } from "@nodle/db";

const blockBackfill = async (blockNum: number) => {
  const api = await getApi(process.env.WS_PROVIDER);
  const connection = await connect(connectionOptions);

  const blockHash = await api.rpc.chain.getBlockHash(blockNum);
  const [{ block }, timestamp, events, { specVersion }] = await Promise.all([
    api.rpc.chain.getBlock(blockHash),
    api.query.timestamp.now.at(blockHash),
    api.query.system.events.at(blockHash),
    api.rpc.state.getRuntimeVersion(blockHash),
  ]);
  const blockNumber = block.header.number.unwrap();

  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Block
    //eslint-disable-next-line
    //@ts-ignore
    const newBlock = await handleNewBlock(queryRunner.manager, block.header, timestamp, specVersion.toNumber());
    const { blockId } = newBlock;
    // 2. Extrinsics
    const [, extrinsicsWithBoundedEvents] = await handleExtrinsics(
      queryRunner.manager,
      api,
      block.extrinsics,
      //eslint-disable-next-line
      //@ts-ignore
      events,
      blockId,
      blockNumber,
      blockHash
    );

    // 3.Logs
    await handleLogs(queryRunner.manager, block.header.digest.logs, blockId, blockNumber);

    // 4.Events
    const [, trackedEvents] = await handleEvents(
      queryRunner.manager,
      //eslint-disable-next-line
      //@ts-ignore
      events,
      extrinsicsWithBoundedEvents,
      blockId,
      blockNumber
    );

    //5. Backfilling custom events
    await backfillTrackedEvents(queryRunner.manager, trackedEvents, api, blockId, blockHash, blockNumber);

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
  }
};

const r = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

r.question(`Input account address to update: `, async (blockNumber: string) => {
  r.close();
  await blockBackfill(Number(blockNumber));
});
