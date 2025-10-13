# @apollo/client-integration-tanstack-start

This package provides integrations between Apollo Client and TanStack Start to support modern streaming SSR.

## Setup

Install dependencies:

```sh
npm i @apollo/client-integration-tanstack-start @apollo/client graphql
```

In your `routes/__root.tsx`, change from `createRootRoute` to `createRootRouteWithContext` to provide the right context type to your application.

```diff
+import type { ApolloClientIntegration } from "@apollo/client-integration-tanstack-start";
import {
-   createRootRoute
+   createRootRouteWithContext
} from "@tanstack/react-router";

-export const Route = createRootRoute({
+export const Route = createRootRouteWithContext<ApolloClientIntegration.RouterContext>()({
```

In your `router.tsx`, set up your Apollo Client instance and run `routerWithApolloClient`

```ts
import {
  routerWithApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-tanstack-start";
import { HttpLink } from "@apollo/client";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  const apolloClient = new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({ uri: "https://your.graphql.api" }),
  });
  const router = createTanStackRouter({
    routeTree,
    context: {
      ...routerWithApolloClient.defaultContext,
    },
  });

  return routerWithApolloClient(router, apolloClient);
}
```

> [!IMPORTANT]  
> `ApolloClient` and `InMemoryCache` need to be imported from `@apollo/client-integration-tanstack-start`, not from `@apollo/client`.

## Usage

### `loader` with `preloadQuery` and `useReadQuery`

```ts
import { useReadQuery } from "@apollo/client";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/loader-defer")({
  component: RouteComponent,
  loader: ({ context: { preloadQuery } }) => {
    const queryRef = preloadQuery(QUERY, {
      variables: { myVariable: "myValue" },
    });
    return {
      queryRef,
    };
  },
});

function RouteComponent() {
  const { queryRef } = Route.useLoaderData();
  const { data } = useReadQuery(queryRef);

  return (
    <div> do something with `data` here </div>
  )
}
```

### `useSuspenseQuery`

You can also use the suspenseful Apollo Client api `useSuspenseQuery` (or `useQueryRef` and `useReadQuery`) directly into your component without a loader:

```tsx
import { useSuspenseQuery } from "@apollo/client";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/myPage")({
  component: RouteComponent,
});

function RouteComponent() {
  const { data } = useSuspenseQuery(QUERY);

  return <div> do something with `data` here </div>;
}
```
