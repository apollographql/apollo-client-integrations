/**
 * sets up a jsdom environment and returns a render function that can be used to render react components
 */
export function browserEnv(): Promise<{
  /**
   *
   * @param {import('react-dom/client').Container} container
   * @param {import('react').ReactNode} reactNode
   * @param {import('react-dom/client').RootOptions} [rootOptions]
   * @returns
   */
  render(
    container: import("react-dom/client").Container,
    reactNode: import("react").ReactNode,
    rootOptions?: import("react-dom/client").RootOptions
  ): Promise<import("react-dom/client").Root>;
  [Symbol.asyncDispose]: () => Promise<void>;
}>;
export function renderStreamEnv(): Promise<{
  createRenderStream: typeof import("@testing-library/react-render-stream").createRenderStream;
  [Symbol.dispose]: () => void;
}>;
