// @ts-check

/** @type{import('knip').KnipConfig}*/
const config = {
  workspaces: {
    ".": {
      ignoreBinaries: ["jq", "playwright"],
      entry: ["knip.config.js", "scripts/*.js", "scripts/*.ts"],
      ignoreDependencies: [/@size-limit\/.*/, "prettier"],
    },
    "packages/*": {
      entry: ["**/*.test.{ts,tsx}"],
      project: ["**/*.{ts,tsx}"],
    },
    "packages/test-utils": {
      entry: ["*.js"],
      ignoreDependencies: ["rxjs"],
    },
    "packages/client-react-streaming": {
      entry: ["**/*.test.{ts,tsx}"],
      project: ["**/*.{ts,tsx}"],
      ignoreDependencies: ["tsx"],
    },
    "packages/experimental-nextjs-app-support": {},
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
