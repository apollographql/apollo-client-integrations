"use client";
import {
  useFragment as orig_useFragment,
  useSuspenseQuery as orig_useSuspenseQuery,
  useReadQuery as orig_useReadQuery,
  useQuery as orig_useQuery,
  useBackgroundQuery as orig_useBackgroundQuery,
} from "@apollo/client";
import { useTransportValue } from "./useTransportValue";
import { useRehydrationContext } from "./RehydrationContext";

export const useFragment = wrap(orig_useFragment, [
  "data",
  "complete",
  "missing",
]);
export const useQuery = wrap<typeof orig_useQuery>(
  typeof window === "undefined"
    ? (query, options) =>
        orig_useQuery(query, { ...options, fetchPolicy: "cache-only" })
    : orig_useQuery,
  ["data", "loading", "networkStatus", "called"]
);
export const useSuspenseQuery = wrap(orig_useSuspenseQuery, [
  "data",
  "networkStatus",
]);
export const useReadQuery = wrap(orig_useReadQuery, ["data", "networkStatus"]);

export const useBackgroundQuery: typeof orig_useBackgroundQuery = (
  ...args: [any, any]
) => {
  useRehydrationContext();
  return orig_useBackgroundQuery(...args) as any;
};

function wrap<T extends (...args: any[]) => any>(
  useFn: T,
  transportKeys: (keyof ReturnType<T>)[]
): T {
  return ((...args: any[]) => {
    const result = useFn(...args);
    const transported: Partial<typeof result> = {};
    for (const key of transportKeys) {
      transported[key] = result[key];
    }
    return { ...result, ...useTransportValue(transported) };
  }) as T;
}
