import { describe, it, expect } from 'vitest';
import {
  parseExportsFromContent,
  extractCodeBlocks,
  parseImports,
  validateContent,
  TUVIX_PACKAGES,
} from '../validate-code-examples';

// ─── parseExportsFromContent ────────────────────────────

describe('parseExportsFromContent', () => {
  it('parses named re-exports from braces', () => {
    const content = `export { Router, createRouter } from './router';`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('Router');
    expect(exports).toContain('createRouter');
  });

  it('parses type re-exports', () => {
    const content = `export type { RouterConfig, IRouter } from './types';`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('RouterConfig');
    expect(exports).toContain('IRouter');
  });

  it('parses export function declarations', () => {
    const content = `export function createReactMicroApp(config: Config): Module {}`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('createReactMicroApp');
  });

  it('parses export async function declarations', () => {
    const content = `export async function loadModule(): Promise<void> {}`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('loadModule');
  });

  it('parses export class declarations', () => {
    const content = `export class EventBus {}`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('EventBus');
  });

  it('parses export const declarations', () => {
    const content = `export const DEFAULT_TIMEOUT = 5000;`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('DEFAULT_TIMEOUT');
  });

  it('parses export interface declarations', () => {
    const content = `export interface ReactMicroAppConfig { name: string; }`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('ReactMicroAppConfig');
  });

  it('parses export enum declarations', () => {
    const content = `export enum OrchestratorEvent { APP_MOUNTED = 'app:mounted' }`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('OrchestratorEvent');
  });

  it('parses export type alias declarations', () => {
    const content = `export type VueSsrMicroAppConfig = VueMicroAppConfig;`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('VueSsrMicroAppConfig');
  });

  it('handles "as" aliases in braced exports', () => {
    const content = `export { Foo as Bar } from './foo';`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('Bar');
    expect(exports).not.toContain('Foo');
  });

  it('parses multiple export blocks from the same content', () => {
    const content = `
export { A, B } from './a';
export { C } from './c';
export function doStuff() {}
export class MyClass {}
`;
    const exports = parseExportsFromContent(content);
    expect(exports.size).toBe(5);
    expect(exports).toContain('A');
    expect(exports).toContain('B');
    expect(exports).toContain('C');
    expect(exports).toContain('doStuff');
    expect(exports).toContain('MyClass');
  });

  it('returns empty set for empty content', () => {
    const exports = parseExportsFromContent('');
    expect(exports.size).toBe(0);
  });

  it('ignores non-export declarations', () => {
    const content = `
const internal = 42;
function helper() {}
class Private {}
`;
    const exports = parseExportsFromContent(content);
    expect(exports.size).toBe(0);
  });

  it('ignores exports inside block comments (JSDoc examples)', () => {
    const content = `
/**
 * @example
 * \`\`\`ts
 * export const Route = createFileRoute('/github')({});
 * \`\`\`
 */
export function realExport() {}
`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('realExport');
    expect(exports).not.toContain('Route');
    expect(exports.size).toBe(1);
  });

  it('ignores exports inside single-line comments', () => {
    const content = `
// export const ignored = true;
export const real = true;
`;
    const exports = parseExportsFromContent(content);
    expect(exports).toContain('real');
    expect(exports).not.toContain('ignored');
  });
});

// ─── extractCodeBlocks ──────────────────────────────────

