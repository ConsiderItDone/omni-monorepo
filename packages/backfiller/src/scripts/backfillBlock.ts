import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}
import { Between, Connection, ConnectionOptions } from "typeorm";
import { handleNewBlock, handleEvents, handleLogs, handleExtrinsics } from "@nodle/polkadot";
import { backfillTrackedEvents, backfillValidators } from "../utils";
import { BlockRepository, BackfillProgressRepository } from "@nodle/db";
import type { AccountInfo } from "@polkadot/types/interfaces/system";
import type { AccountId } from "@polkadot/types/interfaces/runtime";
const { CronJob } = require("cron"); // eslint-disable-line
import { services, blockFinalizer, logger as Logger } from "@nodle/utils";
type MetricsService = services.MetricsService;
const { logger } = Logger;
import express from "express";
import { ApiPromise } from "@polkadot/api";
import { MQ } from "@nodle/utils";
import { ConsumeMessage } from "amqplib/properties";
import { Channel } from "amqplib";
import { AccountBlockData } from "@nodle/utils";
import { handleAccountBalance, getApi } from "@nodle/polkadot";
import { PaginationOptions } from "@polkadot/api/types";
import { IAccount } from "@nodle/polkadot";
import {
  connect,
  Account,
  Application,
  Balance,
  Block,
  Event,
  Extrinsic,
  ExtrinsicType,
  Log,
  RootCertificate,
  VestingSchedule,
  Validator,
  BackfillProgress,
  Vote,
  Module,
  EventType,
} from "@nodle/db";

const connectionOptions = {
  name: "default",
  type: "postgres",
  host: process.env.TYPEORM_HOST,
  port: Number(process.env.TYPEORM_PORT),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  logging: process.env.TYPEORM_LOGGING === "true",
  entities: [
    Account,
    Application,
    Balance,
    Block,
    Event,
    Extrinsic,
    ExtrinsicType,
    Log,
    RootCertificate,
    VestingSchedule,
    Validator,
    BackfillProgress,
    Vote,
    Module,
    EventType,
  ],
} as ConnectionOptions;

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

//blockBackfill();
