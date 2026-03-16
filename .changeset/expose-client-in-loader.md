---
"@apollo/client-integration-react-router": minor
---

Expose the Apollo Client instance in `createApolloLoaderHandler` loader callback. The `client` is now available alongside `preloadQuery` in the loader args, enabling direct client interactions (e.g., cache reads/writes, queries, mutations) within route loaders.
