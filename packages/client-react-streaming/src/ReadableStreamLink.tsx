import { ApolloLink, Observable } from "@apollo/client";

/**
 * @internal
 */
export type ReadableStreamLinkEvent =
  | { type: "next"; value: ApolloLink.Result }
  | { type: "completed" }
  | { type: "error" };

/**
 * Called when the link is hit, before the request is forwarded.
 *
 * Should return the controller for the readable stream.
 *
 * This is useful because when starting a query, it's not always
 * clear if the query will hit the network or will be served from
 * cache, deduplicated etc.
 * This allows to inject the "start event" into the stream only
 * when we know that more chunks will actually follow.
 */
type OnLinkHitFunction =
  () => ReadableStreamDefaultController<ReadableStreamLinkEvent>;
interface InternalContext {
  [teeToReadableStreamKey]?: OnLinkHitFunction;
  [readFromReadableStreamKey]?: ReadableStream<ReadableStreamLinkEvent>;
}

const teeToReadableStreamKey = Symbol.for(
  "apollo.tee.readableStreamController"
);
const readFromReadableStreamKey = Symbol.for("apollo.read.readableStream");

/**
 * Apply to a context that will be passed to a link chain containing `TeeToReadableStreamLink`.
 * @public
 */
export function teeToReadableStream<T extends Record<string, any>>(
  onLinkHit: OnLinkHitFunction,
  context: T
): T & InternalContext {
  return Object.assign(context, {
    [teeToReadableStreamKey]: onLinkHit,
  });
}

/**
 * Apply to a context that will be passed to a link chain containing `ReadFromReadableStreamLink`.
 * @public
 */
export function readFromReadableStream<T extends Record<string, any>>(
  readableStream: ReadableStream<ReadableStreamLinkEvent>,
  context: T
): T & InternalContext {
  return Object.assign(context, {
    [readFromReadableStreamKey]: readableStream,
  });
}

/**
 * A link that allows the request to be cloned into a readable stream, e.g. for
 * transport of multipart responses from RSC or a server loader to the browser.
 * @public
 */
export class TeeToReadableStreamLink extends ApolloLink {
  constructor() {
    super((operation, forward) => {
      const context = operation.getContext() as InternalContext;

      const onLinkHit = context[teeToReadableStreamKey];

      if (onLinkHit) {
        const controller = onLinkHit();

        const tryClose = () => {
          try {
            controller.close();
          } catch {
            // maybe we already tried to close the stream, nothing to worry about
          }
        };
        return new Observable((observer) => {
          let subscribed = true;
          const subscription = forward(operation).subscribe({
            next(result) {
              controller.enqueue({ type: "next", value: result });
              if (subscribed) {
                observer.next(result);
              }
            },
            error(error) {
              controller.enqueue({ type: "error" });
              tryClose();
              if (subscribed) {
                observer.error(error);
              }
            },
            complete() {
              controller.enqueue({ type: "completed" });
              tryClose();
              if (subscribed) {
                observer.complete();
              }
            },
          });

          return () => {
            subscribed = false;
          };
        });
      }

      return forward(operation);
    });
  }
}

/**
 * A link that allows the response to be read from a readable stream, e.g. for
 * hydration of a multipart response from RSC or a server loader in the browser.
 * @public
 */
export class ReadFromReadableStreamLink extends ApolloLink {
  constructor() {
    super((operation, forward) => {
      const context = operation.getContext() as InternalContext;

      const eventSteam = context[readFromReadableStreamKey];
      if (eventSteam) {
        return new Observable((observer) => {
          let aborted = false as boolean;
          const reader = (() => {
            try {
              return eventSteam.getReader();
            } catch {
              /**
               * The reader could not be created, usually because the stream has
               * already been consumed.
               * This would be the case if we call `refetch` on a queryRef that has
               * the `readFromReadableStreamKey` property in context.
               * In that case, we want to do a normal network request.
               */
            }
          })();

          if (!reader) {
            // if we can't create a reader, we want to do a normal network request
            const subscription = forward(operation).subscribe(observer);
            return () => subscription.unsubscribe();
          }
          let forwarded = false;
          consume(reader).finally(() => {
            // in case the stream ends without a `completed` event we still need to close the observer
            // to avoid an the observable never being removed from `inFlightLinkObservables`
            if (!observer.closed && !forwarded) {
              observer.complete();
            }
          });
          let onAbort = () => {
            aborted = true;
            reader.cancel();
          };

          return () => onAbort();

          async function consume(
            reader: ReadableStreamDefaultReader<ReadableStreamLinkEvent>
          ) {
            let event:
              | ReadableStreamReadResult<ReadableStreamLinkEvent>
              | undefined = undefined;
            while (!aborted && !event?.done) {
              event = await reader.read();
              if (aborted) break;
              if (event.value) {
                switch (event.value.type) {
                  case "next":
                    observer.next(event.value.value);
                    break;
                  case "completed":
                    observer.complete();
                    break;
                  case "error":
                    // in case a network error happened on the sending side,
                    if (process.env.REACT_ENV === "ssr") {
                      // we want to fail SSR for this tree
                      observer.error(
                        new Error(
                          "Error from event stream. Redacted for security concerns."
                        )
                      );
                    } else {
                      // we want to retry the operation on the receiving side
                      onAbort();
                      forwarded = true;
                      const subscription =
                        forward(operation).subscribe(observer);
                      onAbort = () => subscription.unsubscribe();
                    }
                    break;
                }
              }
            }
          }
        });
      }

      return forward(operation);
    });
  }
}
