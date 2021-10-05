import * as dotenv from "dotenv";
import path from "path";

try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}

import { subscribe } from "./services/subscribe";
import { connect } from "@nodle/db";
import MQ from "@nodle/utils/src/mq";
import { ConnectionOptions } from "typeorm";
import {ConsumeMessage} from "amqplib/properties";
import {logger} from "@nodle/utils/src/logger";
import {processBlock} from "./services/processBlock";
import {getApi} from "@nodle/polkadot/src/api";
import type { BlockNumber } from "@polkadot/types/interfaces/runtime";
import MetricsService from "@nodle/utils/src/services/metricsService";


const connectionOptions = {
  name: "default",
  type: "postgres",
  host: process.env.TYPEORM_HOST,
  port: Number(process.env.TYPEORM_PORT),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  logging: process.env.TYPEORM_LOGGING === "true",
  entities: ["../db/src/models/*.ts", "../db/src/models/**/*.ts"],
} as ConnectionOptions;

const start = async (): Promise<void> => {
  const connection = await connect(connectionOptions);

  await MQ.init(process.env.RABBIT_MQ_URL); // init MQ connection

  subscribe(process.env.WS_PROVIDER, connection); // run subscription
};

const daemon = async (): Promise<void> => {
  logger.info(`Processor daemon is started`);

  const api = await getApi(process.env.WS_PROVIDER);
  const connection = await connect(connectionOptions);


  // init MQ connection
  await MQ.init(process.env.RABBIT_MQ_URL); 
  // run queue consumer
  processBlock(process.env.WS_PROVIDER, connection); 

}

export const Indexer = {
  start,
  daemon,
};
