import { useSearchParams } from "react-router";
import type { Route } from "./+types/preloadQuery.useSuspenseQuery";
import { type DefaultContext } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { apolloLoader } from "~/apollo";
import { QUERY } from "@integration-test/shared/queries";
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
  return (
    <Suspense fallback={<>loading</>}>
      <Child />
    </Suspense>
  );
}

function Child() {
  const [search] = useSearchParams();
  const errorIn = search.get("errorIn") as DefaultContext["error"];
  const { data } = useSuspenseQuery(QUERY, {
    context: { delay: 1000, ...(errorIn ? { error: errorIn } : {}) },
  });
  return (
    <>
      <ul>
        {data.products.map(({ id, title }: any) => (
          <li key={id}>{title}</li>
        ))}
      </ul>
      <p>Queried in {data.env} environment</p>
    </>
  );
}
