---
"@apollo/client-integration-react-router": patch
---

Widen the `react-router` peer range to `^7.2.0-pre.3 || ^8.0.0`.

React Router 8 does not change any of the surface this package depends on — `useMatches`, `args.request`, `unstable_SerializesTo` and turbo-stream loader-data serialization are all unchanged, and `turbo-stream-v2` is still vendored. Streaming SSR, hydration and client-side navigation via single-fetch all verified working against react-router 8.3.0.
