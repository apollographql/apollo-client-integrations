"use client";
import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";

import { useQuery } from "@apollo/client/react";

const QUERY: TypedDocumentNode<{
  products: {
    id: string;
    title: string;
  }[];
}> = gql`
  query dynamicProducts {
    products {
      id
      title
    }
  }
`;

export const dynamic = "force-dynamic";

export default function Page() {
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
