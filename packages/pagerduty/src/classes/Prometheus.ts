import express, { Express } from "express";
import { register, Gauge } from "prom-client";

export default class Prometheus {
  server: Express;
  port: number;
  gauge: Gauge<any>;

  constructor(port = 3008) {
    this.server = express();
    this.port = port;
    this.init();
    this.start();
    this.gauge = new Gauge({
      name: `nodle_graphql`,
      help: "Graphql endpoint error",
      labelNames: ["name", "timestamp"],
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
    console.log(`Server listening to ${this.port}, metrics exposed on /metrics endpoint`);
  }

  set(name: string, value: number, timestamp: number) {
    this.gauge.set({ name, timestamp }, value);
  }
}
