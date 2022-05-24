import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  accountBackfill,
  accountBackfillDaemon,
  backfiller,
  blockBackfill,
  blockBackfillDaemon,
} from "./services/backfiller";
import { ConnectionOptions } from "typeorm";
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
import { logger as Logger } from "@nodle/utils";
const { logger } = Logger;

const connectionOptions = {
  name: "default",
  type: "postgres",
  host: process.env.TYPEORM_HOST,
  port: Number(process.env.TYPEORM_PORT),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  logging: process.env.TYPEORM_LOGGING === "true",
  ssl: {
    ca: process.env.TYPEORM_SSL_CA,
    cert: process.env.TYPEORM_SSL_CERT,
    key: process.env.TYPEORM_SSL_KEY,
  },
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

yargs(hideBin(process.argv))
  .command("blocks", "run block backfiller", {}, async () => {
    logger.info(`Block backfilling started`);

    const connection = await connect(connectionOptions);

    blockBackfill(process.env.WS_PROVIDER, connection);
  })
  .command("blocks-daemon", "run block backfiller daemon", {}, async () => {
    logger.info(`Block backfilling daemon started`);

    const connection = await connect(connectionOptions);

    blockBackfillDaemon(process.env.WS_PROVIDER, connection);
  })
  .command("accounts", "run accounts backfiller", {}, async () => {
    logger.info(`Accounts backfilling started`);

    const connection = await connect(connectionOptions);

    accountBackfill(process.env.WS_PROVIDER, connection);
  })
  .command("accounts-daemon", "run account backfiller daemon", {}, async () => {
    logger.info(`Account backfilling daemon started`);

    const connection = await connect(connectionOptions);

    accountBackfillDaemon(process.env.WS_PROVIDER, connection);
  })
  // default
  .command("*", "run legacy backfiller", {}, async () => {
    logger.info(`Legacy backfiller started`);

    const connection = await connect(connectionOptions);

    backfiller(process.env.WS_PROVIDER, connection);
  })
  .help(true).argv;
