---
"@apollo/client-react-streaming": minor
"@apollo/client-integration-react-router": minor
---

Add `preloadQuery.waitForStaticResult()` API for awaiting query data from a preloaded query ref.

This new method takes an already-created `queryRef` and returns a promise that resolves with the query result. An optional predicate can resolve the promise early against incremental `@defer` results, enabling use cases like populating React Router's `meta()` function with critical data without blocking the full streaming response.
