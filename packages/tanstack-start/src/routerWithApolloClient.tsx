import { type PreloadTransportedQueryFunction } from "@apollo/client-react-streaming";
import type { ApolloClient } from "@apollo/client-react-streaming";
import { createTransportedQueryPreloader } from "@apollo/client-react-streaming";
import { ApolloProvider } from "./ApolloProvider.js";
import { createQueryPreloader } from "@apollo/client/react";
import { type AnyRouter } from "@tanstack/react-router";
import React from "react";
import { getQueryRefSerializationAdapter } from "./QueryRefSerializationAdapter.js";
import type {
  ClientTransport,
  TransportSerializationAdapter,
} from "./Transport.js";
import { ServerTransport, transportSerializationAdapter } from "./Transport.js";

/** @alpha */
export interface ApolloClientRouterContext {
  apolloClient: ApolloClient;
  apolloClientTransport: ServerTransport | ClientTransport;
  preloadQuery: PreloadTransportedQueryFunction;
}

import type { QueryRefSerializationAdapter } from "./QueryRefSerializationAdapter.js";
export declare namespace routerWithApolloClient {
  export type SerializationAdapters = [
    QueryRefSerializationAdapter,
    TransportSerializationAdapter,
  ];
}

/** @alpha */
export function routerWithApolloClient<TRouter extends AnyRouter>(
  router: TRouter["options"]["context"] extends ApolloClientRouterContext
    ? TRouter
    : never,
  apolloClient: ApolloClient
): TRouter {
  const context = router.options.context as ApolloClientRouterContext;

  context.apolloClient = apolloClient;
  context.preloadQuery = router.isServer
    ? createTransportedQueryPreloader(apolloClient, { prepareForReuse: true })
    : (createQueryPreloader(
        apolloClient
      ) as unknown as PreloadTransportedQueryFunction);

  const ogHydrate = router.options.hydrate;
  const ogDehydrate = router.options.dehydrate;

  if (router.isServer) {
    const apolloClientTransport = new ServerTransport();
    context.apolloClientTransport = apolloClientTransport;
    router.options.dehydrate = async () => {
      router.serverSsr!.onRenderFinished(() =>
        apolloClientTransport.closeOnceFinished()
      );
      return {
        ...(await ogDehydrate?.()),
        apolloClientTransport,
      };
    };
  } else {
    router.options.hydrate = (dehydratedState) => {
      context.apolloClientTransport = dehydratedState.apolloClientTransport;
      return ogHydrate?.(dehydratedState);
    };
  }

  router.options.serializationAdapters = [
    ...(router.options.serializationAdapters ?? []),
    getQueryRefSerializationAdapter(apolloClient),
    transportSerializationAdapter,
  ];

  const PreviousInnerWrap = router.options.InnerWrap || React.Fragment;
  // eslint-disable-next-line react/display-name
  router.options.InnerWrap = ({ children }) => (
    <ApolloProvider router={router}>
      <PreviousInnerWrap>{children}</PreviousInnerWrap>
    </ApolloProvider>
  );

  return router;
}
