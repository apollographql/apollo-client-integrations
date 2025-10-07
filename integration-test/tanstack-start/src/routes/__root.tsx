/// <reference types="vite/client" />
import {
  HeadContent,
  Link,
  Scripts,
  createRootRouteWithContext,
  Outlet,
} from "@tanstack/react-router";

import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useState, type ReactNode } from "react";

import type { ApolloClientIntegration } from "@apollo/client-integration-tanstack-start";

export const Route =
  createRootRouteWithContext<ApolloClientIntegration.RouterContext>()({
    head: () => ({
      meta: [
        {
          charSet: "utf-8",
        },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        {
          title: "TanStack Start Starter",
        },
      ],
    }),
    component: RootComponent,
  });

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <div className="p-2 flex gap-2 text-lg">
          <Link
            to="/"
            activeProps={{
              className: "font-bold",
            }}
            activeOptions={{ exact: true }}
          >
            Home
          </Link>{" "}
          <Link
            to="/loader-defer"
            activeProps={{
              className: "font-bold",
            }}
          >
            Loader with @defer + useReadQuery
          </Link>{" "}
          <Link
            to="/useSuspenseQuery"
            activeProps={{
              className: "font-bold",
            }}
            search={{ errorLevel: undefined }}
          >
            useSuspenseQuery
          </Link>{" "}
          <button onClick={() => setDevToolsOpen((open) => !open)}>
            Toggle DevTools
          </button>
        </div>
        <hr />
        {children}
        {devToolsOpen && <TanStackRouterDevtools position="bottom-right" />}
        <Scripts />
      </body>
    </html>
  );
}
