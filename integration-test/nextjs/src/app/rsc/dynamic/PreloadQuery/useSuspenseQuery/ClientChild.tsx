"use client";

import { useSuspenseQuery } from "@apollo/client/react";
import { QUERY } from "@integration-test/shared/queries";

export function ClientChild() {
  const { data } = useSuspenseQuery(QUERY);
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
