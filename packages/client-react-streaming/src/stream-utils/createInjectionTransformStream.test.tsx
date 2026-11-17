import { test } from "node:test";
import {
  ReadableStream,
  TransformStream,
  TextEncoderStream,
} from "node:stream/web";
import * as assert from "node:assert";
import { text } from "node:stream/consumers";
import React from "react";
import { scheduler } from "node:timers/promises";
import { runInConditions } from "@internal/test-utils/runInConditions.js";

runInConditions("node");

const { createInjectionTransformStream } = await import(
  "./createInjectionTransformStream.js"
);

function html(strings: TemplateStringsArray) {
  return strings[0]
    .split("\n")
    .map((line) => line.trim())
    .join("");
}

const emptyHtml = html`<html>
  <head>
    <title>Test</title>
  </head>
  <body></body>
</html>`;
function TestComponent() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `console.log("test");` }} />
  );
}

function setupStream(
  transform: globalThis.TransformStream<any, any>,
  onOutputChunk?: (chunk: string) => void
) {
  let controller: ReadableStreamDefaultController<string>;
  let stream = new ReadableStream<string>({
    start(c) {
      controller = c;
    },
  })
    .pipeThrough(new TextEncoderStream())
    .pipeThrough(transform as TransformStream);
  if (onOutputChunk) {
    const decoder = new TextDecoder();
    stream = stream.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          onOutputChunk(decoder.decode(chunk, { stream: true }));
          controller.enqueue(chunk);
        },
      })
    );
  }
  const resultPromise = text(stream);
  return { resultPromise, controller: controller! };
}

test("equality transformation", async () => {
  const { transformStream } = createInjectionTransformStream();
  const { resultPromise, controller } = setupStream(transformStream);

  controller.enqueue(emptyHtml);
  controller.close();

  assert.equal(await resultPromise, emptyHtml);
});

test("if the head has not been flushed yet, inject before the end of head", async () => {
  const { transformStream, injectIntoStream } =
    createInjectionTransformStream();
  const { resultPromise, controller } = setupStream(transformStream);

  controller.enqueue(emptyHtml);
  injectIntoStream(() => <TestComponent />);
  controller.close();

  assert.equal(
    await resultPromise,
    html`<html>
      <head>
        <title>Test</title>
        <script>
          console.log("test");
        </script>
      </head>
      <body></body>
    </html>`
  );
});

test("if the head has been flushed, just insert wherever", async () => {
  const { transformStream, injectIntoStream } =
    createInjectionTransformStream();
  const { resultPromise, controller } = setupStream(transformStream);

  controller.enqueue("<html><head><title>Test</title></head><body>");
  await scheduler.wait(10);
  injectIntoStream(() => <TestComponent />);
  controller.enqueue("</body></html>");
  controller.close();

  assert.equal(
    await resultPromise,
    html`<html>
      <head>
        <title>Test</title>
      </head>
      <body>
        <script>
          console.log("test");
        </script>
      </body>
    </html>`
  );
});

test("race condition: injection queued while currentlyStreaming is true, no async follow-up chunks", async () => {
  const { transformStream, injectIntoStream } =
    createInjectionTransformStream();
  let markChunkSeen!: () => void;
  const chunkSeen = new Promise<void>((resolve) => (markChunkSeen = resolve));
  const { resultPromise, controller } = setupStream(
    transformStream,
    (chunk) => {
      if (chunk.includes("<di")) markChunkSeen();
    }
  );

  controller.enqueue("<html><head><title>Test</title></head><body>");
  await scheduler.wait(10);
  controller.enqueue("<di");
  // Wait until `<di` has gone through the transform (which sets
  // `currentlyStreaming`). Without this, the number of microtask hops in
  // Node's web streams decides if the injection is queued before or after
  // `<di` is transformed, and that changes between Node versions.
  // Only microtasks pass here, so the `setImmediate` that resets
  // `currentlyStreaming` has not run yet.
  await chunkSeen;
  injectIntoStream(() => <TestComponent />);
  controller.enqueue("v>unrelated content</div>");
  controller.enqueue("</body></html>");
  // TODO: it would be better if the script chunk ended up inside the `html` tag, but right now it's better here than nowhere. Browsers will be okay with it.
  controller.close();

  assert.equal(
    await resultPromise,
    html`<html>
        <head>
          <title>Test</title>
        </head>
        <body>
          <div>unrelated content</div>
        </body>
      </html>
      <script>
        console.log("test");
      </script>`
  );
});

test("if the head is chopped into pieces, take the last chunk into account when looking for the end of the head", async () => {
  const { transformStream, injectIntoStream } =
    createInjectionTransformStream();
  const { resultPromise, controller } = setupStream(transformStream);

  controller.enqueue(`<html><he`);
  injectIntoStream(() => <TestComponent />);
  await scheduler.wait(1);
  controller.enqueue(`ad><title>Test</title></hea`);
  await scheduler.wait(1);
  controller.enqueue(`d><body></body></html>`);
  await scheduler.wait(1);
  controller.close();

  assert.equal(
    await resultPromise,
    html`<html>
      <head>
        <title>Test</title>
        <script>
          console.log("test");
        </script>
      </head>
      <body></body>
    </html>`
  );
});
