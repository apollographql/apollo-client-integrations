import React, { Suspense, use, useMemo } from "react";
import { runInConditions, testIn } from "../util/runInConditions.js";
import type {
  Cache,
  TypedDocumentNode,
  WatchQueryOptions,
} from "@apollo/client/index.js";
import { gql } from "@apollo/client/index.js";

import "global-jsdom/register";
import assert from "node:assert";
import { afterEach } from "node:test";
import { getQueriesForElement } from "@testing-library/react";

runInConditions("browser", "node");

const {
  WrappedApolloClient,
  WrappedInMemoryCache,
  WrapApolloProvider,
  DataTransportContext,
  useSuspenseQuery,
} = await import("#bundled");
const { MockSubscriptionLink } = await import(
  "@apollo/client/testing/index.js"
);
const { render, cleanup } = await import("@testing-library/react");

afterEach(cleanup);

const QUERY_ME: TypedDocumentNode<{ me: string }> = gql`
  query {
    me
  }
`;
const FIRST_REQUEST: WatchQueryOptions = {
  fetchPolicy: "cache-first",
  nextFetchPolicy: undefined,
  notifyOnNetworkStatusChange: false,
  query: QUERY_ME,
};
const FIRST_RESULT = { me: "User" };
const FIRST_WRITE: Cache.WriteOptions = {
  dataId: "ROOT_QUERY",
  overwrite: false,
  query: QUERY_ME,
  result: FIRST_RESULT,
  variables: {},
};
const FIRST_HOOK_RESULT = {
  data: FIRST_RESULT,
  networkStatus: 7,
};

