import { test as base, expect } from "@playwright/test";

const WHITELISTED_ERRORS = [
  "favicon.ico",
  "content.js",
  "the server responded with a status of 404",
  "%cDownload the React DevTools",
  "DevTools",
  "Manifest:",
  "[vite]",
];

function isWhitelisted(text: string): boolean {
  return WHITELISTED_ERRORS.some((pattern) => text.includes(pattern));
}

export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];

    page.on("pageerror", (err) => {
      if (!isWhitelisted(err.message)) {
        errors.push(`[pageerror] ${err.message}`);
      }
    });

    page.on("console", (msg) => {
      if (msg.type() === "error" && !isWhitelisted(msg.text())) {
        errors.push(`[console.error] ${msg.text()}`);
      }
    });

    await use(errors);

    expect(errors, "Console errors detected during test").toEqual([]);
  },
});

export { expect };
