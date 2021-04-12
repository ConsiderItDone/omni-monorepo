import * as dotenv from "dotenv";
import fs from 'fs';
import path from 'path';
const envConfig = dotenv.parse(
  fs.readFileSync(path.resolve(__dirname) + "/../../../.env")
);

import { backfiller } from "./services/backfiller";
import { connect } from "@nodle/db";
import MQ from "@nodle/utils/src/mq";
import { ConnectionOptions } from "typeorm";

const start = async function (): Promise<void> {
  const connectionOptions = {
    name: "default",
    type: "postgres",
    host: envConfig.TYPEORM_HOST,
    port: Number(envConfig.TYPEORM_PORT),
    username: envConfig.TYPEORM_USERNAME,
    password: envConfig.TYPEORM_PASSWORD,
    database: envConfig.TYPEORM_DATABASE,
    logging: false,
    entities: ["../../db/src/models/*.ts", "../db/src/models/**/*.ts"],
  } as ConnectionOptions;

  const connection = await connect(connectionOptions);

  await MQ.init(envConfig.RABBIT_MQ_URL); // init MQ connection

  backfiller(envConfig.WS_PROVIDER, connection); // run service
};

export const Backfiller = {
  start,
};
