import { expect } from "@playwright/test";
import { test } from "../fixture";
import { matchesTag } from "./helpers";

const regex_connection_closed_early =
  /streaming connection closed before server query could be fully transported, rerunning/i;
const regex_query_error_restart =
  /query failed on server, rerunning in browser/i;
const reactErr419 = /(Minified React error #419|Switched to client rendering)/;

const base = matchesTag("@nextjs") ? "/cc/dynamic" : "";
test.describe("CC dynamic", () => {
  test.describe("useSuspenseQuery", () => {
    test(
      "one query",
      {
        tag: ["@nextjs", "@tanstack"],
      },
      async ({ page, blockRequest, hydrationFinished }) => {
        await page.goto(`${base}/useSuspenseQuery`, {
          waitUntil: "commit",
        });

        await expect(page).toBeInitiallyLoading(true);
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();

        await hydrationFinished;
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      }
    );

    test(
      "error during SSR restarts query in browser",
      {
        tag: ["@nextjs", "@tanstack"],
      },
      async ({ page, hydrationFinished }) => {
        page.allowErrors?.();
        let allLogs: string[] = [];
        page.on("console", (message) => {
          allLogs.push(message.text());
        });

        await page.goto(`${base}/useSuspenseQuery?errorLevel=ssr`, {
          waitUntil: "commit",
        });

        await expect(page).toBeInitiallyLoading(true);

        await page.waitForEvent("console", (message) => {
          return regex_query_error_restart.test(message.text());
        });
        await page.waitForEvent("pageerror", (error) => {
          return reactErr419.test(error.message);
        });

        await hydrationFinished;
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();

        for (const log of allLogs) {
          expect(log).not.toMatch(regex_connection_closed_early);
        }
      }
    );
  });

  test.describe("useBackgroundQuery + useReadQuery", () => {
    test(
      "one query",
      {
        tag: ["@nextjs", "@tanstack"],
      },
      async ({ page, blockRequest, hydrationFinished }) => {
        await page.goto(`${base}/useBackgroundQuery`, {
          waitUntil: "commit",
        });

        await expect(page).toBeInitiallyLoading(true);
        await expect(page.getByText("loading")).not.toBeVisible();
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();

        await hydrationFinished;
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      }
    );

    // Next.js will close the connection prematurely if `useReadQuery` is not used
    // we want to ensure it logs a message that it restarts the query in the browser
    test(
      "no `useReadQuery` on the server - restarts in the browser",
      { tag: ["@nextjs"] },
      async ({ page }) => {
        await page.goto(`${base}/useBackgroundQueryWithoutSsrReadQuery`, {
          waitUntil: "commit",
        });

        await expect(page.getByText("rendered on server")).toBeVisible();

        await page.waitForEvent("console", (message) => {
          return regex_connection_closed_early.test(message.text());
        });

        await expect(page.getByText("rendered on client")).toBeVisible();
        await expect(page.getByText("loading")).toBeVisible();
        await expect(page.getByText("loading")).not.toBeVisible();
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      }
    );
    test(
      "no `useReadQuery` on the server - streams over without a browser network request",
      { tag: ["@tanstack"] },
      async ({ page, blockRequest }) => {
        await page.goto(`${base}/useBackgroundQueryWithoutSsrReadQuery`, {
          waitUntil: "commit",
        });

        await expect(page.getByText("rendered on server")).toBeVisible();

        await expect(page.getByText("rendered on client")).toBeVisible();
        await expect(page.getByText("loading")).toBeVisible();
        await expect(page.getByText("loading")).not.toBeVisible();
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      }
    );
  });
  test.describe("useQuery", () => {
    test(
      "without cache value",
      { tag: ["@nextjs", "@tanstack"] },
      async ({ page }) => {
        await page.goto(`${base}/useQuery`, {
          waitUntil: "commit",
        });

        await expect(page).toBeInitiallyLoading(true);
        await expect(page.getByText("loading")).not.toBeVisible();
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      }
    );

    test(
      "with cache value",
      { tag: ["@nextjs", "@tanstack"] },
      async ({ page }) => {
        await page.goto(`${base}/useQueryWithCache`, {
          waitUntil: "commit",
        });

        await expect(page).toBeInitiallyLoading(false);
        await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      }
    );
  });

  test(
    "useSuspenseQuery with @defer, success",
    { tag: ["@tanstack"] },
    async ({ page }) => {
      await page.goto(`${base}/useSuspenseQuery-defer`, {
        waitUntil: "commit",
      });

      // main data already there
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      expect(await page.getByText("Queried in SSR environment").count()).toBe(
        1
      );
      // deferred chunks still loading
      expect(await page.getByText("loading...").count()).toBe(6);
      // deferred chunk came in
      await expect(page.getByText("cuteness overload")).toBeVisible();
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(await page.getByText("Queried in SSR environment").count()).toBe(
        7
      );
      expect(await page.getByText("loading...").count()).toBe(0);
    }
  );

  test(
    "useSuspenseQuery with @defer, error in deferred chunk",
    { tag: ["@tanstack"] },
    async ({ page }) => {
      await page.goto(
        `${base}/useSuspenseQuery-defer?errorIn=ssr,incremental_chunk_error_alpha2`,
        {
          waitUntil: "commit",
        }
      );

      // main data already there
      await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
      expect(await page.getByText("Queried in SSR environment").count()).toBe(
        1
      );
      // deferred chunks still loading
      expect(await page.getByText("loading...").count()).toBe(6);
      // deferred chunk came in
      await expect(page.getByText("cuteness overload")).toBeVisible();
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(
        await page.getByText("Queried in Browser environment").count()
      ).toBe(7);
      expect(await page.getByText("loading...").count()).toBe(0);
    }
  );

  test.describe("useSuspenseQuery with a nonce", () => {
    test(
      "invalid: logs an error",
      { tag: ["@nextjs"] },
      async ({ page, blockRequest }) => {
        await page.goto(`${base}/useSuspenseQuery?nonce=invalid`, {
          waitUntil: "commit",
        });

        await page.waitForEvent("console", (message) => {
          return /^Refused to execute inline script because it violates the following Content Security Policy/.test(
            message.text()
          );
        });
      }
    );
    test(
      "valid: does not log an error",
      { tag: ["@nextjs"] },
      async ({ page, blockRequest }) => {
        await page.goto(
          `${base}/useSuspenseQuery?nonce=8IBTHwOdqNKAWeKl7plt8g==`,
          {
            waitUntil: "commit",
          }
        );

        const messagePromise = page.waitForEvent("console");
        expect(messagePromise).rejects.toThrow(/waiting for event \"console\"/);
      }
    );
  });

  test("async loader", { tag: ["@react-router"] }, async ({ page }) => {
    await page.goto(`${base}/asyncLoader`, {
      waitUntil: "commit",
    });

    // main data already there
    await expect(page.getByText("Soft Warm Apollo Beanie")).toBeVisible();
    expect(await page.getByText("Queried in SSR environment").count()).toBe(1);
    // deferred chunks still loading
    expect(await page.getByText("loading...").count()).toBe(6);
    // deferred chunk came in
    await expect(page.getByText("cuteness overload")).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 500));

    expect(await page.getByText("Queried in SSR environment").count()).toBe(7);
    expect(await page.getByText("loading...").count()).toBe(0);
  });
});
