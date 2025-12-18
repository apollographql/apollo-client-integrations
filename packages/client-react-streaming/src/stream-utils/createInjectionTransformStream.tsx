/**
 * The logic for `createInjectionTransformStream` was strongly inspired by `createHeadInsertionTransformStream`
 * from https://github.com/vercel/next.js/blob/6481c92038cce43056005c07f80f2938faf29c29/packages/next/src/server/node-web-streams-helper.ts
 *
 * released under a MIT license (https://github.com/vercel/next.js/blob/6481c92038cce43056005c07f80f2938faf29c29/packages/next/license.md)
 * by Vercel, Inc., marked Copyright (c) 2023 Vercel, Inc.
 */

import { renderToString } from "react-dom/server";
import * as React from "react";

/**
 * > This export is only available in streaming SSR Server environments
 *
 * Used to create a `TransformStream` that can be used for piping a React stream rendered by
 * `renderToReadableStream` and using the callback to insert chunks of HTML between React Chunks.
 */
export function createInjectionTransformStream(): {
  /**
   * @example
   * ```js
   * const { injectIntoStream, transformStream } = createInjectionTransformStream();
   * const App = render({ assets, injectIntoStream });
   * const reactStream = await renderToReadableStream(App, { bootstrapModules }));
   * await pipeReaderToResponse(
   *   reactStream.pipeThrough(transformStream).getReader(),
   *   response
   * );
   *  ```
   */
  transformStream: TransformStream;
  /**
   * `injectIntoStream` method that can be injected into your React application, to be made available to
   *
   * @example
   * ```js title="setup"
   * // create a Context for injection of `injectIntoStream`
   * const InjectionContext = React.createContext<
   *   (callback: () => React.ReactNode) => void
   * >(() => {});
   * // to be used in your application
   * export const InjectionContextProvider = InjectionContext.Provider;
   * // make it accessible to `WrapApolloProvider`
   * export const WrappedApolloProvider = WrapApolloProvider(
   *   buildManualDataTransport({
   *     useInsertHtml() {
   *       return React.useContext(InjectionContext);
   *     },
   *   })
   * );
   * ```
   * Then in your applications SSR render, pass this function to `InjectionContextProvider`:
   * ```js
   * <InjectionContextProvider value={injectIntoStream}>
   * ```
   */
  injectIntoStream: (callback: () => React.ReactNode) => void;
} {
  let queuedInjections: Array<() => React.ReactNode> = [];

  async function renderInjectedHtml() {
    const injections = [...queuedInjections];
    queuedInjections = [];
    return renderToString(
      <>
        {injections.map((callback, i) => (
          <React.Fragment key={i}>{callback()}</React.Fragment>
        ))}
      </>
    );
  }

  let headInserted = false;
  let currentlyStreaming = false;
  let tailOfLastChunk = "";
  const textDecoder = new TextDecoder();
  const textEncoder = new TextEncoder();
  const HEAD_END = "</head>";
  // while the head has not fully been inserted, always move the last few
  // bytes of a chunk into the next chunk, so we can ensure that `</head>`
  // is not chopped into e.g. `</he` and `ad>`.
  const KEEP_BYTES = HEAD_END.length;

  const transformStream = new TransformStream({
    async transform(chunk, controller) {
      // While react is flushing chunks, we don't apply insertions.
      // Injecting during streaming could break HTML by inserting content
      // at arbitrary chunk boundaries (e.g., inside partial tags like <di${injected}v>).
      if (currentlyStreaming) {
        controller.enqueue(chunk);
        return;
      }

      if (!headInserted) {
        const content =
          tailOfLastChunk + textDecoder.decode(chunk, { stream: true });
        const index = content.indexOf(HEAD_END);
        if (index !== -1) {
          const insertedHeadContent =
            content.slice(0, index) +
            (await renderInjectedHtml()) +
            content.slice(index);
          controller.enqueue(textEncoder.encode(insertedHeadContent));
          currentlyStreaming = true;
          setImmediate(() => {
            currentlyStreaming = false;
          });
          headInserted = true;
        } else {
          tailOfLastChunk = content.slice(-KEEP_BYTES);
          controller.enqueue(textEncoder.encode(content.slice(0, -KEEP_BYTES)));
        }
      } else {
        if (queuedInjections.length > 0) {
          controller.enqueue(textEncoder.encode(await renderInjectedHtml()));
        }
        controller.enqueue(chunk);
        currentlyStreaming = true;
        setImmediate(() => {
          currentlyStreaming = false;
        });
      }
    },
    async flush(controller) {
      if (queuedInjections.length > 0) {
        controller.enqueue(textEncoder.encode(await renderInjectedHtml()));
      }
    },
  });

  return {
    transformStream,
    injectIntoStream: (callback) => queuedInjections.push(callback),
  };
}
