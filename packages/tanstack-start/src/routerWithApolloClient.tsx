import {
  isTransportedQueryRef,
  reviveTransportedQueryRef,
  type PreloadTransportedQueryFunction,
} from "@apollo/client-react-streaming";
import type { ApolloClient } from "@apollo/client-react-streaming";
import { createTransportedQueryPreloader } from "@apollo/client-react-streaming";
import { ApolloProvider } from "./ApolloProvider.js";
import { createQueryPreloader } from "@apollo/client/react";
import { type AnyRouter } from "@tanstack/react-router";
import React from "react";

/** @alpha */
export interface ApolloClientRouterContext {
  apolloClient: ApolloClient;
  preloadQuery: PreloadTransportedQueryFunction;
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
    ? createTransportedQueryPreloader(apolloClient)
    : (createQueryPreloader(
        apolloClient
      ) as unknown as PreloadTransportedQueryFunction);

  const originalHydrate = router.options.hydrate;
  router.options.hydrate = (...args) => {
    originalHydrate?.(...args);

    for (const match of router.state.matches) {
      // using JSON.stringify to recurse the object
      JSON.stringify(match.loaderData, (_, value) => {
        if (isTransportedQueryRef(value)) {
          reviveTransportedQueryRef(
            value,
            (router.options.context as { apolloClient: ApolloClient })
              .apolloClient
          );
        }
        return value;
      });
    }
  };
  const PreviousInnerWrap = router.options.InnerWrap || React.Fragment;
  // eslint-disable-next-line react/display-name
  router.options.InnerWrap = ({ children }) => (
    <ApolloProvider router={router}>
      <PreviousInnerWrap>{children}</PreviousInnerWrap>
    </ApolloProvider>
  );

  return router;
}
