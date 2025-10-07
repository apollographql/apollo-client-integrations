import type * as ACCore from "@apollo/client";
import type * as Streaming from "@apollo/client-react-streaming";
import type { TsrSerializable } from "@tanstack/router-core";

export declare namespace ApolloClientIntegration {
  /** @alpha */
  export interface RouterContext {
    apolloClient: Streaming.ApolloClient;
    preloadQuery: PreloadTransportedQueryFunction;
  }

  export interface PreloadTransportedQueryFunction {
    <
      TData = unknown,
      TVariables extends ACCore.OperationVariables = ACCore.OperationVariables,
    >(
      query: ACCore.DocumentNode | ACCore.TypedDocumentNode<TData, TVariables>,
      options?: Streaming.PreloadTransportedQueryOptions<
        TData,
        NoInfer<TVariables>
      >
    ): TransportedQueryRef<TData, TVariables>;
  }

  export interface TransportedQueryRef<
    TData = unknown,
    TVariables extends ACCore.OperationVariables = ACCore.OperationVariables,
  > extends Streaming.TransportedQueryRef<TData, TVariables>,
      TsrSerializable {}
}
