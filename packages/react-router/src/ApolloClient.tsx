import {
  ReadFromReadableStreamLink,
  TeeToReadableStreamLink,
} from "@apollo/client-react-streaming";
import type { QueryManager } from "@apollo/client/core/QueryManager.js";
import type { NormalizedCacheObject } from "@apollo/client/index.js";
import {
  ApolloLink,
  ApolloClient as _ApolloClient,
} from "@apollo/client/index.js";
import { useApolloClient } from "@apollo/client/react/index.js";
import type { HookWrappers } from "@apollo/client/react/internal";
import { hydrateIfNecessary } from "./preloader.js";

const wrappers = Symbol.for("apollo.hook.wrappers");
function getQueryManager(
  client: _ApolloClient<unknown>
): QueryManager<NormalizedCacheObject> & {
  [wrappers]: HookWrappers;
} {
  return client["queryManager"];
}

export class ApolloClient extends _ApolloClient<any> {
  constructor(options: ConstructorParameters<typeof _ApolloClient>[0]) {
    super(options);
    this.setLink(this.link);

    getQueryManager(this)[wrappers] = {
      useReadQuery(originalHook) {
        return function useReadQuery(queryRef) {
          const client = useApolloClient();
          return originalHook(hydrateIfNecessary(queryRef, client) as any);
        };
      },
      useQueryRefHandlers(originalHook) {
        return function useQueryRefHandlers(queryRef) {
          const client = useApolloClient();
          return originalHook(hydrateIfNecessary(queryRef, client) as any);
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
