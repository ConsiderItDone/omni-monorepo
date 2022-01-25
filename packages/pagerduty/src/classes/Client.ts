import "cross-fetch/polyfill";
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  FetchResult,
  OperationVariables,
} from "@apollo/client/core";
import { Callbacks, Mutation, Query } from "../types";
import Metric from "./Metric";
import Metrics from "./Metrics";
import { v1 } from "@datadog/datadog-api-client";
/* eslint-disable */

function initMetricsApi() {
  const configuration = v1.createConfiguration({});
  return new v1.MetricsApi(configuration);
}

export default class Client {
  #client: ApolloClient<NormalizedCacheObject>;
  #metricsApi: v1.MetricsApi;

  constructor(uri?: string) {
    this.#client = new ApolloClient({
      uri,
      cache: new InMemoryCache(),
    });

    this.#metricsApi = initMetricsApi();
  }
  async query<T, TVars = OperationVariables>(query: Query<T, TVars>, variables?: TVars, callbacks?: Callbacks) {
    //@ts-ignore
    return await this.#client.query<T, TVars>({ query, variables });
  }
  async mutate<T, TVars = OperationVariables>(mutation: Mutation<T, TVars>, variables?: TVars) {
    return (
      this.#client
        //@ts-ignore
        .mutate<T, TVars>({ mutation, variables })
        .then(this.handleSuccess)
        .catch(this.handleError)
    );
  }

  private handleSuccess<T>(result: FetchResult<T>, onSuccess?: (result: FetchResult<T>) => any): FetchResult<T> {
    console.log("handleSuccess", result);
    onSuccess && onSuccess(result);
    return result;
  }

  private handleError(error: any, onError?: (error: any) => any): void {
    console.log("handleError", error);
    onError && onError(error);
    return error;
  }
  async submitMetrics(metricsToSubmit: Metric[]) {
    const metrics = new Metrics(metricsToSubmit);
    return await this.#metricsApi.submitMetrics(metrics.getParams());
  }
}
/* eslint-enable */
