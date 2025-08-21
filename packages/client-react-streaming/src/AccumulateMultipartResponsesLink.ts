import { ApolloLink } from "@apollo/client";
import { Observable } from "@apollo/client/utilities";
import { hasDirectives } from "@apollo/client/utilities/internal";
import type { InternalTypes } from "@apollo/client";
import type { Incremental } from "@apollo/client/incremental";

interface AccumulateMultipartResponsesConfig {
  /**
   * The maximum delay in milliseconds
   * from receiving the first response
   * until the accumulated data will be flushed
   * and the connection will be closed.
   */
  cutoffDelay: number;
}

/**
 *
 * This link can be used to "debounce" the initial response of a multipart request. Any incremental data received during the `cutoffDelay` time will be merged into the initial response.
 *
 * After `cutoffDelay`, the link will return the initial response, even if there is still incremental data pending, and close the network connection.
 *
 * If `cutoffDelay` is `0`, the link will immediately return data as soon as it is received, without waiting for incremental data, and immediately close the network connection.
 *
 * @example
 * ```ts
 * new AccumulateMultipartResponsesLink({
 *   // The maximum delay in milliseconds
 *   // from receiving the first response
 *   // until the accumulated data will be flushed
 *   // and the connection will be closed.
 *   cutoffDelay: 100,
 *  });
 * ```
 *
 * @public
 */
export class AccumulateMultipartResponsesLink extends ApolloLink {
  private maxDelay: number;

  constructor(config: AccumulateMultipartResponsesConfig) {
    super();
    this.maxDelay = config.cutoffDelay;
  }
  request(
    operation: ApolloLink.Operation,
    forward?: ApolloLink.ForwardFunction
  ) {
    if (!forward) {
      throw new Error("This is not a terminal link!");
    }

    const operationContainsMultipartDirectives = hasDirectives(
      ["defer"],
      operation.query
    );

    const upstream = forward(operation);
    if (!operationContainsMultipartDirectives) return upstream;

    // TODO: this could be overwritten with a `@AccumulateMultipartResponsesConfig(maxDelay: 1000)` directive on the operation
    const maxDelay = this.maxDelay;
    let accumulatedData: ApolloLink.Result, maxDelayTimeout: NodeJS.Timeout;
    const incrementalHandler = (
      operation.client["queryManager"] as InternalTypes.QueryManager
    ).incrementalHandler;
    let incremental: Incremental.IncrementalRequest<
      Record<string, unknown>,
      Record<string, unknown>
    >;

    return new Observable<ApolloLink.Result>((subscriber) => {
      const upstreamSubscription = upstream.subscribe({
        next: (result) => {
          if (incrementalHandler.isIncrementalResult(result)) {
            incremental ||= incrementalHandler.startRequest({
              query: operation.query,
            });
            accumulatedData = incremental.handle(accumulatedData.data, result);
          } else {
            accumulatedData = result;
          }
          if (!maxDelay) {
            flushAccumulatedData();
          } else if (!maxDelayTimeout) {
            maxDelayTimeout = setTimeout(flushAccumulatedData, maxDelay);
          }
        },
        error: (error) => {
          if (maxDelayTimeout) clearTimeout(maxDelayTimeout);
          subscriber.error(error);
        },
        complete: () => {
          if (maxDelayTimeout) {
            clearTimeout(maxDelayTimeout);
            flushAccumulatedData();
          }
          subscriber.complete();
        },
      });

      function flushAccumulatedData() {
        subscriber.next(accumulatedData);
        subscriber.complete();
        upstreamSubscription.unsubscribe();
      }

      return function cleanUp() {
        clearTimeout(maxDelayTimeout);
        upstreamSubscription.unsubscribe();
      };
    });
  }
}
