import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  ssr: {
    optimizeDeps: {
      exclude: ["@apollo/client"],
    },
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackStart(),
    viteReact(),
    nitro({
      config: { preset: process.env.VERCEL ? "vercel" : "node_server" },
    }),
  ],
});
