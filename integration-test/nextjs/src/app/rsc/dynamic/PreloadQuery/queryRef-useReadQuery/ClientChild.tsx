"use client";

import {
  QueryReference,
  useQueryRefHandlers,
  useReadQuery,
} from "@apollo/client";
import { DynamicProductResult } from "../shared";

export function ClientChild({
  queryRef,
}: {
  queryRef: QueryReference<DynamicProductResult>;
}) {
  const { data } = useReadQuery(queryRef);
  const { refetch } = useQueryRefHandlers(queryRef);
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
