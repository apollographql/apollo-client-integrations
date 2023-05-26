"use client";
import {
  useFragment_experimental,
  useSuspenseQuery_experimental,
  useReadQuery_experimental,
  useQuery as orig_useQuery,
} from "@apollo/client";
import { useTransportValue } from "./useTransportValue";

export const useFragment = wrap(useFragment_experimental, [
  "data",
  "complete",
  "missing",
]);
export const useQuery = wrap(orig_useQuery, [
  "data",
  "loading",
  "networkStatus",
  "called",
]);
export const useSuspenseQuery = wrap(useSuspenseQuery_experimental, [
  "data",
  "networkStatus",
]);
export const useReadQuery = wrap(useReadQuery_experimental, [
  "data",
  "networkStatus",
]);

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
