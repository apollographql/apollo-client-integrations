---
"@apollo/client-react-streaming": patch
---

Keep the server value of a hook in the rehydration cache until the hydration render that reads it has been committed. Before, it was deleted as soon as it was read, so when React interrupted hydration and rendered the component again, the retry got the client value instead and could cause a hydration mismatch.
