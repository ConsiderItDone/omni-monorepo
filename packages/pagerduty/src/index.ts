import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}

import { HOMEPAGE, CHART_TRANSFERTS, CHART_EXTRINSICS } from "./queries";
import Client from "./client";

const client = new Client(process.env.GRAPHQL_ENDPOINT, process.env.PAGERDUTY_API_KEY);

async function run() {
  await runCommonQueries();
}

async function runCommonQueries() {
  const home = await client.query(HOMEPAGE);
  //const chart = await client.query(CHART_TRANSFERTS, { hello: "world" });
  //const chart2 = await client.query(CHART_EXTRINSICS);
  console.log("home", home);
}

run();
