"use client";
import * as React from "react";
import {
  ApolloClient,
  ApolloProvider as _ApolloProvider,
} from "@apollo/client";
import { RehydrationContextProvider } from "./RehydrationContext";

export const ApolloClientSingleton = Symbol.for("ApolloClientSingleton");

declare global {
  interface Window {
    [ApolloClientSingleton]?: ApolloClient<any>;
  }
}
export const ApolloNextAppProvider = ({
  makeClient,
  children,
}: React.PropsWithChildren<{
  makeClient: () => ApolloClient<any>;
}>) => {
  const clientRef = React.useRef<ApolloClient<any>>();

  if (typeof window !== "undefined") {
    clientRef.current = window[ApolloClientSingleton] ??= makeClient();
  } else {
    if (!clientRef.current) {
      clientRef.current = makeClient();
    }
  }

  return (
    <_ApolloProvider client={clientRef.current}>
      <RehydrationContextProvider>{children}</RehydrationContextProvider>
    </_ApolloProvider>
  );
};
