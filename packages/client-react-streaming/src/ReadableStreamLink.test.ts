import { ApolloLink, Observable, gql } from "@apollo/client";
import { test } from "node:test";
import assert from "node:assert";
import { fromPartial } from "@total-typescript/shoehorn";
import { config } from "rxjs";
import type { ReadableStreamLinkEvent } from "#bundled";

const {
  ApolloClient,
  InMemoryCache,
  TeeToReadableStreamLink,
  teeToReadableStream,
} = await import("#bundled");

const client = new ApolloClient({
  link: ApolloLink.empty(),
  cache: new InMemoryCache(),
});

test("TeeToReadableStreamLink: stream cancelled before the result arrives", async () => {
  const unhandled: unknown[] = [];
  const previousOnUnhandledError = config.onUnhandledError;
  config.onUnhandledError = (error) => unhandled.push(error);
  try {
    let controller!: ReadableStreamDefaultController<ReadableStreamLinkEvent>;
    const stream = new ReadableStream<ReadableStreamLinkEvent>({
      start(c) {
        controller = c;
      },
    });
    // e.g. React cancelling the stream after the request was aborted
    await stream.cancel();

    let emit!: () => void;
    const upstream = new ApolloLink(
      () =>
        new Observable((observer) => {
          emit = () => {
            observer.next({ data: { hello: "world" } });
            observer.complete();
          };
        })
    );

    const results: unknown[] = [];
    let completed = false;
    ApolloLink.execute(
      ApolloLink.from([new TeeToReadableStreamLink(), upstream]),
      fromPartial({
        query: gql`
          query {
            hello
          }
        `,
        context: teeToReadableStream(() => controller, {}),
      }),
      { client }
    ).subscribe({
      next: (result) => results.push(result),
      complete: () => (completed = true),
    });

    emit();
    // rxjs reports errors thrown in a subscriber asynchronously
    await new Promise((resolve) => setTimeout(resolve, 10));

    assert.deepStrictEqual(unhandled, []);
    assert.deepStrictEqual(results, [{ data: { hello: "world" } }]);
    assert.ok(completed);
  } finally {
    config.onUnhandledError = previousOnUnhandledError;
  }
});
