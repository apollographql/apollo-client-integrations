import type * as ACCore from "@apollo/client";
import type * as Streaming from "@apollo/client-react-streaming";
import type { TsrSerializable } from "@tanstack/router-core";
/** @public */
export declare namespace ApolloClientIntegration {
  /** @public */
  export interface RouterContext {
    apolloClient: Streaming.ApolloClient;
    preloadQuery: PreloadTransportedQueryFunction;
  }
  /** @public */
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

  /** @public */
  export interface TransportedQueryRef<
    TData = unknown,
    TVariables extends ACCore.OperationVariables = ACCore.OperationVariables,
  > extends Streaming.TransportedQueryRef<TData, TVariables>,
      TsrSerializable {}
}
