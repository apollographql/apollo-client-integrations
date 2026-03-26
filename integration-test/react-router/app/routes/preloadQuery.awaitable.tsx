import { useLoaderData } from "react-router";
import type { Route } from "./+types/preloadQuery.awaitable";
import { useReadQuery } from "@apollo/client/react";
import { apolloLoader } from "~/apollo";
import { DEFERRED_QUERY } from "@integration-test/shared/queries";
import { Suspense } from "react";

export const loader = apolloLoader<Route.LoaderArgs>()(async ({
  preloadQuery,
}) => {
  const { queryRef, resolveWhen } = preloadQuery.awaitable(DEFERRED_QUERY, {
    variables: { delayDeferred: 1000 },
  });

  const data = await resolveWhen(
    (data) => data.products != null && data.products.length > 0
  );

  return {
    queryRef,
    firstProductTitle: data.products[0].title,
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

function StreamingContent({ queryRef }: { queryRef: any }) {
  const { data } = useReadQuery(queryRef);
  return (
    <ul>
      {data.products.map(({ id, title, rating }: any) => (
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
