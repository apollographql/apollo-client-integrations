<div align="center">
<img src="https://raw.githubusercontent.com/apollographql/apollo-client-integrations/main/banner.jpg" width="500" alt="Apollo Client + Next.js App Router" />
</div>

# Apollo Client support for the Next.js App Router

| ☑️ Apollo Client User Survey                                                                                                                                                                                                                                                                                                                                                             |
| :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What do you like best about Apollo Client? What needs to be improved? Please tell us by taking a [one-minute survey](https://docs.google.com/forms/d/e/1FAIpQLSczNDXfJne3ZUOXjk9Ursm9JYvhTh1_nFTDfdq3XBAFWCzplQ/viewform?usp=pp_url&entry.1170701325=Apollo+Client&entry.204965213=Readme). Your responses will help us understand Apollo Client usage and allow us to serve you better. |

## Detailed technical breakdown

You can find a detailed technical breakdown of what this package does and why it needs to do so [in the discussion around the accompanying RFC](https://github.com/apollographql/apollo-client-integrations/pull/9).

## Why do you need this?

### React Server Components

If you want to use Apollo Client in your Next.js app with React Server Components, you will need a way of creating a client instance that is shared between all your server components for one request to prevent making duplicate requests.

### React Client Components

When using the `app` directory, all your "client components" will not only run in the browser. They will also be rendered on the server - in an "SSR" run that will execute after React Server Components have been rendered.

If you want to make the most of your application, you probably already want to make your GraphQL requests on the server so that the page is fully rendered when it reaches the browser.

This package provides the tools necessary to execute your GraphQL queries on the server and to use the results to hydrate your browser-side cache and components.

## Installation

This package has a peer dependency on the latest `@apollo/client`, so you can install both this package and that Apollo Client version via

```sh
npm install @apollo/client@latest @apollo/client-integration-nextjs
```

## Usage

> ❗️ **We do handle "RSC" and "SSR" use cases as completely separate.**\
> You should generally try not to have overlapping queries between the two, as all queries made in SSR can dynamically update in the browser as the cache updates (e.g. from a mutation or another query), but queries made in RSC will not be updated in the browser - for that purpose, the full page would need to rerender. As a result, any overlapping data would result in inconsistencies in your UI.\
> So decide for yourself, which queries you want to make in RSC and which in SSR, and don't have them overlap.

### In RSC

Create an `ApolloClient.js` file:

```js
import { HttpLink } from "@apollo/client";
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      // this needs to be an absolute url, as relative urls cannot be used in SSR
      uri: "http://example.com/api/graphql",
      fetchOptions: {
        // you can pass additional options that should be passed to `fetch` here,
        // e.g. Next.js-related `fetch` options regarding caching and revalidation
        // see https://nextjs.org/docs/app/api-reference/functions/fetch#fetchurl-options
      },
    }),
  });
});
```

You can then use that `getClient` function in your server components:

```js
const { data } = await getClient().query({ query: userQuery });
// `query` is a shortcut for `getClient().query`
const { data } = await query({ query: userQuery });
```

If you want to override Next.js-specific `fetch` options, you can use `context.fetchOptions`:

```js
const { data } = await getClient().query({
  query: userQuery,
  context: {
    fetchOptions: {
      // you can pass additional options that should be passed to `fetch` here,
      // e.g. Next.js-related `fetch` options regarding caching and revalidation
      // see https://nextjs.org/docs/app/api-reference/functions/fetch#fetchurl-options
    },
  },
});
```

For a description of `PreloadQuery`, see [Preloading data in RSC for usage in Client Components](#preloading-data-in-rsc-for-usage-in-client-components)

### In Client Components and streaming SSR

If you use the `app` directory, each Client Component _will_ be SSR-rendered for the initial request. So you will need to use this package.

First, create a new file `app/ApolloWrapper.jsx`:

```js
"use client";
// ^ this file needs the "use client" pragma

import { HttpLink } from "@apollo/client";
import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

// have a function to create a client for you
function makeClient() {
  const httpLink = new HttpLink({
    // this needs to be an absolute url, as relative urls cannot be used in SSR
    uri: "https://example.com/api/graphql",
    // you can disable result caching here if you want to
    // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
    fetchOptions: {
      // you can pass additional options that should be passed to `fetch` here,
      // e.g. Next.js-related `fetch` options regarding caching and revalidation
      // see https://nextjs.org/docs/app/api-reference/functions/fetch#fetchurl-options
    },
    // you can override the default `fetchOptions` on a per query basis
    // via the `context` property on the options passed as a second argument
    // to an Apollo Client data fetching hook, e.g.:
    // const { data } = useSuspenseQuery(MY_QUERY, { context: { fetchOptions: { ... }}});
  });

  // use the `ApolloClient` from "@apollo/client-integration-nextjs"
  return new ApolloClient({
    // use the `InMemoryCache` from "@apollo/client-integration-nextjs"
    cache: new InMemoryCache(),
    link: httpLink,
  });
}

// you need to create a component to wrap your app in
export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
```

Now you can wrap your `RootLayout` in this wrapper component:

```js
import { ApolloWrapper } from "./ApolloWrapper";

// ...

export default function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
      </body>
    </html>
  );
}
```

> ☝️ This will work even if your layout is a React Server Component and will also allow the children of the layout to be React Server Components.\
> It just makes sure that all Client Components will have access to the same Apollo Client instance, shared through the `ApolloNextAppProvider`.

If you want to make the most of the streaming SSR features offered by React & the Next.js App Router, consider using the [`useSuspenseQuery`](https://www.apollographql.com/docs/react/api/react/hooks/#usesuspensequery) and [`useFragment`](https://www.apollographql.com/docs/react/api/react/hooks/#usefragment) hooks.

### Preloading data in RSC for usage in Client Components

Starting with version 0.11, you can preload data in RSC to populate the cache of your Client Components.

For that, follow the setup steps for both RSC and Client Components as laid out in the last two paragraphs. Then you can use the `PreloadQuery` component in your React Server Components:

```jsx
<PreloadQuery
  query={QUERY}
  variables={{
    foo: 1,
  }}
>
  <Suspense fallback={<>loading</>}>
    <ClientChild />
  </Suspense>
</PreloadQuery>
```

And you can use `useSuspenseQuery` in your `ClientChild` component with the same QUERY and variables:

```jsx
"use client";

import { useSuspenseQuery } from "@apollo/client";
// ...

export function ClientChild() {
  const { data } = useSuspenseQuery(QUERY, { variables: { foo: 1 } });
  return <div>...</div>;
}
```

> [!TIP]
> The `Suspense` boundary here is optional and only for demonstration purposes to show that something suspenseful is going on.\
> Place `Suspense` boundaries at meaningful places in your UI, where they give your users the best user experience.

This example will fetch a query in RSC, and then transport the data into the Client Component cache.
Before the child `ClientChild` in the example renders, a "simulated network request" for this query is started in your Client Components.
That way, if you repeat the query in your Client Component using `useSuspenseQuery` (or even `useQuery`!), it will wait for the network request in your Server Component to finish instead of making it's own network request.

> [!IMPORTANT]
> Keep in mind that we don't recommend mixing data between Client Components and Server Components. Data fetched this way should be considered client data and never be referenced in your Server Components. `PreloadQuery` prevents mixing server data and client data by creating a separate `ApolloClient` instance using the `makeClient` function passed into `registerApolloClient`.

> [!TIP]
> If you are using `@defer`: `<PreloadQuery>` allows your deferred data to be streamed in chunk-by-chunk without any cutoff, just as if you would have made that same query in the browser.

#### Usage with `useReadQuery`

Just like using `useBackgroundQuery` with `useReadQuery` in place of `useSuspenseQuery` [to avoid request waterfalls](https://www.apollographql.com/docs/react/data/suspense#avoiding-request-waterfalls), you can also use `PreloadQuery` in combination with `useReadQuery` in Client Components to achieve a similar result. Use the render prop notation to get a `QueryRef` that you can pass to your Client Component:

```jsx
<PreloadQuery
  query={QUERY}
  variables={{
    foo: 1,
  }}
>
  {(queryRef) => (
    <Suspense fallback={<>loading</>}>
      <ClientChild queryRef={queryRef} />
    </Suspense>
  )}
</PreloadQuery>
```

Inside of `ClientChild`, you could then call `useReadQuery` with the `queryRef` prop.

```jsx
"use client";

import { useQueryRefHandlers, useReadQuery, QueryRef } from "@apollo/client";

export function ClientChild({ queryRef }: { queryRef: QueryRef<TQueryData> }) {
  const { refetch } = useQueryRefHandlers(queryRef);
  const { data } = useReadQuery(queryRef);
  return <div>...</div>;
}
```

> [!TIP]
> The `Suspense` boundary here is optional and only for demonstration purposes to show that something suspenseful is going on.\
> Place `Suspense` boundaries at meaningful places in your UI, where they give your users the best user experience.

#### Caveat

Keep in mind that this will look like a "current network request" to your Client Component and as such will update data that is already in your Client Component cache, so make sure that the data you pass from your Server Components is not outdated, e.g. because of other caching layers you might be using, like the Next.js fetch cache.

### Resetting singletons between tests

This package uses some singleton instances on the Browser side - if you are writing tests, you must reset them between tests.

For that, you can use the `resetApolloClientSingletons` helper:

```ts
import { resetApolloClientSingletons } from "@apollo/client-integration-nextjs";

afterEach(resetApolloClientSingletons);
```

## Handling Multipart responses in SSR

Generally, `useSuspenseQuery` will only suspend until the initial response is received.
In most cases, you get a full response, but if you use multipart response features like the `@defer` directive, you will only get a partial response.\
Without further handling, your component will now render with partial data - but the request will still keep running in the background. This is a worst-case scenario because your server will have to bear the load of that request, but the client will not get the complete data anyways.<br/>
To handle this, you can apply one of three different strategies:

- use `PreloadQuery` with `useReadyQuery` - `PreloadQuery` will allow for `@defer`red data to fully be transported over
- remove `@defer` fragments from your query. This will allow you to prerender something in SSR, but the query will restart again in the browser.
- wait for deferred data to be received, either using `AccumulateMultipartResponsesLink` or `useSuspenseFragment`, specifically waiting for deferred fragments.

For this, we ship the two links `RemoveMultipartDirectivesLink` and `AccumulateMultipartResponsesLink`, as well as the `SSRMultipartLink`, which combines both of them into a more convenient-to-use Link.

You can also check out the [Hack The Supergraph example](/examples/hack-the-supergraph-ssr), which shows this in use and allows you to adjust the speed deferred interfaces resolve in.

### Removing `@defer` fragments from your query with `RemoveMultipartDirectivesLink`

Usage example:

```ts
new RemoveMultipartDirectivesLink({
  /**
   * Whether to strip fragments with `@defer` directives
   * from queries before sending them to the server.
   *
   * Defaults to `true`.
   *
   * Can be overwritten by adding a label starting
   * with either `"SsrDontStrip"` or `"SsrStrip"` to the
   * directive.
   */
  stripDefer: true,
});
```

This link will (if called with `stripDefer: true`) strip all `@defer` fragments from your query.

You can exclude certain fragments from this behavior by giving them a label starting with `"SsrDontStrip"`.

Example:

```graphql
query myQuery {
  fastField
  ... @defer(label: "SsrDontStrip1") {
    slowField1
  }
  ... @defer(label: "SsrDontStrip2") {
    slowField2
  }
}
```

You can also use the link with `stripDefer: false` and mark certain fragments to be stripped by giving them a label starting with `"SsrStrip"`.

### Waiting for deferred data to be received with `AccumulateMultipartResponsesLink`

Usage example:

```ts
new AccumulateMultipartResponsesLink({
  /**
   * The maximum delay in milliseconds
   * from receiving the first response
   * until the accumulated data will be flushed
   * and the connection will be closed.
   */
  cutoffDelay: 100,
});
```

This link can be used to "debounce" the initial response of a multipart request. Any incremental data received during the `cutoffDelay` time will be merged into the initial response.

After `cutoffDelay`, the link will return the initial response, even if there is still incremental data pending, and close the network connection.

If `cutoffDelay` is `0`, the link will immediately return data as soon as it is received, without waiting for incremental data, and immediately close the network connection.

### Combining both: `SSRMultipartLink`

Usage example:

```ts
new SSRMultipartLink({
  /**
   * Whether to strip fragments with `@defer` directives
   * from queries before sending them to the server.
   *
   * Defaults to `true`.
   *
   * Can be overwritten by adding a label starting
   * with either `"SsrDontStrip"` or `"SsrStrip"` to the
   * directive.
   */
  stripDefer: true,
  /**
   * The maximum delay in milliseconds
   * from receiving the first response
   * until the accumulated data will be flushed
   * and the connection will be closed.
   *
   * Defaults to `0`.
   */
  cutoffDelay: 100,
});
```

This link combines the behavior of `RemoveMultipartDirectivesLink` and `AccumulateMultipartResponsesLink` into a single link.

### Debugging

If you want more information on what data is sent over the wire, enable logging in your `app/ApolloWrapper.ts`:

```ts
import { setLogVerbosity } from "@apollo/client";
setLogVerbosity("debug");
```
