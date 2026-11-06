import * as assert from "node:assert/strict";
import { test } from "node:test";
import type { QueryEvent } from "@apollo/client-react-streaming";
import { ClientTransport, transportSerializationAdapter } from "./Transport.js";

type TransportEvent =
  ConstructorParameters<typeof ClientTransport>[0] extends ReadableStream<
    infer Event
  >
    ? Event
    : never;

function withoutAsyncIterator<T>(stream: ReadableStream<T>) {
  // Older WebKit has native streams and readers, but no stream async iterator.
  Object.defineProperty(stream, Symbol.asyncIterator, { value: undefined });
  return stream;
}

function createTransport(stream: ReadableStream<TransportEvent>) {
  const finished = Promise.withResolvers<void>();
  const transport = transportSerializationAdapter.fromSerializable(stream);
  assert.ok(transport instanceof ClientTransport);
  transport.rerunSimulatedQueries = finished.resolve;
  return { transport, finished: finished.promise };
}

const queryEvent: QueryEvent = {
  type: "completed",
  id: "query-id" as QueryEvent["id"],
};

test(
  "deserializes values and buffered query events without stream async iteration",
  { timeout: 2000 },
  async () => {
    const stream = withoutAsyncIterator(
      new ReadableStream<TransportEvent>({
        start(controller) {
          controller.enqueue({ type: "value", id: "value-id", value: 42 });
          controller.enqueue(queryEvent);
          controller.close();
        },
      })
    );

    const { transport, finished } = createTransport(stream);
    await finished;

    assert.equal(transport.getStreamedValue("value-id"), 42);
    const events: QueryEvent[] = [];
    transport.onQueryEvent = (event) => events.push(event);
    assert.deepEqual(events, [queryEvent]);
    assert.equal(stream.locked, false);
  }
);

test(
  "delivers query events while a stream without async iteration is still open",
  { timeout: 2000 },
  async () => {
    const { readable, writable } = new TransformStream<TransportEvent>();
    withoutAsyncIterator(readable);
    const { transport, finished } = createTransport(readable);
    const received = Promise.withResolvers<QueryEvent>();
    transport.onQueryEvent = received.resolve;

    const writer = writable.getWriter();
    try {
      await writer.write(queryEvent);
      assert.equal(await received.promise, queryEvent);
      assert.equal(readable.locked, true);
      await writer.close();
      await finished;
      assert.equal(readable.locked, false);
    } finally {
      writer.releaseLock();
    }
  }
);

test(
  "finishes an empty stream without async iteration",
  { timeout: 2000 },
  async () => {
    const stream = withoutAsyncIterator(
      new ReadableStream<TransportEvent>({
        start(controller) {
          controller.close();
        },
      })
    );
    const { finished } = createTransport(stream);
    await finished;
    assert.equal(stream.locked, false);
  }
);

test("releases the reader and preserves stream errors", async () => {
  const { transport, finished } = createTransport(
    new ReadableStream({ start: (controller) => controller.close() })
  );
  await finished;

  const error = new Error("stream failed");
  const stream = new ReadableStream<TransportEvent>({
    start(controller) {
      controller.error(error);
    },
  });
  // Observe the internal consumer promise without creating an unhandled
  // rejection through the constructor, which does not expose the promise.
  await assert.rejects(
    transport["consume"](stream),
    (actual) => actual === error
  );
  assert.equal(stream.locked, false);
});

test("cancels the stream when query event handling throws", async () => {
  const { transport, finished } = createTransport(
    new ReadableStream({ start: (controller) => controller.close() })
  );
  await finished;

  const error = new Error("query event failed");
  transport.onQueryEvent = () => {
    throw error;
  };
  let cancelled = false;
  const stream = new ReadableStream<TransportEvent>({
    start(controller) {
      controller.enqueue(queryEvent);
    },
    cancel() {
      cancelled = true;
      throw new Error("cancellation failed");
    },
  });

  await assert.rejects(
    transport["consume"](stream),
    (actual) => actual === error
  );
  assert.equal(cancelled, true);
  assert.equal(stream.locked, false);
});
