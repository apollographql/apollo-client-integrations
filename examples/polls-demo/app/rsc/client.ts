import { HttpLink } from "@apollo/client";
import { Defer20220824Handler } from "@apollo/client/incremental";
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";

export const { getClient } = registerApolloClient(() => {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      uri: "https://apollo-next-poll.up.railway.app/",
    }),
    incrementalHandler: new Defer20220824Handler(),
  });
});
