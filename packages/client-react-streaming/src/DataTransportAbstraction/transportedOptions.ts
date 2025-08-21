import { gql } from "@apollo/client";
import type { DocumentNode, FetchPolicy, ApolloClient } from "@apollo/client";
import { print } from "@apollo/client/utilities";
import { stripIgnoredCharacters } from "graphql";

export type TransportedOptions = { query: string } & Omit<
  ApolloClient.WatchQueryOptions,
  "query"
>;

export function serializeOptions<
  T extends ApolloClient.WatchQueryOptions<any, any>,
>(
  options: T
): { query: string; nextFetchPolicy?: FetchPolicy | undefined } & Omit<
  T,
  "query"
> {
  return {
    ...(options as typeof options & {
      // little bit of a hack around the method signature, but the method signature would cause React to error anyways
      nextFetchPolicy?: FetchPolicy | undefined;
    }),
    query: printMinified(options.query),
  };
}

export function deserializeOptions(
  options: TransportedOptions
): ApolloClient.WatchQueryOptions {
  return {
    ...options,
    // `gql` memoizes results, but based on the input string.
    // We parse-stringify-parse here to ensure that our minified query
    // has the best chance of being the referential same query as the one used in
    // client-side code.
    query: gql(print(gql(options.query))),
  };
}

function printMinified(query: DocumentNode): string {
  return stripIgnoredCharacters(print(query));
}
