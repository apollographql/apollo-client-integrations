---
"@apollo/client-integration-tanstack-start": patch
---

Fix hydration in browsers that support `ReadableStream` readers but not stream async iteration, including older Safari versions.
