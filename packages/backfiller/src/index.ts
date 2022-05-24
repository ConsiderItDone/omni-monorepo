import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}

import { backfiller } from "./services/backfiller";
import { patcher } from "./services/patcher";
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
import { ConnectionOptions } from "typeorm";

const start = async function (): Promise<void> {
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
      rejectUnauthorized: false,
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

  const connection = await connect(connectionOptions);

  if (process.argv && process.argv.length > 1 && process.argv[process.argv.length - 1] === "patcher-only") {
    patcher(process.env.WS_PROVIDER, connection);
  } else {
    backfiller(process.env.WS_PROVIDER, connection);
  }
};

export const Backfiller = {
  start,
};
