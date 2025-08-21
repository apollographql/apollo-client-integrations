import { useApolloClient } from "@apollo/client/react";
import * as React from "react";
import { useMatches } from "react-router";
import { hydrateIfNecessary } from "./preloader.js";

/** @alpha */
export function ApolloHydrationHelper(props: { children: React.ReactNode }) {
  const [hydrated] = React.useState(new WeakSet());
  const client = useApolloClient();
  const matches = useMatches();
  React.useMemo(() => {
    for (const match of matches) {
      const data = match.data;
      if (!data || hydrated.has(data)) continue;
      hydrated.add(data);

      JSON.stringify(match.data, (_key, value) => {
        hydrateIfNecessary(value, client);
        return value;
      });
    }
  }, [matches, client, hydrated]);
  return props.children;
}
