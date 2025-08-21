import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import {
  routerWithApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-tanstack-start";

import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";

import { IncrementalSchemaLink } from "@integration-test/shared/IncrementalSchemaLink";
import { schema } from "@integration-test/shared/schema";
import { errorLink } from "@integration-test/shared/errorLink";
import { delayLink } from "@integration-test/shared/delayLink";
import { HttpLink, ApolloLink, setLogVerbosity } from "@apollo/client";

setLogVerbosity("debug");
loadDevMessages();
loadErrorMessages();

const link = ApolloLink.from([
  delayLink,
  errorLink,
  typeof window === "undefined"
    ? new IncrementalSchemaLink({ schema })
    : new HttpLink({ uri: "/api/graphql" }),
]);

export function createRouter() {
  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    link,
  });
  const router = createTanStackRouter({
    routeTree,
    context: {} as any,
  });

  return routerWithApolloClient(router, apolloClient);
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createRouter>;
  }
}
