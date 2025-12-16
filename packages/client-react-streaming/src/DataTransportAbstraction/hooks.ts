import type { HookWrappers } from "@apollo/client/react/internal";
import { useTransportValue } from "./useTransportValue.js";
import { useWrapTransportedQueryRef } from "../transportedQueryRef.js";
import { useMemo } from "react";
import { NetworkStatus } from "@apollo/client";

export const hookWrappers: HookWrappers = {
  useFragment(orig_useFragment) {
    return wrap(orig_useFragment, ["data", "complete", "missing", "dataState"]);
  },
  useQuery(orig_useQuery) {
    return wrap<typeof orig_useQuery>(
      process.env.REACT_ENV === "ssr"
        ? (query, options) => {
            const ret = orig_useQuery(
              query,
              typeof options === "symbol"
                ? options
                : {
                    ...options,
                    fetchPolicy: "cache-only",
                  }
            );

            return typeof options === "symbol"
              ? ret
              : // if we changed the options to `cache-only` from something else,
                options?.fetchPolicy !== "cache-only" &&
                  // the value is not in the cache,
                  ret.dataState === "empty" &&
                  // and the query hasn't been skipped,
                  ret.observable.options.fetchPolicy === "cache-only"
                ? // we override the loading state to `true`
                  {
                    ...ret,
                    loading: true,
                    networkStatus: NetworkStatus.loading,
                  }
                : ret;
          }
        : orig_useQuery,
      ["data", "loading", "networkStatus", "dataState"]
    );
  },
  useSuspenseQuery(orig_useSuspenseQuery) {
    return wrap(orig_useSuspenseQuery, ["data", "networkStatus", "dataState"]);
  },
  useReadQuery(orig_useReadQuery) {
    return wrap(
      (queryRef) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return orig_useReadQuery(useWrapTransportedQueryRef(queryRef));
      },
      ["data", "networkStatus", "dataState"]
    );
  },
  useQueryRefHandlers(orig_useQueryRefHandlers) {
    return wrap((queryRef) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return orig_useQueryRefHandlers(useWrapTransportedQueryRef(queryRef));
    }, []);
  },
  useSuspenseFragment(orig_useSuspenseFragment) {
    return wrap(orig_useSuspenseFragment, ["data"]);
  },
};

function wrap<T extends (...args: any[]) => any>(
  useFn: T,
  transportKeys: (keyof ReturnType<T>)[]
): T {
  return ((...args: any[]) => {
    const result = useFn(...args);
    if (transportKeys.length == 0) {
      return result;
    }
    const forTransport = useMemo<Partial<typeof result>>(() => {
      const transport: Partial<typeof result> = {};
      for (const key of transportKeys) {
        transport[key] = result[key];
      }
      return transport;
    }, [result]);
    const transported = useTransportValue(forTransport);

    return useMemo(
      () => ({ ...result, ...transported }),
      [result, transported]
    );
  }) as T;
}
