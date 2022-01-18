import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}

import { HOMEPAGE, CHART_TRANSFERTS, CHART_EXTRINSICS, BLOCKS, BLOCK } from "./queries";
import Client from "./client";
import { Blocks, BlocksVariables } from "./queries/__generated__/Blocks";
import { Block, BlockVariables } from "./queries/__generated__/Block";
const client = new Client(process.env.GRAPHQL_ENDPOINT, process.env.PAGERDUTY_API_KEY);

async function run() {
  //await runCommonQueries();
  await runBlockQueries();
}

async function runCommonQueries() {
  const home = await client.query(HOMEPAGE);
  const chart = await client.query(CHART_TRANSFERTS, { hello: "world" });
  const chart2 = await client.query(CHART_EXTRINSICS);
  console.log("home", home);
}
async function runBlockQueries() {
  const blocks = await client.query<Blocks>(BLOCKS);
  console.log("blocks", blocks);
  let blocksSuccess = false;
  let blockSuccess = false;
  if (blocks.data?.blocks?.items?.length) {
    blocksSuccess = true;
    const block = await client.query<Block, BlockVariables>(BLOCK, {
      id: blocks.data.blocks.items[0].hash,
    });
    console.log("block", block);
    if (block.data.blockByBlockNumber?.hash || block.data.blockByBlockNumber?.hash) blockSuccess = true;
  }
}

run();
