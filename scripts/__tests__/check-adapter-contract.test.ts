// @vitest-environment node
import { describe, expect, it } from 'vitest';
import * as path from 'node:path';
import {
  checkAdapter,
  checkRepo,
  findRegistryWrites,
  findZoneImports,
  REGISTRY_OWNER,
  type AdapterTarget,
  type SourceInput,
} from '../check-adapter-contract';

const target: AdapterTarget = {
  name: '@tuvix.js/fake',
  dir: 'packages/fake/src',
  factory: 'createFakeMicroApp',
  rules: ['register', 'lifecycle', 'per-container', 'no-zone'],
};

const src = (file: string, text: string): SourceInput => ({
  path: `packages/fake/src/${file}`,
  text,
});

/** A factory that follows the contract, split over three files. */
const goodAdapter = (): SourceInput[] => [
  src('index.ts', `export { createFakeMicroApp } from './micro-app';\n`),
  src(
    'events.ts',
    `import { emitLifecycle } from '@tuvix.js/loader';
const ERROR = 'error';
export function reportError(name: string, container: HTMLElement, error: unknown) {
  emitLifecycle(ERROR, { name, container, hydrated: false, error });
}
`
  ),
  src(
    'micro-app.ts',
    `import { emitLifecycle, registerModule } from '@tuvix.js/loader';
import { reportError } from './events';

export function createFakeMicroApp(config: { name: string }) {
  const instances = new WeakMap<HTMLElement, object>();
  const module = {
    async mount({ container }: { container: HTMLElement }) {
      try {
        instances.set(container, {});
        emitLifecycle('mounted', { name: config.name, container, hydrated: false });
      } catch (error) {
        reportError(config.name, container, error);
        throw error;
      }
    },
    async unmount({ container }: { container: HTMLElement }) {
      instances.delete(container);
      container.replaceChildren();
      emitLifecycle('unmounted', { name: config.name, container, hydrated: false });
    },
  };
  registerModule(config.name, module);
  return module;
}
`
  ),
];

function withFile(file: string, text: string): SourceInput[] {
  return goodAdapter().map((s) =>
    s.path.endsWith(`/${file}`) ? src(file, text) : s
  );
}

const rulesOf = (sources: SourceInput[]) =>
  checkAdapter(target, sources).map((v) => v.rule);

describe('checkAdapter', () => {
  it('accepts a factory that follows every rule across files and re-exports', () => {
    expect(checkAdapter(target, goodAdapter())).toEqual([]);
  });

  it('flags a factory that never calls registerModule', () => {
    const sources = withFile(
      'micro-app.ts',
      goodAdapter()[2].text.replace(
        'registerModule(config.name, module);',
        '(window as any).x = module;'
      )
    );
    expect(rulesOf(sources)).toEqual(['register']);
  });

  it('flags a registerModule that is not the loader export', () => {
    const sources = withFile(
      'micro-app.ts',
      goodAdapter()[2]
        .text.replace(
          "import { emitLifecycle, registerModule } from '@tuvix.js/loader';",
          "import { emitLifecycle } from '@tuvix.js/loader';"
        )
        .concat('\nfunction registerModule(_n: string, _m: unknown) {}\n')
    );
    expect(rulesOf(sources)).toEqual(['register']);
  });

  it('flags registerModule that only sits in code the factory never reaches', () => {
    const sources = withFile(
      'micro-app.ts',
      goodAdapter()[2]
        .text.replace('registerModule(config.name, module);', '')
        .concat(
          '\nexport function unused(m: any) { registerModule("x", m); }\n'
        )
    );
    expect(rulesOf(sources)).toEqual(['register']);
  });

  it('names each lifecycle type the factory never emits', () => {
    const sources = withFile('events.ts', `export function reportError() {}\n`);
    const violations = checkAdapter(target, sources);
    expect(violations.map((v) => v.rule)).toEqual(['lifecycle']);
    expect(violations[0].message).toContain("'error'");
    expect(violations[0].message).not.toContain("'mounted'");
  });

  it('flags a module-level singleton instead of a per-container WeakMap', () => {
    const sources = withFile(
      'micro-app.ts',
      goodAdapter()[2]
        .text.replace(
          'const instances = new WeakMap<HTMLElement, object>();',
          ''
        )
        .replace('instances.set(container, {});', 'root = {};')
        .replace('instances.delete(container);', 'root = null;')
        .replace(
          'export function',
          'let root: object | null = null;\nexport function'
        )
    );
    expect(rulesOf(sources)).toEqual(['per-container']);
  });

  it('flags zone.js imports anywhere in the package', () => {
    const sources = [
      ...goodAdapter(),
      src('polyfills.ts', `import 'zone.js';\n`),
    ];
    expect(rulesOf(sources)).toEqual(['no-zone']);
  });

  it('reports a factory it cannot find', () => {
    const violations = checkAdapter(
      { ...target, factory: 'createMissing' },
      goodAdapter()
    );
    expect(violations).toHaveLength(1);
    expect(violations[0].message).toContain('not found');
  });

  it('skips walk rules a target does not list', () => {
    const sources = withFile('events.ts', `export function reportError() {}\n`);
    expect(
      checkAdapter({ ...target, rules: ['register', 'no-zone'] }, sources)
    ).toEqual([]);
  });
});

