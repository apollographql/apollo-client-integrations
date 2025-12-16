# @apollo/client-react-streaming

## 0.14.2

### Patch Changes

- 156a5e1: Fix a bug where `useQuery` started off with `loading: false`.

## 0.14.0

### Minor Changes

- 5c5c0e4: Rework approach for rehydrating transported QueryRefs to preserve user-defined options better.

## 0.13.2

### Patch Changes

- f6ada64: Ensure that `dataState` hook return value is transported to prevent hydration mismatches.

## 0.13.1

### Patch Changes

- af90924: Export modified `Options` type for `ApolloClient`.

## 0.13.0

### Minor Changes

- a434180: Drop depdendency `ts-invariant`. Please use `setLogVerbosity` from `@apollo/client` instead of `setVerbosity` from `ts-invariant`.
- a434180: Updating Apollo Client from v3 to v4. Please follow the [Apollo Client migration guide](https://www.apollographql.com/docs/react/migrating/apollo-client-4-migration).
- a434180: Update signature of PreloadTransportedQueryOptions from `<TVariables, TData>` to `<TData, TVariables>`
- a434180: Deprecate `PreloadQueryOptions` - please use `PreloadQuery.Options` instead.
- a434180: Deprecate `PreloadQueryProps` - please use `PreloadQuery.Props` instead.

## 0.12.3

### Patch Changes

- 45781d4: Adds a `dangerous_disableHookValueTransportation` option to `ManualDataTransport`.

  If `true`, the `useStaticValueRef` hook will not transport values over to the client.
  This hook is used to transport the values of hook calls during SSR to the client, to ensure that
  the client will rehydrate with the exact same values as it rendered on the server.

  This mechanism is in place to prevent hydration mismatches as described in
  https://github.com/apollographql/apollo-client-integrations/blob/pr/RFC-2/RFC.md#challenges-of-a-client-side-cache-in-streaming-ssr
  (first graph of the "Challenges of a client-side cache in streaming SSR" section).

  Setting this value to `true` will save on data transported over the wire, but comes with the risk
  of hydration mismatches.
  Strongly discouraged with older React versions, as hydration mismatches there will likely crash
  the application, setting this to `true` might be okay with React 19, which is much better at recovering
  from hydration mismatches - but it still comes with a risk.
  When enabling this, you should closely monitor error reporting and user feedback.

## 0.12.2

### Patch Changes

- c1db3fd: Call `removeQuery` instead of `stopQuery` to be more compatible with Apollo Client 4.0.

## 0.12.1

### Patch Changes

- 1957588: Fix dependencies to require React 19 and Next.js 15.
  This should already have been part of the 0.12 release, but was forgotten.

  - React 19 is required for the new mechanism behind `PreloadQuery`
  - Next.js 15 is a consequence of that. As versions prior to `15.2.3` had a security vulnerability, we chose that as the minimal supported version.

## 0.12.0

### Minor Changes

- 8209093: Implement multipart streaming support with `@defer` for `PreloadQuery`
- 20ce0c8: add `TeeToReadableStreamLink` and `ReadFromReadableStreamLink`

### Patch Changes

- dd2c972: Adjust imports to use the `@apollo/client/react` entrypoint for React-specific imports.
- c1e2415: Remove `_hydrated` property on transported queryRefs, use `WeakMap` instead.
- 3b6eca6: Added a warning when calling the `query` shortcut of `registerApolloClient` outside of a RSC (e.g. in Server Actions or Middleware).
  This could cause situations where users would accidentally create multiple Apollo Client instances.
- 9a8c872: Start an alpha branch
- 563db9b: add support for `useSuspenseFragment`

## 0.12.0-alpha.4

### Patch Changes

- 3b6eca6: Added a warning when calling the `query` shortcut of `registerApolloClient` outside of a RSC (e.g. in Server Actions or Middleware).
  This could cause situations where users would accidentally create multiple Apollo Client instances.

## 0.12.0-alpha.3

### Patch Changes

- c1e2415: Remove `_hydrated` property on transported queryRefs, use `WeakMap` instead.

## 0.11.11

### Patch Changes

- 372cf0c: Add an optimiziation to minimize reexecution of React components during hydration.

## 0.12.0-alpha.2

### Patch Changes

- dd2c972: Adjust imports to use the `@apollo/client/react` entrypoint for React-specific imports.

## 0.11.10

### Patch Changes

- 37941aa: Adjust imports to use the `@apollo/client/react` entrypoint for React-specific imports.

## 0.12.0-alpha.1

## 0.12.0-alpha.0

### Minor Changes

- 8209093: Implement multipart streaming support for `PreloadQuery`
- 20ce0c8: add `TeeToReadableStreamLink` and `ReadFromReadableStreamLink`

### Patch Changes

- 9a8c872: Start an alpha branch
- 563db9b: add support for `useSuspenseFragment`

## 0.11.9

### Patch Changes

- aaf041c: `createInjectionTransformStream`: fix handling if `</head>` is chopped up into multiple chunks

## 0.11.8

### Patch Changes

- 251bec9: Change package publishing to Changesets
- 2f779cd: Add missing `peerDependencies`: `react-dom` and `graphql`
