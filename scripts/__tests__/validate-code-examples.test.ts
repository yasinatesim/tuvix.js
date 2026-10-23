// @vitest-environment node
import * as path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  ROOT,
  buildTuvixModuleMap,
  checkMarkdown,
  checkedExtension,
  extractCodeBlocks,
  findMarkdownFiles,
  getLocale,
} from '../validate-code-examples';

const fence = '```';

/** Builds a markdown document with one code block. */
function md(code: string, info = 'ts', before = ''): string {
  return `# Fixture\n\n${before}${fence}${info}\n${code}\n${fence}\n`;
}

function check(content: string, rel = 'website/guide/fixture.md') {
  return checkMarkdown([{ path: path.join(ROOT, rel), content }]);
}

const CORRECT = `import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'header',
  entry: 'https://cdn.example.com/header.js',
  container: '#header',
  activeWhen: '/',
});
await orchestrator.start();`;

// ─── extractCodeBlocks ──────────────────────────────────

describe('extractCodeBlocks', () => {
  it('returns language, meta and 1-based start line of the first code line', () => {
    const blocks = extractCodeBlocks(md('const a = 1;', 'ts [main.ts]'));
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      language: 'ts',
      meta: '[main.ts]',
      code: 'const a = 1;',
      startLine: 4,
      indent: 0,
      skip: false,
    });
  });

  it('reads VitePress line-highlight syntax as meta, not language', () => {
    const [block] = extractCodeBlocks(md('x', 'ts{2,3}'));
    expect(block!.language).toBe('ts');
    expect(block!.meta).toBe('{2,3}');
  });

  it('marks no-check fence meta as skipped, alone or after a label', () => {
    expect(extractCodeBlocks(md('x', 'ts no-check'))[0]!.skip).toBe(true);
    expect(extractCodeBlocks(md('x', 'tsx [App.tsx] no-check'))[0]!.skip).toBe(
      true
    );
    expect(extractCodeBlocks(md('x', 'ts [no-checker.ts]'))[0]!.skip).toBe(
      false
    );
  });

  it('marks a block preceded by the skip comment as skipped', () => {
    const content = md('x', 'ts', '<!-- tuvix-validate: skip -->\n\n');
    expect(extractCodeBlocks(content)[0]!.skip).toBe(true);
  });

  it('strips list indentation and records it', () => {
    const content = `1. Step\n\n   ${fence}ts\n   const a = 1;\n     const b = 2;\n   ${fence}\n`;
    const [block] = extractCodeBlocks(content);
    expect(block!.indent).toBe(3);
    expect(block!.code).toBe('const a = 1;\n  const b = 2;');
  });

  it('keeps a shorter inner fence inside a longer outer fence', () => {
    const content = `${fence}\`md\n${fence}ts\nconst a = 1;\n${fence}\n${fence}\`\n`;
    const blocks = extractCodeBlocks(content);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.language).toBe('md');
  });
});

describe('checkedExtension', () => {
  it('checks every TypeScript block', () => {
    expect(checkedExtension(extractCodeBlocks(md('x', 'typescript'))[0]!)).toBe(
      '.ts'
    );
    expect(checkedExtension(extractCodeBlocks(md('x', 'tsx'))[0]!)).toBe(
      '.tsx'
    );
  });

  it('checks JavaScript blocks only when they import a tuvix package', () => {
    const plain = extractCodeBlocks(md('console.log(1);', 'js'))[0]!;
    const tuvix = extractCodeBlocks(
      md(`import { createOrchestrator } from 'tuvix.js';`, 'js')
    )[0]!;
    expect(checkedExtension(plain)).toBeNull();
    expect(checkedExtension(tuvix)).toBe('.js');
  });

  it('ignores non-code languages and skipped blocks', () => {
    expect(
      checkedExtension(extractCodeBlocks(md('pnpm add x', 'bash'))[0]!)
    ).toBeNull();
    expect(
      checkedExtension(extractCodeBlocks(md('x', 'ts no-check'))[0]!)
    ).toBeNull();
  });
});

// ─── classification and discovery ───────────────────────

describe('getLocale', () => {
  it('treats website locale directories and README.<locale>.md as translated', () => {
    expect(getLocale('website/tr/guide/a.md')).toBe('tr');
    expect(getLocale('packages/core/README.ja.md')).toBe('ja');
    expect(getLocale('README.zh.md')).toBe('zh');
  });

  it('treats everything else as English', () => {
    expect(getLocale('website/guide/a.md')).toBeNull();
    expect(getLocale('website/packages/core.md')).toBeNull();
    expect(getLocale('packages/core/README.md')).toBeNull();
    expect(getLocale('README.md')).toBeNull();
  });
});

describe('findMarkdownFiles', () => {
  it('includes READMEs and website pages, excludes changelogs and node_modules', () => {
    const files = findMarkdownFiles().map((f) => path.relative(ROOT, f));
    expect(files).toContain('README.md');
    expect(files).toContain(path.join('packages', 'core', 'README.md'));
    expect(
      files.some((f) => f.startsWith(`website${path.sep}guide${path.sep}`))
    ).toBe(true);
    expect(files.some((f) => f.includes('CHANGELOG.md'))).toBe(false);
    expect(files.some((f) => f.includes('node_modules'))).toBe(false);
  });
});

