import { Series } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/Series";

const metrics_prefix = "omni.graphql";
export default class Metric {
  name: string;
  timestamp: number;
  success: boolean;
  description?: string;

  constructor(name: string, timestamp: number, sucess: boolean, description?: string) {
    this.name = `${metrics_prefix}.${name}`;
    this.timestamp = timestamp;
    this.success = sucess;
    this.description = description;
  }
  getMetric(): Series {
    return {
      metric: this.name,
      type: "gauge",
      points: [[this.timestamp, Number(!this.success)]],
      tags: ["omni:Graphql server response"],
    };
  }
}
