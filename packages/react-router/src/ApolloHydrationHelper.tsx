import { useApolloClient } from "@apollo/client/react";
import * as React from "react";
import { useMatches } from "react-router";
import { hydrateIfNecessary } from "./preloader.js";

/**
 * Reads a match's loader return value across the whole supported react-router
 * range.
 *
 * Neither property spans it on its own: `UIMatch.loaderData` was only added in
 * react-router 7.8.0, and `UIMatch.data` — deprecated in favour of it — was
 * removed in 8.0.0. Reading only `data` makes this helper a silent no-op on
 * react-router 8, because there the property is absent at runtime, not just
 * from the types.
 */
function getLoaderData(match: ReturnType<typeof useMatches>[number]): unknown {
  const { loaderData, data } = match as { loaderData?: unknown; data?: unknown };
  return loaderData ?? data;
}

/** @alpha */
export function ApolloHydrationHelper(props: { children: React.ReactNode }) {
  const [hydrated] = React.useState(new WeakSet());
  const client = useApolloClient();
  const matches = useMatches();
  React.useMemo(() => {
    for (const match of matches) {
      const data = getLoaderData(match);
      if (!data || hydrated.has(data)) continue;
      hydrated.add(data);

      JSON.stringify(data, (_key, value) => {
        hydrateIfNecessary(value, client);
        return value;
      });
    }
  }, [matches, client, hydrated]);
  return props.children;
}
