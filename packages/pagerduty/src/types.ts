import { FetchResult, OperationVariables, TypedDocumentNode } from "@apollo/client/core";
import { DocumentNode } from "graphql";
import { v1, v2 } from "@datadog/datadog-api-client";
import { Series } from "@datadog/datadog-api-client/dist/packages/datadog-api-client-v1/models/Series";

/* export interface Incident {
  incident: {
    type: string;
    title: string;
    service: {
      id: string;
      type: string;
    };
    priority?: { id: string; type: string };
    urgency?: string;
    body?: {
      type: string;
      details?: string;
    };
    incident_key?: string;
    assignments?: [
      {
        at: string;
        assignee: {
          id: string;
          type: string;
          summary: string;
          self: string;
          html_url: string;
        };
      }
    ];
    escalation_policy?: {
      id: string;
      type: string;
    };
    conference_bridge?: {
      conference_number?: string;
      conference_url?: string;
    };
  };
} */

export interface Callbacks {
  onSuccess?: (result: FetchResult) => any; //eslint-disable
  onError?: (error: any) => any; //eslint-disable
}

export type Query<TData = any, TVariables = OperationVariables> = DocumentNode | TypedDocumentNode<TData, TVariables>;

export type Mutation<TData = any, TVariables = OperationVariables> =
  | DocumentNode
  | TypedDocumentNode<TData, TVariables>;

export interface MetricsData {
  name: string;
  value: [QueryResult.SUCCESS | QueryResult.ERROR];
}
export enum QueryResult {
  SUCCESS = 0,
  ERROR = 1,
}
export class Metrics {
  metrics: Series[];

  constructor(metricsData: MetricsData[]) {
    this.metrics = metricsData.map((m) => ({ metric: m.name, points: [[QueryResult.SUCCESS], m.value] }));
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
