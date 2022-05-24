import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}

import { getApi } from "@nodle/polkadot";
import { MQ } from "@nodle/utils";
import { BlockRepository } from "@nodle/db";
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
import * as readline from "readline";

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

async function updateAccount(address: string) {
  console.log(`Updating ${address}`);
  const api = await getApi(process.env.WS_PROVIDER);

  const connection = await connect(connectionOptions);

  const { blockId, hash, number: blockNumber } = await connection
    .getCustomRepository(BlockRepository)
    .findOne({ order: { number: "DESC" } });
  const account = await api.query.system.account(address);
  const balance = {};

  for (const key of account.data.keys()) {
    // eslint-disable-next-line
    //@ts-ignore
    balance[key] = account.data[key].toString();
  }

  const dataToSend = {
    account: { 1: { ...account.toHuman(), data: balance }, 0: address },
    blockHash: hash,
    blockId,
    blockNumber,
  };
  const encodedData = Buffer.from(JSON.stringify(dataToSend));
  console.log(encodedData.toString("hex"));

  await MQ.getMQ().publish("backfill_account", encodedData);
  console.log(`Account ${address} successfully passed to queue`);
  await api.disconnect();
}

const r = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

r.question(`Input account address to update: `, async (address: string) => {
  r.close();
  // init MQ connection
  await MQ.init(process.env.RABBIT_MQ_URL);

  await updateAccount(address);
});
