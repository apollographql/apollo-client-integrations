import { defineConfig, devices } from "@playwright/test";
import { resolve } from "node:path";
import { parseArgs } from "node:util";

if (!process.env.GREP) {
  const {
    values: { grep },
  } = parseArgs({
    options: {
      grep: {
        type: "string",
        default: "",
      },
    },
    allowPositionals: true,
    strict: false,
  });
  process.env.GREP = JSON.stringify(grep);
}

export default defineConfig({
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "yarn start",
        cwd: process.env.TEST_PROJECT_DIR
          ? resolve(__dirname, process.env.TEST_PROJECT_DIR)
          : undefined,
        port: 3000,
        timeout: 15 * 1000,
        reuseExistingServer: !process.env.CI,
      },
  timeout: 15 * 1000,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  use: {
    // "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
  },
  testDir: "src/",
  retries: 1,
});
