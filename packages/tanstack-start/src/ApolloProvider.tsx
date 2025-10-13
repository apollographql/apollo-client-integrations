import type { QueryEvent } from "@apollo/client-react-streaming";
import {
  DataTransportContext,
  WrapApolloProvider,
} from "@apollo/client-react-streaming";
import { invariant } from "@apollo/client/utilities/invariant";
import React from "react";
import { bundle } from "./bundleInfo.js";
import type { ClientTransport, ServerTransport } from "./Transport.js";
import type { ApolloClient } from "./ApolloClient.js";

declare global {
  interface Window {
    __APOLLO_EVENTS__?: Pick<QueryEvent[], "push">;
  }
}

export declare namespace ApolloProvider {
  export interface Context {
    transport: ServerTransport | ClientTransport;
  }
}

export const ApolloProvider = ({
  client,
  context,
  children,
}: React.PropsWithChildren<{
  client: ApolloClient;
  context: ApolloProvider.Context;
}>) => {
  return (
    <WrappedApolloProvider makeClient={() => client} context={context}>
      {children}
    </WrappedApolloProvider>
  );
};

const WrappedApolloProvider = WrapApolloProvider<{
  context: ApolloProvider.Context;
}>((props) => {
  const transport = props.context.transport;
  invariant(transport, "No apolloClientTransport defined");
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
