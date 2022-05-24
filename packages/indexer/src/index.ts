import * as dotenv from "dotenv";
import path from "path";

try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}

import { subscribe } from "./services/subscribe";
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
import { MQ } from "@nodle/utils";
import { ConnectionOptions } from "typeorm";
import { logger as Logger } from "@nodle/utils";
const { logger } = Logger;
import { processBlock } from "./services/processBlock";
import { processAccount } from "./services/processAccount";

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

const start = async (): Promise<void> => {
  await MQ.init(process.env.RABBIT_MQ_URL); // init MQ connection

  subscribe(process.env.WS_PROVIDER); // run subscription
};

const daemon = async (): Promise<void> => {
  logger.info(`Processor daemon is started`);

  const connection = await connect(connectionOptions);

  // init MQ connection
  await MQ.init(process.env.RABBIT_MQ_URL);
  // run queue consumer
  processBlock(process.env.WS_PROVIDER, connection);
};

const accountDaemon = async (): Promise<void> => {
  logger.info(`Account daemon is started`);
  const connection = await connect(connectionOptions);

  // init MQ connection
  await MQ.init(process.env.RABBIT_MQ_URL);
  // run queue consumer
  processAccount(process.env.WS_PROVIDER, connection);
};

export const Indexer = {
  start,
  daemon,
  accountDaemon,
};
