import "cross-fetch/polyfill";
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  FetchResult,
  OperationVariables,
} from "@apollo/client/core";
import { Callbacks, Metrics, MetricsData, Mutation, Query } from "./types";
import { v1, v2 } from "@datadog/datadog-api-client";
/* eslint-disable */
function initIncidentClient() {
  const configuration = v2.createConfiguration();
  //@ts-ignore
  configuration.unstableOperations["createIncident"] = true;
  return new v2.IncidentsApi(configuration);
}
function initMetricsApi() {
  const configuration = v1.createConfiguration({});
  console.log("config", configuration);
  const api = new v1.MetricsApi(configuration);
  console.log("api", api);
  return api;
}
function initApi() {
  const configuration = v1.createConfiguration();
  return new v1.AuthenticationApi(configuration);
}
export default class Client {
  #client: ApolloClient<NormalizedCacheObject>;
  #metricsApi: v1.MetricsApi;
  #datadog: v1.AuthenticationApi;
  constructor(uri?: string, pagerDutyToken?: string) {
    this.#client = new ApolloClient({
      uri,
      cache: new InMemoryCache(),
    });

    this.#metricsApi = initMetricsApi();
    this.#datadog = initApi();
  }
  get datadog() {
    return this.#datadog;
  }

  async query<T, TVars = OperationVariables>(query: Query<T, TVars>, variables?: TVars, callbacks?: Callbacks) {
    return this.#client.query<T, TVars>({ query, variables });
  }

  async mutate<T, TVars = OperationVariables>(mutation: Mutation<T, TVars>, variables?: TVars) {
    return this.#client
      .mutate<T, TVars>({ mutation, variables })
      .then(this.handleSuccess)
      .catch(this.handleError);
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
  async submitMetrics(metricsData: MetricsData[]) {
    const metrics = new Metrics(metricsData);
    return await this.#metricsApi.submitMetrics(metrics.getParams());
  }
}
/* eslint-enable */
