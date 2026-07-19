import type {
  Cache,
  InMemoryCacheConfig,
  OperationVariables,
  Reference,
} from "@apollo/client";
import { InMemoryCache as OrigInMemoryCache } from "@apollo/client";
import { bundle, sourceSymbol } from "../bundleInfo.js";
import { isTransportEmission } from "../ReadableStreamLink.js";
/*
 * We subclass `InMemoryCache` here so that `WrappedApolloClient`
 * can detect if it was initialized with an `InMemoryCache` instance that
 * was also exported from this package.
 */
/**
 * A version of `InMemoryCache` to be used with streaming SSR.
 *
 * For more documentation, please see {@link https://www.apollographql.com/docs/react/api/cache/InMemoryCache | the Apollo Client API documentation}.
 *
 * @public
 */
export class InMemoryCache extends OrigInMemoryCache {
  /**
   * Information about the current package and it's export names, for use in error messages.
   *
   * @internal
   */
  static readonly info = bundle;
  [sourceSymbol]: string;
  constructor(config?: InMemoryCacheConfig | undefined) {
    super(config);
    const info = (this.constructor as typeof InMemoryCache).info;
    this[sourceSymbol] = `${info.pkg}:InMemoryCache`;
  }

  /**
   * Counts cache writes that did not originate from the SSR data transport —
   * e.g. mutation results, optimistic updates, or direct `writeQuery`/
   * `writeFragment`/`modify`/`evict` calls.
   * `WrappedApolloClient` compares this before and after a transported query
   * result was in flight to detect that the (older) transported result would
   * overwrite newer data.
   * @internal
   */
  nonTransportWrites = 0;

  write<
    TData = unknown,
    TVariables extends OperationVariables = OperationVariables,
  >(options: Cache.WriteOptions<TData, TVariables>): Reference | undefined {
    if (!isTransportEmission()) this.nonTransportWrites++;
    return super.write(options);
  }

  modify<Entity extends Record<string, any> = Record<string, any>>(
    options: Cache.ModifyOptions<Entity>
  ): boolean {
    // `modify` and `evict` report whether they changed anything — no-ops
    // don't count as writes.
    const modified = super.modify(options);
    if (modified && !isTransportEmission()) this.nonTransportWrites++;
    return modified;
  }

  evict(options: Cache.EvictOptions): boolean {
    const evicted = super.evict(options);
    if (evicted && !isTransportEmission()) this.nonTransportWrites++;
    return evicted;
  }
}
