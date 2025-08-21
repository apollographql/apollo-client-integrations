import { WrapApolloProvider } from "@apollo/client-react-streaming";
import { buildManualDataTransport } from "@apollo/client-react-streaming/manual-transport";
import * as React from "react";
import { setLogVerbosity } from "@apollo/client";

setLogVerbosity("debug");

const InjectionContext = React.createContext<
  (callback: () => React.ReactNode) => void
>(() => {});

export const InjectionContextProvider = InjectionContext.Provider;

export const WrappedApolloProvider = WrapApolloProvider(
  buildManualDataTransport({
    useInsertHtml() {
      return React.useContext(InjectionContext);
    },
  })
);
