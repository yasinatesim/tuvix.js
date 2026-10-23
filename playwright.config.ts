import { defineConfig } from '@playwright/test';

const reuseExistingServer = !process.env.CI;

/** One Vite dev server per example, started from the example's directory. */
function vite(example: string, port: number) {
  return {
    command: `pnpm exec vite --port ${port} --strictPort`,
    port,
    cwd: `./examples/${example}`,
    reuseExistingServer,
  };
}

export default defineConfig({
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'website',
      testDir: './website/e2e',
      use: { baseURL: 'http://localhost:5190' },
    },
    {
      name: 'with-react',
      testDir: './examples/with-react/e2e',
      use: { baseURL: 'http://localhost:5173' },
    },
    {
      name: 'with-vue',
      testDir: './examples/with-vue/e2e',
      use: { baseURL: 'http://localhost:5174' },
    },
    {
      name: 'with-svelte',
      testDir: './examples/with-svelte/e2e',
      use: { baseURL: 'http://localhost:5175' },
    },
    {
      name: 'with-angular',
      testDir: './examples/with-angular/e2e',
      use: { baseURL: 'http://localhost:4200' },
    },
    {
      name: 'with-react-event-bus',
      testDir: './examples/with-react-event-bus/e2e',
      use: { baseURL: 'http://localhost:5176' },
    },
    {
      name: 'with-react-devtools',
      testDir: './examples/with-react-devtools/e2e',
      use: { baseURL: 'http://localhost:5177' },
    },
    {
      name: 'with-react-router',
      testDir: './examples/with-react-router/e2e',
      use: { baseURL: 'http://localhost:5178' },
    },
    {
      name: 'with-react-sandbox',
      testDir: './examples/with-react-sandbox/e2e',
      use: { baseURL: 'http://localhost:5179' },
    },
    {
      name: 'with-multiple-frameworks',
      testDir: './examples/with-multiple-frameworks/e2e',
      use: { baseURL: 'http://localhost:5180' },
    },
    {
      name: 'with-vanilla',
      testDir: './examples/with-vanilla/e2e',
      use: { baseURL: 'http://localhost:5181' },
    },
    {
      name: 'with-module-federation-react',
      testDir: './examples/with-module-federation-react/e2e',
      use: { baseURL: 'http://localhost:5182' },
    },
    {
      name: 'with-ssr-react',
      testDir: './examples/with-ssr-react/e2e',
      use: { baseURL: 'http://localhost:3100' },
    },
    {
      name: 'with-ssr-vanilla',
      testDir: './examples/with-ssr-vanilla/e2e',
      use: { baseURL: 'http://localhost:3101' },
    },
    {
      name: 'with-ssr-islands',
      testDir: './examples/with-ssr-islands/e2e',
      use: { baseURL: 'http://localhost:5185' },
    },
  ],
  webServer: [
    {
      command:
        'pnpm --filter @tuvix.js/website exec vitepress dev --port 5190 --strictPort',
      port: 5190,
      reuseExistingServer,
      timeout: 60_000,
    },
    vite('with-react', 5173),
    vite('with-vue', 5174),
    vite('with-svelte', 5175),
    {
      command: 'pnpm exec ng serve --port 4200',
      port: 4200,
      cwd: './examples/with-angular',
      reuseExistingServer,
      timeout: 120_000,
    },
    vite('with-react-event-bus', 5176),
    vite('with-react-devtools', 5177),
    vite('with-react-router', 5178),
    vite('with-react-sandbox', 5179),
    vite('with-multiple-frameworks', 5180),
    vite('with-vanilla', 5181),
    // Module Federation: two webpack remotes (ports fixed in their
    // webpack.config.js and in shell/src/shell.ts) and the Vite shell.
    {
      command: 'pnpm exec webpack serve --config webpack.config.js',
      port: 3001,
      cwd: './examples/with-module-federation-react/remote1',
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: 'pnpm exec webpack serve --config webpack.config.js',
      port: 3002,
      cwd: './examples/with-module-federation-react/remote2',
      reuseExistingServer,
      timeout: 120_000,
    },
    vite('with-module-federation-react/shell', 5182),
    // SSR servers read PORT from the environment.
    {
      command: 'node server.js',
      port: 3100,
      cwd: './examples/with-ssr-react',
      env: { PORT: '3100' },
      reuseExistingServer,
    },
    {
      command: 'node server.js',
      port: 3101,
      cwd: './examples/with-ssr-vanilla',
      env: { PORT: '3101' },
      reuseExistingServer,
    },
    // SSR islands: the spec tests the production build on 5185 and runs one
    // dev-mode smoke test against 5186.
    {
      command:
        'pnpm --filter with-ssr-islands build && pnpm --filter with-ssr-islands start',
      port: 5185,
      env: { PORT: '5185' },
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: 'pnpm --filter with-ssr-islands dev',
      port: 5186,
      env: { PORT: '5186' },
      reuseExistingServer,
      timeout: 60_000,
    },
  ],
});
