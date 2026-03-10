import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  dts: false,
  splitting: false,
  sourcemap: false,
  clean: true,
  treeshake: true,
  minify: false,
  banner: { js: '#!/usr/bin/env node' },
});
