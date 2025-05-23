// @ts-check

/** @type{import('knip').KnipConfig}*/
const config = {
  workspaces: {
    ".": {
      ignoreBinaries: ["jq", "playwright"],
      ignoreDependencies: [/@size-limit\/.*/, "prettier", "zx"],
    },
    "packages/*": {
      entry: ["**/*.test.{ts,tsx}"],
      project: ["**/*.{ts,tsx}"],
    },
    "packages/test-utils": {
      entry: ["*.js"],
    },
    "packages/client-react-streaming": {
      entry: ["**/*.test.{ts,tsx}"],
      project: ["**/*.{ts,tsx}"],
      ignoreDependencies: ["tsx"],
    },
    "packages/experimental-nextjs-app-support": {
      ignoreDependencies: ["graphql", "react-dom"],
    },
  },
  ignore: [
    "examples/**",
    "integration-test/**",
    "packages/test-utils/*.d.ts",
    "scripts/**",
    "packages/client-react-streaming/api-extractor.d.ts",
    "packages/nextjs/api-extractor.d.ts",
    "**/.yalc/**",
  ],
};

export default config;
