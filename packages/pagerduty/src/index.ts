import { getSimpleMetrics, getBlockMetrics, getEventsMetrics, getExtrinsicsMetrics, client } from "./metrics";
import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}
async function run() {
  //eslint-disable-next-line
  while (true) {
    console.log("Metrics collection cronjob started");
    await monitor();
    //const metricService = new Prometheus();
    //const crontabJob = new CronJob("0 */5 * * * *", () => monitor(metricService));
    //crontabJob.start();
    //monitor(metricService);
  }
}

async function monitor() {
  console.log("Metrics collection started");
  console.time("Metrics collection");

  const commonMetrics = await getSimpleMetrics();
  const blockMetrics = await getBlockMetrics();
  const eventMetrics = await getEventsMetrics();
  const extrinsicMetrics = await getExtrinsicsMetrics();

  const combinedMetrics = commonMetrics.concat(blockMetrics).concat(eventMetrics).concat(extrinsicMetrics);

  const ddResponse = await client.submitMetrics(combinedMetrics);
  console.log("Metrics submitted to Datadog at", new Date().toTimeString(), ":", ddResponse);

  //commonMetrics.map((m) => metricService.set(m.name, Number(!m.success), m.timestamp));
  //console.log("Metrics submitted to Prometheus");

  console.log("Metrics collection finished");
  console.timeEnd("Metrics collection");
  console.log("--------------------------------------------------------");
  return;
}
run();
