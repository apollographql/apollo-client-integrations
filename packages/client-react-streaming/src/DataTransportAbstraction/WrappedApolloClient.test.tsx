import React, { Suspense, use, useMemo } from "react";
import { outsideOf } from "@internal/test-utils/runInConditions.js";
import assert from "node:assert";
import test, { afterEach, describe } from "node:test";
import type {
  ProgressEvent,
  QueryEvent,
  TransportIdentifier,
} from "./DataTransportAbstraction.js";

import type { TypedDocumentNode } from "@apollo/client";
import { MockSubscriptionLink } from "@apollo/client/testing";
import { gql, DocumentTransform, ApolloLink } from "@apollo/client";
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
      dataState: "complete",
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
          devtools: { enabled: false },
          cache: new InMemoryCache(),
          link: ApolloLink.empty(),
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
          devtools: { enabled: false },
          cache: new InMemoryCache(),
          link: ApolloLink.empty(),
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

        // at this point, the server value has tried to render twice
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert.deepStrictEqual(finishedRenders, [
          { me: "User" },
          { me: "User" },
        ]);

        // meanwhile, in the browser, the cache is modified
        client.cache.writeQuery({
          query: QUERY_ME,
          data: {
            me: "Future me.",
          },
        });

        // component already reruns the render function
        await new Promise((resolve) => setTimeout(resolve, 20));
        assert.deepStrictEqual(finishedRenders, [
          { me: "User" },
          { me: "User" },
          { me: "Future me." },
        ]);

        // `ParallelSuspending` finishes rendering
        appendToBody`<div hidden id="S:2"><div id="parallel">suspending in parallel</div></div>`;
        $RS("S:2", "P:2");

        // everything in the suspense boundary finished rendering, so assemble HTML and take up React rendering again
        $RC("B:0", "S:0");

        // we expect the *new* value to appear after hydration finished, not the old value from the server
        await findByText("Future me.");

        // no more renders happened
        assert.deepStrictEqual(finishedRenders, [
          { me: "User" },
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
          `<div id="user">Future me.</div><div id="parallel">suspending in parallel</div>`
        );
      }
    );

    /**
     * Runs the transported-query flow of the "race condition" test above in
     * a plain client render (the hydration aspects are covered there), but
     * lets the caller choose when the browser writes a newer value to the
     * cache relative to the late-arriving transported server result.
     */
    async function runLateTransportScenario(
      writeMoment: "before-transport" | "after-transport"
    ) {
      const { createRoot } = await import("react-dom/client");
      // render into an own container so the scenarios don't collide with
      // the `document.body` hydration of the test above or each other
      const container = document.body.appendChild(
        document.createElement("div")
      );

      const mockLink = new MockSubscriptionLink();
      let requestCount = 0;
      const link = new ApolloLink((operation, forward) => {
        requestCount++;
        return forward(operation);
      }).concat(mockLink);

      const client = new ApolloClient({
        devtools: { enabled: false },
        cache: new InMemoryCache(),
        link,
      });
      const simulateRequestStart = client.onQueryStarted!;
      const simulateRequestData = client.onQueryProgress!;

      const Provider = WrapApolloProvider(({ children }) => {
        return (
          <DataTransportContext.Provider
            value={useMemo(
              () => ({
                useStaticValueRef: (value: any) => ({ current: value }),
              }),
              []
            )}
          >
            {children}
          </DataTransportContext.Provider>
        );
      });

      function Child() {
        const { data } = useSuspenseQuery(QUERY_ME);
        return <div id="user">{data.me}</div>;
      }

      // request started on the server; the browser simulates it, waiting on
      // the transported stream
      simulateRequestStart(
        EVENT_STARTED as Extract<QueryEvent, { type: "started" }>
      );

      // the component deduplicates onto the simulated query and suspends
      const root = createRoot(container);
      await act(async () => {
        root.render(
          <Provider makeClient={() => client}>
            <Suspense fallback={"Fallback"}>
              <Child />
            </Suspense>
          </Provider>
        );
      });

      const writeNewerClientValue = () =>
        client.cache.writeQuery({
          query: QUERY_ME,
          data: { me: "Future me." },
        });

      // in this ordering, the browser writes newer data (think: a mutation
      // result) while the transported result is still in flight
      if (writeMoment === "before-transport") writeNewerClientValue();

      // the transported (by now stale) server result arrives late
      simulateRequestData(EVENT_DATA as ProgressEvent);
      simulateRequestData(EVENT_COMPLETE as ProgressEvent);
      await new Promise((resolve) => setTimeout(resolve, 20));

      // this ordering is already covered by the "race condition" test above
      if (writeMoment === "after-transport") writeNewerClientValue();
      await new Promise((resolve) => setTimeout(resolve, 20));

      const cacheBeforeNetworkResponse = JSON.parse(
        JSON.stringify(client.extract())
      );

      // if the query was rerouted to the network, serve fresh data
      if (requestCount > 0) {
        mockLink.simulateResult(
          { result: { data: { me: "Fresh me." } } },
          true
        );
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      // in the "before" ordering, wait for the rerun's fresh result to reach
      // the UI through the suspended query's stream; on a timeout,
      // `renderedText` keeps whatever the UI was stuck on
      let renderedText: string | null = null;
      if (writeMoment === "before-transport") {
        for (let i = 0; i < 300 && renderedText !== "Fresh me."; i++) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          renderedText = container.querySelector("#user")?.textContent ?? null;
        }
      }
      root.unmount();
      container.remove();

      return {
        requestCount,
        cacheBeforeNetworkResponse,
        finalCache: JSON.parse(JSON.stringify(client.extract())),
        renderedText,
      };
    }

    test(
      "late transported result: client writing after the transport resolved does not cause a refetch",
      { skip: outsideOf("browser") },
      async () => {
        const { requestCount, finalCache } =
          await runLateTransportScenario("after-transport");
        assert.equal(requestCount, 0);
        assert.deepStrictEqual(finalCache, {
          ROOT_QUERY: { __typename: "Query", me: "Future me." },
        });
        // (that the newer client value reaches the UI in this ordering is
        // asserted by the "race condition" test above)
      }
    );

    test(
      "late transported result does not overwrite a newer client cache write, but refetches in the browser",
      { skip: outsideOf("browser") },
      async () => {
        const {
          requestCount,
          cacheBeforeNetworkResponse,
          finalCache,
          renderedText,
        } = await runLateTransportScenario("before-transport");
        // the stale transported snapshot never landed in the cache
        assert.deepStrictEqual(cacheBeforeNetworkResponse, {
          ROOT_QUERY: { __typename: "Query", me: "Future me." },
        });
        // instead, the query was rerun against the network exactly once
        assert.equal(requestCount, 1);
        // and the cache converged to the fresh server data
        assert.deepStrictEqual(finalCache, {
          ROOT_QUERY: { __typename: "Query", me: "Fresh me." },
        });
        // ... which also reached the UI: the query suspended on the
        // transported stream received the rerun's result through it
        assert.equal(renderedText, "Fresh me.");
      }
    );
  }
);

