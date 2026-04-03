import { describe, it, expect, beforeAll } from 'vitest';
import * as esbuild from 'esbuild-wasm';

// Initialize esbuild-wasm once for all tests
beforeAll(async () => {
  await esbuild.initialize({ worker: false });
});

describe('esbuild transform (compiler core)', () => {
  it('transpiles TypeScript to ESM', async () => {
    const result = await esbuild.transform(
      `const x: number = 42; console.log(x);`,
      { loader: 'ts', format: 'esm' }
    );
    expect(result.code).toContain('console.log');
    expect(result.code).not.toContain(': number'); // type annotation stripped
  });

  it('returns error for invalid syntax', async () => {
    await expect(
      esbuild.transform(`const x = {{{`, { loader: 'ts', format: 'esm' })
    ).rejects.toThrow();
  });

  it('preserves import statements (ESM output)', async () => {
    const result = await esbuild.transform(
      `import { defineMicroApp } from 'tuvix.js'; export default defineMicroApp({ name: 'x', mount() {}, unmount() {} });`,
      { loader: 'ts', format: 'esm' }
    );
    expect(result.code).toContain("from \"tuvix.js\"");
  });
});
