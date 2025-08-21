import { ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import {
  createApolloLoaderHandler,
  ApolloClient,
} from "@apollo/client-integration-react-router";
import { IncrementalSchemaLink } from "@integration-test/shared/IncrementalSchemaLink";
import { schema } from "@integration-test/shared/schema";
import { delayLink } from "@integration-test/shared/delayLink";
import { errorLink } from "@integration-test/shared/errorLink";

const link = ApolloLink.from([
  delayLink,
  errorLink,
  typeof window === "undefined"
    ? (new IncrementalSchemaLink({ schema }) as any as ApolloLink)
    : new HttpLink({ uri: "/graphql" }),
]);

export const makeClient = (request?: Request) => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link,
  });
};
export const apolloLoader = createApolloLoaderHandler(makeClient);
