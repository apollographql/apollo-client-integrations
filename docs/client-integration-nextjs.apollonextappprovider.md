<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@apollo/client-integration-nextjs](./client-integration-nextjs.md) &gt; [ApolloNextAppProvider](./client-integration-nextjs.apollonextappprovider.md)

## ApolloNextAppProvider variable

&gt; This export is only available in React Client Components

A version of `ApolloProvider` to be used with the Next.js App Router.

As opposed to the normal `ApolloProvider`<!-- -->, this version does not require a `client` prop, but requires a `makeClient` prop instead.

Use this component together with `ApolloClient` and `InMemoryCache` from the `"@apollo/client-integration-nextjs"` package to make an ApolloClient instance available to your Client Component hooks in the Next.js App Router.

**Signature:**

```typescript
ApolloNextAppProvider: _apollo_client_react_streaming.WrappedApolloProvider<_apollo_client_react_streaming_manual_transport.HydrationContextOptions>
```

## Example

`app/ApolloWrapper.jsx`

```tsx
import { HttpLink } from "@apollo/client";
import { ApolloNextAppProvider, ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";

function makeClient() {
  const httpLink = new HttpLink({
    uri: "https://example.com/api/graphql",
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: httpLink,
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
```

