import type { CacheKey } from "@apollo/client/react/internal";
import {
  getSuspenseCache,
  unwrapQueryRef,
  wrapQueryRef,
} from "@apollo/client/react/internal/index.js";
import {
  readFromReadableStream,
  teeToReadableStream,
} from "./ReadableStreamLink.js";
import { skipDataTransport } from "./DataTransportAbstraction/index.js";
import type { ReadableStreamLinkEvent } from "./ReadableStreamLink.js";
import { useApolloClient } from "@apollo/client/index.js";
import type {
  DocumentNode,
  ApolloClient,
  QueryRef,
  QueryOptions,
  OperationVariables,
  TypedDocumentNode,
} from "@apollo/client/index.js";
import {
  serializeOptions,
  deserializeOptions,
  type TransportedOptions,
} from "./DataTransportAbstraction/transportedOptions.js";
import { useEffect } from "react";
import { canonicalStringify } from "@apollo/client/cache/index.js";
import {
  JSONDecodeStream,
  JSONEncodeStream,
  type JsonString,
} from "@apollo/client-react-streaming/stream-utils";

export type RestrictedPreloadOptions = {
  fetchPolicy?: "network-only" | "cache-and-network" | "cache-first";
  returnPartialData?: false;
  nextFetchPolicy?: undefined;
  pollInterval?: undefined;
};

export type PreloadTransportedQueryOptions<TVariables, TData> = Omit<
  QueryOptions<TVariables, TData>,
  "query"
> &
  RestrictedPreloadOptions;

export type TransportedQueryRefOptions = TransportedOptions &
  RestrictedPreloadOptions;

/**
 * A `TransportedQueryRef` is an opaque object accessible via renderProp within `PreloadQuery`.
 *
 * A child client component reading the `TransportedQueryRef` via useReadQuery will suspend until the promise resolves.
 *
 * @public
 */
export interface TransportedQueryRef<
  TData = unknown,
  TVariables extends OperationVariables = OperationVariables,
> extends QueryRef<TData, TVariables> {
  /**
   * Temporarily disabled - see https://github.com/apollographql/apollo-client-nextjs/issues/332
   *
   * Will now be be `undefined` both in React Server Components and Client Components until we can find a better resolution.
   */
  toPromise?: undefined;
  /** @private */
  $__apollo_queryRef: {
    options: TransportedQueryRefOptions;
    stream: ReadableStream<JsonString<ReadableStreamLinkEvent>>;
    /**
     * A unique key for this query, to ensure it is only hydrated once,
     * even if it should get transported over the wire in a way that results
     * in multiple objects describing the same queryRef.
     * This key will be used to store the queryRef in the suspence cache.
     *
     * The chances of this happening should be slim (it is handled within
     * React thanks to https://github.com/facebook/react/pull/28996), but
     * as we use transported queryRefs with multiple frameworks with distinct
     * transport mechanisms, this seems like a safe option.
     */
    queryKey: string;
  };
  /** @private */
  _hydrated?: CacheKey;
}

export interface PreloadTransportedQueryFunction {
  <TData = unknown, TVariables extends OperationVariables = OperationVariables>(
    query: DocumentNode | TypedDocumentNode<TData, TVariables>,
    options?: PreloadTransportedQueryOptions<NoInfer<TVariables>, TData>
  ): TransportedQueryRef<TData, TVariables>;
}

export function createTransportedQueryPreloader(
  client: ApolloClient<any>
): PreloadTransportedQueryFunction {
  return (...[query, options]: Parameters<PreloadTransportedQueryFunction>) => {
    // unset options that we do not support
    options = { ...options };
    delete options.returnPartialData;
    delete options.nextFetchPolicy;
    delete options.pollInterval;

    let __injectIntoStream:
      | ReadableStreamDefaultController<ReadableStreamLinkEvent>
      | undefined;
    const __eventStream = new ReadableStream({
      start(controller) {
        __injectIntoStream = controller;
      },
    });

    // Instead of creating the queryRef, we kick off a query that will feed the network response
    // into our custom event stream.
    client
      .query({
        query,
        ...options,
        // ensure that this query makes it to the network
        fetchPolicy: "network-only",
        context: skipDataTransport(
          teeToReadableStream(__injectIntoStream!, {
            ...options?.context,
            // we want to do this even if the query is already running for another reason
            queryDeduplication: false,
          })
        ),
      })
      .catch(() => {
        /* we want to avoid any floating promise rejections */
      });

    return createTransportedQueryRef<any, any>(
      query,
      options,
      crypto.randomUUID(),
      __eventStream
    );
  };
}

