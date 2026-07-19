---
"@apollo/client-react-streaming": patch
---

Prevent a late-arriving SSR-transported query result from overwriting newer
data the browser cache received in the meantime (e.g. from a mutation result,
an optimistic update or `writeQuery`). If newer data covering any part of the
query was written while the transported result was still in flight, the query
is refetched in the browser instead, so the cache converges on fresh server
data rather than reverting to a stale snapshot.
