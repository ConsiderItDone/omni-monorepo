import "cross-fetch/polyfill";
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  OperationVariables,
  createHttpLink,
} from "@apollo/client/core";
import { Query } from "../types";
import Metric from "./Metric";
import Metrics from "./Metrics";
import { v1 } from "@datadog/datadog-api-client";
import ApolloLinkTimeout from "apollo-link-timeout";
/* eslint-disable */

function initMetricsApi() {
  const configuration = v1.createConfiguration({});
  return new v1.MetricsApi(configuration);
}

export default class Client {
  #client: ApolloClient<NormalizedCacheObject>;
  #metricsApi: v1.MetricsApi;

  constructor(uri?: string) {
    const timeoutLink = new ApolloLinkTimeout(5000);
    const httpLink = createHttpLink({ uri });
    //@ts-ignore
    const timeoutHttpLink = timeoutLink.concat(httpLink);

    this.#client = new ApolloClient({
      //@ts-ignore
      link: timeoutHttpLink,
      cache: new InMemoryCache(),
    });

    this.#metricsApi = initMetricsApi();
  }
  async query<T, TVars = OperationVariables>(query: Query<T, TVars>, variables?: TVars) {
    //@ts-ignore
    return await this.#client.query<T, TVars>({ query, variables, fetchPolicy: "no-cache" });
  }

  async submitMetrics(metricsToSubmit: Metric[]) {
    const metrics = new Metrics(metricsToSubmit);
    return await this.#metricsApi.submitMetrics(metrics.getParams());
  }
}
/* eslint-enable */
