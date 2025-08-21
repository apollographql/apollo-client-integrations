import { SimulatePreloadedQuery } from "./index.cc.js";
import type {
  ApolloClient,
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
} from "@apollo/client";
import type { ReactNode } from "react";
import React from "react";
import type {
  PreloadTransportedQueryOptions,
  TransportedQueryRef,
} from "./transportedQueryRef.js";
import { createTransportedQueryPreloader } from "./transportedQueryRef.js";

export type PreloadQueryOptions<TVariables, TData> =
  PreloadTransportedQueryOptions<TVariables, TData> & {
    query: DocumentNode | TypedDocumentNode<TData, TVariables>;
  };
export async function PreloadQuery<
  TData,
  TVariables extends OperationVariables,
>({
  getClient,
  children,
  ...options
}: PreloadQueryOptions<TVariables, TData> & {
  getClient: () => ApolloClient | Promise<ApolloClient>;
  children:
    | ReactNode
    | ((
        queryRef: TransportedQueryRef<NoInfer<TData>, NoInfer<TVariables>>
      ) => ReactNode);
}): Promise<React.ReactElement> {
  const preloader = createTransportedQueryPreloader(await getClient());
  const { query, ...transportedOptions } = options;
  const queryRef = preloader(query, transportedOptions);

  return (
    <SimulatePreloadedQuery<TData> queryRef={queryRef}>
      {typeof children === "function" ? children(queryRef) : children}
    </SimulatePreloadedQuery>
  );
}