describe('extractCodeBlocks', () => {
  it('extracts a TypeScript code block', () => {
    const md = [
      'Some text',
      '```ts',
      'import { Foo } from "bar";',
      'const x = 1;',
      '```',
      'More text',
    ].join('\n');

    const blocks = extractCodeBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.language).toBe('ts');
    expect(blocks[0]!.code).toContain('import { Foo }');
    expect(blocks[0]!.startLine).toBe(3); // 1-indexed, line after ```ts
  });

  it('extracts multiple code blocks with different languages', () => {
    const md = [
      '```typescript',
      'const a = 1;',
      '```',
      '',
      '```js',
      'const b = 2;',
      '```',
    ].join('\n');

    const blocks = extractCodeBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.language).toBe('typescript');
    expect(blocks[1]!.language).toBe('js');
  });

  it('extracts tsx code blocks', () => {
    const md = ['```tsx', '<div />', '```'].join('\n');
    const blocks = extractCodeBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.language).toBe('tsx');
  });

  it('extracts javascript code blocks', () => {
    const md = ['```javascript', 'var x = 1;', '```'].join('\n');
    const blocks = extractCodeBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.language).toBe('javascript');
  });

  it('extracts jsx code blocks', () => {
    const md = ['```jsx', '<App />', '```'].join('\n');
    const blocks = extractCodeBlocks(md);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.language).toBe('jsx');
  });

  it('ignores non-JS/TS code blocks', () => {
    const md = [
      '```bash',
      'npm install',
      '```',
      '',
      '```html',
      '<div></div>',
      '```',
      '',
      '```json',
      '{ "key": "value" }',
      '```',
    ].join('\n');

    const blocks = extractCodeBlocks(md);
    expect(blocks).toHaveLength(0);
  });

  it('ignores vue code blocks', () => {
    const md = ['```vue', '<template><div /></template>', '```'].join('\n');
    const blocks = extractCodeBlocks(md);
    expect(blocks).toHaveLength(0);
  });

  it('returns empty array for markdown with no code blocks', () => {
    const md = 'Just some text\nMore text\n';
    const blocks = extractCodeBlocks(md);
    expect(blocks).toHaveLength(0);
  });

  it('correctly tracks line numbers for multiple blocks', () => {
    const md = [
      'Line 1',
      '```ts',
      'code line 1',
      '```',
      'Line 5',
      '```js',
      'code line 2',
      '```',
    ].join('\n');

    const blocks = extractCodeBlocks(md);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.startLine).toBe(3);
    expect(blocks[1]!.startLine).toBe(7);
  });
});

// ─── parseImports ───────────────────────────────────────

describe('parseImports', () => {
  it('parses named imports', () => {
    const code = `import { createRouter, Router } from '@tuvix.js/router';`;
    const imports = parseImports(code, 10);
    expect(imports).toHaveLength(1);
    expect(imports[0]!.symbols).toEqual(['createRouter', 'Router']);
    expect(imports[0]!.packageName).toBe('@tuvix.js/router');
    expect(imports[0]!.line).toBe(10);
  });

  it('parses type imports', () => {
    const code = `import type { RouterConfig, IRouter } from '@tuvix.js/router';`;
    const imports = parseImports(code, 1);
    expect(imports).toHaveLength(1);
    expect(imports[0]!.symbols).toEqual(['RouterConfig', 'IRouter']);
    expect(imports[0]!.packageName).toBe('@tuvix.js/router');
  });

  it('parses default imports', () => {
    const code = `import App from './App.vue';`;
    const imports = parseImports(code, 1);
    expect(imports).toHaveLength(1);
    expect(imports[0]!.symbols).toEqual(['App']);
    expect(imports[0]!.packageName).toBe('./App.vue');
  });

  it('handles aliased imports (as)', () => {
    const code = `import { EventBus as Bus } from '@tuvix.js/event-bus';`;
    const imports = parseImports(code, 1);
    expect(imports).toHaveLength(1);
    // The original symbol name (not alias) should be used for validation
    expect(imports[0]!.symbols).toEqual(['EventBus']);
  });

  it('parses multiple import lines', () => {
    const code = [
      `import { createOrchestrator } from 'tuvix.js';`,
      `import { Router } from '@tuvix.js/router';`,
    ].join('\n');
    const imports = parseImports(code, 5);
    expect(imports).toHaveLength(2);
    expect(imports[0]!.line).toBe(5);
    expect(imports[1]!.line).toBe(6);
  });

  it('handles imports with single quotes', () => {
    const code = `import { Foo } from 'tuvix.js';`;
    const imports = parseImports(code, 1);
    expect(imports).toHaveLength(1);
    expect(imports[0]!.packageName).toBe('tuvix.js');
  });

  it('handles imports with double quotes', () => {
    const code = `import { Foo } from "tuvix.js";`;
    const imports = parseImports(code, 1);
    expect(imports).toHaveLength(1);
    expect(imports[0]!.packageName).toBe('tuvix.js');
  });

  it('returns empty array for code without imports', () => {
    const code = `const x = 1;\nconsole.log(x);`;
    const imports = parseImports(code, 1);
    expect(imports).toHaveLength(0);
  });
});

// ─── validateContent ────────────────────────────────────