export function createTransportedQueryRef<
  TData,
  TVariables extends OperationVariables,
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options: PreloadTransportedQueryOptions<NoInfer<TVariables>, TData>,
  queryKey: string,
  stream: ReadableStream<ReadableStreamLinkEvent>
): TransportedQueryRef<TData, TVariables> {
  return {
    $__apollo_queryRef: {
      options: sanitizeForTransport(serializeOptions({ query, ...options })),
      queryKey,
      stream: stream.pipeThrough(new JSONEncodeStream()),
    },
  };
}

export function reviveTransportedQueryRef(
  queryRef: TransportedQueryRef,
  client: ApolloClient<any>
): asserts queryRef is TransportedQueryRef &
  ReturnType<typeof wrapQueryRef<any, any>> & { _hydrated: CacheKey } {
  const {
    $__apollo_queryRef: { options, stream, queryKey },
  } = queryRef;
  const hydratedOptions = deserializeOptions(options);
  const cacheKey: CacheKey = [
    hydratedOptions.query,
    canonicalStringify(hydratedOptions.variables),
    queryKey,
  ];
  if (!queryRef._hydrated) {
    // TanStack query has a timing where this is potentially transported over the wire if it
    // is consumed in a component (it will be revived there) and timing is unfortunate
    // this works here now, but might cause problems with React itself - we should change this
    // to a WeakMap.
    Object.defineProperty(queryRef, "_hydrated", {
      value: cacheKey,
      writable: false,
      enumerable: false,
      configurable: true,
    });
    const internalQueryRef = getSuspenseCache(client).getQueryRef(
      cacheKey,
      () =>
        client.watchQuery({
          ...hydratedOptions,
          fetchPolicy: "network-only",
          context: skipDataTransport(
            readFromReadableStream(stream.pipeThrough(new JSONDecodeStream()), {
              ...hydratedOptions.context,
              queryDeduplication: true,
            })
          ),
        })
    );
    Object.assign(queryRef, wrapQueryRef(internalQueryRef));
  }
}

export function isTransportedQueryRef(
  queryRef: any
): queryRef is TransportedQueryRef {
  return !!(queryRef && queryRef.$__apollo_queryRef);
}

export function useWrapTransportedQueryRef<TData, TVariables>(
  queryRef: QueryRef<TData, TVariables> | TransportedQueryRef
): QueryRef<TData, TVariables> {
  const client = useApolloClient();
  let cacheKey: CacheKey | undefined;
  let isTransported: boolean;
  if ((isTransported = isTransportedQueryRef(queryRef))) {
    reviveTransportedQueryRef(queryRef, client);
    cacheKey = queryRef._hydrated;
  }
  const unwrapped = unwrapQueryRef<any>(queryRef)!;

  useEffect(() => {
    // We only want this to execute if the queryRef is a transported query.
    if (!isTransported) return;
    // We want to always keep this queryRef in the suspense cache in case another component has another instance of this transported queryRef.
    if (cacheKey) {
      if (unwrapped.disposed) {
        getSuspenseCache(client).add(cacheKey, unwrapped);
      }
    }
    // Omitting the deps is intentional. This avoids stale closures and the
    // conditional ensures we aren't running the logic on each render.
  });
  // Soft-retaining because useQueryRefHandlers doesn't do it for us.
  useEffect(() => {
    if (isTransported) {
      return unwrapped.softRetain();
    }
  }, [isTransported, unwrapped]);
  return queryRef;
}

function sanitizeForTransport<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}
