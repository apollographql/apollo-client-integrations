/** @type {import('size-limit').SizeLimitConfig} */
const checks = [
  {
    name: "{ ApolloNextAppProvider, NextSSRApolloClient, NextSSRInMemoryCache } from '@apollo/experimental-nextjs-app-support/ssr' (Browser ESM)",
    path: "packages/experimental-nextjs-app-support/dist/ssr/index.browser.js",
    import:
      "{ ApolloNextAppProvider, NextSSRApolloClient, NextSSRInMemoryCache }",
  },
  {
    name: "{ WrapApolloProvider, ApolloClient, InMemoryCache } from '@apollo/client-react-streaming' (Browser ESM)",
    path: "packages/client-react-streaming/dist/index.browser.js",
    import: "{ WrapApolloProvider, ApolloClient, InMemoryCache }",
  },
  {
    name: "{ buildManualDataTransport } from '@apollo/client-react-streaming/manual-transport' (Browser ESM)",
    path: "packages/client-react-streaming/dist/manual-transport.browser.cjs",
    import: "{ buildManualDataTransport }",
  },
  {
    name: "@apollo/client-react-streaming (Browser ESM)",
    path: "packages/client-react-streaming/dist/index.browser.js",
  },
  {
    name: "@apollo/client-react-streaming (SSR ESM)",
    path: "packages/client-react-streaming/dist/index.ssr.js",
  },
  {
    name: "@apollo/client-react-streaming (RSC ESM)",
    path: "packages/client-react-streaming/dist/index.rsc.js",
  },
  {
    name: "@apollo/client-react-streaming/manual-transport (Browser ESM)",
    path: "packages/client-react-streaming/dist/manual-transport.browser.cjs",
  },
  {
    name: "@apollo/client-react-streaming/manual-transport (SSR ESM)",
    path: "packages/client-react-streaming/dist/manual-transport.ssr.cjs",
  },
  {
    name: "@apollo/experimental-nextjs-app-support/ssr (Browser ESM)",
    path: "packages/experimental-nextjs-app-support/dist/ssr/index.browser.js",
  },
  {
    name: "@apollo/experimental-nextjs-app-support/ssr (SSR ESM)",
    path: "packages/experimental-nextjs-app-support/dist/ssr/index.ssr.js",
  },
  {
    name: "@apollo/experimental-nextjs-app-support/ssr (RSC ESM)",
    path: "packages/experimental-nextjs-app-support/dist/ssr/index.rsc.js",
  },
  {
    name: "@apollo/experimental-nextjs-app-support/rsc (RSC ESM)",
    path: "packages/experimental-nextjs-app-support/dist/rsc/index.js",
  },
];

module.exports = checks.map(
  (check) =>
    /** @type {import('size-limit').SizeLimitConfig} */ ({
      ...check,
      import: check.import || "*",
      modifyWebpackConfig(config) {
        config.resolve = {
          ...config.resolve,
          modules: ["node_modules"],
          conditionNames: [
            "import",
            check.name.includes("Browser")
              ? "browser"
              : check.name.includes("RSC")
                ? "react-server"
                : check.name.includes("SSR")
                  ? "node"
                  : "default",
          ],
        };
        return config;
      },
      ignore: [
        ...(check.ignore || []),
        "rehackt",
        "react",
        "react-dom",
        "@apollo/client",
        "@graphql-typed-document-node/core",
        "@wry/caches",
        "@wry/context",
        "@wry/equality",
        "@wry/trie",
        "graphql-tag",
        "hoist-non-react-statics",
        "optimism",
        "prop-types",
        "response-iterator",
        "symbol-observable",
        "ts-invariant",
        "tslib",
        "zen-observable-ts",
      ],
    })
);
