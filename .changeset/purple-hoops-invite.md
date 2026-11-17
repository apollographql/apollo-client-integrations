---
"@apollo/client-react-streaming": patch
---

Declare `@types/react` as an optional peer dependency so the shipped `.d.ts` files can resolve React types in package layouts where the package is installed outside the consumer's `node_modules` tree.
