import express, { Express } from "express";
import { register, Histogram, Counter, Gauge, collectDefaultMetrics } from "prom-client";

export class MetricsService {
  server: Express;
  port: number;
  prefix: string;

  blockCounter: Counter<any>; // eslint-disable-line
  blockProcessingHistogram: Histogram<any>; // eslint-disable-line
  blockNumberGauge: Gauge<any>; // eslint-disable-line

  endTimer: any; // eslint-disable-line

  constructor(
    server: Express = express(),
    port: number = parseInt(process.env.METRICS_PORT) || 9100,
    prefix = "omni_"
  ) {
    this.server = server;
    this.port = port;
    this.init();
    this.start();
    this.prefix = "omni_indexer_";

    collectDefaultMetrics({
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
      prefix,
    });

    this.blockCounter = new Counter({
      name: `${prefix}processed_blocks`,
      help: "Processed blocks counter",
      labelNames: ["block_number", "time"],
    });

    this.blockNumberGauge = new Gauge({
      name: `${prefix}last_processed_block_number`,
      help: "Processed blocks gauge",
    });

    this.blockProcessingHistogram = new Histogram({
      name: `${prefix}block_time`,
      help: "Time to process block",
      labelNames: ["code"],
      buckets: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
    });
  }

  init(): void {
    // eslint-disable-next-line
    this.server.get("/metrics", async (req: any, res: any) => {
      try {
        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
      } catch (ex) {
        res.status(500).end(ex);
      }
    });
  }

  start(): void {
    this.server.listen(this.port, "0.0.0.0");
  }

  startTimer(): void {
    this.endTimer = this.blockProcessingHistogram.startTimer();
  }

  resetTimer(): void {
    this.endTimer = this.blockProcessingHistogram.reset();
  }

  setBlockNumber(blockNumber: number): void {
    this.blockNumberGauge.set(blockNumber);
  }

  addBlockToCounter(blockNumber?: string, time?: number): void {
    this.blockCounter.inc(blockNumber && time ? { block_number: blockNumber, time: time } : null);
  }
}
