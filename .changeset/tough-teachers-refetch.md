---
"@apollo/client-react-streaming": patch
---

Fix `SimulatePreloadedQuery` firing a spurious network request that races the transported stream during hydration (#546).

The extra `useBackgroundQuery` observable created next to the revived `queryRef` runs with the default `cache-first` policy. During hydration the transported result may not have reached the cache yet, so `cache-first` observes an empty cache and fires a duplicate network request for a query the server already executed. The revived `queryRef` already delivers the result via its stream-reading link chain (and falls back to the network on stream error), so the background query is skipped when the policy is `cache-first`. Callers that explicitly opt into `network-only` / `cache-and-network` are unaffected.
