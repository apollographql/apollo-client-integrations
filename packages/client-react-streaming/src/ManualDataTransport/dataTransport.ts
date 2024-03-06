import SuperJSON from "superjson";
import { ApolloSSRDataTransport } from "./ApolloRehydrateSymbols.js";
import type { RehydrationCache } from "./types.js";
import { registerLateInitializingQueue } from "./lateInitializingQueue.js";
import { invariant } from "ts-invariant";
import { htmlEscapeJsonString } from "./htmlescape.js";
import type { QueryEvent } from "@apollo/client-react-streaming";

export type DataTransport<T> = Array<T> | { push(...args: T[]): void };

type DataToTransport = {
  rehydrate: RehydrationCache;
  events: QueryEvent[];
};

/**
 * Returns a string of JavaScript that can be used to transport data to the client.
 */
export function transportDataToJS(data: DataToTransport) {
  const key = Symbol.keyFor(ApolloSSRDataTransport);
  return `(window[Symbol.for("${key}")] ??= []).push(${htmlEscapeJsonString(
    SuperJSON.stringify(data)
  )})`;
}

/**
 * Registers a lazy queue that will be filled with data by `transportDataToJS`.
 * All incoming data will be added either to the rehydration cache or the result cache.
 */
export function registerDataTransport({
  onQueryEvent,
  onRehydrate,
}: {
  onQueryEvent(event: QueryEvent): void;
  onRehydrate(rehydrate: RehydrationCache): void;
}) {
  registerLateInitializingQueue(ApolloSSRDataTransport, (data) => {
    const parsed = SuperJSON.deserialize<DataToTransport>(data);
    invariant.debug(`received data from the server:`, parsed);
    onRehydrate(parsed.rehydrate);
    for (const result of parsed.events) {
      onQueryEvent(result);
    }
  });
}
