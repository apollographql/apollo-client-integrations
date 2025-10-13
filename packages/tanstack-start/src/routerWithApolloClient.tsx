import { createTransportedQueryPreloader } from "@apollo/client-react-streaming";
import { createQueryPreloader } from "@apollo/client/react";
import type { AnyRouter } from "@tanstack/router-core";
import React from "react";
import type { ApolloClientIntegration } from "./ApolloClientIntegration.js";
import { ApolloProvider } from "./ApolloProvider.js";
import type { ApolloClient } from "./index.js";
import { getQueryRefSerializationAdapter } from "./QueryRefSerializationAdapter.js";
import { ServerTransport, transportSerializationAdapter } from "./Transport.js";

/** @alpha */
export function routerWithApolloClient<TRouter extends AnyRouter>(
  router: TRouter["options"]["context"] extends ApolloClientIntegration.RouterContext
    ? TRouter
    : never,
  apolloClient: ApolloClient
): TRouter {
  router.options.context ??= {};
  router.options.context.apolloClient = apolloClient;
  router.options.context.preloadQuery = (router.isServer
    ? createTransportedQueryPreloader(apolloClient, { prepareForReuse: true })
    : createQueryPreloader(
        apolloClient
      )) as unknown as ApolloClientIntegration.PreloadTransportedQueryFunction;

  const providerContext = {} as ApolloProvider.Context;

  const ogHydrate = router.options.hydrate;
  const ogDehydrate = router.options.dehydrate;

  if (router.isServer) {
    const apolloClientTransport = new ServerTransport();
    providerContext.transport = apolloClientTransport;
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
      providerContext.transport = dehydratedState.apolloClientTransport;
      return ogHydrate?.(dehydratedState);
    };
  }

  router.options.serializationAdapters = [
    ...(router.options.serializationAdapters ?? []),
    getQueryRefSerializationAdapter(apolloClient),
    transportSerializationAdapter,
  ];

  // necessary to have `RouterOptionsExtensions` applied to `router.options` - otherwise the build fails
  type _ForceRouterTypes = typeof import("@tanstack/react-router");
  const PreviousInnerWrap = router.options.InnerWrap || React.Fragment;
  // eslint-disable-next-line react/display-name
  router.options.InnerWrap = ({ children }) => (
    <ApolloProvider client={apolloClient} context={providerContext}>
      <PreviousInnerWrap>{children}</PreviousInnerWrap>
    </ApolloProvider>
  );

  return router;
}

routerWithApolloClient.defaultContext = {
  apolloClient: new Proxy({} as any, { get: contextAccess }),
  preloadQuery: new Proxy(contextAccess as any, { get: contextAccess }),
} satisfies ApolloClientIntegration.RouterContext as ApolloClientIntegration.RouterContext;

function contextAccess(): never {
  throw new Error(
    `
Could not find Apollo Client in router context. 
Did you forget to wrap your router in a \`routerWithApolloClient\` call before returning it from \`getRouter\`?
`.trim()
  );
}
