import { DynamicProductResult, QUERY } from "@integration-test/shared/queries";
import {
  QueryRef,
  useQueryRefHandlers,
  useReadQuery,
} from "@apollo/client/react";
import { type DefaultContext } from "@apollo/client";
import "@integration-test/shared/errorLink";
import { createFileRoute, ErrorComponentProps } from "@tanstack/react-router";
import { Suspense } from "react";

export const Route = createFileRoute("/preloadQuery/queryRef-useReadQuery")({
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
  errorComponent: ErrorComponent,
});

function RouteComponent() {
  const { queryRef } = Route.useLoaderData();
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

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  return (
    <>
      <h2>Encountered an error:</h2>
      <pre>{error.message}</pre>
      <button onClick={() => reset()}>Try again</button>
    </>
  );
}
