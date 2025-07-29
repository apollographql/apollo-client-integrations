import React, { useCallback, useEffect, useId, useMemo, useRef } from "react";
import type { DataTransportProviderImplementation } from "@apollo/client-react-streaming";
import { DataTransportContext } from "@apollo/client-react-streaming";
import type { RehydrationCache, RehydrationContextValue } from "./types.js";
import type { HydrationContextOptions } from "./RehydrationContext.js";
import { buildApolloRehydrationContext } from "./RehydrationContext.js";
import { registerDataTransport } from "./dataTransport.js";
import { revive, stringify } from "./serialization.js";
import { ApolloHookRehydrationCache } from "./ApolloRehydrateSymbols.js";

interface ManualDataTransportOptions {
  /**
   * A hook that allows for insertion into the stream.
   * Will only be called during SSR, doesn't need to actiually return something otherwise.
   */
  useInsertHtml(): (callbacks: () => React.ReactNode) => void;
  /**
   * Prepare data for injecting into the stream by converting it into a string that can be parsed as JavaScript by the browser.
   * Could e.g. be `SuperJSON.stringify` or `serialize-javascript`.
   * The default implementation act like a JSON.stringify that preserves `undefined`, but not do much on top of that.
   */
  stringifyForStream?: (value: any) => string;
  /**
   * If necessary, additional deserialization steps that need to be applied on top of executing the result of `stringifyForStream` in the browser.
   * Could e.g. be `SuperJSON.deserialize`. (Not needed in the case of using `serialize-javascript`)
   */
  reviveFromStream?: (value: any) => any;
  /**
   * **Read the whole comment before using this option!**
   *
   * If `true`, the `useStaticValueRef` hook will not transport values over to the client.
   * This hook is used to transport the values of hook calls during SSR to the client, to ensure that
   * the client will rehydrate with the exact same values as it rendered on the server.
   *
   * This mechanism is in place to prevent hydration mismatches as described in
   * https://github.com/apollographql/apollo-client-integrations/blob/pr/RFC-2/RFC.md#challenges-of-a-client-side-cache-in-streaming-ssr
   * (first graph of the "Challenges of a client-side cache in streaming SSR" section).
   *
   * Setting this value to `true` will save on data transported over the wire, but comes with the risk
   * of hydration mismatches.
   * Strongly discouraged with older React versions, as hydration mismatches there will likely crash
   * the application, setting this to `true` might be okay with React 19, which is much better at recovering
   * from hydration mismatches - but it still comes with a risk.
   * When enabling this, you should closely monitor error reporting and user feedback.
   */
  dangerous_disableHookValueTransportation?: boolean;
}

const buildManualDataTransportSSRImpl = ({
  useInsertHtml,
  stringifyForStream = stringify,
  dangerous_disableHookValueTransportation: disableHookValueTransportation,
}: ManualDataTransportOptions): DataTransportProviderImplementation<HydrationContextOptions> =>
  function ManualDataTransportSSRImpl({
    extraScriptProps,
    children,
    registerDispatchRequestStarted,
  }) {
    const insertHtml = useInsertHtml();

    const rehydrationContext = useRef<RehydrationContextValue>(undefined);
    if (!rehydrationContext.current) {
      rehydrationContext.current = buildApolloRehydrationContext({
        insertHtml,
        extraScriptProps,
        stringify: stringifyForStream,
      });
    }

    registerDispatchRequestStarted!(({ event, observable }) => {
      rehydrationContext.current!.incomingEvents.push(event);
      observable.subscribe({
        next(event) {
          rehydrationContext.current!.incomingEvents.push(event);
        },
      });
    });

    const contextValue = useMemo(
      () => ({
        useStaticValueRef: function useStaticValueRef<T>(value: T) {
          const id = useId();
          if (!disableHookValueTransportation) {
            rehydrationContext.current!.transportValueData[id] = value;
          }
          return { current: value };
        },
      }),
      []
    );

    return (
      <DataTransportContext.Provider value={contextValue}>
        {children}
      </DataTransportContext.Provider>
    );
  };

