import * as assert from "node:assert";
import { test } from "node:test";
import { outsideOf } from "@internal/test-utils/runInConditions.js";
import { silenceConsoleErrors } from "@internal/test-utils/console.js";
import type { AnyRouter } from "@tanstack/router-core";

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
    const React = await import("react");

    const routeTree = tsr
      .createRootRouteWithContext<
        import("@apollo/client-integration-tanstack-start").ApolloClientIntegration.RouterContext
      >()({
        component: () => <></>,
      })
      .addChildren({});

    await test("@apollo/client should error", async () => {
      const { ApolloClient, InMemoryCache, HttpLink } = await import(
        "@apollo/client"
      );
      const { renderToString } = await import("react-dom/server");
      // Even with an error Boundary, React will still log to `console.error` - we avoid the noise here.
      using _restoreConsole = silenceConsoleErrors();
      const router = routerWithApolloClient(
        tsr.createRouter({
          routeTree,
          isServer: true,
          context: { ...routerWithApolloClient.defaultContext },
        }),
        // @ts-expect-error deliberately using the wrong class here
        new ApolloClient({
          cache: new InMemoryCache(),
          link: new HttpLink({ uri: "/api/graphql" }),
        })
      );

      const InnerWrap = router.options.InnerWrap!;
      assert.throws(() => renderToString(<InnerWrap>{""}</InnerWrap>), {
        message:
          'When using `ApolloClient` in streaming SSR, you must use the `ApolloClient` export provided by `"@apollo/client-integration-tanstack-start"`.',
      });
    });

    await test("this package should work", async () => {
      const { ApolloClient, InMemoryCache } = bundled;
      const { HttpLink } = await import("@apollo/client");
      await renderStartToString(
        routerWithApolloClient(
          tsr.createRouter({
            routeTree,
            isServer: true,
            context: { ...routerWithApolloClient.defaultContext },
          }),
          new ApolloClient({
            cache: new InMemoryCache(),
            link: new HttpLink({ uri: "/api/graphql" }),
          })
        )
      );
    });
  }
);

async function renderStartToString(
  router: AnyRouter,
  Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => children
) {
  const React = await import("react");
  const tss = await import("@tanstack/react-start/server");
  const { createRequestHandler, renderRouterToString } = await import(
    "@tanstack/react-router/ssr/server"
  );
  const createRouter = () => router;
  const request = new Request("http://localhost/");
  const handler = createRequestHandler({
    createRouter,
    request,
  });
  return handler(({ responseHeaders, router }) =>
    renderRouterToString({
      responseHeaders,
      router,
      children: (
        <Wrapper>
          <tss.StartServer router={router} />
        </Wrapper>
      ),
    })
  );
}
