# @apollo/client-integration-nextjs

## 0.13.0

### Minor Changes

- a434180: Drop depdendency `ts-invariant`. Please use `setLogVerbosity` from `@apollo/client` instead of `setVerbosity` from `ts-invariant`.
- a434180: Updating Apollo Client from v3 to v4. Please follow the [Apollo Client migration guide](https://www.apollographql.com/docs/react/migrating/apollo-client-4-migration).
- a434180: Update signature of PreloadTransportedQueryOptions from `<TVariables, TData>` to `<TData, TVariables>`
- a434180: Deprecate `PreloadQueryOptions` - please use `PreloadQuery.Options` instead.
- a434180: Deprecate `PreloadQueryProps` - please use `PreloadQuery.Props` instead.

### Patch Changes

- Updated dependencies [a434180]
- Updated dependencies [a434180]
- Updated dependencies [a434180]
- Updated dependencies [a434180]
- Updated dependencies [a434180]
  - @apollo/client-react-streaming@0.13.0

## 0.12.3

### Patch Changes

- Updated dependencies [45781d4]
  - @apollo/client-react-streaming@0.12.3

## 0.12.3-alpha.5

### Patch Changes

- @apollo/client-react-streaming@0.12.3-alpha.5

## 0.12.2

### Patch Changes

- Updated dependencies [c1db3fd]
  - @apollo/client-react-streaming@0.12.2

## 0.12.1

### Patch Changes

- 1957588: Fix dependencies to require React 19 and Next.js 15.
  This should already have been part of the 0.12 release, but was forgotten.

  - React 19 is required for the new mechanism behind `PreloadQuery`
  - Next.js 15 is a consequence of that. As versions prior to `15.2.3` had a security vulnerability, we chose that as the minimal supported version.

- Updated dependencies [1957588]
  - @apollo/client-react-streaming@0.12.1

## 0.12.0

### Minor Changes

- 53972d4: Rename package `@apollo/experimental-nextjs-app-support` to `@apollo/client-integration-nextjs`
- 8209093: Implement multipart streaming support with `@defer` for `PreloadQuery`

### Patch Changes

- dd2c972: Adjust imports to use the `@apollo/client/react` entrypoint for React-specific imports.
- Updated dependencies [dd2c972]
- Updated dependencies [c1e2415]
- Updated dependencies [3b6eca6]
- Updated dependencies [8209093]
- Updated dependencies [20ce0c8]
- Updated dependencies [9a8c872]
- Updated dependencies [563db9b]
  - @apollo/client-react-streaming@0.12.0

## 0.12.0-alpha.4

### Patch Changes

- Updated dependencies [3b6eca6]
  - @apollo/client-react-streaming@0.12.0-alpha.4

## 0.12.0-alpha.3

### Patch Changes

- Updated dependencies [c1e2415]
  - @apollo/client-react-streaming@0.12.0-alpha.3

## 0.12.0-alpha.2

### Patch Changes

- dd2c972: Adjust imports to use the `@apollo/client/react` entrypoint for React-specific imports.
- Updated dependencies [dd2c972]
  - @apollo/client-react-streaming@0.12.0-alpha.2

## 0.12.0-alpha.1

### Patch Changes

- @apollo/client-react-streaming@0.12.0-alpha.1
