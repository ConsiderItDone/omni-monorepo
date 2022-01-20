import { FetchResult, OperationVariables, TypedDocumentNode } from "@apollo/client/core";
import { DocumentNode } from "graphql";
import { v1, v2 } from "@datadog/datadog-api-client";
import { Series } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/Series";

export interface Callbacks {
  onSuccess?: (result: FetchResult) => any; //eslint-disable
  onError?: (error: any) => any; //eslint-disable
}

export type Query<TData = any, TVariables = OperationVariables> = DocumentNode | TypedDocumentNode<TData, TVariables>;

export type Mutation<TData = any, TVariables = OperationVariables> =
  | DocumentNode
  | TypedDocumentNode<TData, TVariables>;

export class Metric {
  name: string;
  timestamp: number;
  success: boolean;
  description?: string;

  constructor(name: string, timestamp: number, sucess: boolean, description?: string) {
    this.name = name;
    this.timestamp = timestamp;
    this.success = sucess;
    this.description = description;
  }
  getMetric() {
    return {
      metric: this.name,
      points: [[this.timestamp, Number(!this.success)]],
    };
  }
}

export class Metrics {
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
export class Incident {
  title: string;
  constructor(error?: any) {
    this.title = error?.message || error;
  }

  getParams(): v2.IncidentsApiCreateIncidentRequest {
    return {
      body: {
        data: {
          attributes: {
            title: this.title,
            customerImpacted: false,
          },
          type: "incidents",
        },
      },
    };
  }
}
