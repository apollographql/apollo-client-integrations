import { ApolloLink, Observable } from "@apollo/client";
import { GraphQLError, type GraphQLFormattedError } from "graphql";
import * as entryPoint from "@apollo/client-react-streaming";
import { Defer20220824Handler } from "@apollo/client/incremental";

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
      } else if (errorConditions.includes("incremental_chunk_error_alpha2")) {
        let chunk = 0;
        const sub = forward(operation).subscribe({
          next(value) {
            if (++chunk === 3) {
              subscriber.next({
                hasNext: false,
                incremental: [
                  {
                    errors: [
                      {
                        message: `Simulated error (${env})`,
                      },
                    ],
                  },
                ],
              } satisfies Defer20220824Handler.SubsequentResult);
              subscriber.complete();
              sub.unsubscribe();
            } else {
              subscriber.next(value);
            }
          },
          error(err) {
            subscriber.error(err);
          },
          complete() {
            subscriber.complete();
          },
        });
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
