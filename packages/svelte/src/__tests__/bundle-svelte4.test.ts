// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Bundles the adapter source with Vite against a Svelte 4-shaped `svelte`
// package (no `./reactivity`, no `./server`). Any bare `svelte/*` import that
// only Svelte 5 has fails this build, as it fails a real Svelte 4 app build.

interface OutputChunk {
  type: string;
  fileName: string;
  code?: string;
}
type BuildResult = { output: OutputChunk[] } | { output: OutputChunk[] }[];
type ViteBuild = (config: Record<string, unknown>) => Promise<BuildResult>;

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

let project: string;
let build: ViteBuild;

beforeAll(async () => {
  // Vite isn't a dependency of this package; load the copy vitest runs on.
  const require = createRequire(import.meta.url);
  const vitePkg = createRequire(require.resolve('vitest/package.json')).resolve(
    'vite/package.json'
  );
  const vite = (await import(
    pathToFileURL(join(dirname(vitePkg), 'dist/node/index.js')).href
  )) as { build: ViteBuild };
  build = vite.build;

  project = mkdtempSync(join(tmpdir(), 'tuvix-svelte4-'));
  const svelte = join(project, 'node_modules', 'svelte');
  mkdirSync(svelte, { recursive: true });
  writeFileSync(
    join(svelte, 'package.json'),
    JSON.stringify({
      name: 'svelte',
      version: '4.2.20',
      type: 'module',
      exports: {
        '.': './index.js',
        './store': './store.js',
        './package.json': './package.json',
      },
    })
  );
  writeFileSync(
    join(svelte, 'index.js'),
    'export function tick() { return Promise.resolve(); }\nexport function onMount() {}\n'
  );
  writeFileSync(join(svelte, 'store.js'), 'export function writable() {}\n');
  writeFileSync(join(project, 'importer.js'), '');
});

afterAll(() => {
  rmSync(project, { recursive: true, force: true });
});

/** Resolve every `svelte` and `svelte/*` import as the Svelte 4 project would. */
function svelte4Resolver(): Record<string, unknown> {
  return {
    name: 'resolve-svelte-from-svelte4-project',
    enforce: 'pre',
    async resolveId(
      this: {
        resolve(
          id: string,
          importer: string,
          options: { skipSelf: boolean }
        ): Promise<unknown>;
      },
      id: string
    ) {
      if (id !== 'svelte' && !id.startsWith('svelte/')) return null;
      return this.resolve(id, join(project, 'importer.js'), {
        skipSelf: true,
      });
    },
  };
}

function bundle(entry: string, ssr: boolean): Promise<BuildResult> {
  return build({
    root: project,
    configFile: false,
    logLevel: 'silent',
    plugins: [svelte4Resolver()],
    ssr: ssr ? { noExternal: true } : undefined,
    build: {
      write: false,
      minify: false,
      ...(ssr
        ? { ssr: entry }
        : { lib: { entry, formats: ['es'], fileName: 'out' } }),
      rollupOptions: { external: [/^@tuvix\.js\//] },
    },
  });
}

function chunks(result: BuildResult): OutputChunk[] {
  return (Array.isArray(result) ? result : [result]).flatMap((r) => r.output);
}

describe('bundling against Svelte 4', () => {
  it('reproduces the failure for an import only Svelte 5 has', async () => {
    const entry = join(project, 'svelte5-only.js');
    writeFileSync(
      entry,
      "export const load = () => import('svelte/reactivity');\n"
    );

    await expect(bundle(entry, false)).rejects.toThrow(/reactivity/);
  });

  it('builds the client adapter', async () => {
    const output = chunks(await bundle(join(SRC, 'index.ts'), false));
    const code = output.map((chunk) => chunk.code ?? '').join('\n');

    expect(code).toContain('createSvelteMicroApp');
    expect(code).not.toContain('svelte/reactivity');
    // The stub's `tick` got bundled, so `svelte` resolved to the Svelte 4 stub.
    expect(code).toContain('Promise.resolve()');
  });

  it('builds the server renderer with Svelte bundled in', async () => {
    const output = chunks(await bundle(join(SRC, 'server.ts'), true));
    const code = output.map((chunk) => chunk.code ?? '').join('\n');

    expect(code).toContain('renderSvelteToString');
  });
});
