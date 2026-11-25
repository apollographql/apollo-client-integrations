import React from "react";
import type { ReactNode } from "react";
import { outsideOf } from "@internal/test-utils/runInConditions.js";
import assert from "node:assert";
import test, { afterEach, describe } from "node:test";

import type { TypedDocumentNode } from "@apollo/client";
import { ApolloClient, ApolloLink, InMemoryCache, gql } from "@apollo/client";
import { ApolloProvider, useReadQuery } from "@apollo/client/react";
import type { QueryRef } from "@apollo/client/react";
import { Observable } from "rxjs";

const {
  createTransportedQueryPreloader,
  reviveTransportedQueryRef,
  ReadFromReadableStreamLink,
  TeeToReadableStreamLink,
} = await import("#bundled");

describe(
  "reviveTransportedQueryRef",
  { skip: outsideOf("browser") },
  async () => {
    // @ts-expect-error seems to have a wrong type?
    await import("global-jsdom/register");
    const { render, cleanup, act, screen } = await import(
      "@testing-library/react"
    );

    /**
     * Flushes inside `act` until `text` is on the page: React only retries a
     * suspended render once its ping is flushed.
     */
    async function untilText(text: string | RegExp) {
      for (let i = 0; i < 100; i++) {
        if (screen.queryByText(text)) return;
        await act(() => new Promise((resolve) => setTimeout(resolve, 10)));
      }
      screen.getByText(text);
    }

    afterEach(cleanup);

    const QUERY: TypedDocumentNode<{ greeting: { message: string } }> = gql`
      query Greeting {
        greeting {
          message
        }
      }
    `;
    const FAILED = {
      data: null,
      errors: [{ message: "Something went wrong" }],
    };

    // (inside the suite: `react-server` has no `Component`)
    class ErrorBoundary extends React.Component<
      { children: ReactNode },
      { error: unknown }
    > {
      state = { error: null as unknown };
      static getDerivedStateFromError(error: unknown) {
        return { error };
      }
      render() {
        return this.state.error ? (
          <p>error: {String(this.state.error)}</p>
        ) : (
          this.props.children
        );
      }
    }

    test("a revived query ref never reads a result without data while a refetch after an error is in flight", async () => {
      // The server's query fails; its result is transported over the queryRef's stream.
      const serverClient = new ApolloClient({
        cache: new InMemoryCache(),
        link: ApolloLink.from([
          new TeeToReadableStreamLink(),
          new ApolloLink(
            () =>
              new Observable((observer) => {
                setTimeout(() => {
                  observer.next(FAILED);
                  observer.complete();
                });
              })
          ),
        ]),
      });
      const queryRef = createTransportedQueryPreloader(serverClient)(QUERY);

      // In the browser, later requests are held until the test answers them.
      let respond: (body: object) => void = () => {};
      const browserClient = new ApolloClient({
        cache: new InMemoryCache(),
        link: ApolloLink.from([
          new ReadFromReadableStreamLink(),
          new ApolloLink(
            () =>
              new Observable((observer) => {
                respond = (body) => {
                  observer.next(body);
                  observer.complete();
                };
              })
          ),
        ]),
      });
      // (an assertion function from a dynamic import needs an explicit type)
      const revive: typeof reviveTransportedQueryRef =
        reviveTransportedQueryRef;
      revive(queryRef, browserClient);

      const reads: Array<{ data: unknown; networkStatus: number }> = [];
      function Greeting({ queryRef }: { queryRef: QueryRef<any> }) {
        const { data, networkStatus } = useReadQuery(queryRef);
        reads.push({ data, networkStatus });
        return <p>{data.greeting.message}</p>;
      }
      const boundary = React.createRef<ErrorBoundary>();
      await act(async () => {
        render(
          <ApolloProvider client={browserClient}>
            <ErrorBoundary ref={boundary}>
              <React.Suspense fallback={<p>loading</p>}>
                <Greeting queryRef={queryRef} />
              </React.Suspense>
            </ErrorBoundary>
          </ApolloProvider>
        );
      });
      await untilText(/error: .*Something went wrong/);

      // "Retry": reset the boundary and refetch the active queries.
      await act(async () => {
        void browserClient.refetchQueries({ include: "active" });
        boundary.current!.setState({ error: null });
      });
      // While the refetch is in flight, the reader keeps the ref's last outcome
      // (the error), as with a `createQueryPreloader` ref, instead of reading
      // the refetch's loading result: `data: undefined`, `networkStatus: 4`.
      await untilText(/error: /);
      assert.deepStrictEqual(reads, []);
      screen.getByText(/error: .*Something went wrong/);

      await act(async () =>
        respond({
          data: { greeting: { __typename: "Greeting", message: "Hello" } },
        })
      );
      await act(async () => boundary.current!.setState({ error: null }));
      await untilText("Hello");
      assert.deepStrictEqual(reads, [
        {
          data: { greeting: { __typename: "Greeting", message: "Hello" } },
          networkStatus: 7,
        },
      ]);
    });
  }
);
