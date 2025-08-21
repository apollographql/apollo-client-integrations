"use client";

import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";

const QUERY: TypedDocumentNode<{
  products: {
    id: string;
    title: string;
  }[];
}> = gql`
  query {
    products {
      id
      title
    }
  }
`;

export const dynamic = "force-static";

export default function Page() {
  const { data } = useSuspenseQuery(QUERY);
  globalThis.hydrationFinished?.();

  return (
    <ul>
      {data.products.map(({ id, title }) => (
        <li key={id}>{title}</li>
      ))}
    </ul>
  );
}
