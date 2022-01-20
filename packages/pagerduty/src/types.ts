import { FetchResult, OperationVariables, TypedDocumentNode } from "@apollo/client/core";
import { DocumentNode } from "graphql";

export interface Callbacks {
  onSuccess?: (result: FetchResult) => any; //eslint-disable
  onError?: (error: any) => any; //eslint-disable
}

export type Query<TData = any, TVariables = OperationVariables> = DocumentNode | TypedDocumentNode<TData, TVariables>;

export type Mutation<TData = any, TVariables = OperationVariables> =
  | DocumentNode
  | TypedDocumentNode<TData, TVariables>;
