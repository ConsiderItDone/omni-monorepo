import { HttpLink, split } from "@apollo/client";
import { WebSocketLink } from "@apollo/client/link/ws";
import { getMainDefinition } from "@apollo/client/utilities";

export function constructLink(httpEndpoint: string, wsEndpoint?: string) {
  const httpLink = new HttpLink({
    uri: httpEndpoint || "http://localhost:4000/graphql",
  });

  const wsLink = new WebSocketLink({
    uri: wsEndpoint || httpEndpoint || "ws://localhost:4000/graphql",
    options: {
      reconnect: true,
    },
  });
  return split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === "OperationDefinition" && definition.operation === "subscription";
    },
    wsLink,
    httpLink
  );
}
