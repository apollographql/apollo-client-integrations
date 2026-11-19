import React, { StrictMode, Suspense, use } from "react";
import { outsideOf } from "@internal/test-utils/runInConditions.js";
import assert from "node:assert";
import test, { afterEach, describe } from "node:test";

describe(
  "ManualDataTransport in the browser",
  { skip: outsideOf("browser") },
  async () => {
    // @ts-expect-error seems to have a wrong type?
    await import("global-jsdom/register");
    const { renderToString } = await import("react-dom/server");
    const { hydrateRoot } = await import("react-dom/client");
    const { DataTransportContext } = await import("#bundled");
    const { buildManualDataTransport, resetManualSSRApolloSingletons } =
      await import("#bundled/manual-transport");

    afterEach(resetManualSSRApolloSingletons);

    const cacheKey = Symbol.for("apollo.hookRehydrationCache");
    const ManualDataTransport = buildManualDataTransport({
      useInsertHtml: () => () => {},
    });

    test(
      "a hydration render that React throws away and runs again still gets the server value",
      { timeout: 5000 },
      async () => {
        let suspendUntil: Promise<void> | undefined;
        let onSuspended = () => {};
        let onCommitted = () => {};

        function Reader({ value }: { value: string }) {
          const ref = use(DataTransportContext)!.useStaticValueRef(value);
          React.useEffect(() => onCommitted(), []);
          return <p>{ref.current}</p>;
        }
        // Suspends after `Reader` has read its value, so React throws that
        // hydration render away and renders the boundary again later.
        function Sibling() {
          if (suspendUntil) {
            onSuspended();
            throw suspendUntil;
          }
          return <p>sibling</p>;
        }
        function App({ value }: { value: string }) {
          return (
            <StrictMode>
              <ManualDataTransport
                onQueryEvent={() => {}}
                rerunSimulatedQueries={() => {}}
              >
                <Suspense fallback="loading">
                  <Reader value={value} />
                  <Sibling />
                </Suspense>
              </ManualDataTransport>
            </StrictMode>
          );
        }

        // "server" render: the HTML, and the `useId` key `Reader` reads from
        const keys: string[] = [];
        (window as any)[cacheKey] = new Proxy(
          {},
          { has: (_, key) => (keys.push(String(key)), false) }
        );
        const html = renderToString(<App value="server value" />);
        assert.deepStrictEqual(new Set(keys).size, 1);
        resetManualSSRApolloSingletons();

        // browser: the transported values are waiting in the cache
        const cache: Record<string, unknown> = {
          [keys[0]]: "server value",
          "value of another component": "untouched",
        };
        (window as any)[cacheKey] = cache;
        document.body.innerHTML = html;

        let resume!: () => void;
        suspendUntil = new Promise<void>((resolve) => (resume = resolve));
        const suspended = new Promise<void>(
          (resolve) => (onSuspended = resolve)
        );
        const committed = new Promise<void>(
          (resolve) => (onCommitted = resolve)
        );
        const errors: unknown[] = [];
        const root = hydrateRoot(document.body, <App value="client value" />, {
          onRecoverableError: (error) => errors.push(error),
        });

        // `Reader` has read its value and the hydration render was thrown away
        await suspended;
        suspendUntil = undefined;
        resume();
        // the boundary is hydrated (or, on a mismatch, rendered on the client)
        // and its effects have run
        await committed;

        assert.deepStrictEqual(errors, []);
        assert.equal(
          document.body.innerHTML,
          "<!--$--><p>server value</p><p>sibling</p><!--/$-->"
        );
        // the value is removed once the render that read it has been committed
        assert.deepStrictEqual(cache, {
          "value of another component": "untouched",
        });
        root.unmount();
      }
    );
  }
);
