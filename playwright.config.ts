import { defineConfig } from '@playwright/test';

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
      name: 'with-ssr-react',
      testDir: './examples/with-ssr-react/e2e',
      use: { baseURL: 'http://localhost:3000' },
    },
    {
      name: 'with-module-federation-react',
      testDir: './examples/with-module-federation-react/e2e',
      use: { baseURL: 'http://localhost:3000' },
    },
  ],
  webServer: [
    {
      command: 'pnpm exec vite --port 5173 --strictPort',
      port: 5173,
      cwd: './examples/with-react',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm exec vite --port 5174 --strictPort',
      port: 5174,
      cwd: './examples/with-vue',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm exec vite --port 5175 --strictPort',
      port: 5175,
      cwd: './examples/with-svelte',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm exec ng serve --port 4200',
      port: 4200,
      cwd: './examples/with-angular',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'pnpm exec vite --port 5176 --strictPort',
      port: 5176,
      cwd: './examples/with-react-event-bus',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm exec vite --port 5177 --strictPort',
      port: 5177,
      cwd: './examples/with-react-devtools',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm exec vite --port 5178 --strictPort',
      port: 5178,
      cwd: './examples/with-react-router',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm exec vite --port 5179 --strictPort',
      port: 5179,
      cwd: './examples/with-react-sandbox',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm exec vite --port 5180 --strictPort',
      port: 5180,
      cwd: './examples/with-multiple-frameworks',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
