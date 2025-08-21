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