const buildManualDataTransportBrowserImpl = ({
  reviveFromStream = revive,
}: ManualDataTransportOptions): DataTransportProviderImplementation<HydrationContextOptions> =>
  function ManualDataTransportBrowserImpl({
    children,
    onQueryEvent,
    rerunSimulatedQueries,
  }) {
    const hookRehydrationCache = useRef<RehydrationCache>(
      (window[ApolloHookRehydrationCache] ??= {})
    );
    registerDataTransport({
      onQueryEvent: onQueryEvent!,
      onRehydrate(rehydrate) {
        Object.assign(hookRehydrationCache.current, rehydrate);
      },
      revive: reviveFromStream,
    });

    useEffect(() => {
      if (document.readyState !== "complete") {
        // happens simulatenously to `readyState` changing to `"complete"`, see
        // https://html.spec.whatwg.org/multipage/parsing.html#the-end (step 9.1 and 9.5)
        window.addEventListener("load", rerunSimulatedQueries!, {
          once: true,
        });
        return () => window.removeEventListener("load", rerunSimulatedQueries!);
      } else {
        rerunSimulatedQueries!();
      }
    }, [rerunSimulatedQueries]);

    const useStaticValueRef = useCallback(function useStaticValueRef<T>(v: T) {
      const id = useId();
      const store = hookRehydrationCache.current;
      const dataRef = useRef(UNINITIALIZED as T);
      if (dataRef.current === UNINITIALIZED) {
        if (store && id in store) {
          dataRef.current = store[id] as T;
          delete store[id];
        } else {
          dataRef.current = v;
        }
      }
      return dataRef;
    }, []);

    return (
      <DataTransportContext.Provider
        value={useMemo(
          () => ({
            useStaticValueRef,
          }),
          [useStaticValueRef]
        )}
      >
        {children}
      </DataTransportContext.Provider>
    );
  };

const UNINITIALIZED = {};

/**
 * > This export is only available in React Client Components
 *
 * Creates a "manual" Data Transport, to be used with `WrapApolloProvider`.
 *
 * @remarks
 *
 * ### Drawbacks
 *
 * While this Data Transport enables streaming SSR, it has some conceptual drawbacks:
 *
 * - It does not have a way of keeping your connection open if your application already finished, but there are still ongoing queries that might need to be transported over.
 *   - This can happen if a component renders `useBackgroundQuery`, but does not read the `queryRef` with `useReadQuery`
 *   - These "cut off" queries will be restarted in the browser once the browser's `load` event happens
 * - If the `useInsertHtml` doesn't immediately flush data to the browser, the browser might already attain "newer" data through queries triggered by user interaction.
 *   - This delayed behaviour is the case with the Next.js `ServerInsertedHTMLContext` and in the example Vite implementation.
 *   - In this, case, older data from the server might overwrite newer data in the browser. This is minimized by simulating ongoing queries in the browser once the information of a started query is transported over.
 *     If the browser would try to trigger the exact same query, query deduplication would make the browser wait for the server query to resolve instead.
 * - For more timing-related details, see https://github.com/apollographql/apollo-client-integrations/pull/9
 *
 * To fully work around these drawbacks, React needs to add "data injection into the stream" to it's public API, which is not the case today.
 * We provide an [example with a patched React version](https://github.com/apollographql/apollo-client-integrations/blob/main/integration-test/experimental-react) to showcase how that could look.
 *
 * @example
 * For usage examples, see the implementation of the `@apollo/client-integration-nextjs`
 * [`ApolloNextAppProvider`](https://github.com/apollographql/apollo-client-integrations/blob/c0715a05cf8ca29a3cbb9ce294cdcbc5ce251b2e/packages/experimental-nextjs-app-support/src/ApolloNextAppProvider.ts)
 *
 * ```tsx
 * export const ApolloNextAppProvider = WrapApolloProvider(
 *   buildManualDataTransport({
 *     useInsertHtml() {
 *       const insertHtml = useContext(ServerInsertedHTMLContext);
 *       if (!insertHtml) {
 *         throw new Error(
 *           "ApolloNextAppProvider cannot be used outside of the Next App Router!"
 *         );
 *       }
 *       return insertHtml;
 *     },
 *   })
 * );
 * ```
 *
 * @example
 * Another usage example is our integration example with Vite and streaming SSR, which you can find at https://github.com/apollographql/apollo-client-integrations/tree/main/integration-test/vite-streaming
 *
 * @public
 */
export const buildManualDataTransport: (
  args: ManualDataTransportOptions
) => DataTransportProviderImplementation<HydrationContextOptions> =
  process.env.REACT_ENV === "ssr"
    ? buildManualDataTransportSSRImpl
    : buildManualDataTransportBrowserImpl;
