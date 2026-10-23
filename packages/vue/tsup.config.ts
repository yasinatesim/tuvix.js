import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/server.ts'],
  format: ['cjs', 'esm'],
  // index.cjs + index.mjs, so neither file depends on package.json "type".
  // Declarations keep tsup's defaults (index.d.ts for CJS, index.d.mts for
  // ESM): tsup builds them in a worker that ignores outExtension.
  outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.mjs' }),
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['vue', '@vue/server-renderer'],
});
