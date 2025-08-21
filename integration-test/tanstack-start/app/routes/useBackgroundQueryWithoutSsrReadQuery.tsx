import {
  QueryRef,
  useBackgroundQuery,
  useReadQuery,
} from "@apollo/client/react";
import { DynamicProductResult, QUERY } from "@integration-test/shared/queries";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useSyncExternalStore } from "react";

export const Route = createFileRoute("/useBackgroundQueryWithoutSsrReadQuery")({
  component: RouteComponent,
});

function RouteComponent() {
  const [queryRef] = useBackgroundQuery(QUERY, {
    context: { delay: 1000, error: "browser" },
  });
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  return (
    <>
      {isClient ? "rendered on client" : "rendered on server"}
      <Suspense fallback={<p>loading</p>}>
        {isClient && <DisplayData queryRef={queryRef} />}
      </Suspense>
    </>
  );
}

function DisplayData({
  queryRef,
}: {
  queryRef: QueryRef<DynamicProductResult>;
}) {
  const { data } = useReadQuery(queryRef);
  globalThis.hydrationFinished?.();
  return (
    <ul>
      {data.products.map(({ id, title }) => (
        <li key={id}>{title}</li>
      ))}
    </ul>
  );
}
