import { ApolloClient, InMemoryCache, NormalizedCacheObject, FetchResult } from "@apollo/client";
import { constructLink } from "./utils";
import { DocumentNode } from "graphql";
import { Incident, Callbacks } from "./types";
import { api } from "@pagerduty/pdjs";
import { PartialCall } from "@pagerduty/pdjs/build/src/api";

/* eslint-disable */

export default class Client {
  #client: ApolloClient<NormalizedCacheObject>;
  #pagerduty: PartialCall;
  constructor(uri?: string, pagerDutyToken?: string) {
    this.#client = new ApolloClient({
      link: constructLink(uri),
      cache: new InMemoryCache(),
    });
    this.#pagerduty = api({ token: pagerDutyToken });
  }

  async query<T>(query: DocumentNode, variables?: any, callbacks?: Callbacks): Promise<void> {
    return this.#client
      .query<T>({ query, variables })
      .then((res) => this.#handleSuccess(res, callbacks?.onSuccess))
      .catch((error) => this.#handleError(error, callbacks?.onError));
  }
  async mutate<T>(mutation: DocumentNode, variables?: any) {
    return this.#client
      .mutate<T>({ mutation, variables })
      .then(this.#handleSuccess)
      .catch(this.#handleError);
  }

  #handleSuccess<T>(result: FetchResult<T>, onSuccess?: (result: FetchResult<T>) => any): void {
    console.log(result);
    onSuccess && onSuccess(result);
  }

  #handleError(error: any, onError?: (error: any) => any): void {
    console.log(error);
    this.#pagerduty
      .post("/incidents", {
        data: {
          incident: {
            type: "incident",
            title: "Error occured",
            service: { id: "SERVER", type: "ERROR" },
            body: { type: "Error", details: error?.message || error },
          },
        } as Incident,
      })
      .then((res) => {
        console.log(res);
      });
    onError && onError(error);
  }
}

/* eslint-enable */
