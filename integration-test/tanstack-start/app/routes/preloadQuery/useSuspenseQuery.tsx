import { QUERY } from "@integration-test/shared/queries";
import { type DefaultContext } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import "@integration-test/shared/errorLink";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/preloadQuery/useSuspenseQuery")({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      errorIn: search.errorIn as DefaultContext["error"],
    };
  },
  loaderDeps: ({ search: { errorIn } }) => ({ errorIn }),
  loader: async ({ context: { preloadQuery }, deps: { errorIn } }) => {
    const queryRef = preloadQuery(QUERY, {
      context: { delay: 1000, ...(errorIn ? { error: errorIn } : {}) },
    });
    return {
      queryRef,
    };
  },
});

function RouteComponent() {
  return (
    <Suspense fallback={<>loading</>}>
      <Child />
    </Suspense>
  );
}

function Child() {
  const { errorIn } = Route.useSearch();
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
