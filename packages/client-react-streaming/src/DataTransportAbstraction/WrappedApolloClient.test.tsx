import React, { Suspense, useMemo } from "react";
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

runInConditions("browser", "node");

const {
  ApolloClient,
  InMemoryCache,
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
    const client = new ApolloClient({
      connectToDevTools: false,
      cache: new InMemoryCache(),
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
    // one render to rehydrate the server value
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
