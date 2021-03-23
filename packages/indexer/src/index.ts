import { subscribe } from "./services/subscribe";
import { connect } from "@nodle/db";
import MQ from "@nodle/utils/src/mq";
import { ConnectionOptions } from "typeorm";

const start = async function (): Promise<void> {
  const connectionOptions = {
    name: "default",
    type: "postgres",
    host: process.env.TYPEORM_HOST || "3.217.156.114",
    port: Number(process.env.TYPEORM_PORT || 54321),
    username: process.env.TYPEORM_USERNAME || "nodle",
    password: process.env.TYPEORM_PASSWORD || "password",
    database: process.env.TYPEORM_DATABASE || "nodle",
    logging: false,
    entities: ["../../db/src/models/*.ts", "../db/src/models/**/*.ts"],
  } as ConnectionOptions;

  const connection = await connect(connectionOptions);

  await MQ.init(); // init MQ connection

  subscribe(connection); // run subscription
};

export const Indexer = {
  start,
};
