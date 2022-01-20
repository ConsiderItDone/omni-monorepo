import { v1 } from "@datadog/datadog-api-client";
import { Series } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/Series";
import Metric from "./Metric";

export default class Metrics {
  metrics: Series[];

  constructor(metricsData: Metric[]) {
    this.metrics = metricsData.map((m) => m.getMetric());
  }

  getParams(): v1.MetricsApiSubmitMetricsRequest {
    return {
      body: {
        series: this.metrics,
      },
    };
  }
}
