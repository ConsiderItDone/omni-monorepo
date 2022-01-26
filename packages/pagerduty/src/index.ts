import { getSimpleMetrics, getBlockMetrics, getEventsMetrics, getExtrinsicsMetrics, client } from "./metrics";
const { CronJob } = require("cron"); // eslint-disable-line
import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}
import Prometheus from "./classes/Prometheus";

function run() {
  console.log("Metrics collection cronjob started");

  const metricService = new Prometheus();

  //const crontabJob = new CronJob("0 */5 * * * *", () => monitor(metricService));
  //crontabJob.start();

  monitor(metricService);
  return;
}

async function monitor(metricService: Prometheus) {
  console.log("Metrics collection started");
  console.time("Metrics collection");

  const commonMetrics = await getSimpleMetrics();
  const blockMetrics = await getBlockMetrics();
  const eventMetrics = await getEventsMetrics();
  const extrinsicMetrics = await getExtrinsicsMetrics();

  const combinedMetrics = commonMetrics.concat(blockMetrics).concat(eventMetrics).concat(extrinsicMetrics);

  const ddResponse = await client.submitMetrics(combinedMetrics);
  console.log("Metrics submitted to Datadog at", new Date().toTimeString(), ":", ddResponse);

  commonMetrics.map((m) => metricService.set(m.name, Number(!m.success), m.timestamp));
  console.log("Metrics submitted to Prometheus");

  console.log("Metrics collection finished");
  console.timeEnd("Metrics collection");
  return;
}
run();
