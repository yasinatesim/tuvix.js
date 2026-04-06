// @vitest-environment node
/**
 * Compilation tests for ALL 600 JSONL records the RAG pipeline actually serves.
 *
 * templates-compilation.test.ts tests template SOURCE files (scripts/templates/).
 * This file tests the generated data files (data/components/*.jsonl) — the actual
 * records that get embedded in ChromaDB and returned to the LLM.
 *
 * Each record's `code` field is compiled with esbuild.transform() to prove the
 * code is syntactically valid before it ever reaches the LLM context window.
 */
import { describe, it, expect } from 'vitest';
import { transform } from 'esbuild';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data/components');

const V2_CATEGORIES = [
  'header', 'sidebar', 'form', 'card', 'layout',
  'footer', 'modal', 'table', 'navigation', 'notification',
];

interface DataRecord {
  id: string;
  framework: string;
  category: string;
  code: string;
}

function loadAllRecords(): DataRecord[] {
  const records: DataRecord[] = [];
  const files = readdirSync(DATA_DIR).filter(
    (f) => f.endsWith('.jsonl') && V2_CATEGORIES.some((cat) => f === `${cat}.jsonl`),
  );
  for (const file of files) {
    const lines = readFileSync(join(DATA_DIR, file), 'utf-8').split('\n').filter(Boolean);
    for (const line of lines) {
      records.push(JSON.parse(line) as DataRecord);
    }
  }
  return records;
}

/** Extract the <script> block from a Vue or Svelte SFC */
function extractScriptBlock(code: string, recordId: string): string {
  const match = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error(`${recordId}: no <script> block found in SFC code`);
  return match[1].trim();
}

const hasV2Data = V2_CATEGORIES.some((cat) =>
  existsSync(join(DATA_DIR, `${cat}.jsonl`)),
);

describe('Dataset compilation (JSONL records)', () => {
  if (!hasV2Data) {
    it.skip('v2 dataset not yet generated — run pnpm generate-dataset first', () => {});
    return;
  }

  const allRecords = loadAllRecords();

  // ─── React ───────────────────────────────────────────────────────────────
  describe('React records compile as TSX', () => {
    const reactRecords = allRecords.filter((r) => r.framework === 'react');

    it(`has records to test (got ${reactRecords.length})`, () => {
      expect(reactRecords.length).toBeGreaterThan(0);
    });

    for (const record of reactRecords) {
      it(record.id, async () => {
        const result = await transform(record.code, {
          loader: 'tsx',
          jsx: 'transform',
          jsxFactory: 'React.createElement',
          jsxFragment: 'React.Fragment',
        }).catch((err) => {
          throw new Error(`${record.id} failed to compile:\n${err.message}`);
        });
        expect(result.code.length).toBeGreaterThan(0);
      });
    }
  });

  // ─── Angular ─────────────────────────────────────────────────────────────
  describe('Angular records compile as TypeScript (with decorators)', () => {
    const angularRecords = allRecords.filter((r) => r.framework === 'angular');

    it(`has records to test (got ${angularRecords.length})`, () => {
      expect(angularRecords.length).toBeGreaterThan(0);
    });

    for (const record of angularRecords) {
      it(record.id, async () => {
        const result = await transform(record.code, {
          loader: 'ts',
          tsconfigRaw: {
            compilerOptions: { experimentalDecorators: true },
          },
        }).catch((err) => {
          throw new Error(`${record.id} failed to compile:\n${err.message}`);
        });
        expect(result.code.length).toBeGreaterThan(0);
      });
    }
  });

  // ─── Vue ─────────────────────────────────────────────────────────────────
  // Vue records are now TypeScript module format (not SFC).
  // Strip template: `...` to avoid Vue ${{ }} syntax confusing esbuild's
  // template-literal parser, then compile the remaining TypeScript.
  describe('Vue records compile as TypeScript module', () => {
    const vueRecords = allRecords.filter((r) => r.framework === 'vue');

    it(`has records to test (got ${vueRecords.length})`, () => {
      expect(vueRecords.length).toBeGreaterThan(0);
    });

    for (const record of vueRecords) {
      it(record.id, async () => {
        const codeWithoutTemplate = record.code.replace(
          /template:\s*`[\s\S]*?`,/,
          "template: '',",
        );
        const result = await transform(codeWithoutTemplate, {
          loader: 'ts',
        }).catch((err) => {
          throw new Error(`${record.id} failed to compile:\n${err.message}`);
        });
        expect(result.code.length).toBeGreaterThan(0);
      });
    }
  });

  // ─── Svelte ──────────────────────────────────────────────────────────────
  describe('Svelte records <script> block compiles as JavaScript', () => {
    const svelteRecords = allRecords.filter((r) => r.framework === 'svelte');

    it(`has records to test (got ${svelteRecords.length})`, () => {
      expect(svelteRecords.length).toBeGreaterThan(0);
    });

    for (const record of svelteRecords) {
      it(record.id, async () => {
        const scriptContent = extractScriptBlock(record.code, record.id);
        const result = await transform(scriptContent, {
          loader: 'js',
        }).catch((err) => {
          throw new Error(`${record.id} script failed to compile:\n${err.message}`);
        });
        expect(result.code.length).toBeGreaterThan(0);
      });
    }
  });
});
