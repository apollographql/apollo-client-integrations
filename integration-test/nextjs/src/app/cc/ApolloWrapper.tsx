"use client";
import React from "react";
import { HttpLink } from "@apollo/client";
import {
  ApolloNextAppProvider,
  InMemoryCache,
  ApolloClient,
} from "@apollo/client-integration-nextjs";

import { loadErrorMessages, loadDevMessages } from "@apollo/client/dev";
import { setVerbosity } from "ts-invariant";
import { delayLink } from "@integration-test/shared/delayLink";
import { schema } from "@integration-test/shared/schema";

import { useSSROnlySecret } from "ssr-only-secrets";
import { errorLink } from "@integration-test/shared/errorLink";
import { IncrementalSchemaLink } from "@integration-test/shared/IncrementalSchemaLink";

setVerbosity("debug");
loadDevMessages();
loadErrorMessages();

export function ApolloWrapper({
  children,
  nonce,
}: React.PropsWithChildren<{ nonce?: string }>) {
  const actualNonce = useSSROnlySecret(nonce, "SECRET");
  return (
    <ApolloNextAppProvider
      makeClient={makeClient}
      extraScriptProps={{
        nonce: actualNonce,
      }}
    >
      {children}
    </ApolloNextAppProvider>
  );

  function makeClient() {
    const httpLink = new HttpLink({
      uri: "/graphql",
    });

    return new ApolloClient({
      cache: new InMemoryCache(),
      link: delayLink
        .concat(errorLink)
        .concat(
          typeof window === "undefined"
            ? new IncrementalSchemaLink({ schema })
            : httpLink
        ),
    });
  }
}
