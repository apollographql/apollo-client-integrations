/** @type {import('size-limit').SizeLimitConfig} */
const checks = [
  {
    name: "{ ApolloNextAppProvider, ApolloClient, InMemoryCache } from '@apollo/client-integration-nextjs' (Browser ESM)",
    path: "packages/nextjs/dist/index.browser.js",
    import: "{ ApolloNextAppProvider, ApolloClient, InMemoryCache }",
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
    name: "@apollo/client-integration-nextjs (Browser ESM)",
    path: "packages/nextjs/dist/index.browser.js",
  },
  {
    name: "@apollo/client-integration-nextjs (SSR ESM)",
    path: "packages/nextjs/dist/index.ssr.js",
  },
  {
    name: "@apollo/client-integration-nextjs (RSC ESM)",
    path: "packages/nextjs/dist/index.rsc.js",
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
        "react",
        "react-dom",
        "@apollo/client",
        "@graphql-typed-document-node/core",
        "@wry/caches",
        "@wry/context",
        "@wry/equality",
        "@wry/trie",
        "graphql-tag",
        "optimism",
        "prop-types",
        "tslib",
        "rxjs",
      ],
    })
);
