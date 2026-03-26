---
"@apollo/client-react-streaming": minor
"@apollo/client-integration-react-router": minor
---

Add `preloadQuery.awaitable()` API for selectively awaiting partial query data in loaders.

This new method returns `{ queryRef, resolveWhen }` — the `queryRef` works identically to the standard `preloadQuery()` for streaming, while `resolveWhen(predicate)` returns a promise that resolves with `data` as soon as the predicate returns `true` against an incoming result. This enables use cases like populating React Router's `meta()` function with query data without blocking the full streaming response, and works naturally with `@defer` for incremental delivery.
