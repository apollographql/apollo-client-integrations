import * as assert from "node:assert";
import { test } from "node:test";
import { outsideOf } from "@internal/test-utils/runInConditions.js";
import { browserEnv } from "@internal/test-utils/react.js";
import { silenceConsoleErrors } from "@internal/test-utils/console.js";

test("Error message when `WrappedApolloClient` is instantiated with wrong `InMemoryCache`", async () => {
  const { ApolloClient } = await import("#bundled");
  const upstreamPkg = await import("@apollo/client");
  assert.throws(
    () =>
      new ApolloClient({
        // @ts-expect-error this is what we're testing
        cache: new upstreamPkg.InMemoryCache(),
        connectToDevTools: false,
      }),
    {
      message:
        'When using `InMemoryCache` in streaming SSR, you must use the `InMemoryCache` export provided by `"@apollo/client-integration-nextjs"`.',
    }
  );
});

test(
  "Error message when using `ApolloNextAppProvider` with the wrong `ApolloClient`",
  { skip: outsideOf("node") },
  async () => {
    const { ApolloNextAppProvider, ...bundled } = await import("#bundled");
    const { ServerInsertedHTMLContext } = await import("next/navigation.js");
    const React = await import("react");
    const { renderToString } = await import("react-dom/server");
    await test("@apollo/client should error", async () => {
      const upstreamPkg = await import("@apollo/client");
      assert.throws(
        () =>
          renderToString(
            <ServerInsertedHTMLContext.Provider value={() => {}}>
              <ApolloNextAppProvider
                makeClient={() =>
                  // @ts-expect-error we want to test exactly this
                  new upstreamPkg.ApolloClient({
                    cache: new upstreamPkg.InMemoryCache(),
                  })
                }
              >
                {null}
              </ApolloNextAppProvider>
            </ServerInsertedHTMLContext.Provider>
          ),
        {
          message:
            'When using `ApolloClient` in streaming SSR, you must use the `ApolloClient` export provided by `"@apollo/client-integration-nextjs"`.',
        }
      );
    });
    await test("@apollo/client-react-streaming should error", async () => {
      const streamingPkg = await import("@apollo/client-react-streaming");
      assert.throws(
        () =>
          renderToString(
            <ServerInsertedHTMLContext.Provider value={() => {}}>
              <ApolloNextAppProvider
                makeClient={() =>
                  new streamingPkg.ApolloClient({
                    cache: new streamingPkg.InMemoryCache(),
                  })
                }
              >
                {null}
              </ApolloNextAppProvider>
            </ServerInsertedHTMLContext.Provider>
          ),
        {
          message:
            'When using `ApolloClient` in streaming SSR, you must use the `ApolloClient` export provided by `"@apollo/client-integration-nextjs"`.',
        }
      );
    });
    await test("this package should work", async () => {
      renderToString(
        <ServerInsertedHTMLContext.Provider value={() => {}}>
          <ApolloNextAppProvider
            makeClient={() =>
              new bundled.ApolloClient({
                cache: new bundled.InMemoryCache(),
              })
            }
          >
            {null}
          </ApolloNextAppProvider>
        </ServerInsertedHTMLContext.Provider>
      );
    });
  }
);

test(
  "Error message when using `ApolloNextAppProvider` with the wrong `ApolloClient`",
  { skip: outsideOf("browser") },
  async () => {
    const { ApolloNextAppProvider, ...bundled } = await import("#bundled");
    const React = await import("react");

    const { ErrorBoundary } = await import("react-error-boundary");
    // Even with an error Boundary, React will still log to `console.error` - we avoid the noise here.
    using _restoreConsole = silenceConsoleErrors();

    await test("@apollo/client should error", async () => {
      await using env = await browserEnv();
      const upstreamPkg = await import("@apollo/client");
      const promise = new Promise((_resolve, reject) => {
        env.render(
          document.body,
          <ErrorBoundary onError={reject} fallback={<></>}>
            <ApolloNextAppProvider
              makeClient={() =>
                // @ts-expect-error we want to test exactly this
                new upstreamPkg.ApolloClient({
                  cache: new upstreamPkg.InMemoryCache(),
                  connectToDevTools: false,
                })
              }
            >
              {null}
            </ApolloNextAppProvider>
          </ErrorBoundary>
        );
      });
      await assert.rejects(promise, {
        message:
          'When using `ApolloClient` in streaming SSR, you must use the `ApolloClient` export provided by `"@apollo/client-integration-nextjs"`.',
      });
    });
    await test("@apollo/client-react-streaming should error", async () => {
      await using env = await browserEnv();
      const streamingPkg = await import("@apollo/client-react-streaming");
      const promise = new Promise((_resolve, reject) => {
        env.render(
          document.body,
          <ErrorBoundary onError={reject} fallback={<></>}>
            <ApolloNextAppProvider
              makeClient={() =>
                new streamingPkg.ApolloClient({
                  cache: new streamingPkg.InMemoryCache(),
                  connectToDevTools: false,
                })
              }
            >
              {null}
            </ApolloNextAppProvider>
          </ErrorBoundary>
        );
      });
      await assert.rejects(promise, {
        message:
          'When using `ApolloClient` in streaming SSR, you must use the `ApolloClient` export provided by `"@apollo/client-integration-nextjs"`.',
      });
    });
    await test("this package should work", async () => {
      await using env = await browserEnv();
      const promise = new Promise<void>((resolve, reject) => {
        function Child() {
          resolve();
          return null;
        }
        env.render(
          document.body,
          <ErrorBoundary onError={reject} fallback={<></>}>
            <ApolloNextAppProvider
              makeClient={() =>
                new bundled.ApolloClient({
                  cache: new bundled.InMemoryCache(),
                  connectToDevTools: false,
                })
              }
            >
              {<Child />}
            </ApolloNextAppProvider>
          </ErrorBoundary>
        );
      });
      // correct usage, should not throw
      await promise;
    });
  }
);
