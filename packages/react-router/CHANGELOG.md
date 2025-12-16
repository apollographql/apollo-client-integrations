# @apollo/client-integration-react-router

## 0.14.2

### Patch Changes

- Updated dependencies [156a5e1]
  - @apollo/client-react-streaming@0.14.2

## 0.14.0-alpha.0

### Patch Changes

- Updated dependencies [5c5c0e4]
  - @apollo/client-react-streaming@0.14.0

## 0.13.2-alpha.0

### Patch Changes

- Updated dependencies [f6ada64]
  - @apollo/client-react-streaming@0.13.2

## 0.13.1-alpha.6

### Patch Changes

- 874abab: Drop depdendency `ts-invariant`. Please use `setLogVerbosity` from `@apollo/client` instead of `setVerbosity` from `ts-invariant`.
- 874abab: Updating Apollo Client from v3 to v4. Please follow the [Apollo Client migration guide](https://www.apollographql.com/docs/react/migrating/apollo-client-4-migration).
- 874abab: Update signature of PreloadTransportedQueryOptions from `<TVariables, TData>` to `<TData, TVariables>`
- 874abab: Deprecate `PreloadQueryOptions` - please use `PreloadQuery.Options` instead.
- 874abab: Deprecate `PreloadQueryProps` - please use `PreloadQuery.Props` instead.
  - @apollo/client-react-streaming@0.13.0

## 0.12.3-alpha.5

### Patch Changes

- @apollo/client-react-streaming@0.12.3-alpha.5

## 0.12.0-alpha.4

### Patch Changes

- 7836098: fix up types for async loaders
- Updated dependencies [3b6eca6]
  - @apollo/client-react-streaming@0.12.0-alpha.4

## 0.12.0-alpha.3

### Patch Changes

- c1e2415: Fix handling of asynchronous loaders.
- Updated dependencies [c1e2415]
  - @apollo/client-react-streaming@0.12.0-alpha.3

## 0.12.0-alpha.2

### Patch Changes

- dd2c972: Adjust imports to use the `@apollo/client/react` entrypoint for React-specific imports.
- Updated dependencies [dd2c972]
  - @apollo/client-react-streaming@0.12.0-alpha.2

## 0.12.0-alpha.1

### Patch Changes

- 2f4890a: Set minimal version of React Router to 7.2.0-pre.3, removes need for patching.
  - @apollo/client-react-streaming@0.12.0-alpha.1

## 0.12.0-alpha.0

### Minor Changes

- 5417a54: Add a package to support React Router streaming SSR

### Patch Changes

- Updated dependencies [8209093]
- Updated dependencies [20ce0c8]
- Updated dependencies [9a8c872]
- Updated dependencies [563db9b]
  - @apollo/client-react-streaming@0.12.0-alpha.0
