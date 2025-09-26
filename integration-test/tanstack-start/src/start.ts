import { createStart } from "@tanstack/react-start";
import { ApolloSerializationAdapter } from "@apollo/client-integration-tanstack-start";

export const startInstance = createStart(() => {
  return {
    serializationAdapters: [ApolloSerializationAdapter],
  };
});
