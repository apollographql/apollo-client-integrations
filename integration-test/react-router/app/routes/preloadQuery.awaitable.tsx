import { useLoaderData } from "react-router";
import type { Route } from "./+types/preloadQuery.awaitable";
import { useReadQuery, type QueryRef } from "@apollo/client/react";
import { apolloLoader } from "~/apollo";
import {
  DEFERRED_QUERY,
  type DeferredDynamicProductResult,
} from "@integration-test/shared/queries";
import { Suspense } from "react";

export const loader = apolloLoader<Route.LoaderArgs>()(async ({
  preloadQuery,
}) => {
  const queryRef = preloadQuery(DEFERRED_QUERY, {
    variables: { delayDeferred: 1000 },
  });

  const result = await preloadQuery.waitForStaticResult(
    queryRef,
    (result) => result.data.products != null && result.data.products.length > 0
  );

  return {
    queryRef,
    firstProductTitle: result.data.products[0].title,
  };
});

export function meta({ data }: Route.MetaArgs) {
  return [{ title: data!.firstProductTitle }];
}

export default function RouteComponent() {
  const { queryRef } = useLoaderData<typeof loader>();
  return (
    <Suspense fallback={<>loading</>}>
      <StreamingContent queryRef={queryRef} />
    </Suspense>
  );
}

function StreamingContent({
  queryRef,
}: {
  queryRef: QueryRef<DeferredDynamicProductResult>;
}) {
  const { data } = useReadQuery(queryRef);
  return (
    <ul>
      {data.products.map(({ id, title, rating }) => (
        <li key={id}>
          {title}
          <br />
          Rating:{" "}
          <span data-testid={`rating-${id}`}>
            {rating?.value || "loading..."}
          </span>
        </li>
      ))}
    </ul>
  );
}
