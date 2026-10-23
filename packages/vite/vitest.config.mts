import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Each test runs real Vite builds or a dev server.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
