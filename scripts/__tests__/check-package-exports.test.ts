// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  checkPackage,
  collectExportTargets,
  runCheck,
} from '../check-package-exports';

let dir: string;

function writePackage(pkg: object, files: string[]): void {
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg));
  for (const file of files) {
    const full = path.join(dir, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, '');
  }
}

const dualExports = (entry: string) => ({
  import: {
    types: `./dist/${entry}.d.mts`,
    default: `./dist/${entry}.mjs`,
  },
  require: {
    types: `./dist/${entry}.d.ts`,
    default: `./dist/${entry}.cjs`,
  },
});

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tuvix-exports-'));
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('collectExportTargets', () => {
  it('walks subpaths and tags each leaf with its format and types flag', () => {
    const targets = collectExportTargets({
      '.': dualExports('index'),
      './server': dualExports('server'),
    });
    expect(targets).toContainEqual({
      field: 'exports["./server"].require.default',
      target: './dist/server.cjs',
      format: 'require',
      isTypes: false,
    });
    expect(targets).toContainEqual({
      field: 'exports["."].import.types',
      target: './dist/index.d.mts',
      format: 'import',
      isTypes: true,
    });
    expect(targets).toHaveLength(8);
  });
});

describe('checkPackage', () => {
  it('passes when every target exists with the right extension', () => {
    writePackage(
      {
        main: 'dist/index.cjs',
        module: 'dist/index.mjs',
        types: 'dist/index.d.ts',
        exports: {
          '.': dualExports('index'),
          './server': dualExports('server'),
          './package.json': './package.json',
        },
        typesVersions: { '*': { server: ['./dist/server.d.ts'] } },
      },
      [
        'dist/index.cjs',
        'dist/index.mjs',
        'dist/index.d.ts',
        'dist/index.d.mts',
        'dist/server.cjs',
        'dist/server.mjs',
        'dist/server.d.ts',
        'dist/server.d.mts',
      ]
    );
    expect(checkPackage(dir)).toEqual([]);
  });

  it('reports require targets that the build never emitted (the 0.4 .cjs bug)', () => {
    writePackage(
      {
        main: 'dist/index.cjs',
        exports: {
          '.': {
            import: './dist/index.mjs',
            require: {
              types: './dist/index.d.cts',
              default: './dist/index.cjs',
            },
          },
        },
      },
      ['dist/index.js', 'dist/index.mjs', 'dist/index.d.ts']
    );
    expect(checkPackage(dir)).toEqual([
      'main -> dist/index.cjs: file does not exist',
      'exports["."].require.types -> ./dist/index.d.cts: file does not exist',
      'exports["."].require.default -> ./dist/index.cjs: file does not exist',
    ]);
  });

  it('reports an ESM file served under require and a CJS file under import', () => {
    writePackage(
      {
        exports: {
          '.': {
            import: { types: './dist/index.d.ts', default: './dist/index.js' },
            require: './dist/index.mjs',
          },
        },
      },
      ['dist/index.js', 'dist/index.mjs', 'dist/index.d.ts']
    );
    expect(checkPackage(dir)).toEqual([
      'exports["."].import.types -> ./dist/index.d.ts: import types must be .d.mts',
      'exports["."].import.default -> ./dist/index.js: import target must be .mjs',
      'exports["."].require -> ./dist/index.mjs: require target must be .cjs',
    ]);
  });

  it('accepts .js under import when the package is "type": "module"', () => {
    writePackage(
      {
        type: 'module',
        exports: {
          '.': {
            import: { types: './dist/index.d.ts', default: './dist/index.js' },
            require: {
              types: './dist/index.d.cts',
              default: './dist/index.cjs',
            },
          },
        },
      },
      ['dist/index.js', 'dist/index.d.ts', 'dist/index.cjs', 'dist/index.d.cts']
    );
    expect(checkPackage(dir)).toEqual([]);
  });

  it('checks bin entries', () => {
    writePackage({ bin: { 'create-x': 'dist/index.js' } }, []);
    expect(checkPackage(dir)).toEqual([
      'bin.create-x -> dist/index.js: file does not exist',
    ]);
  });
});

describe('runCheck', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it('fails when the packages directory holds no package', () => {
    fs.mkdirSync(path.join(dir, 'not-a-package'));
    expect(runCheck(dir)).toBe(1);
    expect(console.error).toHaveBeenCalledWith(`No packages found in ${dir}.`);
  });

  it('fails when one package points at a missing file', () => {
    const pkgDir = path.join(dir, 'broken');
    fs.mkdirSync(pkgDir);
    fs.writeFileSync(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({ main: 'dist/index.cjs' })
    );
    expect(runCheck(dir)).toBe(1);
  });

  it('passes when every package resolves', () => {
    const pkgDir = path.join(dir, 'ok');
    fs.mkdirSync(path.join(pkgDir, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(pkgDir, 'dist/index.cjs'), '');
    fs.writeFileSync(
      path.join(pkgDir, 'package.json'),
      JSON.stringify({ main: 'dist/index.cjs' })
    );
    expect(runCheck(dir)).toBe(0);
  });
});
