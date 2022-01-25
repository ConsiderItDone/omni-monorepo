import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}

import { ApolloQueryResult } from "@apollo/client";
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
import Client from "./classes/Client";
import { Query } from "./types";
import Metric from "./classes/Metric";

import { Blocks } from "./queries/__generated__/Blocks";
import { Block, BlockVariables } from "./queries/__generated__/Block";
import { HomePage } from "./queries/__generated__/HomePage";
import { ChartTransfers } from "./queries/__generated__/ChartTransfers";
import { ChartExtrinsics } from "./queries/__generated__/ChartExtrinsics";
import { Transfers } from "./queries/__generated__/Transfers";
import { TransferDetails, TransferDetailsVariables } from "./queries/__generated__/TransferDetails";
import { Extrinsics } from "./queries/__generated__/Extrinsics";
import { ExtrinsicsDetails, ExtrinsicsDetailsVariables } from "./queries/__generated__/ExtrinsicsDetails";

const metrics_prefix = "nodle.graphql";
export const client = new Client(process.env.GRAPHQL_ENDPOINT);

export function isQuerySuccessfull(result: ApolloQueryResult<any>) {
  return !result.errors?.length && Boolean(result.data);
}

export async function gatherMetrics<T, TVars = any>(query: Query<T, TVars>, name: string, vars?: TVars) {
  return (await gatherMetricsResult(query, name, vars)).metric;
}

export async function gatherMetricsResult<T, TVars = any>(query: Query<T, TVars>, name: string, vars?: TVars) {
  console.log("Gathering " + name + " metric");

  try {
    const queryResult = await client.query<T, TVars>(query, vars);
    if (queryResult?.errors) {
      console.log("Errors received:", JSON.stringify(queryResult.errors));
    }
    return {
      result: queryResult,
      metric: new Metric(`${metrics_prefix}.${name}`, Date.now(), isQuerySuccessfull(queryResult)),
    };
  } catch (e) {
    console.error(`Cought error: ${JSON.stringify(e, null, 2)}`);
    return {
      result: null,
      metric: new Metric(`${metrics_prefix}.${name}`, Date.now(), false),
    };
  }
}

/**************************  GET METRICS  *****************************/

export async function getSimpleMetrics() {
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

export async function getBlockMetrics() {
  let metrics: Metric[] = [];

  const { result: blocksResult, metric: blocksMetric } = await gatherMetricsResult<Blocks>(BLOCKS, "blocks");
  metrics.push(blocksMetric);

  if (blocksResult.data) {
    const block = blocksResult.data.blocks.items[0];
    metrics.push(
      await gatherMetrics<Block, BlockVariables>(BLOCK, "block", {
        id: block.hash,
      })
    );
  }

  return metrics;
}

export async function getEventsMetrics() {
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

export async function getExtrinsicsMetrics() {
  let metrics: Metric[] = [];

  const { result: extrinsicsResult, metric: extrinsicsMetric } = await gatherMetricsResult<Extrinsics>(
    EXTRINSICS,
    "extrinsics"
  );
  metrics.push(extrinsicsMetric);

  if (extrinsicsResult) {
    const extrinsic = extrinsicsResult.data.extrinsics.items[0];
    metrics.push(
      await gatherMetrics<ExtrinsicsDetails, ExtrinsicsDetailsVariables>(EXTRINSICSDETAILTS, "extrinsic_details", {
        id: extrinsic.hash,
      })
    );
  }
  return metrics;
}
