import assert from "node:assert";
import { test } from "node:test";
import { outsideOf } from "@internal/test-utils/runInConditions.js";
import { browserEnv } from "@internal/test-utils/react.js";
import { silenceConsoleErrors } from "@internal/test-utils/console.js";
import { ApolloLink } from "@apollo/client";

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
        'When using `InMemoryCache` in streaming SSR, you must use the `InMemoryCache` export provided by `"@apollo/client-react-streaming"`.',
    }
  );
});

test(
  "Error message when using `ManualDataTransport` with the wrong `ApolloClient`",
  { skip: outsideOf("node") },
  async () => {
    const { WrapApolloProvider, ...bundled } = await import("#bundled");
    const React = await import("react");
    const { renderToString } = await import("react-dom/server");

    function FakeTransport({ children }: { children: any }) {
      return children;
    }
    const Provider = WrapApolloProvider(FakeTransport);

    await test("@apollo/client should error", async () => {
      const upstreamPkg = await import("@apollo/client");
      assert.throws(
        () =>
          renderToString(
            <Provider
              makeClient={() =>
                // @ts-expect-error we want to test exactly this
                new upstreamPkg.ApolloClient({
                  cache: new upstreamPkg.InMemoryCache(),
                })
              }
            >
              {null}
            </Provider>
          ),
        {
          message:
            'When using `ApolloClient` in streaming SSR, you must use the `ApolloClient` export provided by `"@apollo/client-react-streaming"`.',
        }
      );
    });
    await test("this package should work", async () => {
      renderToString(
        <Provider
          makeClient={() =>
            new bundled.ApolloClient({
              cache: new bundled.InMemoryCache(),
              link: ApolloLink.empty(),
            })
          }
        >
          {null}
        </Provider>
      );
    });
  }
);

test(
  "Error message when using `ApolloNextAppProvider` with the wrong `ApolloClient`",
  { skip: outsideOf("browser") },
  async () => {
    const { WrapApolloProvider, ...bundled } = await import("#bundled");

    const React = await import("react");
    function FakeTransport({ children }: { children: any }) {
      return children;
    }
    const Provider = WrapApolloProvider(FakeTransport);
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
            <Provider
              makeClient={() =>
                // @ts-expect-error we want to test exactly this
                new upstreamPkg.ApolloClient({
                  cache: new upstreamPkg.InMemoryCache(),
                  devtools: { enabled: false },
                })
              }
            >
              {null}
            </Provider>
          </ErrorBoundary>
        );
      });
      await assert.rejects(promise, {
        message:
          'When using `ApolloClient` in streaming SSR, you must use the `ApolloClient` export provided by `"@apollo/client-react-streaming"`.',
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
            <Provider
              makeClient={() =>
                new bundled.ApolloClient({
                  cache: new bundled.InMemoryCache(),
                  devtools: { enabled: false },
                  link: ApolloLink.empty(),
                })
              }
            >
              {<Child />}
            </Provider>
          </ErrorBoundary>
        );
      });
      // correct usage, should not throw
      await promise;
    });
  }
);
