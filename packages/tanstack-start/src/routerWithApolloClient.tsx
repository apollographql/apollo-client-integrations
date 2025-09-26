import { type PreloadTransportedQueryFunction } from "@apollo/client-react-streaming";
import type { ApolloClient } from "@apollo/client-react-streaming";
import { createTransportedQueryPreloader } from "@apollo/client-react-streaming";
import { ApolloProvider } from "./ApolloProvider.js";
import { createQueryPreloader } from "@apollo/client/react";
import { type AnyRouter } from "@tanstack/react-router";
import React from "react";
import type { ClientTransport } from "./Transport.js";
import { ServerTransport } from "./Transport.js";

/** @alpha */
export interface ApolloClientRouterContext {
  apolloClient: ApolloClient;
  apolloClientTransport: ServerTransport | ClientTransport;
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

  // right now this has no effect, waiting for upstream changes
  // router.options.serializationAdapters = [
  //   ...(router.options.serializationAdapters ?? []),
  //   getQueryRefSerializationAdapter(apolloClient),
  //   transportSerializationAdapter,
  // ];

  const PreviousInnerWrap = router.options.InnerWrap || React.Fragment;
  // eslint-disable-next-line react/display-name
  router.options.InnerWrap = ({ children }) => (
    <ApolloProvider router={router}>
      <PreviousInnerWrap>{children}</PreviousInnerWrap>
    </ApolloProvider>
  );

  return router;
}

routerWithApolloClient.defaultContext = {
  apolloClient: new Proxy({} as any, { get: contextAccess }),
  apolloClientTransport: new Proxy({} as any, { get: contextAccess }),
  preloadQuery: new Proxy(contextAccess as any, { get: contextAccess }),
} as ApolloClientRouterContext;

function contextAccess(): never {
  throw new Error(
    `
Could not find Apollo Client in router context. 
Did you forget to wrap your router in a \`routerWithApolloClient\` call before returning it from \`getRouter\`?

`
  );
}
