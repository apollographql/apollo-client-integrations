import * as assert from "node:assert";
import { test } from "node:test";
import { outsideOf } from "@internal/test-utils/runInConditions.js";
import { renderStreamEnv } from "@internal/test-utils/react.js";
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
        'When using `InMemoryCache` in streaming SSR, you must use the `InMemoryCache` export provided by `"@apollo/client-integration-tanstack-start"`.',
    }
  );
});

test(
  "Error message when using the wrong `ApolloClient`",
  { skip: outsideOf("node") },
  async () => {
    globalThis.window = {} as any;
    const { routerWithApolloClient, ...bundled } = await import("#bundled");
    const tsr = await import("@tanstack/react-router");
    const tss = await import("@tanstack/start/server");
    const React = await import("react");

    const { ErrorBoundary } = await import("react-error-boundary");

    const routeTree = tsr
      .createRootRouteWithContext<
        import("@apollo/client-integration-tanstack-start").ApolloClientRouterContext
      >()({
        component: () => <></>,
      })
      .addChildren({});

    await test("@apollo/client should error", async () => {
      const { ApolloClient, InMemoryCache, HttpLink } = await import(
        "@apollo/client"
      );
      using env = await renderStreamEnv();
      // Even with an error Boundary, React will still log to `console.error` - we avoid the noise here.
      using _restoreConsole = silenceConsoleErrors();
      const router = routerWithApolloClient(
        tsr.createRouter({
          routeTree,
          context: {} as any,
        }),
        // @ts-expect-error deliberately using the wrong class here
        new ApolloClient({
          cache: new InMemoryCache(),
          link: new HttpLink({ uri: "/api/graphql" }),
        })
      );
      const stream = env.createRenderStream();
      const promise = new Promise((_, reject) => {
        stream.render(
          <ErrorBoundary onError={reject} fallback={<></>}>
            <tss.StartServer router={router as any} />
          </ErrorBoundary>
        );
      });
      await assert.rejects(promise, {
        message:
          'When using `ApolloClient` in streaming SSR, you must use the `ApolloClient` export provided by `"@apollo/client-integration-tanstack-start"`.',
      });
    });

    await test("this package should work", async () => {
      const { ApolloClient, InMemoryCache } = bundled;
      const { HttpLink } = await import("@apollo/client");
      using env = await renderStreamEnv();
      const router = routerWithApolloClient(
        tsr.createRouter({
          routeTree,
          context: {} as any,
        }),
        new ApolloClient({
          cache: new InMemoryCache(),
          link: new HttpLink({ uri: "/api/graphql" }),
        })
      );
      const stream = env.createRenderStream();
      await stream.render(<tss.StartServer router={router as any} />);
      await stream.takeRender();
    });
  }
);
