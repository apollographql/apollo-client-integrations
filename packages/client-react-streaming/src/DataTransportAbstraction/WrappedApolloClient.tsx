/* eslint-disable prefer-rest-params */
import type {
  ApolloClientOptions,
  OperationVariables,
  WatchQueryOptions,
  NormalizedCacheObject,
} from "@apollo/client/index.js";

import {
  ApolloLink,
  ApolloClient as OrigApolloClient,
  Observable,
} from "@apollo/client/index.js";
import type { QueryManager } from "@apollo/client/core/QueryManager.js";
import { invariant } from "ts-invariant";
import { createBackpressuredCallback } from "./backpressuredCallback.js";
import type { InMemoryCache } from "./WrappedInMemoryCache.js";
import { hookWrappers } from "./hooks.js";
import type { HookWrappers } from "@apollo/client/react/internal/index.js";
import type {
  ProgressEvent,
  QueryEvent,
  TransportIdentifier,
} from "./DataTransportAbstraction.js";
import { bundle, sourceSymbol } from "../bundleInfo.js";
import { serializeOptions, deserializeOptions } from "./transportedOptions.js";
import { assertInstance } from "../assertInstance.js";
import type { ReadableStreamLinkEvent } from "../ReadableStreamLink.js";
import {
  readFromReadableStream,
  ReadFromReadableStreamLink,
  teeToReadableStream,
  TeeToReadableStreamLink,
} from "../ReadableStreamLink.js";
import { getInjectableEventStream } from "../transportedQueryRef.js";

function getQueryManager(
  client: OrigApolloClient<unknown>
): QueryManager<NormalizedCacheObject> & {
  [wrappers]: HookWrappers;
} {
  return client["queryManager"];
}

type SimulatedQueryInfo = {
  controller: ReadableStreamDefaultController<ReadableStreamLinkEvent>;
  options: WatchQueryOptions<OperationVariables, any>;
};

interface WrappedApolloClientOptions
  extends Omit<
    ApolloClientOptions<NormalizedCacheObject>,
    "cache" | "ssrMode" | "ssrForceFetchDelay"
  > {
  cache: InMemoryCache;
}

const wrappers = Symbol.for("apollo.hook.wrappers");
class ApolloClientBase extends OrigApolloClient<NormalizedCacheObject> {
  /**
   * Information about the current package and it's export names, for use in error messages.
   *
   * @internal
   */
  static readonly info = bundle;

  [sourceSymbol]: string;

  constructor(options: WrappedApolloClientOptions) {
    const warnings: string[] = [];
    if ("ssrMode" in options) {
      delete options.ssrMode;
      warnings.push(
        "The `ssrMode` option is not supported in %s. Please remove it from your %s constructor options."
      );
    }
    if ("ssrForceFetchDelay" in options) {
      delete options.ssrForceFetchDelay;
      warnings.push(
        "The `ssrForceFetchDelay` option is not supported in %s. Please remove it from your %s constructor options."
      );
    }
    super(
      process.env.REACT_ENV === "rsc" || process.env.REACT_ENV === "ssr"
        ? {
            connectToDevTools: false,
            ...options,
          }
        : options
    );
    const info = (this.constructor as typeof ApolloClientBase).info;
    this[sourceSymbol] = `${info.pkg}:ApolloClient`;

    for (const warning of warnings) {
      console.warn(warning, info.pkg, "ApolloClient");
    }

    assertInstance(
      this.cache as unknown as InMemoryCache,
      info,
      "InMemoryCache"
    );

    this.setLink(this.link);
  }

  setLink(newLink: ApolloLink) {
    super.setLink.call(
      this,
      ApolloLink.from([
        new ReadFromReadableStreamLink(),
        new TeeToReadableStreamLink(),
        newLink,
      ])
    );
  }
}

class ApolloClientClientBaseImpl extends ApolloClientBase {
  constructor(options: WrappedApolloClientOptions) {
    super(options);
    this.onQueryStarted = this.onQueryStarted.bind(this);

    getQueryManager(this)[wrappers] = hookWrappers;
  }

  private simulatedStreamingQueries = new Map<
    TransportIdentifier,
    SimulatedQueryInfo
  >();

  onQueryStarted({ options, id }: Extract<QueryEvent, { type: "started" }>) {
    const hydratedOptions = deserializeOptions(options);

    const [controller, stream] = getInjectableEventStream();

    const queryManager = getQueryManager(this);
    const queryId = queryManager.generateQueryId();
    queryManager
      .fetchQuery(queryId, {
        ...hydratedOptions,
        query: queryManager.transform(hydratedOptions.query),
        fetchPolicy: "network-only",
        context: skipDataTransport(
          readFromReadableStream(stream, {
            ...hydratedOptions.context,
            queryDeduplication: true,
          })
        ),
      })
      .finally(() => queryManager.stopQuery(queryId));

    this.simulatedStreamingQueries.set(id, {
      controller,
      options: hydratedOptions,
    });
  }

