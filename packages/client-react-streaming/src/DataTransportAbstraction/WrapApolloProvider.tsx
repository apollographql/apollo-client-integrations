"use client";
import React from "react";
import { useRef } from "react";
import type { ApolloClient } from "./WrappedApolloClient.js";
import { ApolloProvider } from "@apollo/client/react";
import type { DataTransportProviderImplementation } from "./DataTransportAbstraction.js";
import { ApolloClientSingleton } from "./symbols.js";
import { bundle } from "../bundleInfo.js";
import { assertInstance } from "../assertInstance.js";

declare global {
  interface Window {
    [ApolloClientSingleton]?: ApolloClient;
  }
}

/**
 * > This is only available in React Client Components
 *
 * A version of `ApolloProvider` particularly suited for React's streaming SSR.
 *
 * @public
 */
export interface WrappedApolloProvider<ExtraProps> {
  ({
    makeClient,
    children,
    ...extraProps
  }: React.PropsWithChildren<
    {
      makeClient: () => ApolloClient;
    } & ExtraProps
  >): React.JSX.Element;
  /**
   * Information about the current package and it's export names, for use in error messages.
   */
  info: {
    pkg: string;
  };
}

/**
 * > This export is only available in React Client Components
 *
 * Creates an ApolloProvider for streaming SSR.
 *
 * @param TransportProvider - The transport provider to be used.
 * This could e.g. be a `ManualDataTransport` created by `buildManualDataTransport`,
 * or a fully custom implementation of `DataTransportProviderImplementation`.
 * @public
 */
export function WrapApolloProvider<ExtraProps>(
  TransportProvider: DataTransportProviderImplementation<ExtraProps>
): WrappedApolloProvider<ExtraProps> {
  const WrappedApolloProvider: WrappedApolloProvider<ExtraProps> = ({
    makeClient,
    children,
    ...extraProps
  }) => {
    const clientRef = useRef<ApolloClient>(undefined);
    if (!clientRef.current) {
      if (process.env.REACT_ENV === "ssr") {
        clientRef.current = makeClient();
      } else {
        clientRef.current = window[ApolloClientSingleton] ??= makeClient();
      }
      assertInstance(
        clientRef.current,
        WrappedApolloProvider.info,
        "ApolloClient"
      );
    }

    return (
      <ApolloProvider client={clientRef.current}>
        <TransportProvider
          onQueryEvent={(event) =>
            event.type === "started"
              ? clientRef.current!.onQueryStarted!(event)
              : clientRef.current!.onQueryProgress!(event)
          }
          rerunSimulatedQueries={clientRef.current.rerunSimulatedQueries}
          registerDispatchRequestStarted={
            clientRef.current.watchQueryQueue?.register
          }
          {...(extraProps as ExtraProps)}
        >
          {children}
        </TransportProvider>
      </ApolloProvider>
    );
  };
  WrappedApolloProvider.info = bundle;
  return WrappedApolloProvider;
}
