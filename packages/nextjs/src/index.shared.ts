export {
  SSRMultipartLink,
  DebounceMultipartResponsesLink,
  RemoveMultipartDirectivesLink,
  type TransportedQueryRef,
} from "@apollo/client-react-streaming";
import { bundle } from "./bundleInfo.js";
import {
  ApolloClient as UpstreamApolloClient,
  InMemoryCache as UpstreamInMemoryCache,
} from "@apollo/client-react-streaming";

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
 * A version of `ApolloClient` to be used with streaming SSR or in React Server Components.
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
 * A version of `InMemoryCache` to be used with streaming SSR.
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
