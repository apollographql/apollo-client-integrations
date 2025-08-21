import * as base from "./index.js";
export const ApolloNextAppProvider = base.ApolloNextAppProvider;
export const DebounceMultipartResponsesLink =
  base.DebounceMultipartResponsesLink;
export const NextSSRApolloClient = base.ApolloClient;
export const NextSSRInMemoryCache = base.InMemoryCache;
export const RemoveMultipartDirectivesLink = base.RemoveMultipartDirectivesLink;
export const SSRMultipartLink = base.SSRMultipartLink;
export const resetNextSSRApolloSingletons = base.resetApolloClientSingletons;
export {
  useBackgroundQuery,
  useFragment,
  useQuery,
  useReadQuery,
  useSuspenseQuery,
} from "@apollo/client";
