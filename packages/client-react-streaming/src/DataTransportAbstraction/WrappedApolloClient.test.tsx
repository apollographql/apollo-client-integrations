import React, { Suspense, use, useMemo } from "react";
import { outsideOf } from "@internal/test-utils/runInConditions.js";
import assert from "node:assert";
import test, { afterEach, describe } from "node:test";
import type {
  QueryEvent,
  TransportIdentifier,
} from "./DataTransportAbstraction.js";

import type { TypedDocumentNode } from "@apollo/client";
import { MockSubscriptionLink } from "@apollo/client/testing/core/mocking/mockSubscriptionLink.js";
import { gql, DocumentTransform } from "@apollo/client";
import { useSuspenseQuery } from "@apollo/client/react";
import { visit, Kind, print, isDefinitionNode } from "graphql";
import { serializeOptions } from "./transportedOptions.js";

const {
  ApolloClient,
  InMemoryCache,
  WrapApolloProvider,
  DataTransportContext,
  resetApolloSingletons,
} = await import("#bundled");

describe(
  "tests with DOM access",
  { skip: outsideOf("node", "browser") },
  async () => {
    // @ts-expect-error seems to have a wrong type?
    await import("global-jsdom/register");
    const { render, cleanup, getQueriesForElement, act } = await import(
      "@testing-library/react"
    );

    afterEach(cleanup);
    afterEach(resetApolloSingletons);

    const QUERY_ME: TypedDocumentNode<{ me: string }> = gql`
      query {
        me
      }
    `;
    const EVENT_STARTED: QueryEvent = {
      type: "started",
      id: "1" as any,
      options: serializeOptions({
        fetchPolicy: "cache-first",
        nextFetchPolicy: undefined,
        notifyOnNetworkStatusChange: false,
        query: QUERY_ME,
      }),
    };
    const FIRST_RESULT = { me: "User" };
    const EVENT_DATA: QueryEvent = {
      type: "next",
      id: "1" as any,
      value: { data: FIRST_RESULT },
    };
    const EVENT_COMPLETE: QueryEvent = {
      type: "completed",
      id: "1" as any,
    };
    const FIRST_HOOK_RESULT = {
      data: FIRST_RESULT,
      networkStatus: 7,
    };

    test(
      "`useSuspenseQuery`: data is getting sent to the transport",
      { skip: outsideOf("node") },
      async () => {
        const events: QueryEvent[] = [];
        const staticData: unknown[] = [];

        function useStaticValueRef<T>(current: T) {
          staticData.push(current);
          return { current };
        }

        const Provider = WrapApolloProvider(
          ({ children, registerDispatchRequestStarted }) => {
            registerDispatchRequestStarted!(({ event, observable }) => {
              events.push(event);
              observable.subscribe({
                next: events.push.bind(events),
              });
            });
            return (
              <DataTransportContext.Provider
                value={useMemo(
                  () => ({
                    useStaticValueRef,
                  }),
                  []
                )}
              >
                {children}
              </DataTransportContext.Provider>
            );
          }
        );

        const link = new MockSubscriptionLink();
        const client = new ApolloClient({
          cache: new InMemoryCache(),
          link,
        });

        let finishedRenderCount = 0;

        function Child() {
          const { data } = useSuspenseQuery(QUERY_ME);
          finishedRenderCount++;
          return <>{data.me}</>;
        }

        const { findByText } = await act(async () =>
          render(
            <Provider makeClient={() => client}>
              <Suspense fallback={"Fallback"}>
                <Child />
              </Suspense>
            </Provider>
          )
        );

        // these are an uuid, not just an incremental number, so we need to fix our EVENT_* constants with the real random uuid
        const id = events[0].id;
        assert.deepStrictEqual(events, [{ ...EVENT_STARTED, id }]);
        assert.deepStrictEqual(staticData, []);

        await act(async () =>
          link.simulateResult({ result: { data: FIRST_RESULT } }, true)
        );

        await findByText("User");

        assert.deepStrictEqual(events, [
          { ...EVENT_STARTED, id },
          { ...EVENT_DATA, id },
          { ...EVENT_COMPLETE, id },
        ]);
        assert.deepStrictEqual(
          staticData,
          new Array(finishedRenderCount).fill(FIRST_HOOK_RESULT)
        );
      }
    );

    test(
      "`useSuspenseQuery`: data from the transport is used by the hooks",
      { skip: outsideOf("browser") },
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
        let useStaticValueRefStub = <T extends unknown>(): { current: T } => {
          throw new Error("Should not be called yet!");
        };
        let simulateQueryEvent: (event: QueryEvent) => void;

        const Provider = WrapApolloProvider(
          ({ children, onQueryEvent, ..._rest }) => {
            simulateQueryEvent = onQueryEvent!;
            return (
              <DataTransportContext.Provider
                value={useMemo(
                  () => ({
                    useStaticValueRef() {
                      return useStaticValueRefStub();
                    },
                  }),
                  []
                )}
              >
                {children}
              </DataTransportContext.Provider>
            );
          }
        );

        const client = new ApolloClient({
          connectToDevTools: false,
          cache: new InMemoryCache(),
        });

        let attemptedRenderCount = 0;
        let finishedRenderCount = 0;

        function Child() {
          attemptedRenderCount++;
          const { data } = useSuspenseQuery(QUERY_ME);
          finishedRenderCount++;
          return <>{data.me}</>;
        }

        const { findByText, rerender } = await act(async () =>
          render(<Provider makeClient={() => client}></Provider>)
        );

        await act(async () => simulateQueryEvent!(EVENT_STARTED));
        await act(async () =>
          rerender(
            <Provider makeClient={() => client}>
              <Suspense fallback={"Fallback"}>
                <Child />
              </Suspense>
            </Provider>
          )
        );

        assert.ok(attemptedRenderCount > 0);
        assert.ok(finishedRenderCount == 0);
        await findByText("Fallback");

        useStaticValueRefStub = () => ({ current: FIRST_HOOK_RESULT as any });
        await act(async () => simulateQueryEvent!(EVENT_DATA));
        await act(async () => simulateQueryEvent!(EVENT_COMPLETE));

        await new Promise((resolve) => setTimeout(resolve, 1000));

        await findByText("User");

        assert.ok(attemptedRenderCount > 0);
        // will try with server value and immediately restart with client value
        // one rerender with the actual client value (which is hopefull equal)
        assert.equal(finishedRenderCount, 1);

        assert.deepStrictEqual(JSON.parse(JSON.stringify(client.extract())), {
          ROOT_QUERY: {
            __typename: "Query",
            me: "User",
          },
        });
      }
    );

    test(
      "race condition: client ahead of server renders without hydration mismatch",
      { skip: outsideOf("browser") },
      async () => {
        const { $RC, $RS, setBody, hydrateBody, appendToBody } = await import(
          "@internal/test-utils/hydrationTest.js"
        );
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
        let useStaticValueRefStub = <T extends unknown>(): { current: T } => {
          throw new Error("Should not be called yet!");
        };

        const client = new ApolloClient({
          connectToDevTools: false,
          cache: new InMemoryCache(),
        });
        const simulateRequestStart = client.onQueryStarted!;
        const simulateRequestData = client.onQueryProgress!;

        const Provider = WrapApolloProvider(({ children }) => {
          return (
            <DataTransportContext.Provider
              value={useMemo(
                () => ({
                  useStaticValueRef() {
                    return useStaticValueRefStub();
                  },
                }),
                []
              )}
            >
              {children}
            </DataTransportContext.Provider>
          );
        });

        const finishedRenders: any[] = [];

        function Child() {
          const { data } = useSuspenseQuery(QUERY_ME);
          finishedRenders.push(data);
          return <div id="user">{data.me}</div>;
        }

        const promise = Promise.resolve();
        // suspends on the server, immediately resolved in browser
        function ParallelSuspending() {
          use(promise);
          return <div id="parallel">suspending in parallel</div>;
        }

        const { findByText } = getQueriesForElement(document.body);

        // server starts streaming
        setBody`<!--$?--><template id="B:0"></template>Fallback<!--/$-->`;
        // request started on the server
        simulateRequestStart(EVENT_STARTED);

        hydrateBody(
          <Provider makeClient={() => client}>
            <Suspense fallback={"Fallback"}>
              <Child />
              <ParallelSuspending />
            </Suspense>
          </Provider>
        );

        await findByText("Fallback");
        // this is the div for the suspense boundary
        appendToBody`<div hidden id="S:0"><template id="P:1"></template><template id="P:2"></template></div>`;
        // request has finished on the server
        simulateRequestData(EVENT_DATA);
        simulateRequestData(EVENT_COMPLETE);
        // `Child` component wants to transport data from SSR render to the browser
        useStaticValueRefStub = () => ({ current: FIRST_HOOK_RESULT as any });
        // `Child` finishes rendering on the server
        appendToBody`<div hidden id="S:1"><div id="user">User</div></div>`;
        $RS("S:1", "P:1");

        await new Promise((resolve) => setTimeout(resolve, 10));
        // meanwhile, in the browser, the cache is modified
        client.cache.writeQuery({
          query: QUERY_ME,
          data: {
            me: "Future me.",
          },
        });

        // `ParallelSuspending` finishes rendering
        appendToBody`<div hidden id="S:2"><div id="parallel">suspending in parallel</div></div>`;
        $RS("S:2", "P:2");

        // everything in the suspense boundary finished rendering, so assemble HTML and take up React rendering again
        $RC("B:0", "S:0");

        // we expect the *new* value to appear after hydration finished, not the old value from the server
        await findByText("Future me.");

        // one render to rehydrate the server value
        // one rerender with the actual client value (which is hopefull equal)
        assert.deepStrictEqual(finishedRenders, [
          { me: "User" },
          { me: "Future me." },
        ]);

        assert.deepStrictEqual(JSON.parse(JSON.stringify(client.extract())), {
          ROOT_QUERY: {
            __typename: "Query",
            me: "Future me.",
          },
        });
        assert.equal(
          document.body.innerHTML,
          `<!--$--><div id="user">Future me.</div><div id="parallel">suspending in parallel</div><!--/$-->`
        );
      }
    );
  }
);