describe('validateContent', () => {
  const exportMap = new Map<string, Set<string>>([
    ['tuvix.js', new Set(['createOrchestrator', 'EventBus', 'Router'])],
    ['@tuvix.js/router', new Set(['Router', 'createRouter', 'matchRoute'])],
    [
      '@tuvix.js/event-bus',
      new Set(['EventBus', 'createEventBus', 'getGlobalBus']),
    ],
  ]);

  it('returns no errors for valid imports', () => {
    const md = [
      '# Guide',
      '```ts',
      `import { createOrchestrator, EventBus } from 'tuvix.js';`,
      '```',
    ].join('\n');

    const errors = validateContent(md, '/project/README.md', exportMap, TUVIX_PACKAGES, '/project');
    expect(errors).toHaveLength(0);
  });

  it('returns errors for invalid imports', () => {
    const md = [
      '# Guide',
      '```ts',
      `import { createOrchestrator, nonExistent } from 'tuvix.js';`,
      '```',
    ].join('\n');

    const errors = validateContent(md, '/project/README.md', exportMap, TUVIX_PACKAGES, '/project');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.symbol).toBe('nonExistent');
    expect(errors[0]!.packageName).toBe('tuvix.js');
    expect(errors[0]!.message).toContain('not exported');
  });

  it('skips non-tuvix imports', () => {
    const md = [
      '```ts',
      `import { useState } from 'react';`,
      `import express from 'express';`,
      '```',
    ].join('\n');

    const errors = validateContent(md, '/project/README.md', exportMap, TUVIX_PACKAGES, '/project');
    expect(errors).toHaveLength(0);
  });

  it('reports error for unknown tuvix package (no exports found)', () => {
    const md = [
      '```ts',
      `import { something } from '@tuvix.js/sandbox';`,
      '```',
    ].join('\n');

    // @tuvix.js/sandbox is in TUVIX_PACKAGES but not in our test exportMap
    const errors = validateContent(md, '/project/README.md', exportMap, TUVIX_PACKAGES, '/project');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.message).toContain('no known exports');
  });

  it('validates across multiple code blocks in one file', () => {
    const md = [
      '```ts',
      `import { Router } from '@tuvix.js/router';`,
      '```',
      '',
      '```typescript',
      `import { FakeSymbol } from '@tuvix.js/router';`,
      '```',
    ].join('\n');

    const errors = validateContent(md, '/project/README.md', exportMap, TUVIX_PACKAGES, '/project');
    expect(errors).toHaveLength(1);
    expect(errors[0]!.symbol).toBe('FakeSymbol');
  });

  it('includes correct file path in errors', () => {
    const md = [
      '```ts',
      `import { invalid } from 'tuvix.js';`,
      '```',
    ].join('\n');

    const errors = validateContent(
      md,
      '/project/website/guide/routing.md',
      exportMap,
      TUVIX_PACKAGES,
      '/project'
    );
    expect(errors[0]!.file).toBe('website/guide/routing.md');
  });

  it('includes correct line number in errors', () => {
    const md = [
      '# Title',
      '',
      'Some text',
      '',
      '```ts',
      `import { badSymbol } from 'tuvix.js';`,
      '```',
    ].join('\n');

    const errors = validateContent(md, '/project/file.md', exportMap, TUVIX_PACKAGES, '/project');
    expect(errors).toHaveLength(1);
    // Line 6 in the file (1-indexed): ```ts is line 5, code is line 6
    expect(errors[0]!.line).toBe(6);
  });

  it('handles type imports the same as value imports', () => {
    const md = [
      '```ts',
      `import type { Router } from '@tuvix.js/router';`,
      '```',
    ].join('\n');

    const errors = validateContent(md, '/project/README.md', exportMap, TUVIX_PACKAGES, '/project');
    expect(errors).toHaveLength(0);
  });

  it('returns empty errors for markdown with no code blocks', () => {
    const md = 'Just some text\n\nNothing to see here.';
    const errors = validateContent(md, '/project/README.md', exportMap, TUVIX_PACKAGES, '/project');
    expect(errors).toHaveLength(0);
  });
});

// ─── TUVIX_PACKAGES set ─────────────────────────────────

describe('TUVIX_PACKAGES', () => {
  it('contains all expected package names', () => {
    expect(TUVIX_PACKAGES.has('tuvix.js')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/core')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/router')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/event-bus')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/loader')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/sandbox')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/react')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/vue')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/angular')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/devtools')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/module-federation')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/server')).toBe(true);
    expect(TUVIX_PACKAGES.has('@tuvix.js/svelte')).toBe(true);
  });

  it('does not contain external packages', () => {
    expect(TUVIX_PACKAGES.has('react')).toBe(false);
    expect(TUVIX_PACKAGES.has('vue')).toBe(false);
    expect(TUVIX_PACKAGES.has('express')).toBe(false);
  });
});
