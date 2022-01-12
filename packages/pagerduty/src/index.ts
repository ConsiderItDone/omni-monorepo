import Client from "./client";
import { HOMEPAGE, CHART_TRANSFERTS, CHART_EXTRINSICS } from "./queries";

const client = new Client(process.env.GRAPHQL_ENDPOINT, process.env.PAGERDUTY_API_KEY);

const variables: { [key: string]: any } = {};

async function run() {
  await runCommonQueries();
}

async function runCommonQueries() {
  await client.query(HOMEPAGE);
  await client.query(CHART_TRANSFERTS);
  await client.query(CHART_EXTRINSICS);
  await client.query(HOMEPAGE);
  await client.query(HOMEPAGE);
}

run();
