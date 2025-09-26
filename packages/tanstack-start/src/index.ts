export { routerWithApolloClient } from "./routerWithApolloClient.js";
export type { ApolloClientRouterContext } from "./routerWithApolloClient.js";
import type { TransportedQueryRef } from "@apollo/client-react-streaming";
import {
  ApolloClient as UpstreamApolloClient,
  InMemoryCache as UpstreamInMemoryCache,
} from "@apollo/client-react-streaming";
import { bundle } from "./bundleInfo.js";
import { createSerializationAdapter } from "@tanstack/router-core";
import {
  getQueryRefSerializationAdapter,
  type QueryRefSerializationAdapter,
} from "./QueryRefSerializationAdapter.js";
import type { ApolloClientRouterContext } from "./routerWithApolloClient.js";
import type { ClientTransport, ServerTransport } from "./Transport.js";
import { transportSerializationAdapter } from "./Transport.js";

/** @public */
export declare namespace ApolloClient {
  /** @public */
  export interface Options extends UpstreamApolloClient.Options {}
  /*
  We can currently not re-export these types from the upstream ApolloClient implementation because the build 
  tooling doesn't support that:
    > DTS Build error
    > Error: namespace child (hoisting) not supported yet

    We could re-export them by defining them as new types that reference the originals, but that would require us
    to keep generics in sync and would either erase the docblocks or require us to duplicate them 
    (and they would go out of sync).
    If you need any of the other types, please use the `ApolloClient` namespace exported from `@apollo/client` directly.
  */
  // export import DefaultOptions = UpstreamApolloClient.DefaultOptions;
  // export import DevtoolsOptions = UpstreamApolloClient.DevtoolsOptions;
  // export import MutateOptions = UpstreamApolloClient.MutateOptions;
  // export import MutateResult = UpstreamApolloClient.MutateResult;
  // export import QueryOptions = UpstreamApolloClient.QueryOptions;
  // export import QueryResult = UpstreamApolloClient.QueryResult;
  // export import RefetchQueriesOptions = UpstreamApolloClient.RefetchQueriesOptions;
  // export import RefetchQueriesResult = UpstreamApolloClient.RefetchQueriesResult;
  // export import SubscribeOptions = UpstreamApolloClient.SubscribeOptions;
  // export import SubscribeResult = UpstreamApolloClient.SubscribeResult;
  // export import WatchFragmentOptions = UpstreamApolloClient.WatchFragmentOptions;
  // export import WatchFragmentResult = UpstreamApolloClient.WatchFragmentResult;
  // export import WatchQueryOptions = UpstreamApolloClient.WatchQueryOptions;
  // export import ReadQueryOptions = UpstreamApolloClient.ReadQueryOptions;
  // export import WriteQueryOptions = UpstreamApolloClient.WriteQueryOptions;
  // export import WriteFragmentOptions = UpstreamApolloClient.WriteFragmentOptions;
}

/**
 * A version of `ApolloClient` to be used with TanStack Start.
 *
 * For more documentation, please see {@link https://www.apollographql.com/docs/react/api/core/ApolloClient | the Apollo Client API documentation}.
 *
 * @public
 */
export class ApolloClient extends UpstreamApolloClient {
  /**
   * Information about the current package and it's export names, for use in error messages.
   *
   * @internal
   */
  static readonly info = bundle;
}

/**
 * A version of `InMemoryCache` to be used with TanStack Start.
 *
 * For more documentation, please see {@link https://www.apollographql.com/docs/react/api/cache/InMemoryCache | the Apollo Client API documentation}.
 *
 * @public
 */
export class InMemoryCache extends UpstreamInMemoryCache {
  /**
   * Information about the current package and it's export names, for use in error messages.
   *
   * @internal
   */
  static readonly info = bundle;
}

export const ApolloSerializationAdapter: QueryRefSerializationAdapter =
  // createSerializationAdapter<any, any>({
  // key: "apollo-never",
  // test: (_: any): _ is any => false,
  // fromSerializable: () => {},
  // toSerializable: () => {},
  // this should actually be a no-op just for types, and be added in `routerWithApolloClient`,
  // but right now this still needs upstream changes so it's a very hacky temporary workaround
  createSerializationAdapter<
    TransportedQueryRef | ServerTransport | ClientTransport,
    TransportedQueryRef["$__apollo_queryRef"] | ReadableStream
  >({
    key: "apollo-everything",
    test: (value): value is any =>
      dummyQueryRefSerializationAdapter.test(value) ||
      transportSerializationAdapter.test(value),
    fromSerializable(value) {
      if ("stream" in value) {
        return getQueryRefSerializationAdapter(getAc()).fromSerializable(value);
      } else {
        return transportSerializationAdapter.fromSerializable(value);
      }
    },
    toSerializable(queryRef) {
      if (dummyQueryRefSerializationAdapter.test(queryRef)) {
        return dummyQueryRefSerializationAdapter.toSerializable(queryRef);
      } else {
        return transportSerializationAdapter.toSerializable(queryRef);
      }
    },
  }) as any;
// TODO remove once the hack above is removed
const dummyQueryRefSerializationAdapter = getQueryRefSerializationAdapter(
  undefined!
);
// TODO remove once the hack above is removed
function getAc() {
  const ac = (
    (window as any).__TSR_ROUTER__.options.context as ApolloClientRouterContext
  ).apolloClient;
  if (!ac) {
    throw new Error(
      "Could not find Apollo Client in router context. Make sure you used `routerWithApolloClient` to add the client to the router."
    );
  }
  return ac;
}
