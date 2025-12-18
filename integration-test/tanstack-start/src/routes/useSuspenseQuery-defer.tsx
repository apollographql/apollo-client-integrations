import { createFileRoute } from "@tanstack/react-router";
import { DEFERRED_QUERY } from "@integration-test/shared/queries";
import { useApolloClient, useSuspenseQuery } from "@apollo/client/react";
import { useTransition } from "react";
import { DefaultContext } from "@apollo/client";

export const Route = createFileRoute("/useSuspenseQuery-defer")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      errorIn: search.errorIn as DefaultContext["error"],
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [refetching, startTransition] = useTransition();
  const client = useApolloClient();
  const { errorIn } = Route.useSearch();
  const { data, refetch } = useSuspenseQuery(DEFERRED_QUERY, {
    variables: { delayDeferred: 1000 },
    context: {
      ...(errorIn ? { error: errorIn } : {}),
    },
  });

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