describe('findZoneImports', () => {
  const scan = (text: string) =>
    findZoneImports({ path: 'packages/fake/src/a.ts', text });

  it.each([
    [`import 'zone.js';`],
    [`import 'zone.js/testing';`],
    [`export * from 'zone.js';`],
    [`async function f() { await import('zone.js'); }`],
    [`const z = require('zone.js');`],
    [`import z = require('zone.js');`],
  ])('flags %s', (text) => {
    expect(scan(text).map((v) => v.rule)).toEqual(['no-zone']);
  });

  it('ignores zone.js mentioned in a string or comment', () => {
    expect(
      scan(`// import 'zone.js'\nthrow new Error("zone.js is not loaded");`)
    ).toEqual([]);
  });
});

describe('findRegistryWrites', () => {
  const scan = (text: string, file = 'packages/fake/src/a.ts') =>
    findRegistryWrites({ path: file, text });

  it.each([
    ['assignment', `(window as any).__TUVIX_MODULES__ = {};`],
    ['entry assignment', `(window as any).__TUVIX_MODULES__['app'] = m;`],
    ['element access key', `(window as any)['__TUVIX_MODULES__'] = {};`],
    [
      'constant key',
      `const KEY = '__TUVIX_MODULES__';\n(window as any)[KEY][name] = m;`,
    ],
    ['logical assignment', `(window as any).__TUVIX_MODULES__ ??= {};`],
    [
      'alias write',
      `const reg = (window as any).__TUVIX_MODULES__ ?? {};\nreg[name] = m;`,
    ],
    ['delete', `delete (window as any).__TUVIX_MODULES__.app;`],
    [
      'Object.assign',
      `Object.assign((window as any).__TUVIX_MODULES__, { app: m });`,
    ],
    [
      'Object.defineProperty',
      `Object.defineProperty(window, '__TUVIX_MODULES__', { value: {} });`,
    ],
    [
      'Reflect.set',
      `Reflect.set((window as any).__TUVIX_MODULES__, 'app', m);`,
    ],
    ['plain JS', `window.__TUVIX_MODULES__.app = m;`],
  ])('flags %s', (_label, text) => {
    expect(scan(text).map((v) => v.rule)).toEqual(['registry']);
  });

  it('reports the line of the write', () => {
    expect(scan(`const a = 1;\n\nwindow.__TUVIX_MODULES__ = {};`)[0].line).toBe(
      3
    );
  });

  it('allows reads', () => {
    expect(
      scan(
        `const reg = (window as any).__TUVIX_MODULES__;\nconst app = reg?.app;\nconst b = window.__TUVIX_MODULES__['x'];`
      )
    ).toEqual([]);
  });

  it('exempts the runtime that owns the registry', () => {
    expect(
      scan(`(window as any).__TUVIX_MODULES__ = {};`, REGISTRY_OWNER)
    ).toEqual([]);
  });
});

describe('checkRepo', () => {
  it('passes on this repository', () => {
    const root = path.resolve(__dirname, '..', '..');
    expect(checkRepo(root)).toEqual([]);
  });
});
