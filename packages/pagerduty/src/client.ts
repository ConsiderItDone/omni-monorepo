import {
  ApolloClient,
  InMemoryCache,
  gql,
  NormalizedCacheObject,
  FetchResult,
  ApolloQueryResult,
} from "@apollo/client";
import { constructLink } from "./utils";
import { DocumentNode } from "graphql";

interface Callbacks {
  onSuccess?: (result: FetchResult) => any;
  onError?: (error: any) => any;
}

export default class Client {
  #client: ApolloClient<NormalizedCacheObject>;

  constructor(uri?: string) {
    this.#client = new ApolloClient({
      link: constructLink(uri),
      cache: new InMemoryCache(),
    });
  }

  async query<T>(query: DocumentNode, variables?: any, callbacks?: Callbacks) {
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

  #handleSuccess<T>(result: FetchResult<T>, onSuccess?: (result: FetchResult<T>) => any) {
    console.log(result);
    onSuccess && onSuccess(result);
  }

  #handleError(error: any, onError?: (error: any) => any) {
    console.log(error);
    onError && onError(error);
  }
}
