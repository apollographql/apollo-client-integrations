# @apollo/client-integration-react-router

This package provides integrations between Apollo Client and React Router 7 to support modern streaming SSR.

## Apollo Client Skill

Give your AI agent specialized Apollo Client knowledge and setup guidance:

```sh
npx skills add apollographql/skills --skill apollo-client
```

## Setup

Install dependencies:

```sh
npm i @apollo/client-integration-react-router @apollo/client graphql
```

Create an `app/apollo.ts` with that exports a `makeClient` function and an `apolloLoader` created with `createApolloLoaderHandler`:

```ts
import { ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import {
  createApolloLoaderHandler,
  ApolloClient,
} from "@apollo/client-integration-react-router";

// `request` will be available on the server during SSR or in loaders, but not in the browser
export const makeClient = (request?: Request) => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({ uri: "https://your.graphql.api" }),
  });
};
export const apolloLoader = createApolloLoaderHandler(makeClient);
```

> [!IMPORTANT]  
> `ApolloClient` needs to be imported from `@apollo/client-integration-react-router`, not from `@apollo/client`.

Run `yarn react-router reveal`. This will create the files `app/entry.client.tsx` and `app/entry.server.tsx`.

Adjust `app/entry.client.tsx`:

```diff
+import { makeClient } from "./apollo";
+import { ApolloProvider } from "@apollo/client";

startTransition(() => {
+ const client = makeClient();
  hydrateRoot(
  document,
  <StrictMode>
+    <ApolloProvider client={client}>
       <HydratedRouter />
+    </ApolloProvider>
  </StrictMode>
  );
});
```

Adjust `app/entry.server.tsx`:

```diff
+import { makeClient } from "./apollo";
+import { ApolloProvider } from "@apollo/client";

export default function handleRequest(
  // ...
) {
  return new Promise((resolve, reject) => {
  // ...
+ const client = makeClient(request);
  const { pipe, abort } = renderToPipeableStream(
+   <ApolloProvider client={client}>
      <ServerRouter
        context={routerContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
+   </ApolloProvider>,
    {
      [readyOption]() {
        shellRendered = true;
```

Add `<ApolloHydrationHelper>` to `app/root.tsx`

```diff
+ import { ApolloHydrationHelper } from "@apollo/client-integration-react-router";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      // ...
      <body>
-        {children}
+        <ApolloHydrationHelper>{children}</ApolloHydrationHelper>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

## Usage

### Using `apolloLoader` with `useReadQuery`

You can now use the `apolloLoader` function to create Apollo-enabled loaders:

```ts
export const loader = apolloLoader<Route.LoaderArgs>()(({ preloadQuery }) => {
  const myQueryRef = preloadQuery(MY_QUERY, {
    variables: { someVariable: 1 },
  });
  return {
    myQueryRef,
  };
});
```

> [!IMPORTANT]  
> To provide you with better TypeScript support, this is a method that you need to call twice: `apolloLoader<LoaderArgs>()(loader)`

Then you can consume this `myQueryRef` object with `useReadQuery` in your component:

```ts
export default function Home() {
  const { myQueryRef } = useLoaderData<typeof loader>();

  const { data } = useReadQuery(myQueryRef);

  return (
    <div> do something with `data` here </div>
  )
}
```

### Using `preloadQuery.awaitable` for `meta()` and other loader data needs

The standard `preloadQuery()` returns an opaque query ref that can only be consumed by
`useReadQuery` in a component — you cannot `await` it for raw data inside the loader.
This is a problem when you need actual values in the loader, for example to set document
metadata via React Router's `meta()` export.

`preloadQuery.awaitable()` solves this by returning two things:

- **`queryRef`** — the same transportable query ref as `preloadQuery()`, for streaming to
  the client.
- **`resolveWhen(predicate)`** — a function that returns a Promise. The promise resolves
  with the query `data` as soon as the predicate returns `true` against an incoming result.
  This works with `@defer` — the predicate is evaluated against each incremental result,
  so you can await only the critical initial data while deferred fields keep streaming.

```ts
import { gql } from "@apollo/client";

const MY_QUERY = gql`
  query Product($id: ID!) {
    product(id: $id) {
      id
      title
      rating @defer {
        value
      }
    }
  }
`;

export const loader = apolloLoader<Route.LoaderArgs>()(async ({
  preloadQuery,
}) => {
  const { queryRef, resolveWhen } = preloadQuery.awaitable(MY_QUERY);

  // Await only the product title — `rating` will stream in later via @defer
  const data = await resolveWhen(
    (data) => data?.product?.title !== null
  );

  return {
    queryRef,
    title: data.product.title,
  };
});

// `meta()` now has access to the awaited data
export function meta({ data }: Route.MetaArgs) {
  return [{ title: data!.title }];
}

export default function Products() {
  const { queryRef } = useLoaderData<typeof loader>();
  const { data } = useReadQuery(queryRef);

  return (
    <div>
      <h1>{product.title}</h1>
      <span>Rating: {product.rating?.value ?? "loading..."}</span>
    </div>
  );
}
```

> [!NOTE] > `resolveWhen` rejects if the query completes (all deferred chunks arrive)
> without the predicate ever returning `true`, or if the query errors.
> Make sure your predicate matches on a condition that the initial (non-deferred) response satisfies.
