import type React from "react";
import type {
  FetchResult,
  Observable,
  WatchQueryOptions,
} from "@apollo/client/index.js";
import { createContext } from "react";

interface DataTransportAbstraction {
  /**
   * This hook should always return the first value it was called with.
   *
   * If used in the browser and SSR happened, it should return the value passed to it on the server.
   */
  useStaticValueRef<T>(value: T): { current: T };
}

/**
 * > This export is only available in React Client Components
 *
 * If you create a custom data transport, you need to wrap the child tree in a
 * `DataTransportContext.Provider` and provide the `DataTransportAbstraction` to it.
 *
 * See for example
 * https://github.com/apollographql/apollo-client-nextjs/blob/37feeaa9aea69b90a974eb9cd0fbd636b62d841a/integration-test/experimental-react/src/WrappedApolloProvider.tsx
 *
 * @public
 */
export const DataTransportContext =
  /*#__PURE__*/ createContext<DataTransportAbstraction | null>(null);

/**
 * Interface to be implemented by a custom data transport component,
 * for usage with `WrapApolloProvider`.
 *
 * This component needs to provide a `DataTransportContext` to it's children.
 *
 * See for example
 * https://github.com/apollographql/apollo-client-nextjs/blob/37feeaa9aea69b90a974eb9cd0fbd636b62d841a/integration-test/experimental-react/src/WrappedApolloProvider.tsx
 *
 * @public
 */
export type DataTransportProviderImplementation<
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtraProps = {},
> = React.FC<
  {
    /** will be present in the Browser */
    onQueryEvent?: (event: QueryEvent) => void;
    /** will be present in the Browser */
    rerunSimulatedQueries?: () => void;
    /** will be present during SSR */
    registerDispatchRequestStarted?: (
      callback: (query: {
        event: Extract<QueryEvent, { type: "started" }>;
        observable: Observable<Exclude<QueryEvent, { type: "started" }>>;
      }) => void
    ) => void;
    /** will always be present */
    children: React.ReactNode;
  } & ExtraProps
>;

export type TransportIdentifier = string & { __transportIdentifier: true };

/**
 * Events that will be emitted by a wrapped ApolloClient instance during
 * SSR on `DataTransportProviderImplementation.registerDispatchRequestStarted`,
 * to be transported to the browser and replayed there using
 * `DataTransportProviderImplementation.onQueryEvent`.
 *
 * @public
 */
export type QueryEvent =
  | {
      type: "started";
      options: WatchQueryOptions;
      id: TransportIdentifier;
    }
  | {
      type: "data";
      id: TransportIdentifier;
      result: FetchResult;
    }
  | {
      type: "error";
      id: TransportIdentifier;
      // for now we don't transport the error itself, as it might leak some sensitive information
      // this is similar to how React handles errors during SSR
    }
  | {
      type: "complete";
      id: TransportIdentifier;
    };
