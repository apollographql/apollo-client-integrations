---
"@apollo/client-react-streaming": patch
---

Create the `ObservableQuery` of a revived (or reused) transported query ref with `notifyOnNetworkStatusChange: false`, like `createQueryPreloader` and the suspense hooks. Previously, refetching such a ref outside its own handlers (e.g. with `client.refetchQueries`) after an error made `useReadQuery` return `data: undefined` with `dataState: "empty"` instead of keeping the ref's last outcome.
