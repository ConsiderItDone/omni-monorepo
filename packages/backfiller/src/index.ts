import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}

import { backfiller } from "./services/backfiller";
import { connect } from "@nodle/db";
import MQ from "@nodle/utils/src/mq";
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
    logging: false,
    entities: ["../../db/src/models/*.ts", "../db/src/models/**/*.ts"],
  } as ConnectionOptions;

  const connection = await connect(connectionOptions);

  await MQ.init(process.env.RABBIT_MQ_URL); // init MQ connection

  backfiller(process.env.WS_PROVIDER, connection); // run service
};

export const Backfiller = {
  start,
};
