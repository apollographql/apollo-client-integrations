import type { CacheKey } from "@apollo/client/react/internal";
import {
  getSuspenseCache,
  unwrapQueryRef,
  wrapQueryRef,
} from "@apollo/client/react/internal";
import {
  readFromReadableStream,
  teeToReadableStream,
} from "./ReadableStreamLink.js";
import { skipDataTransport } from "./DataTransportAbstraction/index.js";
import type { ReadableStreamLinkEvent } from "./ReadableStreamLink.js";
import type { QueryRef } from "@apollo/client/react";
import { useApolloClient } from "@apollo/client/react";
import type {
  DocumentNode,
  ApolloClient,
  OperationVariables,
  TypedDocumentNode,
} from "@apollo/client";
import {
  serializeOptions,
  deserializeOptions,
  type TransportedOptions,
} from "./DataTransportAbstraction/transportedOptions.js";
import { useEffect } from "react";
import { canonicalStringify } from "@apollo/client/cache";
import {
  JSONDecodeStream,
  JSONEncodeStream,
  type JsonString,
} from "@apollo/client-react-streaming/stream-utils";

type RestrictedPreloadOptions = {
  fetchPolicy?: "network-only" | "cache-and-network" | "cache-first";
  returnPartialData?: false;
  nextFetchPolicy?: undefined;
  pollInterval?: undefined;
};

/** @public */
export type PreloadTransportedQueryOptions<
  TData,
  TVariables extends OperationVariables,
> = Omit<ApolloClient.QueryOptions<TData, TVariables>, "query"> &
  RestrictedPreloadOptions;

type TransportedQueryRefOptions = TransportedOptions & RestrictedPreloadOptions;

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
   * Temporarily disabled - see https://github.com/apollographql/apollo-client-integrations/issues/332
   *
   * Will now be be `undefined` both in React Server Components and Client Components until we can find a better resolution.
   */
  toPromise?: undefined;
  /** @internal */
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
}

/** @public */
export interface PreloadTransportedQueryFunction {
  <TData = unknown, TVariables extends OperationVariables = OperationVariables>(
    query: DocumentNode | TypedDocumentNode<TData, TVariables>,
    options?: PreloadTransportedQueryOptions<TData, NoInfer<TVariables>>
  ): TransportedQueryRef<TData, TVariables>;
}

/** @internal */
export function getInjectableEventStream() {
  let controller:
    | ReadableStreamDefaultController<ReadableStreamLinkEvent>
    | undefined;
  const stream = new ReadableStream<ReadableStreamLinkEvent>({
    start(c) {
      controller = c;
    },
  });
  return [controller!, stream] as const;
}

/** @public */
export function createTransportedQueryPreloader(
  client: ApolloClient,
  {
    /**
     * Set this to `true` to indicate that this `queryRef` will be reused within the same process with the same Apollo Client instance without being dehydrated and hydrated.
     * In that case, it will already be written to the suspense cache so it doesn't need to be hydrated by re-running the query with a fake network request.
     */
    prepareForReuse = false,
  } = {}
): PreloadTransportedQueryFunction {
  return (...[query, options]: Parameters<PreloadTransportedQueryFunction>) => {
    // unset options that we do not support
    options = { ...options };
    delete options.returnPartialData;
    delete options.nextFetchPolicy;
    delete options.pollInterval;

    const [controller, stream] = getInjectableEventStream();
    const transportedQueryRef = createTransportedQueryRef<any, any>(
      query,
      options,
      crypto.randomUUID(),
      stream
    );

    const watchQueryOptions: ApolloClient.QueryOptions<any, any> = {
      query,
      ...options,
      // ensure that this query makes it to the network
      fetchPolicy: "no-cache",
      context: skipDataTransport(
        teeToReadableStream(() => controller, {
          ...options?.context,
          // we want to do this even if the query is already running for another reason
          queryDeduplication: false,
        })
      ),
    };

    if (!prepareForReuse) {
      // Instead of creating the queryRef, we just kick off the query.
      client.query(watchQueryOptions).catch(() => {
        /* we want to avoid any floating promise rejections */
      });
    } else {
      const cacheKey: CacheKey = [
        query,
        canonicalStringify(options.variables),
        transportedQueryRef.$__apollo_queryRef.queryKey,
      ];
      const suspenseCache = getSuspenseCache(client);
      // this will kick of the query and write it to the suspense cache
      suspenseCache.getQueryRef(cacheKey, () =>
        client.watchQuery(watchQueryOptions)
      );
      hydrationCache.set(transportedQueryRef, {
        cacheKey,
        hydratedOptions: { query, ...options },
      });
    }

    return transportedQueryRef;
  };
}

function createTransportedQueryRef<
  TData,
  TVariables extends OperationVariables,
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options: PreloadTransportedQueryOptions<TData, NoInfer<TVariables>>,
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

const hydrationCache = new WeakMap<
  TransportedQueryRef,
  { cacheKey: CacheKey; hydratedOptions: ApolloClient.WatchQueryOptions }
>();

/** @public */
export function reviveTransportedQueryRef(
  queryRef: TransportedQueryRef,
  client: ApolloClient
): asserts queryRef is TransportedQueryRef & ReturnType<typeof wrapQueryRef> {
  const {
    $__apollo_queryRef: { options, stream, queryKey },
  } = queryRef;
  if (!hydrationCache.has(queryRef)) {
    const hydratedOptions = deserializeOptions(options);
    hydrationCache.set(queryRef, {
      hydratedOptions,
      cacheKey: [
        hydratedOptions.query,
        canonicalStringify(hydratedOptions.variables),
        queryKey,
      ],
    });
  }
  const { cacheKey, hydratedOptions } = hydrationCache.get(queryRef)!;
  if (!unwrapQueryRef(queryRef)) {
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

/** @public */
export function isTransportedQueryRef(
  queryRef: any
): queryRef is TransportedQueryRef {
  return !!(queryRef && queryRef.$__apollo_queryRef);
}

/** @public */
export function useWrapTransportedQueryRef<TData>(
  queryRef:
    | QueryRef<TData, any, "complete" | "streaming" | "empty" | "partial">
    | TransportedQueryRef
): QueryRef<TData> {
  const client = useApolloClient();
  let cacheKey: CacheKey | undefined;
  let isTransported: boolean;
  if ((isTransported = isTransportedQueryRef(queryRef))) {
    reviveTransportedQueryRef(queryRef, client);
    cacheKey = hydrationCache.get(queryRef)?.cacheKey;
  }
  const unwrapped = unwrapQueryRef(queryRef)!;

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
  return queryRef satisfies QueryRef<any, any, any> as QueryRef<TData>;
}

function sanitizeForTransport<T>(value: T) {
  return JSON.parse(JSON.stringify(value)) as T;
}