describe('buildTuvixModuleMap', () => {
  it('maps package names and exported subpaths to type entry files', () => {
    const map = buildTuvixModuleMap();
    expect(map.get('@tuvix.js/core')).toBe(
      path.join(ROOT, 'packages/core/src/index.ts')
    );
    expect(map.get('@tuvix.js/vue/server')).toBe(
      path.join(ROOT, 'packages/vue/src/server.ts')
    );
    expect(map.get('@tuvix.js/vite/client')).toBe(
      path.join(ROOT, 'packages/vite/client.d.ts')
    );
    expect(map.has('@tuvix.js/core/package.json')).toBe(false);
  });
});

// ─── checkMarkdown (real TypeScript program) ────────────

describe('checkMarkdown', () => {
  it('passes a block that matches the real API', () => {
    const result = check(md(CORRECT));
    expect(result.diagnostics).toEqual([]);
    expect(result.checkedBlocks).toBe(1);
  });

  it('fails a wrong call signature with markdown line and column', () => {
    const code = `import { createOrchestrator } from '@tuvix.js/core';\n\ncreateOrchestrator().register('header');`;
    const { diagnostics } = check(md(code));
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      file: path.join('website', 'guide', 'fixture.md'),
      line: 6,
      column: 31,
      code: 2345,
      locale: null,
    });
  });

  it('fails an import of a name the package does not export', () => {
    const { diagnostics } = check(
      md(`import { createApp } from '@tuvix.js/core';\ncreateApp();`)
    );
    expect(diagnostics.map((d) => d.code)).toEqual([2305]);
  });

  it('fails a tuvix subpath that is not exported', () => {
    const { diagnostics } = check(
      md(`import { createSandbox } from 'tuvix.js/sandbox';\ncreateSandbox();`)
    );
    expect(diagnostics.map((d) => d.code)).toEqual([2307]);
  });

  it('reports undeclared placeholders', () => {
    const { diagnostics } = check(md(`await orchestrator.start();`));
    expect(diagnostics.map((d) => d.code)).toEqual([2304]);
  });

  it('skips a wrong block marked no-check or preceded by the skip comment', () => {
    const wrong = `import { createOrchestrator } from '@tuvix.js/core';\ncreateOrchestrator(42);`;
    expect(check(md(wrong, 'ts no-check'))).toMatchObject({
      diagnostics: [],
      checkedBlocks: 0,
      skippedBlocks: 1,
    });
    const skipped = check(md(wrong, 'ts', '<!-- tuvix-validate: skip -->\n'));
    expect(skipped.diagnostics).toEqual([]);
    expect(skipped.skippedBlocks).toBe(1);
  });

  it('types relative and uninstalled imports as any, values and types alike', () => {
    const code = [
      `import App, { Header, type HeaderProps } from './App.vue';`,
      `import * as styles from './styles.module.css';`,
      `import { thing } from 'some-package-that-is-not-installed';`,
      `const props: HeaderProps<string> = { title: 'x' };`,
      `App(Header, props, styles.root, thing);`,
      `const lazy = await import('./Lazy');`,
      `lazy.default();`,
    ].join('\n');
    expect(check(md(code)).diagnostics).toEqual([]);
  });

  it('checks TSX against installed React types', () => {
    const code = [
      `import { useState } from 'react';`,
      `export function Counter() {`,
      `  const [n, setN] = useState(0);`,
      `  return <button onClick={() => setN(n + 1)}>{n}</button>;`,
      `}`,
      `const broken: number = <Counter />;`,
    ].join('\n');
    const { diagnostics } = check(md(code, 'tsx'));
    expect(diagnostics.map((d) => [d.line, d.code])).toEqual([[9, 2322]]);
  });

  it('resolves the vite client types through a triple-slash reference', () => {
    const code = [
      `/// <reference types="@tuvix.js/vite/client" />`,
      `import { getAssets } from 'virtual:tuvix/assets';`,
      `const assets = await getAssets(['src/islands/footer/index.ts']);`,
      `console.log(assets);`,
    ].join('\n');
    expect(check(md(code)).diagnostics).toEqual([]);
  });

  it('keeps blocks isolated so two blocks can declare the same name', () => {
    expect(check(`${md(CORRECT)}\n${md(CORRECT)}`).diagnostics).toEqual([]);
  });

  it('checks JavaScript blocks that import tuvix', () => {
    const { diagnostics } = check(
      md(
        `import { createOrchestrator } from 'tuvix.js';\ncreateOrchestrator().register('x');`,
        'js'
      )
    );
    expect(diagnostics.map((d) => d.code)).toEqual([2345]);
  });

  it('tags diagnostics from translated files with their locale', () => {
    const { diagnostics } = check(
      md(`await orchestrator.start();`),
      'website/de/guide/fixture.md'
    );
    expect(diagnostics[0]!.locale).toBe('de');
  });
});
