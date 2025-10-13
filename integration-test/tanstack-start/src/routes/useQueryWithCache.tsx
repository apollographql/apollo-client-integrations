import { useQuery, useSuspenseQuery } from "@apollo/client/react";
import { QUERY } from "@integration-test/shared/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/useQueryWithCache")({
  component: RouteComponent,
});

function RouteComponent() {
  useSuspenseQuery(QUERY); // fill cache with `useSuspenseQuery`
  const result = useQuery(QUERY);
  globalThis.hydrationFinished?.();

  if (!result.data) {
    return <div>Loading...</div>;
  }

  return (
    <ul>
      {result.data.products.map(({ id, title }) => (
        <li key={id}>{title}</li>
      ))}
    </ul>
  );
}
