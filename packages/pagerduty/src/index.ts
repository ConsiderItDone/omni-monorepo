import { getSimpleMetrics, getBlockMetrics, getEventsMetrics, getExtrinsicsMetrics, client } from "./metrics";

async function run() {
  console.time("Metrics collection");
  console.log("Metrics collection started");

  const commonMetrics = await getSimpleMetrics();
  const blockMetrics = await getBlockMetrics();
  const eventMetrics = await getEventsMetrics();
  const extrinsicMetrics = await getExtrinsicsMetrics();

  const combinedMetrics = commonMetrics.concat(blockMetrics).concat(eventMetrics).concat(extrinsicMetrics);

  client.submitMetrics(combinedMetrics).then((res) => {
    console.log("Metrics submitted", res);
  });

  console.log("Metrics collection finished");
  console.timeEnd("Metrics collection");
}

run();
