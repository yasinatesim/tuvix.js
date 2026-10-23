// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import { createRequire } from 'module';
import * as path from 'path';
import { build, transform } from 'esbuild';
import { createProject, TUVIX_VERSION_RANGE } from '../create-project';

const TEMPLATES = [
  'shell',
  'react-app',
  'vue-app',
  'vanilla-app',
  'svelte-app',
  'angular-app',
] as const;

const ADAPTER: Record<(typeof TEMPLATES)[number], string | null> = {
  shell: null,
  'vanilla-app': null,
  'react-app': '@tuvix.js/react',
  'vue-app': '@tuvix.js/vue',
  'svelte-app': '@tuvix.js/svelte',
  'angular-app': '@tuvix.js/angular',
};

let projectDir: string | undefined;

async function scaffold(
  template: string,
  typescript: boolean
): Promise<string> {
  // createProject only writes inside process.cwd(), and vitest workers cannot chdir.
  const name = `.tmp/tuvix-scaffold-${template}-${process.pid}-${Date.now()}`;
  projectDir = path.resolve(process.cwd(), name);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  await createProject({ name, template, typescript });
  return projectDir;
}

function readPackageJson(dir: string): {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
}

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

/**
 * Bundles a generated file with the named imports replaced by stub modules,
 * runs it, and returns its default export.
 */
async function runWithStubs(
  entry: string,
  stubs: Record<string, string>
): Promise<unknown> {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'neutral',
    plugins: [
      {
        name: 'stubs',
        setup(b) {
          b.onResolve({ filter: /.*/ }, (args) =>
            args.path in stubs
              ? { path: args.path, namespace: 'stub' }
              : undefined
          );
          b.onLoad({ filter: /.*/, namespace: 'stub' }, (args) => ({
            contents: stubs[args.path],
            loader: 'js',
          }));
        },
      },
    ],
  });
  const code = result.outputFiles[0]!.text;
  // The module only exists as bundler output, so it needs a runtime import.
  const mod: { default: unknown } = await import(
    `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`
  );
  return mod.default;
}

/** Runs a generated vite.config.ts and returns the plugin names it registers. */
async function vitePluginNames(
  dir: string,
  pluginModule: string,
  pluginName: string,
  namedExport?: string
): Promise<string[]> {
  const factory = `() => ({ name: '${pluginName}' })`;
  const config = (await runWithStubs(path.join(dir, 'vite.config.ts'), {
    vite: 'export const defineConfig = (c) => c;',
    [pluginModule]: namedExport
      ? `export const ${namedExport} = ${factory};`
      : `export default ${factory};`,
  })) as { plugins: { name: string }[] };
  return config.plugins.map((p) => p.name);
}

afterEach(() => {
  vi.restoreAllMocks();
  if (projectDir) fs.rmSync(projectDir, { recursive: true, force: true });
  projectDir = undefined;
});

describe('scaffolded package.json', () => {
  it('targets the 0.5 release line', () => {
    expect(TUVIX_VERSION_RANGE).toBe('^0.5.0');
  });

  for (const template of TEMPLATES) {
    it(`${template}: every tuvix dependency uses ^0.5.0`, async () => {
      const dir = await scaffold(template, true);
      const { dependencies, devDependencies } = readPackageJson(dir);
      const all = { ...dependencies, ...devDependencies };
      const tuvixDeps = Object.entries(all).filter(
        ([name]) => name === 'tuvix.js' || name.startsWith('@tuvix.js/')
      );

      expect(dependencies['tuvix.js']).toBe('^0.5.0');
      for (const [name, range] of tuvixDeps) {
        expect(`${name}@${range}`).toBe(`${name}@^0.5.0`);
      }

      const adapter = ADAPTER[template];
      const adapters = tuvixDeps
        .map(([name]) => name)
        .filter((name) => name !== 'tuvix.js');
      expect(adapters).toEqual(adapter ? [adapter] : []);
    });
  }

  it('angular-app depends on @tuvix.js/angular and ships no zone.js', async () => {
    const dir = await scaffold('angular-app', false);
    const { dependencies } = readPackageJson(dir);

    expect(dependencies['@tuvix.js/angular']).toBe('^0.5.0');
    expect(dependencies['@tuvix.js/core']).toBeUndefined();
    expect(dependencies['zone.js']).toBeUndefined();
    // The adapter compiles JIT components at runtime.
    expect(dependencies['@angular/compiler']).toBeDefined();
  });
});

