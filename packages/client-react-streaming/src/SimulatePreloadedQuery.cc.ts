"use client";

import {
  skipToken,
  useApolloClient,
  useBackgroundQuery,
} from "@apollo/client/react";
import { useMemo, type ReactNode } from "react";
import {
  reviveTransportedQueryRef,
  type TransportedQueryRef,
} from "./transportedQueryRef.js";
import { deserializeOptions } from "./DataTransportAbstraction/transportedOptions.js";
import type { PreloadQueryOptions } from "./PreloadQuery.js";

export default function SimulatePreloadedQuery<T>({
  queryRef,
  children,
}: {
  queryRef: TransportedQueryRef<T>;
  children: ReactNode;
}) {
  const client = useApolloClient();
  reviveTransportedQueryRef(queryRef, client);

  const bgQueryArgs = useMemo<Parameters<typeof useBackgroundQuery>>(() => {
    const { query, ...hydratedOptions } = deserializeOptions(
      queryRef.$__apollo_queryRef.options
    ) as PreloadQueryOptions<any, T>;
    return [
      query,
      { ...hydratedOptions, queryKey: queryRef.$__apollo_queryRef.queryKey },
    ] as const;
  }, [queryRef.$__apollo_queryRef]);

  // This background query is only here to keep the revived queryRef warm; the
  // preloaded result itself is delivered through the queryRef's own
  // stream-reading link chain (see reviveTransportedQueryRef /
  // ReadFromReadableStreamLink), which falls back to the network if the stream
  // errors. With the default `cache-first` policy, this extra observable races
  // the transported-stream cache write during hydration: it can observe a
  // still-empty cache and fire a duplicate network request for a query the
  // server already executed (#546). Skip it in that case; callers that
  // explicitly opted into a client-side refresh (`network-only` /
  // `cache-and-network`) keep their fetch.
  const bgOptions = bgQueryArgs[1];
  const bgFetchPolicy =
    (typeof bgOptions === "object" && bgOptions.fetchPolicy) || "cache-first";
  useBackgroundQuery(
    bgQueryArgs[0],
    bgFetchPolicy === "cache-first" ? skipToken : bgOptions
  );

  return children;
}
