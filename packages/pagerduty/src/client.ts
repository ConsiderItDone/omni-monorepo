import "cross-fetch/polyfill";
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  FetchResult,
  OperationVariables,
} from "@apollo/client/core";
import { Incident, Callbacks, Mutation, Query } from "./types";
import { api } from "@pagerduty/pdjs";
import { PartialCall } from "@pagerduty/pdjs/build/src/api";

/* eslint-disable */

export default class Client {
  #client: ApolloClient<NormalizedCacheObject>;
  #pagerduty: PartialCall;
  constructor(uri?: string, pagerDutyToken?: string) {
    this.#client = new ApolloClient({
      uri,
      cache: new InMemoryCache(),
    });
    this.#pagerduty = api({ token: pagerDutyToken });
  }

  async query<T, TVars = OperationVariables>(
    query: Query<T, TVars>,
    variables?: TVars,
    callbacks?: Callbacks
  ): Promise<void> {
    return this.#client
      .query<T, TVars>({ query, variables })
      .then((res) => {
        console.log("aQ", res);
        this.handleSuccess(res, callbacks?.onSuccess);
      })
      .catch((error) => this.handleError(error, callbacks?.onError));
  }
  async mutate<T, TVars = OperationVariables>(mutation: Mutation<T, TVars>, variables?: TVars) {
    return this.#client
      .mutate<T, TVars>({ mutation, variables })
      .then(this.handleSuccess)
      .catch(this.handleError);
  }

  private handleSuccess<T>(result: FetchResult<T>, onSuccess?: (result: FetchResult<T>) => any): void {
    console.log("handleSuccess", result);
    return onSuccess && onSuccess(result);
  }

  private handleError(error: any, onError?: (error: any) => any): void {
    console.log("handleError", error);
    this.#pagerduty
      .post("/incidents", {
        data: {
          incident: {
            type: "incident",
            title: "Error occured",
            service: { id: "test", type: "test" },
            body: { type: "Error", details: error?.message || error },
          },
        } as Incident,
      })
      .then((res) => {
        console.log("pagerduty success", res, JSON.stringify(res.data.error.errors));
      })
      .catch((error) => {
        console.log("pagerduty error", error);
      });
    onError && onError(error);
  }
}

/* eslint-enable */