describe('scaffolded sources compile', () => {
  for (const template of TEMPLATES) {
    for (const typescript of [true, false]) {
      it(`${template} (${typescript ? 'ts' : 'js'}) passes esbuild`, async () => {
        const dir = await scaffold(template, typescript);
        // Declaration files emit no JavaScript, so they have nothing to check here.
        const sources = listFiles(dir).filter(
          (file) => /\.(ts|tsx|js|jsx)$/.test(file) && !file.endsWith('.d.ts')
        );
        expect(sources.length).toBeGreaterThan(0);

        for (const file of sources) {
          const ext = path.extname(file).slice(1) as
            'ts' | 'tsx' | 'js' | 'jsx';
          const result = await transform(fs.readFileSync(file, 'utf-8'), {
            loader: ext,
            format: 'esm',
            jsx: 'automatic',
            tsconfigRaw: {
              compilerOptions: { experimentalDecorators: true },
            },
          });
          expect(result.code.length, path.relative(dir, file)).toBeGreaterThan(
            0
          );
        }
      });
    }
  }
});

describe('index.html loads the generated entry', () => {
  for (const template of TEMPLATES) {
    for (const typescript of [true, false]) {
      it(`${template} (${typescript ? 'ts' : 'js'})`, async () => {
        const dir = await scaffold(template, typescript);
        const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf-8');
        const scripts = [
          ...html.matchAll(/<script type="module" src="([^"]+)"><\/script>/g),
        ].map((m) => m[1]!);

        // Angular is always TypeScript; React uses JSX extensions.
        const ts = typescript || template === 'angular-app';
        const ext =
          template === 'react-app' ? (ts ? 'tsx' : 'jsx') : ts ? 'ts' : 'js';
        expect(scripts).toEqual([`/src/main.${ext}`]);
        expect(fs.existsSync(path.join(dir, `src/main.${ext}`))).toBe(true);
      });
    }
  }
});

describe('vue-app builds with the Vue plugin', () => {
  // The CLI has no vue dependency; borrow the adapter's Vue SFC compiler.
  const vueRequire = createRequire(
    path.resolve(__dirname, '../../../vue/package.json')
  );
  const sfc = vueRequire('vue/compiler-sfc') as {
    parse: (
      source: string,
      options: { filename: string }
    ) => { descriptor: unknown; errors: unknown[] };
    compileScript: (
      descriptor: unknown,
      options: { id: string }
    ) => { content: string };
  };

  for (const typescript of [true, false]) {
    it(`App.vue (${typescript ? 'ts' : 'js'}) compiles and main imports it`, async () => {
      const dir = await scaffold('vue-app', typescript);
      const file = path.join(dir, 'src/App.vue');
      const { descriptor, errors } = sfc.parse(fs.readFileSync(file, 'utf-8'), {
        filename: file,
      });
      expect(errors).toEqual([]);
      // compileScript throws on invalid <script setup> (e.g. bad defineProps).
      expect(sfc.compileScript(descriptor, { id: 'app' }).content).toContain(
        'setup'
      );

      const main = fs.readFileSync(
        path.join(dir, `src/main.${typescript ? 'ts' : 'js'}`),
        'utf-8'
      );
      expect(main).toMatch(/^import App from '\.\/App\.vue';$/m);
    });
  }

  it('adds @vitejs/plugin-vue and registers it in vite.config.ts', async () => {
    const dir = await scaffold('vue-app', true);
    const { devDependencies } = readPackageJson(dir);
    expect(devDependencies['@vitejs/plugin-vue']).toBe('^5.2.0');
    expect(
      await vitePluginNames(dir, '@vitejs/plugin-vue', 'vite:vue')
    ).toEqual(['vite:vue']);
  });
});

