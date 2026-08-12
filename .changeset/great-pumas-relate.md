---
"@apollo/client-integration-react-router": patch
---

Fix `ApolloHydrationHelper` silently doing nothing on react-router 8.

`ApolloHydrationHelper` walked `useMatches()` and read each match's loader return value from `UIMatch.data`. That property was deprecated in favour of `UIMatch.loaderData` and removed in react-router 8.0.0 — and not just from the types: `convertRouteMatchToUiMatch` no longer emits it, so on react-router 8 `match.data` is `undefined` at runtime and the helper never hydrated a single transported query ref.

Neither property spans the supported peer range on its own (`loaderData` was only added in react-router 7.8.0), so the helper now reads whichever one the installed version provides.

Note that `UIMatch.data` also made the package fail to build against react-router 8 with `TS2339`.
