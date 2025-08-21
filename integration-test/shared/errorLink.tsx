import { ApolloLink, Observable } from "@apollo/client";
import { GraphQLError, type GraphQLFormattedError } from "graphql";
import * as entryPoint from "@apollo/client-react-streaming";

declare module "@apollo/client" {
  type Env = "ssr" | "browser" | "rsc";
  export interface DefaultContext {
    error?: `${"always" | Env | `${Env},${Env}`}${"" | ",network_error"}`;
  }
}

export const errorLink = new ApolloLink((operation, forward) => {
  const context = operation.getContext();
  const errorConditions = context.error?.split(",") || [];
  if (
    errorConditions.includes("always") ||
    ("built_for_ssr" in entryPoint && errorConditions.includes("ssr")) ||
    ("built_for_browser" in entryPoint &&
      errorConditions.includes("browser")) ||
    ("built_for_rsc" in entryPoint && errorConditions.includes("rsc"))
  ) {
    const env =
      "built_for_ssr" in entryPoint
        ? "SSR"
        : "built_for_browser" in entryPoint
          ? "Browser"
          : "built_for_rsc" in entryPoint
            ? "RSC"
            : "unknown";

    return new Observable((subscriber) => {
      if (errorConditions.includes("network_error")) {
        subscriber.error(new Error(`Simulated link chain error (${env})`));
      } else {
        subscriber.next({
          data: null,
          errors: [
            {
              message: `Simulated error (${env})`,
            } satisfies GraphQLFormattedError as GraphQLError,
          ],
        });
        subscriber.complete();
      }
    });
  }
  return forward(operation);
});
