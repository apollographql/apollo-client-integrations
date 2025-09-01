import {
  DataTransportContext,
  WrapApolloProvider,
} from "@apollo/client-react-streaming";
import type { AnyRouterWithContext } from "@tanstack/react-router";
import React from "react";
import type { QueryEvent } from "@apollo/client-react-streaming";
import { bundle } from "./bundleInfo.js";
import type { ApolloClientRouterContext } from "./routerWithApolloClient.js";
import { invariant } from "@apollo/client/utilities/invariant";

declare global {
  interface Window {
    __APOLLO_EVENTS__?: Pick<QueryEvent[], "push">;
  }
}

export const ApolloProvider = ({
  router,
  children,
}: React.PropsWithChildren<{
  router: AnyRouterWithContext<ApolloClientRouterContext>;
}>) => {
  return (
    <WrappedApolloProvider
      router={router}
      makeClient={() =>
        (router.options.context as ApolloClientRouterContext).apolloClient
      }
    >
      {children}
    </WrappedApolloProvider>
  );
};

const WrappedApolloProvider = WrapApolloProvider<{
  router: AnyRouterWithContext<ApolloClientRouterContext>;
}>((props) => {
  const router = props.router;
  const context: ApolloClientRouterContext = router.options.context;

  const transport = context.apolloClientTransport;
  if ("dispatchRequestStarted" in transport) {
    invariant(
      props.registerDispatchRequestStarted,
      "Browser bundle loaded in SSR"
    );
    props.registerDispatchRequestStarted(transport.dispatchRequestStarted);
  } else {
    invariant(
      props.onQueryEvent && props.rerunSimulatedQueries,
      "SSR bundle loaded in Browser"
    );
    transport.onQueryEvent = props.onQueryEvent;
    transport.rerunSimulatedQueries = props.rerunSimulatedQueries;
  }

  return (
    <DataTransportContext.Provider value={transport}>
      {props.children}
    </DataTransportContext.Provider>
  );
});
WrappedApolloProvider.info = bundle;