describe('react-app compiles JSX with the automatic runtime', () => {
  // Without @vitejs/plugin-react, Vite compiles .jsx with the classic runtime
  // and the JS template's App.jsx throws "React is not defined".
  for (const typescript of [true, false]) {
    it(`registers @vitejs/plugin-react (${typescript ? 'ts' : 'js'})`, async () => {
      const dir = await scaffold('react-app', typescript);
      const { devDependencies } = readPackageJson(dir);
      expect(devDependencies['@vitejs/plugin-react']).toBe('^4.3.0');
      expect(
        await vitePluginNames(dir, '@vitejs/plugin-react', 'vite:react-babel')
      ).toEqual(['vite:react-babel']);
    });
  }
});

describe('svelte-app targets Svelte 5', () => {
  // The CLI has no svelte dependency; borrow the adapter's Svelte 5 compiler.
  const svelteRequire = createRequire(
    path.resolve(__dirname, '../../../svelte/package.json')
  );
  const { compile, VERSION } = svelteRequire('svelte/compiler') as {
    compile: (
      source: string,
      options: { filename: string; runes: boolean; generate: 'client' }
    ) => { js: { code: string } };
    VERSION: string;
  };

  it('pins Svelte 5 tooling', async () => {
    const dir = await scaffold('svelte-app', true);
    const { dependencies, devDependencies } = readPackageJson(dir);

    expect(dependencies['svelte']).toBe('^5.0.0');
    expect(devDependencies['@sveltejs/vite-plugin-svelte']).toBe('^5.0.0');
    expect(devDependencies['svelte-check']).toBe('^4.0.0');
  });

  it('leaves svelte-check out of the JavaScript variant', async () => {
    const dir = await scaffold('svelte-app', false);
    const { dependencies, devDependencies } = readPackageJson(dir);

    expect(dependencies['svelte']).toBe('^5.0.0');
    expect(devDependencies['svelte-check']).toBeUndefined();
  });

  for (const typescript of [true, false]) {
    it(`App.svelte (${typescript ? 'ts' : 'js'}) compiles in runes mode`, async () => {
      expect(VERSION.startsWith('5.')).toBe(true);
      const dir = await scaffold('svelte-app', typescript);
      const file = path.join(dir, 'src/App.svelte');

      // Runes mode rejects Svelte 4 `export let` props.
      const { js } = compile(fs.readFileSync(file, 'utf-8'), {
        filename: file,
        runes: true,
        generate: 'client',
      });
      expect(js.code).toContain('$.prop(');
    });

    it(`main (${typescript ? 'ts' : 'js'}) passes SvelteMap from svelte/reactivity`, async () => {
      const dir = await scaffold('svelte-app', typescript);
      const entry = path.join(dir, `src/main.${typescript ? 'ts' : 'js'}`);

      const microApp = (await runWithStubs(entry, {
        'svelte/reactivity': 'export class SvelteMap extends Map {}',
        '@tuvix.js/svelte':
          'export const createSvelteMicroApp = (config) => ({ config });',
        './App.svelte': 'export default function App() {}',
      })) as { config: { name: string; App: unknown; SvelteMap?: unknown } };

      const { config } = microApp;
      expect(config.name).toBe('my-svelte-app');
      expect(typeof config.App).toBe('function');
      expect(typeof config.SvelteMap).toBe('function');
      const map = new (config.SvelteMap as new () => Map<string, unknown>)();
      expect(map).toBeInstanceOf(Map);
    });

    it(`svelte.config.js (${typescript ? 'ts' : 'js'}) preprocesses with vitePreprocess`, async () => {
      // svelte-check fails with "No Svelte configuration found" without it.
      const dir = await scaffold('svelte-app', typescript);
      const config = (await runWithStubs(path.join(dir, 'svelte.config.js'), {
        '@sveltejs/vite-plugin-svelte':
          "export const vitePreprocess = () => ({ name: 'vitePreprocess' });",
      })) as { preprocess: { name: string } };
      expect(config.preprocess).toEqual({ name: 'vitePreprocess' });
      expect(
        await vitePluginNames(
          dir,
          '@sveltejs/vite-plugin-svelte',
          'vite-plugin-svelte',
          'svelte'
        )
      ).toEqual(['vite-plugin-svelte']);
    });
  }
});
