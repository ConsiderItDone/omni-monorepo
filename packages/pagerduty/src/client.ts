import { ApolloClient, InMemoryCache, NormalizedCacheObject, FetchResult } from "@apollo/client";
import { constructLink } from "./utils";
import { DocumentNode } from "graphql";
/* eslint-disable */
interface Callbacks {
  onSuccess?: (result: FetchResult) => any; //eslint-disable
  onError?: (error: any) => any; //eslint-disable
}

export default class Client {
  #client: ApolloClient<NormalizedCacheObject>;

  constructor(uri?: string) {
    this.#client = new ApolloClient({
      link: constructLink(uri),
      cache: new InMemoryCache(),
    });
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
    onError && onError(error);
  }
}

/* eslint-enable */