describe(
  "transported results vs. newer cache data",
  { skip: outsideOf("browser") },
  () => {
    const QUERY_FULL: TypedDocumentNode<{ me: string; email: string }> = gql`
      query {
        me
        email
      }
    `;
    const QUERY_PARTIAL: TypedDocumentNode<{ me: string }> = gql`
      query {
        me
      }
    `;
    const tick = () => new Promise((resolve) => setTimeout(resolve, 10));

    function setup() {
      const mockLink = new MockSubscriptionLink();
      let requestCount = 0;
      const client = new ApolloClient({
        devtools: { enabled: false },
        cache: new InMemoryCache(),
        link: new ApolloLink((operation, forward) => {
          requestCount++;
          return forward(operation);
        }).concat(mockLink),
      });
      const started = (id: string, query: TypedDocumentNode<any>) =>
        client.onQueryStarted!({
          type: "started",
          id: id as TransportIdentifier,
          options: serializeOptions({ query }),
        });
      const next = (id: string, data: Record<string, unknown>) =>
        client.onQueryProgress!({
          type: "next",
          id: id as TransportIdentifier,
          value: { data },
        } as ProgressEvent);
      const completed = (id: string) =>
        client.onQueryProgress!({
          type: "completed",
          id: id as TransportIdentifier,
        });
      const extract = () => JSON.parse(JSON.stringify(client.extract()));
      return {
        client,
        mockLink,
        getRequestCount: () => requestCount,
        started,
        next,
        completed,
        extract,
      };
    }

    test("a sibling transported query's write is not treated as newer data", async () => {
      const { started, next, completed, extract, getRequestCount } = setup();
      started("1", QUERY_FULL);
      started("2", QUERY_PARTIAL);

      next("1", { me: "User", email: "user@example.com" });
      completed("1");
      // let the first query's transported result land in the cache
      await tick();

      // the second query's data is now fully contained in the cache — but it
      // was written by the transport itself, so this is not a conflict
      next("2", { me: "User" });
      completed("2");
      await tick();

      assert.equal(getRequestCount(), 0);
      assert.deepStrictEqual(extract(), {
        ROOT_QUERY: {
          __typename: "Query",
          me: "User",
          email: "user@example.com",
        },
      });
    });

    test("a restored persisted cache is not treated as newer data", async () => {
      const { client, started, next, completed, extract, getRequestCount } =
        setup();
      // a cache persistence library restores an (older) snapshot before
      // hydration
      client.cache.restore({
        ROOT_QUERY: { __typename: "Query", me: "Persisted (old)" },
      });

      started("1", QUERY_PARTIAL);
      next("1", { me: "From server" });
      completed("1");
      await tick();

      // the transported result is newer than the persisted snapshot and must
      // still be applied, without a spurious refetch
      assert.equal(getRequestCount(), 0);
      assert.deepStrictEqual(extract(), {
        ROOT_QUERY: { __typename: "Query", me: "From server" },
      });
    });

    test("a client write covering only part of the query is still protected", async () => {
      const {
        client,
        mockLink,
        started,
        next,
        completed,
        extract,
        getRequestCount,
      } = setup();
      started("1", QUERY_FULL);

      // a mutation result / writeQuery updates only one of the query's
      // fields while the transported result is in flight
      client.cache.writeQuery({
        query: QUERY_PARTIAL,
        data: { me: "Newer client value" },
      });

      next("1", { me: "Old server value", email: "old@example.com" });
      completed("1");
      await tick();

      // the stale transported result was not written...
      assert.deepStrictEqual(extract(), {
        ROOT_QUERY: { __typename: "Query", me: "Newer client value" },
      });
      // ...instead the query was rerun against the network
      assert.equal(getRequestCount(), 1);
      mockLink.simulateResult(
        { result: { data: { me: "Fresh", email: "fresh@example.com" } } },
        true
      );
      await tick();
      assert.deepStrictEqual(extract(), {
        ROOT_QUERY: {
          __typename: "Query",
          me: "Fresh",
          email: "fresh@example.com",
        },
      });
    });

    test("writes landing after the first chunk do not abort the stream", async () => {
      const { client, started, next, completed, extract, getRequestCount } =
        setup();
      started("1", QUERY_PARTIAL);

      next("1", { me: "chunk 1" });
      await tick();

      // a client write between two chunks of a multi-chunk response is not
      // protected (documented limitation) — but it must not cause the
      // stream to be aborted and rerun mid-flight either
      client.cache.writeQuery({
        query: QUERY_PARTIAL,
        data: { me: "Client value" },
      });

      next("1", { me: "chunk 2" });
      completed("1");
      await tick();

      assert.equal(getRequestCount(), 0);
      assert.deepStrictEqual(extract(), {
        ROOT_QUERY: { __typename: "Query", me: "chunk 2" },
      });
    });
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
      devtools: { enabled: false },
      documentTransform: addIdTransform,
      cache: new InMemoryCache({}),
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
        devtools: { enabled: false },
        documentTransform: addIdTransform,
        cache: new InMemoryCache({}),
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
        devtools: { enabled: false },
        documentTransform: addIdTransform,
        cache: new InMemoryCache({}),
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
