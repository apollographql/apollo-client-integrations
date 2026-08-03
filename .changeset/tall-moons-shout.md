---
"@apollo/client-integration-react-router": patch
---

Fix types failing to resolve on react-router >= 7.7.0.

`preloader.tsx` imported `CreateServerLoaderArgs` from `react-router/route-module`, a subpath that was removed from react-router's `exports` map in 7.7.0 and is absent from all of 8.x. Consumers hit `TS2307`, or — with the `skipLibCheck: true` that the React Router templates default to — silently lost the `apolloLoader<Route.LoaderArgs>()` constraint as the type degraded to `any`.

The type is no longer reachable from any public react-router subpath, so the constraint is now expressed structurally against the one property this package actually uses (`request`). This keeps types resolving across the full supported react-router range with no peer-range change.
