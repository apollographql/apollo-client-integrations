"use client";

import { useApolloClient, useBackgroundQuery } from "@apollo/client/react";
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

  useBackgroundQuery(...bgQueryArgs);

  return children;
}
