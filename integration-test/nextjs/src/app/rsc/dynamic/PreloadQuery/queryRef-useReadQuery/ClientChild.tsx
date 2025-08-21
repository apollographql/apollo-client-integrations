"use client";

import { useQueryRefHandlers, useReadQuery } from "@apollo/client/react";
import { DynamicProductResult } from "@integration-test/shared/queries";
import { TransportedQueryRef } from "@apollo/client-integration-nextjs";

export function ClientChild({
  queryRef,
}: {
  queryRef: TransportedQueryRef<DynamicProductResult>;
}) {
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
      <button onClick={() => refetch()}>refetch</button>
    </>
  );
}
