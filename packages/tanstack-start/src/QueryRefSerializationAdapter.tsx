import {
  type ApolloClient,
  type TransportedQueryRef,
  isTransportedQueryRef,
  reviveTransportedQueryRef,
} from "@apollo/client-react-streaming";
import { createSerializationAdapter } from "@tanstack/router-core";

export const getQueryRefSerializationAdapter = (apolloClient: ApolloClient) =>
  createSerializationAdapter<
    TransportedQueryRef,
    TransportedQueryRef["$__apollo_queryRef"]
  >({
    key: "apollo-query-ref",
    test: isTransportedQueryRef,
    fromSerializable(value) {
      const queryRef = {
        $__apollo_queryRef: {
          ...value,
          stream: value.stream.pipeThrough(new TransformStream(), {
            /**
             * This is a workaround for an issue with seroval streams that will keep writing
             * incoming chunks/close calls, even if the consumer called `reader.cancel()`.
             * Might get fixed upstream with https://github.com/lxsmnsyc/seroval/pull/62
             */
            preventCancel: true,
          }),
        },
      };
      reviveTransportedQueryRef(queryRef, apolloClient);
      return queryRef;
    },
    toSerializable(queryRef) {
      return queryRef.$__apollo_queryRef;
    },
  });
