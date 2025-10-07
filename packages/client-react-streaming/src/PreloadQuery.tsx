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

/** @deprecated use `PreloadQuery.Options` instead */
export type PreloadQueryOptions<
  TVariables extends OperationVariables,
  TData,
> = PreloadQuery.Options<TData, TVariables>;
export declare namespace PreloadQuery {
  export type Options<
    TData,
    TVariables extends OperationVariables,
  > = PreloadTransportedQueryOptions<TData, TVariables> & {
    query: DocumentNode | TypedDocumentNode<TData, TVariables>;
  };

  export type Props<
    TData,
    TVariables extends OperationVariables,
  > = PreloadQuery.Options<TData, TVariables> & {
    children:
      | ReactNode
      | ((
          queryRef: TransportedQueryRef<NoInfer<TData>, NoInfer<TVariables>>
        ) => ReactNode);
  };
}

export async function PreloadQuery<
  TData,
  TVariables extends OperationVariables,
>({
  getClient,
  children,
  query,
  ...transportedOptions
}: PreloadQuery.Props<TData, TVariables> & {
  getClient: () => ApolloClient | Promise<ApolloClient>;
}): Promise<React.ReactElement> {
  const preloader = createTransportedQueryPreloader(await getClient(), {
    notTransportedOptionOverrides: { fetchPolicy: "no-cache" },
  });
  const queryRef = preloader(
    query,
    transportedOptions as PreloadTransportedQueryOptions<TData, TVariables>
  );

  return (
    <SimulatePreloadedQuery<TData> queryRef={queryRef}>
      {typeof children === "function" ? children(queryRef) : children}
    </SimulatePreloadedQuery>
  );
}
