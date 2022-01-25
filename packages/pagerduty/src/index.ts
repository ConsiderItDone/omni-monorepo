import { getSimpleMetrics, getBlockMetrics, getEventsMetrics, getExtrinsicsMetrics, client } from "./metrics";
import { v1 } from "@datadog/datadog-api-client";

import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}
import Prometheus from "./classes/Prometheus";

async function run() {
  console.time("Metrics collection");
  console.log("Metrics collection started");

  //const blockMetrics = await getBlockMetrics();
  //const eventMetrics = await getEventsMetrics();
  //const extrinsicMetrics = await getExtrinsicsMetrics();

  const commonMetrics = await getSimpleMetrics();

  //const combinedMetrics = commonMetrics.concat(blockMetrics).concat(eventMetrics).concat(extrinsicMetrics);

  client.submitMetrics(commonMetrics).then((res) => {
    console.log("Metrics to Datadog submitted:", res);
  });

  const metricService = new Prometheus();
  commonMetrics.map((m) => metricService.set(m.name, Number(!m.success), m.timestamp));

  console.log("Metrics collection finished");
  console.timeEnd("Metrics collection");
  return;
}

run();
