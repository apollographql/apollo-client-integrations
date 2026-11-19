---
"@apollo/client-react-streaming": patch
---

`TeeToReadableStreamLink`: don't throw when the stream has already been cancelled (e.g. because the request was aborted) before a result arrives. Previously this caused an uncaught `TypeError: Invalid state: Controller is already closed`.
