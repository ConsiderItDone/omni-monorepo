import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../../.env" });
} catch (e) {
  //nop
}

import { getApi } from "@nodle/polkadot";
import { MQ } from "@nodle/utils";
import { connect } from "@nodle/db";
import * as readline from "readline";
import { backfillVestingSchedules } from "../utils/backfillers";
import { connectionOptions } from "../utils";

const r = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

r.question(`Input account address to update Vesting schedules: `, async (address: string) => {
  r.close();
  // init MQ connection
  await MQ.init(process.env.RABBIT_MQ_URL);
  const connection = await connect(connectionOptions);
  const api = await getApi(process.env.WS_PROVIDER);
  await backfillVestingSchedules(address, api, connection);
});
