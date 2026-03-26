/* eslint-disable @typescript-eslint/no-namespace */
import type { CreateServerLoaderArgs } from "react-router/route-module";
import type { ApolloClient } from "./ApolloClient.js";
import type { QueryRef } from "@apollo/client/react";
import type {
  PreloadTransportedQueryOptions,
  ReadableStreamLinkEvent,
  TransportedQueryRef,
} from "@apollo/client-react-streaming";
import {
  createTransportedQueryPreloader,
  isTransportedQueryRef,
  reviveTransportedQueryRef,
} from "@apollo/client-react-streaming";
import type { Promiscade } from "promiscade";
import { promiscadeToReadableStream, streamToPromiscade } from "promiscade";
import type { unstable_SerializesTo } from "react-router";
import type { JsonString } from "@apollo/client-react-streaming/stream-utils";
import type {
  DocumentNode,
  OperationVariables,
  TypedDocumentNode,
} from "@apollo/client";

/** @alpha */
export declare namespace createApolloLoaderHandler {
  /**
   * The result of calling `preloadQuery.awaitable()` inside a loader.
   */
  export interface AwaitablePreloadQueryResult<
    TData = unknown,
    TVariables extends OperationVariables = OperationVariables,
  > {
    /** The transportable query ref — pass this to `useReadQuery` on the client. */
    queryRef: unstable_SerializesTo<QueryRef<TData, TVariables>>;
    /**
     * Returns a promise that resolves with `data` as soon as the predicate
     * returns `true`. Use this to selectively await critical data (e.g. for
     * the `meta()` function) without blocking the full streaming response.
     */
    resolveWhen: (predicate: (data: TData) => boolean) => Promise<TData>;
  }

  export interface PreloadQueryFn {
    <
      TData = unknown,
      TVariables extends OperationVariables = OperationVariables,
    >(
      query: DocumentNode | TypedDocumentNode<TData, TVariables>,
      options?: PreloadTransportedQueryOptions<TData, NoInfer<TVariables>>
    ): unstable_SerializesTo<QueryRef<TData, TVariables>>;

    /**
     * Like `preloadQuery()`, but returns `{ queryRef, resolveWhen }` so you can
     * selectively await partial data in the loader while streaming continues.
     *
     * @see {@link AwaitablePreloadQueryResult}
     */
    awaitable: <
      TData = unknown,
      TVariables extends OperationVariables = OperationVariables,
    >(
      query: DocumentNode | TypedDocumentNode<TData, TVariables>,
      options?: PreloadTransportedQueryOptions<TData, NoInfer<TVariables>>
    ) => AwaitablePreloadQueryResult<TData, TVariables>;
  }

  export type ApolloLoader = <
    LoaderArgs extends CreateServerLoaderArgs<any>,
  >() => <ReturnValue>(
    loader: (
      args: LoaderArgs & {
        preloadQuery: PreloadQueryFn;
        client: ApolloClient;
      }
    ) => ReturnValue
  ) => (args: LoaderArgs) => ReturnValue;
}

/** @alpha */
export function createApolloLoaderHandler(
  makeClient: (request: Request) => ApolloClient
): createApolloLoaderHandler.ApolloLoader {
  return () => (loader) => (args) => {
    const client = makeClient(args.request);
    const preloader = createTransportedQueryPreloader(client, {
      notTransportedOptionOverrides: { fetchPolicy: "no-cache" },
    });
    const preloadQueryFn = (...args: Parameters<typeof preloader>) =>
      replaceStreamWithPromiscade(preloader(...args));
    preloadQueryFn.awaitable = (
      ...args: Parameters<typeof preloader.awaitable>
    ) => {
      const { queryRef, resolveWhen } = preloader.awaitable(...args);
      return {
        queryRef: replaceStreamWithPromiscade(queryRef),
        resolveWhen,
      };
    };
    const preloadQuery =
      preloadQueryFn as unknown as createApolloLoaderHandler.PreloadQueryFn;

    return loader({
      ...args,
      preloadQuery,
      client,
    });
  };
}

// currently, `turbo-stream` cannot stream a `ReadableStream`.
// until https://github.com/jacob-ebey/turbo-stream/pull/51
// is merged or similar functionality is added, we need to
// convert the stream to a cascade of promises
// once that functionality has been added, all this can be removed.

type EventPromiscade = Promiscade<JsonString<ReadableStreamLinkEvent>>;
type PromiscadedRef = Omit<TransportedQueryRef, "$__apollo_queryRef"> & {
  $__apollo_queryRef: Omit<
    TransportedQueryRef["$__apollo_queryRef"],
    "stream"
  > & {
    stream?: never;
    promiscade: EventPromiscade;
  };
};

function isPromiscaded(
  queryRef: TransportedQueryRef | PromiscadedRef
): queryRef is PromiscadedRef {
  return "promiscade" in queryRef.$__apollo_queryRef;
}

/**
 * This function is used to convert a stream ref to a promiscaded ref
 *
 * **modifies the object in place and returns it**
 */
function replaceStreamWithPromiscade<
  TData,
  TVariables extends OperationVariables,
>(
  queryRef: TransportedQueryRef<TData, TVariables>
): unstable_SerializesTo<QueryRef<TData, TVariables>> {
  const typed = queryRef as unknown as PromiscadedRef;
  // the stream will be tee'd so it can be used in the same environment,
  // but also transported over the wire in the form of a promiscade
  const stream = queryRef.$__apollo_queryRef.stream;
  typed.$__apollo_queryRef.promiscade = streamToPromiscade(stream);
  delete typed.$__apollo_queryRef.stream;
  return queryRef as any;
}

/**
 * This function is used to convert a promiscaded query ref back to a stream ref
 *
 * **returns a new object** - this is important because modifying the original object
 * could result in poor timing and have the modified object be sent over the wire instead
 * of the one with the promiscade
 */
function promiscadedRefToStreamRef(
  queryRef: PromiscadedRef
): TransportedQueryRef {
  const { promiscade: _, ...restRef } = queryRef.$__apollo_queryRef;
  return {
    ...queryRef,
    $__apollo_queryRef: {
      ...restRef,
      stream: promiscadeToReadableStream(
        queryRef.$__apollo_queryRef.promiscade
      ),
    },
  };
}

const hydratedRefs = new WeakMap<PromiscadedRef, TransportedQueryRef>();
/**
 * If `obj` is a Promiscaded Ref, creates a new "live" QueryRef
 * If `obj` is a Transported Ref, converts it to a "live" QueryRef
 * Returns other values untouched
 */
export function hydrateIfNecessary(obj: unknown, client: ApolloClient) {
  if (isTransportedQueryRef(obj)) {
    if (isPromiscaded(obj)) {
      if (!hydratedRefs.has(obj)) {
        hydratedRefs.set(obj, promiscadedRefToStreamRef(obj));
      }
      obj = hydratedRefs.get(obj)!;
    }
    reviveTransportedQueryRef(obj as TransportedQueryRef, client);
  }
  return obj;
}
