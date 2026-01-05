import { unwrapQueryRef, wrapQueryRef } from "@apollo/client/react/internal";
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
import {
  JSONDecodeStream,
  JSONEncodeStream,
  type JsonString,
} from "@apollo/client-react-streaming/stream-utils";
import { InternalQueryReference } from "@apollo/client/react/internal";
import { invariant } from "@apollo/client/utilities/invariant";
import { __DEV__ } from "@apollo/client/utilities/environment";
import { Kind, visit } from "graphql";

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
    prepareForReuse = false,
    notTransportedOptionOverrides = {},
  }:
    | {
        /**
         * Set this to `true` to indicate that this `queryRef` will be reused within the same process with the same Apollo Client instance without being dehydrated and hydrated.
         * In that case, it will already be written to the suspense cache so it doesn't need to be hydrated by re-running the query with a fake network request.
         */
        prepareForReuse?: boolean;
        notTransportedOptionOverrides?: never;
      }
    | {
        prepareForReuse?: never;
        /**
         * Overrides to the options that should happen only in the `preloader` call, but should not be transported/hydrated on the client.
         */
        notTransportedOptionOverrides?: Partial<
          ApolloClient.WatchQueryOptions<any, any>
        >;
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

    const watchQueryOptions: ApolloClient.WatchQueryOptions<any, any> = {
      query,
      ...options,
      notifyOnNetworkStatusChange: false,
      context: skipDataTransport(
        teeToReadableStream(() => controller, {
          ...options?.context,
          // we want to do this even if the query is already running for another reason
          queryDeduplication: false,
        })
      ),
      ...notTransportedOptionOverrides,
    };

    if (notTransportedOptionOverrides?.fetchPolicy === "no-cache") {
      // If the `fetchPolicy` is overwritten to `no-cache`, we don't want to
      // provoke the warning about masked fields in a no-cache query.
      // `QueryManager` will strip these `@unmask` directives to get `serverQuery`
      // before query deduplication hits, so this will still deduplicate fine.
      watchQueryOptions.query = unmask(
        client.documentTransform.transformDocument(query)
      );
    }

    if (
      watchQueryOptions.fetchPolicy !== "no-cache" &&
      watchQueryOptions.fetchPolicy !== "network-only" &&
      (!prepareForReuse ||
        watchQueryOptions.fetchPolicy !== "cache-and-network")
    ) {
      // ensure that this query makes it to the network
      watchQueryOptions.fetchPolicy = "network-only";
    }

    if (prepareForReuse) {
      const internalQueryRef = getInternalQueryRef(
        client,
        { query, ...options },
        watchQueryOptions
      );

      return Object.assign(transportedQueryRef, wrapQueryRef(internalQueryRef));
    } else {
      const subscription = client.watchQuery(watchQueryOptions).subscribe({
        next() {
          subscription.unsubscribe();
        },
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

/** @public */
export function reviveTransportedQueryRef(
  queryRef: TransportedQueryRef,
  client: ApolloClient
): asserts queryRef is TransportedQueryRef & ReturnType<typeof wrapQueryRef> {
  if (unwrapQueryRef(queryRef)) return;
  const {
    $__apollo_queryRef: { options, stream },
  } = queryRef;
  const hydratedOptions = deserializeOptions(options);
  const internalQueryRef = getInternalQueryRef(client, hydratedOptions, {
    ...hydratedOptions,
    fetchPolicy: "network-only",
    context: skipDataTransport(
      readFromReadableStream(stream.pipeThrough(new JSONDecodeStream()), {
        ...hydratedOptions.context,
        queryDeduplication: true,
      })
    ),
  });
  Object.assign(queryRef, wrapQueryRef(internalQueryRef));
}

function getInternalQueryRef(
  client: ApolloClient,
  userOptions: ApolloClient.WatchQueryOptions,
  initialFetchOptions: ApolloClient.WatchQueryOptions
) {
  if (__DEV__) {
    // this would be a bug in our code, `initialFetchOptions` should always be derived
    // from `userOptions` and never change `nextFetchPolicy` or we would need additional
    // logic to handle that case
    invariant(
      userOptions.nextFetchPolicy === initialFetchOptions.nextFetchPolicy,
      "Encountered an unexpected bug in @apollo/client-react-streaming. Please file an issue."
    );
  }
  // create with `userOptions` so internals like `initialFetchPolicy` are set correctly
  const observable = client.watchQuery(userOptions);
  // this might have filled in some defaults, so we need to capture them
  const optionsAfterCreation = {
    // context might still be `undefined`, so we need to make sure the property is at least present
    // `undefined` won't merge in as `applyOptions` uses `compact`, so we use an empty object instead
    context: {},
    ...observable.options,
  };
  // apply `initialFetchOptions` for the first fetch
  observable.applyOptions(initialFetchOptions);
  // `new InternalQueryReference` calls `observable.subscribe` immediately, so the `initialFetchOptions` are applied to that call
  const internalQueryRef = new InternalQueryReference(observable, {
    autoDisposeTimeoutMs:
      client.defaultOptions.react?.suspense?.autoDisposeTimeoutMs,
  });
  // set the options for any future `reobserve` calls back to `userOptions` directly after that
  observable.applyOptions({
    ...optionsAfterCreation,
    fetchPolicy:
      observable.options.fetchPolicy === initialFetchOptions.fetchPolicy
        ? // restore `userOptions.fetchPolicy` for future fetches
          optionsAfterCreation.fetchPolicy
        : // otherwise `fetchPolicy` was changed from `initialFetchOptions`, `nextFetchPolicy` has been applied and we're not going to touch it
          observable.options.fetchPolicy,
  });
  return internalQueryRef;
}

/** @public */
export function isTransportedQueryRef(
  queryRef: any
): queryRef is TransportedQueryRef {
  return !!(queryRef && queryRef.$__apollo_queryRef);
}

/** @public */
// This hook is injected into `useReadQuery` and `useQueryRefHandlers` to ensure that
// `TransportedQueryRef`s are properly revived into `WrappedQueryRef`s before usage,
// should they not be hydrated properly for some reason.
export function useWrapTransportedQueryRef<TData>(
  queryRef:
    | QueryRef<TData, any, "complete" | "streaming" | "empty" | "partial">
    | TransportedQueryRef
): QueryRef<TData> {
  const client = useApolloClient();
  const isTransported = isTransportedQueryRef(queryRef);
  if (isTransported) {
    reviveTransportedQueryRef(queryRef, client);
  }
  const unwrapped = unwrapQueryRef(queryRef)!;

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

function unmask(query: DocumentNode) {
  return visit(query, {
    FragmentSpread(node) {
      return {
        ...node,
        directives: (node.directives || []).concat({
          kind: Kind.DIRECTIVE,
          name: { kind: Kind.NAME, value: "unmask" },
        }),
      };
    },
  });
}
