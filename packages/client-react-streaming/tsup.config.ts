import type { Options } from "tsup";
import { defineConfig } from "tsup";
import type { Plugin } from "esbuild";

export default defineConfig((options) => {
  const defaults: Options = {
    splitting: false,
    sourcemap: true,
    format: ["cjs", "esm"],
    target: "node18",
    dts: true,
    treeshake: !options.watch
      ? {
          preset: "smallest",
          moduleSideEffects: "no-external",
        }
      : false,
    outDir: "dist/",
    external: [
      "@apollo/client-react-streaming",
      "graphql",
      "react",
      "rehackt",
      "react-dom",
    ],
    noExternal: ["@apollo/client"], // will be handled by `acModuleImports`
    esbuildPlugins: [acModuleImports],
  };

  function entry(
    env: "browser" | "ssr" | "rsc" | "other",
    input: string,
    output: string
  ): Options {
    return {
      ...defaults,
      env: {
        REACT_ENV: env,
      },
      target:
        env === "browser"
          ? ["chrome109", "firefox115", "safari16", "edge119", "ios15"]
          : defaults.target,
      entry: {
        [output]: input,
      },
      footer(ctx) {
        return {
          js:
            ctx.format === "esm"
              ? `export const built_for_${env} = true;`
              : `exports.built_for_${env} = true;`,
        };
      },
    };
  }

  return [
    {
      ...entry("other", "src/combined.ts", "combined"),
      dts: { only: true },
    },
    entry("other", "src/empty.ts", "empty"),
    entry("rsc", "src/index.rsc.ts", "index.rsc"),
    entry("ssr", "src/index.ts", "index.ssr"),
    entry("browser", "src/index.ts", "index.browser"),
    entry("ssr", "src/ManualDataTransport/index.ts", "manual-transport.ssr"),
    entry(
      "browser",
      "src/ManualDataTransport/index.ts",
      "manual-transport.browser"
    ),
    entry("ssr", "src/stream-utils/index.ssr.ts", "stream-utils.ssr"),
    entry("browser", "src/stream-utils/index.ts", "stream-utils"),
    {
      ...entry(
        "other",
        "src/stream-utils/combined.ts",
        "stream-utils.combined"
      ),
      dts: { only: true },
    },
    {
      ...entry("browser", "src/index.cc.tsx", "index.cc"),
      treeshake: false, // would remove the "use client" directive
    },
    {
      ...entry(
        "browser",
        "src/PreloadQueryRef.cc.ts",
        "PreloadQueryRef.cc"
      ),
      treeshake: false, // would remove the "use client" directive
    },
  ];
});

const acModuleImports: Plugin = {
  name: "replace-ac-module-imports",
  setup(build) {
    build.onResolve({ filter: /^@apollo\/client/ }, async (args) => {
      if (build.initialOptions.define["TSUP_FORMAT"] === '"cjs"') {
        // remove trailing `/index.js` in CommonJS builds
        return { path: args.path.replace(/\/index.js$/, ""), external: true };
      }
      return { path: args.path, external: true };
    });
    // handle "client component" boundary imports
    build.onResolve({ filter: /\.cc\.js$/ }, async (args) => {
      if (build.initialOptions.define["TSUP_FORMAT"] === '"cjs"') {
        return {
          path: args.path.replace(/\.cc\.js$/, ".cc.cjs"),
          external: true,
        };
      }
      return { path: args.path, external: true };
    });
  },
};
