import { useLoaderData } from "react-router";
import type { Route } from "./+types/preloadQuery.queryRef-useReadQuery";
import {
  useQueryRefHandlers,
  useReadQuery,
  type QueryRef,
} from "@apollo/client/react";
import { type DefaultContext } from "@apollo/client";
import { apolloLoader } from "~/apollo";
import {
  QUERY,
  type DynamicProductResult,
} from "@integration-test/shared/queries";
import { Suspense } from "react";

export const loader = apolloLoader<Route.LoaderArgs>()(({
  preloadQuery,
  request,
}) => {
  const errorIn = new URL(request.url).searchParams.get(
    "errorIn"
  ) as DefaultContext["error"];
  const queryRef = preloadQuery(QUERY, {
    context: {
      delay: 1000,
      ...(errorIn ? { error: errorIn } : {}),
    },
  });
  return {
    queryRef,
  };
});

export default function RouteComponent() {
  const { queryRef } = useLoaderData<typeof loader>();
  return (
    <Suspense fallback={<>loading</>}>
      <Child queryRef={queryRef} />
    </Suspense>
  );
}

function Child({ queryRef }: { queryRef: QueryRef<DynamicProductResult> }) {
  const { refetch } = useQueryRefHandlers(queryRef);
  const { data } = useReadQuery(queryRef);
  return (
    <>
      <ul>
        {data.products.map(({ id, title }: any) => (
          <li key={id}>{title}</li>
        ))}
      </ul>
      <p>Queried in {data.env} environment</p>
      <button type="button" onClick={() => refetch()}>
        refetch
      </button>
    </>
  );
}
