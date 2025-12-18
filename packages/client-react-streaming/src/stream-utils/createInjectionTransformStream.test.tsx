import { test } from "node:test";
import {
  ReadableStream,
  type TransformStream,
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

function setupStream(transform: globalThis.TransformStream<any, any>) {
  let controller: ReadableStreamDefaultController<string>;
  const stream = new ReadableStream<string>({
    start(c) {
      controller = c;
    },
  })
    .pipeThrough(new TextEncoderStream())
    .pipeThrough(transform as TransformStream);
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
  await scheduler.wait(1);
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

test("race condition: injection queued while currentlyStreaming is true", async () => {
  const { transformStream, injectIntoStream } =
    createInjectionTransformStream();
  const { resultPromise, controller } = setupStream(transformStream);

  controller.enqueue("<html><head><title>Test</title></head><body>");
  await scheduler.wait(0);
  controller.enqueue("<di");
  injectIntoStream(() => <TestComponent />);
  controller.enqueue("v>unrelated content</div>");
  controller.enqueue("</body></html>");
  // TODO: it would be better if the script chunk ended up inside the `html`, tag, but right now it's better here than nowhere. Browsers will be okay with it.
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
