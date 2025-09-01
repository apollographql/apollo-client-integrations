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
      const queryRef = { $__apollo_queryRef: value };
      reviveTransportedQueryRef(queryRef, apolloClient);
      return queryRef;
    },
    toSerializable(queryRef) {
      return queryRef.$__apollo_queryRef;
    },
  });