await testIn("node")(
  "`useSuspenseQuery`: data is getting sent to the transport",
  async () => {
    const startedRequests: unknown[] = [];
    const requestData: unknown[] = [];
    const staticData: unknown[] = [];

    function useStaticValueRef<T>(current: T) {
      staticData.push(current);
      return { current };
    }

    const Provider = WrapApolloProvider(
      ({
        children,
        registerDispatchRequestData,
        registerDispatchRequestStarted,
      }) => {
        registerDispatchRequestData!(requestData.push.bind(requestData));
        registerDispatchRequestStarted!(
          startedRequests.push.bind(startedRequests)
        );
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
    const client = new WrappedApolloClient({
      connectToDevTools: false,
      cache: new WrappedInMemoryCache(),
      link,
    });

    let finishedRenderCount = 0;

    function Child() {
      const { data } = useSuspenseQuery(QUERY_ME);
      finishedRenderCount++;
      return <>{data.me}</>;
    }

    const { findByText } = render(
      <Provider makeClient={() => client}>
        <Suspense fallback={"Fallback"}>
          <Child />
        </Suspense>
      </Provider>
    );

    assert.deepStrictEqual(startedRequests, [FIRST_REQUEST]);
    assert.deepStrictEqual(requestData, []);
    assert.deepStrictEqual(staticData, []);

    link.simulateResult({ result: { data: FIRST_RESULT } }, true);

    await findByText("User");

    assert.deepStrictEqual(requestData, [FIRST_WRITE]);
    assert.deepStrictEqual(startedRequests, [FIRST_REQUEST]);
    assert.deepStrictEqual(
      staticData,
      new Array(finishedRenderCount).fill(FIRST_HOOK_RESULT)
    );
  }
);

await testIn("browser")(
  "`useSuspenseQuery`: data from the transport is used by the hooks",
  async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
    let useStaticValueRefStub = <T extends unknown>(): { current: T } => {
      throw new Error("Should not be called yet!");
    };
    let simulateRequestStart: (options: WatchQueryOptions) => void;
    let simulateRequestData: (options: Cache.WriteOptions) => void;

    const Provider = WrapApolloProvider(
      ({ children, onRequestData, onRequestStarted, ..._rest }) => {
        simulateRequestStart = onRequestStarted!;
        simulateRequestData = onRequestData!;
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

    const client = new WrappedApolloClient({
      connectToDevTools: false,
      cache: new WrappedInMemoryCache(),
    });

    let attemptedRenderCount = 0;
    let finishedRenderCount = 0;

    function Child() {
      attemptedRenderCount++;
      const { data } = useSuspenseQuery(QUERY_ME);
      finishedRenderCount++;
      return <>{data.me}</>;
    }

    const { findByText, rerender } = render(
      <Provider makeClient={() => client}></Provider>
    );

    simulateRequestStart!(FIRST_REQUEST);
    rerender(
      <Provider makeClient={() => client}>
        <Suspense fallback={"Fallback"}>
          <Child />
        </Suspense>
      </Provider>
    );

    assert.ok(attemptedRenderCount > 0);
    assert.ok(finishedRenderCount == 0);
    await findByText("Fallback");

    useStaticValueRefStub = () => ({ current: FIRST_HOOK_RESULT as any });
    simulateRequestData!(FIRST_WRITE);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    await findByText("User");

    assert.ok(attemptedRenderCount > 0);
    // will try with server value and immediately restart with client value
    // one rerender with the actual client value (which is hopefull equal)
    assert.equal(finishedRenderCount, 2);

    assert.deepStrictEqual(JSON.parse(JSON.stringify(client.extract())), {
      ROOT_QUERY: {
        __typename: "Query",
        me: "User",
      },
    });
  }
);

const { hydrateRoot } = await import("react-dom/client");

// prettier-ignore
// @ts-ignore
function $RS(a, b) { a = document.getElementById(a); b = document.getElementById(b); for (a.parentNode.removeChild(a); a.firstChild;)b.parentNode.insertBefore(a.firstChild, b); b.parentNode.removeChild(b) }
// prettier-ignore
// @ts-ignore
function $RC(b, c, e = undefined) { c = document.getElementById(c); c.parentNode.removeChild(c); var a = document.getElementById(b); if (a) { b = a.previousSibling; if (e) b.data = "$!", a.setAttribute("data-dgst", e); else { e = b.parentNode; a = b.nextSibling; var f = 0; do { if (a && 8 === a.nodeType) { var d = a.data; if ("/$" === d) if (0 === f) break; else f--; else "$" !== d && "$?" !== d && "$!" !== d || f++ } d = a.nextSibling; e.removeChild(a); a = d } while (a); for (; c.firstChild;)e.insertBefore(c.firstChild, a); b.data = "$" } b._reactRetry && b._reactRetry() } }

function appendToBody(html: TemplateStringsArray) {
  document.body.insertAdjacentHTML("beforeend", html[0].trim());
}

await testIn("browser")(
  "race condition: client ahead of server renders without hydration mismatch",
  async () => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
    let useStaticValueRefStub = <T extends unknown>(): { current: T } => {
      throw new Error("Should not be called yet!");
    };

    const client = new WrappedApolloClient({
      connectToDevTools: false,
      cache: new WrappedInMemoryCache(),
    });
    const simulateRequestStart = client.onRequestStarted;
    const simulateRequestData = client.onRequestData;

    const Provider = WrapApolloProvider(
      ({ children, onRequestData, onRequestStarted, ..._rest }) => {
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

    let finishedRenders: any[] = [];

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

    document.body.innerHTML =
      '<!--$?--><template id="B:0"></template>Fallback<!--/$-->';
    simulateRequestStart!(FIRST_REQUEST);

    hydrateRoot(
      document.body,
      <Provider makeClient={() => client}>
        <Suspense fallback={"Fallback"}>
          <Child />
          <ParallelSuspending />
        </Suspense>
      </Provider>
    );

    await findByText("Fallback");

    appendToBody`<div hidden id="S:0"><template id="P:1"></template><template id="P:2"></template></div>`;
    simulateRequestData!(FIRST_WRITE);
    useStaticValueRefStub = () => ({ current: FIRST_HOOK_RESULT as any });
    appendToBody`<div hidden id="S:1"><div id="user">User</div></div>`;
    $RS("S:1", "P:1");

    client.cache.writeQuery({
      query: QUERY_ME,
      data: {
        me: "Future me.",
      },
    });

    appendToBody`<div hidden id="S:2"><div id="parallel">suspending in parallel</div></div>`;

    $RS("S:2", "P:2");
    $RC("B:0", "S:0");

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
