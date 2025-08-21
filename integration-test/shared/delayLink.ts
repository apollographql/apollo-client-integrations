import { ApolloLink, Observable } from "@apollo/client";

declare module "@apollo/client" {
  export interface DefaultContext {
    delay?: number;
  }
}

export const delayLink = new ApolloLink((operation, forward) => {
  if (operation.operationName?.includes("dynamic")) {
    operation.setContext({
      fetchOptions: { cache: "no-store" },
    });
  }

  // slow down network requests so that the browser might want to make an api request
  return new Observable((observer) => {
    const timeout = setTimeout(() => {
      forward(operation).subscribe(observer);
    }, operation.getContext().delay ?? 1500);
    return () => clearTimeout(timeout);
  });
});
