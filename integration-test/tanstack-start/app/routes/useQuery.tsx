import { useQuery } from "@apollo/client/index.js";
import { QUERY } from "@integration-test/shared/queries";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/useQuery")({
  component: RouteComponent,
});

function RouteComponent() {
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
