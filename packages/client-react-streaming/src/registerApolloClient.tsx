import type { ApolloClient, OperationVariables } from "@apollo/client/index.js";
import type React from "react";
import { cache } from "react";
import type { ReactNode } from "react";
import type { PreloadQueryOptions } from "./PreloadQuery.js";
import { PreloadQuery as UnboundPreloadQuery } from "./PreloadQuery.js";
import type { TransportedQueryRef } from "./transportedQueryRef.js";

const seenWrappers = WeakSet
  ? new WeakSet<{ client: ApolloClient<any> | Promise<ApolloClient<any>> }>()
  : undefined;
const seenClients = WeakSet
  ? new WeakSet<ApolloClient<any> | Promise<ApolloClient<any>>>()
  : undefined;

/**
 * > This export is only available in React Server Components
 *
 * Ensures that you can always access the same instance of ApolloClient
 * during RSC for an ongoing request, while always returning
 * a new instance for different requests.
 *
 * @example
 * ```ts
 * export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
 *   return new ApolloClient({
 *     cache: new InMemoryCache(),
 *     link: new HttpLink({
 *       uri: "http://example.com/api/graphql",
 *     }),
 *   });
 * });
 * ```
 *
 * @public
 */
export function registerApolloClient<
  ApolloClientOrPromise extends Promise<ApolloClient<any>> | ApolloClient<any>,
>(
  makeClient: () => ApolloClientOrPromise
): {
  getClient: () => ApolloClientOrPromise;
  query: Awaited<ApolloClientOrPromise>["query"];
  /**
   * Preloads data in React Server Components to be hydrated
   * in Client Components.
   *
   * ### Example with `queryRef`
   * `ClientChild` would call `useReadQuery` with the `queryRef`, the `Suspense` boundary is optional:
   * ```js
   * <PreloadQuery
   *    query={QUERY}
   *    variables={{
   *      foo: 1
   *    }}
   *  >
   *   {(queryRef) => (
   *     <Suspense fallback={<>loading</>}>
   *       <ClientChild queryRef={queryRef} />
   *     </Suspense>
   *   )}
   * </PreloadQuery>
   * ```
   *
   * ### Example for `useSuspenseQuery`
   * `ClientChild` would call the same query with `useSuspenseQuery`, the `Suspense` boundary is optional:
   *  ```js
   *  <PreloadQuery
   *    query={QUERY}
   *    variables={{
   *      foo: 1
   *    }}
   *  >
   *    <Suspense fallback={<>loading</>}>
   *      <ClientChild />
   *    </Suspense>
   *  </PreloadQuery>
   *  ```
   */
  PreloadQuery: PreloadQueryComponent;
} {
  const getClient = makeGetClient(makeClient);
  /*
  We create an independent instance of Apollo Client per request,
  because we don't want to mix up RSC-specific data with Client-specific
  data in the same `InMemoryCache` instance.
  */
  const getPreloadClient = makeGetClient(makeClient);
  const PreloadQuery = makePreloadQuery(getPreloadClient);
  return {
    getClient,
    query: async (...args) => (await getClient()).query(...args),
    PreloadQuery,
  };
}

function makeGetClient<
  AC extends Promise<ApolloClient<any>> | ApolloClient<any>,
>(makeClient: () => AC): () => AC {
  // React invalidates the cache on each server request, so the wrapping
  // object is needed to properly detect whether the client is a unique
  // reference or not. We can warn if `cachedMakeWrappedClient` creates a new "wrapper",
  // but with a `client` property that we have already seen before.
  // In that case, not every call to `makeClient` would create a new
  // `ApolloClient` instance.
  function makeWrappedClient() {
    return { client: makeClient() };
  }

  const cachedMakeWrappedClient = cache(makeWrappedClient);

  function getClient() {
    if (arguments.length) {
      throw new Error(
        `
You cannot pass arguments into \`getClient\`.
Passing arguments to \`getClient\` returns a different instance
of Apollo Client each time it is called with different arguments, potentially 
resulting in duplicate requests and a non-functional cache. 
      `.trim()
      );
    }
    const wrapper = cachedMakeWrappedClient();
    if (seenWrappers && seenClients) {
      if (!seenWrappers.has(wrapper)) {
        if (seenClients.has(wrapper.client)) {
          console.warn(
            `
Multiple calls to \`getClient\` for different requests returned the same client instance.
This means that private user data could accidentally be shared between requests.
This happens, for example, if you create a global \`ApolloClient\` instance and your \`makeClient\`
implementation just looks like \`() => client\`.
Always call \`new ApolloClient\` **inside** your \`makeClient\` function and
return a new instance every time \`makeClient\` is called.
`.trim()
          );
        }
        seenWrappers.add(wrapper);
        seenClients.add(wrapper.client);
      }
    }
    return wrapper.client;
  }
  return getClient;
}

interface PreloadQueryProps<TData, TVariables>
  extends PreloadQueryOptions<TVariables, TData> {
  children:
    | ReactNode
    | ((
        queryRef: TransportedQueryRef<NoInfer<TData>, NoInfer<TVariables>>
      ) => ReactNode);
}

interface PreloadQueryComponent {
  <TData, TVariables extends OperationVariables>(
    props: PreloadQueryProps<TData, TVariables>
  ): React.ReactNode;
}

function makePreloadQuery(
  getClient: () => Promise<ApolloClient<any>> | ApolloClient<any>
) {
  return function PreloadQuery<TData, TVariables extends OperationVariables>(
    props: PreloadQueryProps<TData, TVariables>
  ): React.ReactNode {
    // we directly execute the bound component instead of returning JSX to keep the tree a bit tidier
    return UnboundPreloadQuery({ ...props, getClient });
  };
}
