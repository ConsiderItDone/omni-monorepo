import express from "express";
import {
  register,
  Histogram,
  Counter,
  Gauge,
  collectDefaultMetrics,
} from "prom-client";

//const cluster = require("cluster");
const server = express();

// Enable collection of default metrics
const prefix = "nodle_indexer_";
collectDefaultMetrics({
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
  prefix,
});

// Create custom metrics
export const blockProcessingHistogram = new Histogram({
  name: `${prefix}block_time`,
  help: "Time to process block",
  labelNames: ["code"],
  buckets: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
});
//blockProcessingHistogram.observe(10)

const blockCounter = new Counter({
  name: `${prefix}processed_blocks`,
  help: "Processed blocks counter",
  labelNames: ["block_number", "time"],
});

const blockNumberGauge = new Gauge({
  name: `${prefix}last_processed_block_number`,
  help: "Processed blocks gauge",
  //labelNames: ["method", "code"],
});

export function setBlockNumber(blockNumber: number): void {
  blockNumberGauge.set(blockNumber);
}

export function addBlockToCounter(blockNumber?: string, time?: number): void {
  blockCounter.inc(
    blockNumber && time ? { block_number: blockNumber, time: time } : null
  );
}

// Setup server to Prometheus scrapes:
// eslint-disable-next-line
server.get("/metrics", async (req: any, res: any) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

const port = process.env.METRICS_PORT || 9100;
console.log(
  `Server listening to ${port}, metrics exposed on /metrics endpoint`
);

export function startMetricsServer(): void {
  server.listen(port);
}
