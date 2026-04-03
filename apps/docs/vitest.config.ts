import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/components/Playground/**/*.ts', 'src/components/Playground/**/*.tsx'],
      exclude: ['src/components/Playground/__tests__/**', 'src/components/Playground/types.ts'],
    },
  },
});
