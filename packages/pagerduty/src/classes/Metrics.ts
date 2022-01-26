import { v1 } from "@datadog/datadog-api-client";
import { Series } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/Series";
import Metric from "./Metric";

export default class Metrics {
  metrics: Series[];

  constructor(metricsData: Metric[]) {
    this.metrics = metricsData.map((m) => m.getMetric());
  }

  getParams(): v1.MetricsApiSubmitMetricsRequest {
    const payload = {
      body: {
        series: this.metrics,
      },
    };
    console.log("Payload to submit: ", JSON.stringify(payload, null, 2));
    return payload;
  }
}
