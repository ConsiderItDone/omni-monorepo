import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}

import {
  HOMEPAGE,
  CHART_TRANSFERTS,
  CHART_EXTRINSICS,
  BLOCKS,
  BLOCK,
  EXTRINSIC_FILTER_OPTIONS,
  EVENT_FILTER_OPTIONS,
  TRANSFERS,
  TRANSFERDETAILS,
  ALLOCATIONS,
  ACCOUNTS,
  VALIDATORS,
  ROOT_CERTIFICATES,
  APPLICATIONS,
  EXTRINSICS,
  EXTRINSICSDETAILTS,
} from "./queries";
import Client from "./client";
import { Blocks, BlocksVariables } from "./queries/__generated__/Blocks";
import { Block, BlockVariables } from "./queries/__generated__/Block";
import { HomePage } from "./queries/__generated__/HomePage";
import { ChartTransfers } from "./queries/__generated__/ChartTransfers";
import { ChartExtrinsics } from "./queries/__generated__/ChartExtrinsics";
import { Transfers } from "./queries/__generated__/Transfers";
import { TransferDetails, TransferDetailsVariables } from "./queries/__generated__/TransferDetails";
import { Extrinsics } from "./queries/__generated__/Extrinsics";
import { ExtrinsicsDetails, ExtrinsicsDetailsVariables } from "./queries/__generated__/ExtrinsicsDetails";
import { Metric, Metrics, Query } from "./types";
import { ApolloQueryResult } from "@apollo/client";
const metrics_prefix = "nodle_graphql";
const client = new Client(process.env.GRAPHQL_ENDPOINT);

async function run() {
  const common = await runSimpleQueries();
  //const blocksMetrics = await runBlockQueries();

  const combinedMetrics = common.concat([]).concat([]).concat([]);

  client.submitMetrics(combinedMetrics).then((res) => {
    console.log("Metrics submitted", res);
  });
}

function isQuerySuccessfull(result: ApolloQueryResult<any>) {
  return result.errors.length < 1 && Boolean(result.data);
}
async function gatherMetrics<T, TVars = any>(query: Query<T, TVars>, name: string, vars?: TVars) {
  return (await gatherMetricsResult(query, name, vars)).metric;
}
async function gatherMetricsResult<T, TVars = any>(query: Query<T, TVars>, name: string, vars?: TVars) {
  const queryResult = await client.query<T, TVars>(query, vars);
  return {
    result: queryResult,
    metric: new Metric(`${metrics_prefix}.${name}`, Date.now(), isQuerySuccessfull(queryResult)),
  };
}

async function runSimpleQueries() {
  let metrics = [
    await gatherMetrics<HomePage>(HOMEPAGE, "home"),
    await gatherMetrics<ChartTransfers>(CHART_TRANSFERTS, "chart_transfers"),
    await gatherMetrics<ChartExtrinsics>(CHART_EXTRINSICS, "chart_extrinsics"),
    await gatherMetrics(EXTRINSIC_FILTER_OPTIONS, "filter_options_extrinsic"),
    await gatherMetrics(EVENT_FILTER_OPTIONS, "filter_options_event"),
    await gatherMetrics(ROOT_CERTIFICATES, "root_certificates"),
    await gatherMetrics(APPLICATIONS, "applications"),
    await gatherMetrics(ACCOUNTS, "accounts"),
    await gatherMetrics(VALIDATORS, "validators"),
  ];
  return metrics;
}

async function runBlockQueries() {
  const blocks = await client.query<Blocks>(BLOCKS);
  let blocksSuccess = false;
  let blockSuccess = false;
  let metrics: Metric[] = [];

  if (blocks.data?.blocks?.items?.length) {
    blocksSuccess = true;
    const block = await client.query<Block, BlockVariables>(BLOCK, {
      id: blocks.data.blocks.items[0].hash,
    });
    if (block.data.blockByBlockNumber?.hash || block.data.blockByBlockNumber?.hash) {
      blockSuccess = true;
    }
  }

  metrics.push(new Metric("nodle_graphql.blocks", Date.now(), blocksSuccess));
  metrics.push(new Metric("nodle_graphql.block", Date.now(), blockSuccess));
  return metrics;
}

async function runEventsQueries() {
  let metrics: Metric[] = [await gatherMetrics(ALLOCATIONS, "allocations")];

  const { result: transfersResult, metric: transfersMetric } = await gatherMetricsResult<Transfers>(
    TRANSFERS,
    "transfers"
  );
  metrics.push(transfersMetric);

  if (transfersResult) {
    const transfer = transfersResult.data.events.items[0];
    metrics.push(
      await gatherMetrics<TransferDetails, TransferDetailsVariables>(TRANSFERDETAILS, "transfer_details", {
        blockNumber: Number(transfer.extrinsic.block.number),
        eventIndex: transfer.index,
        extrinsicIndex: transfer.extrinsic.index,
      })
    );
  }

  return metrics;
}

async function runtExtrinsicsQueries() {
  let metrics: Metric[] = [];

  const { result: extrinsicsResult, metric: extrinsicsMetric } = await gatherMetricsResult<Extrinsics>(
    EXTRINSICS,
    "extrinsics"
  );
  metrics.push(extrinsicsMetric);

  if (extrinsicsResult) {
    const extrinsic = extrinsicsResult.data.extrinsics.items[0];
    metrics.push(
      await gatherMetrics(EXTRINSICSDETAILTS, "extrinsic_details", {
        id: extrinsic.hash,
      })
    );
  }
  return metrics;
}

async function runAccountQueries() {
  let metrics: Metric[] = [await gatherMetrics(ACCOUNTS, "accounts"), await gatherMetrics(VALIDATORS, "validators")];
  return metrics;
}

run();
