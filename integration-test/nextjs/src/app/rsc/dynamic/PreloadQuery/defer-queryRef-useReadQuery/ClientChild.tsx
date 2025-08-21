"use client";
import {
  useQueryRefHandlers,
  useReadQuery,
  useSuspenseFragment,
} from "@apollo/client/react";
import {
  DeferredDynamicProductResult,
  RATING_FRAGMENT,
} from "@integration-test/shared/queries";
import { TransportedQueryRef } from "@apollo/client-integration-nextjs";
import { Suspense, useTransition } from "react";

export function ClientChild({
  queryRef,
}: {
  queryRef: TransportedQueryRef<DeferredDynamicProductResult>;
}) {
  const { refetch } = useQueryRefHandlers(queryRef);
  const [refetching, startTransition] = useTransition();
  const { data } = useReadQuery(queryRef);

  return (
    <>
      <ul>
        {data.products.map((product) => (
          <li key={product.id}>
            {product.title}
            <br />
            Rating:{" "}
            <Suspense fallback="Loading rating...">
              <Rating product={product} delayDeferred={1000} />
            </Suspense>
          </li>
        ))}
      </ul>
      <p>Queried in {data.env} environment</p>
      <button
        disabled={refetching}
        onClick={() => {
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

interface RatingProps {
  product: { __typename: "Product"; id: string };
  delayDeferred: number;
}

function Rating({ product, delayDeferred }: RatingProps) {
  const { data } = useSuspenseFragment({
    fragment: RATING_FRAGMENT,
    from: product,
    variables: {
      delayDeferred,
    },
  });

  const { rating } = data;

  return (
    <div style={{ display: "inline-block", verticalAlign: "text-top" }}>
      {rating.value || ""}
      <br />
      Queried in {rating.env} environment
    </div>
  );
}
