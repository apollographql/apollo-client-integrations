import { useLoaderData } from "react-router";
import type { Route } from "./+types/_index";
import {
  useApolloClient,
  useQueryRefHandlers,
  useReadQuery,
} from "@apollo/client/react";
import { apolloLoader } from "~/apollo";
import { DEFERRED_QUERY } from "@integration-test/shared/queries";
import { useTransition } from "react";

export const loader = apolloLoader<Route.LoaderArgs>()(({ preloadQuery }) => {
  const queryRef = preloadQuery(DEFERRED_QUERY, {
    variables: { delayDeferred: 1000 },
  });
  return {
    queryRef,
  };
});

export default function Home() {
  const { queryRef } = useLoaderData<typeof loader>();

  const { refetch } = useQueryRefHandlers(queryRef);
  const [refetching, startTransition] = useTransition();
  const { data } = useReadQuery(queryRef);
  const client = useApolloClient();

  return (
    <>
      <ul>
        {data.products.map(({ id, title, rating }) => (
          <li key={id}>
            {title}
            <br />
            Rating:{" "}
            <div style={{ display: "inline-block", verticalAlign: "text-top" }}>
              {rating?.value || ""}
              <br />
              {rating ? `Queried in ${rating.env} environment` : "loading..."}
            </div>
          </li>
        ))}
      </ul>
      <p>Queried in {data.env} environment</p>
      <button
        disabled={refetching}
        onClick={() => {
          client.cache.batch({
            update(cache) {
              for (const product of data.products) {
                cache.modify({
                  id: cache.identify(product),
                  fields: {
                    rating: () => null,
                  },
                });
              }
            },
          });
          startTransition(() => {
            refetch();
          });
        }}
      >
        {refetching ? "refetching..." : "refetch"}
      </button>
    </>
  );
}
