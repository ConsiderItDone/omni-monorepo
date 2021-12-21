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
} from "@nodle/backfiller/src/services/backfiller";
import { ConnectionOptions } from "typeorm";
import { connect } from "@nodle/db";
import { logger } from "@nodle/utils/src/logger";

const connectionOptions = {
  name: "default",
  type: "postgres",
  host: process.env.TYPEORM_HOST,
  port: Number(process.env.TYPEORM_PORT),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  logging: process.env.TYPEORM_LOGGING === "true",
  entities: ["../../db/src/models/*.ts", "../db/src/models/**/*.ts"],
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
  .command("accounts", "run accounts backfiller", {}, () => {
    logger.info(`Accounts backfilling started`);

    accountBackfill(process.env.WS_PROVIDER);
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
