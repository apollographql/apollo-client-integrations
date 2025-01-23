// @ts-check

/** @type{import('knip').KnipConfig}*/
const config = {
  workspaces: {
    ".": {
      ignoreBinaries: ["jq", "playwright"],
      ignoreDependencies: [/@size-limit\/.*/, "prettier"],
    },
    "packages/*": {
      entry: ["**/*.test.{ts,tsx}"],
      project: ["**/*.{ts,tsx}"],
    },
    "packages/client-react-streaming": {
      entry: ["**/*.test.{ts,tsx}"],
      project: ["**/*.{ts,tsx}"],
      ignoreDependencies: ["tsx"],
    },
  },
  ignore: [
    "examples/**",
    "integration-test/**",
    "packages/test-utils/*.d.ts",
    "scripts/**",
    "packages/client-react-streaming/api-extractor.d.ts",
    "packages/experimental-nextjs-app-support/api-extractor.d.ts",
  ],
};

export default config;