  onQueryProgress = (event: ProgressEvent) => {
    const queryInfo = this.simulatedStreamingQueries.get(event.id);
    if (!queryInfo) return;

    if (
      event.type === "error" ||
      (event.type === "next" && event.value.errors)
    ) {
      /**
       * At this point we're not able to correctly serialize the error over the wire
       * so we do the next-best thing: restart the query in the browser as soon as it
       * failed on the server.
       * This matches up with what React will be doing (abort hydration and rerender)
       * See https://github.com/apollographql/apollo-client-nextjs/issues/52
       */
      this.simulatedStreamingQueries.delete(event.id);
      if (process.env.REACT_ENV === "browser") {
        invariant.debug(
          "Query failed on server, rerunning in browser:",
          queryInfo.options
        );
        this.rerunSimulatedQuery(queryInfo);
      } else if (process.env.REACT_ENV === "ssr") {
        invariant.debug(
          "Query failed upstream, will fail it during SSR and rerun it in the browser:",
          queryInfo.options
        );
        queryInfo.controller.error(new Error("Query failed upstream."));
      }
    } else if (event.type === "completed") {
      this.simulatedStreamingQueries.delete(event.id);
      queryInfo.controller.enqueue(event);
    } else if (event.type === "next") {
      queryInfo.controller.enqueue(event);
    }
  };

  /**
   * Can be called when the stream closed unexpectedly while there might still be unresolved
   * simulated server-side queries going on.
   * Those queries will be cancelled and then re-run in the browser.
   */
  rerunSimulatedQueries = () => {
    for (const [id, queryInfo] of this.simulatedStreamingQueries) {
      this.simulatedStreamingQueries.delete(id);
      invariant.debug(
        "streaming connection closed before server query could be fully transported, rerunning:",
        queryInfo.options
      );
      this.rerunSimulatedQuery(queryInfo);
    }
  };
  rerunSimulatedQuery = (queryInfo: SimulatedQueryInfo) => {
    const queryManager = getQueryManager(this);
    const queryId = queryManager.generateQueryId();
    queryManager
      .fetchQuery(queryId, {
        ...queryInfo.options,
        fetchPolicy: "no-cache",
        query: queryManager.transform(queryInfo.options.query),
        context: skipDataTransport(
          teeToReadableStream(() => queryInfo.controller, {
            ...queryInfo.options.context,
            queryDeduplication: false,
          })
        ),
      })
      .finally(() => queryManager.stopQuery(queryId));
  };
}

const skipDataTransportKey = Symbol.for("apollo.dataTransport.skip");
interface InternalContext {
  [skipDataTransportKey]?: boolean;
}

/**
 * Apply to a context to prevent this operation from being transported over the SSR data transport mechanism.
 * @param readableStream
 * @param context
 * @returns
 */
export function skipDataTransport<T extends Record<string, any>>(
  context: T
): T & InternalContext {
  return Object.assign(context, {
    [skipDataTransportKey]: true,
  });
}

class ApolloClientSSRImpl extends ApolloClientClientBaseImpl {
  watchQueryQueue = createBackpressuredCallback<{
    event: Extract<QueryEvent, { type: "started" }>;
    observable: Observable<Exclude<QueryEvent, { type: "started" }>>;
  }>();

  pushEventStream(
    options: WatchQueryOptions<any, any>
  ): ReadableStreamDefaultController<ReadableStreamLinkEvent> {
    const id = crypto.randomUUID() as TransportIdentifier;

    const [controller, eventStream] = getInjectableEventStream();

    const streamObservable = new Observable<
      Exclude<QueryEvent, { type: "started" }>
    >((subscriber) => {
      function consume(
        event: ReadableStreamReadResult<ReadableStreamLinkEvent>
      ) {
        const value = event.value;
        if (value) {
          subscriber.next({ ...value, id });
        }
        if (event.done) {
          subscriber.complete();
        } else {
          reader.read().then(consume);
        }
      }
      const reader = eventStream.getReader();
      reader.read().then(consume);
    });

    this.watchQueryQueue.push({
      event: {
        type: "started",
        options: serializeOptions(options),
        id,
      },
      observable: streamObservable,
    });

    return controller;
  }

  watchQuery<
    T = any,
    TVariables extends OperationVariables = OperationVariables,
  >(options: WatchQueryOptions<TVariables, T>) {
    if (
      !(options.context as InternalContext | undefined)?.[skipDataTransportKey]
    ) {
      return super.watchQuery({
        ...options,
        context: teeToReadableStream(() => this.pushEventStream(options), {
          ...options?.context,
        }),
      });
    }
    return super.watchQuery(options);
  }
}

class ApolloClientBrowserImpl extends ApolloClientClientBaseImpl {}

class ApolloClientRSCImpl extends ApolloClientBase {}

const ApolloClientImplementation =
  /*#__PURE__*/ process.env.REACT_ENV === "ssr"
    ? ApolloClientSSRImpl
    : process.env.REACT_ENV === "browser"
      ? ApolloClientBrowserImpl
      : ApolloClientRSCImpl;

/**
 * A version of `ApolloClient` to be used with streaming SSR or in React Server Components.
 *
 * For more documentation, please see {@link https://www.apollographql.com/docs/react/api/core/ApolloClient | the Apollo Client API documentation}.
 *
 * @public
 */
export class ApolloClient<
    // this generic is obsolete as we require a `InMemoryStore`, which fixes this generic to `NormalizedCacheObject` anyways
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Ignored = NormalizedCacheObject,
  >
  extends (ApolloClientImplementation as typeof ApolloClientBase)
  implements Partial<ApolloClientSSRImpl>
{
  /** @internal */
  declare onQueryStarted?: ApolloClientSSRImpl["onQueryStarted"];
  /** @internal */
  declare onQueryProgress?: ApolloClientSSRImpl["onQueryProgress"];
  /** @internal */
  declare rerunSimulatedQueries?: ApolloClientSSRImpl["rerunSimulatedQueries"];
  /** @internal */
  declare rerunSimulatedQuery?: ApolloClientSSRImpl["rerunSimulatedQuery"];
  /** @internal */
  declare watchQueryQueue?: ApolloClientSSRImpl["watchQueryQueue"];
}
