import {
  ReadFromReadableStreamLink,
  TeeToReadableStreamLink,
  useWrapTransportedQueryRef,
} from "@apollo/client-react-streaming";
import type { InternalTypes } from "@apollo/client";
import { ApolloLink, ApolloClient as _ApolloClient } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import type { HookWrappers } from "@apollo/client/react/internal";
import { hydrateIfNecessary } from "./preloader.js";

const wrappers = Symbol.for("apollo.hook.wrappers");
function getQueryManager(client: _ApolloClient): InternalTypes.QueryManager & {
  [wrappers]: HookWrappers;
} {
  return client["queryManager"];
}

/** @public */
export declare namespace ApolloClient {
  /** @public */
  export interface Options extends _ApolloClient.Options {}
  /*
  We can currently not re-export these types from the upstream ApolloClient implementation because the build 
  tooling doesn't support that:
    > DTS Build error
    > Error: namespace child (hoisting) not supported yet

    We could re-export them by defining them as new types that reference the originals, but that would require us
    to keep generics in sync and would either erase the docblocks or require us to duplicate them 
    (and they would go out of sync).
    If you need any of the other types, please use the `ApolloClient` namespace exported from `@apollo/client` directly.
  */
  // export import DefaultOptions = _ApolloClient.DefaultOptions;
  // export import DevtoolsOptions = _ApolloClient.DevtoolsOptions;
  // export import MutateOptions = _ApolloClient.MutateOptions;
  // export import MutateResult = _ApolloClient.MutateResult;
  // export import QueryOptions = _ApolloClient.QueryOptions;
  // export import QueryResult = _ApolloClient.QueryResult;
  // export import RefetchQueriesOptions = _ApolloClient.RefetchQueriesOptions;
  // export import RefetchQueriesResult = _ApolloClient.RefetchQueriesResult;
  // export import SubscribeOptions = _ApolloClient.SubscribeOptions;
  // export import SubscribeResult = _ApolloClient.SubscribeResult;
  // export import WatchFragmentOptions = _ApolloClient.WatchFragmentOptions;
  // export import WatchFragmentResult = _ApolloClient.WatchFragmentResult;
  // export import WatchQueryOptions = _ApolloClient.WatchQueryOptions;
  // export import ReadQueryOptions = _ApolloClient.ReadQueryOptions;
  // export import WriteQueryOptions = _ApolloClient.WriteQueryOptions;
  // export import WriteFragmentOptions = _ApolloClient.WriteFragmentOptions;
}

/** @public */
export class ApolloClient extends _ApolloClient {
  constructor(options: ConstructorParameters<typeof _ApolloClient>[0]) {
    super(options);
    this.setLink(this.link);

    getQueryManager(this)[wrappers] = {
      useReadQuery(originalHook) {
        return function useReadQuery(queryRef) {
          const client = useApolloClient();
          return originalHook(
            useWrapTransportedQueryRef(
              hydrateIfNecessary(queryRef, client) as any
            )
          );
        };
      },
      useQueryRefHandlers(originalHook) {
        return function useQueryRefHandlers(queryRef) {
          const client = useApolloClient();
          return originalHook(
            useWrapTransportedQueryRef(
              hydrateIfNecessary(queryRef, client) as any
            )
          );
        };
      },
    };
  }

  setLink(newLink: ApolloLink) {
    _ApolloClient.prototype.setLink.call(
      this,
      ApolloLink.from([
        new ReadFromReadableStreamLink(),
        new TeeToReadableStreamLink(),
        newLink,
      ])
    );
  }
}