describe("document transforms are applied correctly", async () => {
  const untransformedQuery = gql`
    query Test {
      user {
        name
      }
    }
  `;
  const transformedQuery = gql`
    query Test {
      user {
        name
        __typename
        id
      }
    }
  `;
  const addIdTransform = new DocumentTransform((document) =>
    visit(document, {
      SelectionSet: {
        enter(node, _key, parent): undefined | typeof node {
          if (isDefinitionNode(parent as any)) return;
          return {
            ...node,
            selections: [
              ...node.selections,
              {
                kind: Kind.FIELD,
                name: {
                  kind: Kind.NAME,
                  value: "id",
                },
              },
            ],
          };
        },
      },
    })
  );
  test("when making a request", async () => {
    const link = new MockSubscriptionLink();
    const client = new ApolloClient({
      connectToDevTools: false,
      documentTransform: addIdTransform,
      cache: new InMemoryCache({
        addTypename: true,
      }),
      link,
    });
    const obsQuery = client.watchQuery({ query: untransformedQuery });
    obsQuery.subscribe({});
    await Promise.resolve();

    assert.equal(print(link.operation!.query), print(transformedQuery));
  });

  test(
    "when rerunning queries when connection is closed",
    { skip: outsideOf("browser") },
    async () => {
      const link = new MockSubscriptionLink();
      const client = new ApolloClient({
        connectToDevTools: false,
        documentTransform: addIdTransform,
        cache: new InMemoryCache({
          addTypename: true,
        }),
        link,
      });
      client.onQueryStarted!({
        type: "started",
        id: "1" as TransportIdentifier,
        options: serializeOptions({
          query: untransformedQuery,
        }),
      });
      client.rerunSimulatedQueries!();
      await Promise.resolve();

      assert.equal(print(link.operation!.query), print(transformedQuery));
    }
  );

  test(
    "when rerunning a query that failed on the server",
    { skip: outsideOf("browser") },
    async () => {
      const link = new MockSubscriptionLink();
      const client = new ApolloClient({
        connectToDevTools: false,
        documentTransform: addIdTransform,
        cache: new InMemoryCache({
          addTypename: true,
        }),
        link,
      });
      client.onQueryStarted!({
        type: "started",
        id: "1" as TransportIdentifier,
        options: serializeOptions({
          query: untransformedQuery,
        }),
      });
      client.onQueryProgress!({
        type: "error",
        id: "1" as TransportIdentifier,
      });
      await Promise.resolve();

      assert.equal(print(link.operation!.query), print(transformedQuery));
    }
  );
});
