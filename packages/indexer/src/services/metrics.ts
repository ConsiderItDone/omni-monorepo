const express = require("express");
const cluster = require("cluster");
const server = express();
const register = require("prom-client").register;
const {
  collectDefaultMetrics,
  Histogram,
  Counter,
  Gauge,
} = require("prom-client");
// Enable collection of default metrics

const prefix = "nodle_";

collectDefaultMetrics({
  timeout: 1000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5], // These are the default buckets.
  //prefix,
});

// Create custom metrics
export const blockProcessingHistogram = new Histogram({
  name: `${prefix}block_time`,
  help: "Time to process block",
  labelNames: ["code"],
  buckets: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
});
//blockProcessingHistogram.observe(10)

export const blockCounter = new Counter({
  name: `${prefix}processed_blocks`,
  help: "Processed blocks counter",
  labelNames: ["block_number", "time"],
});

const g = new Gauge({
  name: `${prefix}last_processed_block_number`,
  help: "Processed blocks gauge",
  //labelNames: ["method", "code"],
});

export function setGauge(blockNumber: number) {
  g.set(blockNumber);
}

new Counter({
  name: "scrape_counter",
  help: "Number of scrapes (example of a counter with a collect fn)",
  collect() {
    // collect is invoked each time `register.metrics()` is called.
    this.inc();
  },
});

export function addBlockToCounter(blockNumber?: string, time?: number) {
  blockCounter.inc(
    blockNumber && time ? { block_number: blockNumber, time: time } : null
  );
}

const t: any[] = [];
setInterval(() => {
  for (let i = 0; i < 100; i++) {
    t.push(new Date());
  }
}, 10);
setInterval(() => {
  while (t.length > 0) {
    t.pop();
  }
});

// Setup server to Prometheus scrapes:
server.get("/metrics", async (req: any, res: any) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (ex) {
    res.status(500).end(ex);
  }
});

server.get("/metrics/counter", async (req: any, res: any) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.getSingleMetricAsString("processed_block"));
  } catch (ex) {
    res.status(500).end(ex);
  }
});

server.get("/metrics/histogram", async (req: any, res: any) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.getSingleMetricAsString("block_time"));
  } catch (ex) {
    res.status(500).end(ex);
  }
});

const port = process.env.PORT || 3000;
console.log(
  `Server listening to ${port}, metrics exposed on /metrics endpoint`
);

export function startMetricsServer() {
  server.listen(port);
}
