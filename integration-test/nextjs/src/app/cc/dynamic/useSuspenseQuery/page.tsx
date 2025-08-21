"use client";

import type { TypedDocumentNode } from "@apollo/client";
import { gql } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

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
  const searchParams = useSearchParams();
  const errorLevel = searchParams.get("errorLevel") as "ssr" | "always" | null;
  return (
    <Suspense fallback={"loading"}>
      <ErrorBoundary FallbackComponent={FallbackComponent}>
        <Component errorLevel={errorLevel} />
      </ErrorBoundary>
    </Suspense>
  );
}

function FallbackComponent({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <>
      <p>{error.message}</p>
    </>
  );
}

function Component({ errorLevel }: { errorLevel: "ssr" | "always" | null }) {
  const { data } = useSuspenseQuery(QUERY, {
    context: { delay: 1000, ...(errorLevel ? { error: errorLevel } : {}) },
  });
  globalThis.hydrationFinished?.();

  return (
    <ul>
      {data.products.map(({ id, title }) => (
        <li key={id}>{title}</li>
      ))}
    </ul>
  );
}
