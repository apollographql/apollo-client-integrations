import React from "react";
import type { RehydrationContextValue } from "./types.js";
import { transportDataToJS } from "./dataTransport.js";
import { invariant } from "@apollo/client/utilities/invariant";
import type { Stringify } from "./serialization.js";

/**
 * @public
 */
export interface HydrationContextOptions {
  /**
   * Props that will be passed down to `script` tags that will be used to transport
   * data to the browser.
   * Can e.g. be used to add a `nonce`.
   */
  extraScriptProps?: ScriptProps;
}

type SerializableProps<T> = Pick<
  T,
  {
    [K in keyof T]: T[K] extends string | number | boolean | undefined | null
      ? K
      : never;
  }[keyof T]
>;

type ScriptProps = SerializableProps<
  React.ScriptHTMLAttributes<HTMLScriptElement>
>;

export function buildApolloRehydrationContext({
  insertHtml,
  stringify,
  extraScriptProps,
}: HydrationContextOptions & {
  insertHtml: (callbacks: () => React.ReactNode) => void;
  stringify: Stringify;
}): RehydrationContextValue {
  function ensureInserted() {
    if (!rehydrationContext.currentlyInjected) {
      rehydrationContext.currentlyInjected = true;
      insertHtml(() => <rehydrationContext.RehydrateOnClient />);
    }
  }

  const rehydrationContext: RehydrationContextValue = {
    currentlyInjected: false,
    transportValueData: getTransportObject(ensureInserted),
    transportedValues: {},
    incomingEvents: getTransportArray(ensureInserted),
    RehydrateOnClient() {
      rehydrationContext.currentlyInjected = false;
      if (
        !Object.keys(rehydrationContext.transportValueData).length &&
        !Object.keys(rehydrationContext.incomingEvents).length
      )
        return <></>;
      invariant.debug(
        "transporting data",
        rehydrationContext.transportValueData
      );
      invariant.debug("transporting events", rehydrationContext.incomingEvents);

      const __html = transportDataToJS(
        {
          rehydrate: Object.fromEntries(
            Object.entries(rehydrationContext.transportValueData).filter(
              ([key, value]) =>
                rehydrationContext.transportedValues[key] !== value
            )
          ),
          events: rehydrationContext.incomingEvents,
        },
        stringify
      );
      Object.assign(
        rehydrationContext.transportedValues,
        rehydrationContext.transportValueData
      );
      rehydrationContext.transportValueData =
        getTransportObject(ensureInserted);
      rehydrationContext.incomingEvents = getTransportArray(ensureInserted);
      return (
        <script
          {...extraScriptProps}
          dangerouslySetInnerHTML={{
            __html,
          }}
        />
      );
    },
  };
  return rehydrationContext;
}

function getTransportObject(ensureInserted: () => void) {
  return new Proxy(
    {},
    {
      set(...args) {
        ensureInserted();
        return Reflect.set(...args);
      },
    }
  );
}
function getTransportArray(ensureInserted: () => void) {
  return new Proxy<any[]>([], {
    get(...args) {
      if (args[1] === "push") {
        return (...values: any[]) => {
          ensureInserted();
          return args[0].push(...values);
        };
      }
      return Reflect.get(...args);
    },
  });
}
