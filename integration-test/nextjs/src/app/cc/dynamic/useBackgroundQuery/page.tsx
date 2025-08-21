"use client";
import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import {
  useBackgroundQuery,
  useReadQuery,
  QueryRef,
} from "@apollo/client/react";
import { Suspense } from "react";

interface Data {
  products: {
    id: string;
    title: string;
  }[];
}

const QUERY: TypedDocumentNode<Data> = gql`
  query dynamicProducts {
    products {
      id
      title
    }
  }
`;

export const dynamic = "force-dynamic";

export default function Page() {
  const [queryRef] = useBackgroundQuery(QUERY, {
    context: { delay: 2000, error: "browser" },
  });
  return (
    <Suspense fallback={<p>loading</p>}>
      <DisplayData queryRef={queryRef} />
    </Suspense>
  );
}

function DisplayData({ queryRef }: { queryRef: QueryRef<Data> }) {
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
