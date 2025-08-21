export { routerWithApolloClient } from "./routerWithApolloClient.js";
export type { ApolloClientRouterContext } from "./routerWithApolloClient.js";
import {
  ApolloClient as UpstreamApolloClient,
  InMemoryCache as UpstreamInMemoryCache,
} from "@apollo/client-react-streaming";
import { bundle } from "./bundleInfo.js";

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
