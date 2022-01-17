import { FetchResult, OperationVariables, TypedDocumentNode } from "@apollo/client/core";
import { DocumentNode } from "graphql";

export interface Incident {
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
}

export interface Callbacks {
  onSuccess?: (result: FetchResult) => any; //eslint-disable
  onError?: (error: any) => any; //eslint-disable
}

export type Query<TData = any, TVariables = OperationVariables> = DocumentNode | TypedDocumentNode<TData, TVariables>;

export type Mutation<TData = any, TVariables = OperationVariables> =
  | DocumentNode
  | TypedDocumentNode<TData, TVariables>;
