import { getSimpleMetrics, getBlockMetrics, getEventsMetrics, getExtrinsicsMetrics, client } from "./metrics";
import { v1 } from "@datadog/datadog-api-client";

import * as dotenv from "dotenv";
import path from "path";
try {
  dotenv.config({ path: path.resolve(__dirname) + "/../../../.env" });
} catch (e) {
  //nop
}

async function run() {
  console.time("Metrics collection");
  console.log("Metrics collection started");

  //const blockMetrics = await getBlockMetrics();
  //const eventMetrics = await getEventsMetrics();
  //const extrinsicMetrics = await getExtrinsicsMetrics();
  
/*   const config = v1.createConfiguration();
  const api = new v1.AuthenticationApi(config)
  console.log('api', JSON.stringify(api, null, 2))
  const validation = await api.validate();
  console.log('validation', validation) */
  const commonMetrics = await getSimpleMetrics();
  //const combinedMetrics = commonMetrics.concat(blockMetrics).concat(eventMetrics).concat(extrinsicMetrics);

   client.submitMetrics(commonMetrics).then((res) => {
    console.log("Metrics submitted", res);
  });

  console.log("Metrics collection finished");
  console.timeEnd("Metrics collection");
}

run();
