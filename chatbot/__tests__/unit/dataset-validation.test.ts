// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data/components');

// v2 dataset uses singular category names (card.jsonl, not cards.jsonl)
const V2_CATEGORIES = [
  'header', 'sidebar', 'form', 'card', 'layout',
  'footer', 'modal', 'table', 'navigation', 'notification',
];
const hasV2Data = V2_CATEGORIES.some((cat) =>
  existsSync(join(DATA_DIR, `${cat}.jsonl`)),
);

const EXPECTED_TOTAL = 600;
const EXPECTED_PER_CATEGORY = 60;
const REQUIRED_FIELDS = ['id', 'description', 'framework', 'category', 'tags', 'code', 'dependencies'];
const VALID_FRAMEWORKS = ['react', 'vue', 'svelte', 'angular'];
// Svelte is '' (falsy) because Svelte SFCs are raw component files — no @tuvix.js/svelte import
const FRAMEWORK_IMPORTS: Record<string, string> = {
  react: '@tuvix.js/react',
  vue: '@tuvix.js/vue',
  svelte: '',  // Svelte SFC — no package import in the component file itself
  angular: 'tuvix.js',  // Angular now uses defineMicroApp from 'tuvix.js'
};

describe('Dataset v2 Validation', () => {
  if (!hasV2Data) {
    it.skip('v2 dataset not yet generated — run pnpm generate-dataset first', () => {});
    return;
  }

  const files = readdirSync(DATA_DIR).filter((f) =>
    f.endsWith('.jsonl') && V2_CATEGORIES.some((cat) => f === `${cat}.jsonl`),
  );
  const allRecords: Record<string, unknown>[] = [];

  files.forEach((file) => {
    const lines = readFileSync(join(DATA_DIR, file), 'utf-8').split('\n').filter(Boolean);
    lines.forEach((line) => allRecords.push(JSON.parse(line)));
  });

  it('has exactly 600 records total', () => {
    expect(allRecords.length).toBe(EXPECTED_TOTAL);
  });

  it('has no duplicate IDs', () => {
    const ids = allRecords.map((r) => r.id as string);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all records have required fields', () => {
    for (const record of allRecords) {
      for (const field of REQUIRED_FIELDS) {
        expect(record[field], `${record.id} missing ${field}`).toBeTruthy();
      }
    }
  });

  it('all records use valid framework', () => {
    for (const record of allRecords) {
      expect(VALID_FRAMEWORKS).toContain(record.framework as string);
    }
  });

  it('each record code imports the correct tuvix.js package for its framework', () => {
    for (const record of allRecords) {
      const fw = record.framework as string;
      const code = record.code as string;
      const expectedImport = FRAMEWORK_IMPORTS[fw];
      if (!expectedImport) continue; // Svelte SFC — no package import needed
      expect(code, `${record.id} missing correct import`).toContain(expectedImport);
    }
  });

  it('React records use App: not component: and have name:', () => {
    const reactRecords = allRecords.filter((r) => r.framework === 'react');
    for (const record of reactRecords) {
      const code = record.code as string;
      expect(code, `${record.id} uses wrong API field`).not.toContain('component:');
      expect(code, `${record.id} missing App:`).toContain('App:');
      expect(code, `${record.id} missing name:`).toContain('name:');
    }
  });

  it('Vue records use App: and have name:', () => {
    const vueRecords = allRecords.filter((r) => r.framework === 'vue');
    for (const record of vueRecords) {
      const code = record.code as string;
      expect(code, `${record.id} missing createVueMicroApp`).toContain('createVueMicroApp');
      expect(code, `${record.id} missing App:`).toContain('App:');
      expect(code, `${record.id} missing name:`).toContain('name:');
    }
  });

  it('Svelte records are raw SFC format (no createSvelteMicroApp wrapper)', () => {
    const svelteRecords = allRecords.filter((r) => r.framework === 'svelte');
    for (const record of svelteRecords) {
      const code = record.code as string;
      // Svelte files are raw SFC — no createSvelteMicroApp in the code itself
      expect(code, `${record.id} should not contain createSvelteMicroApp`).not.toContain('createSvelteMicroApp');
      // Must have a <script> block
      expect(code, `${record.id} missing <script> block`).toContain('<script>');
    }
  });

  it('Angular records use defineMicroApp with standalone components', () => {
    const angularRecords = allRecords.filter((r) => r.framework === 'angular');
    for (const record of angularRecords) {
      const code = record.code as string;
      expect(code, `${record.id} missing defineMicroApp`).toContain('defineMicroApp');
      expect(code, `${record.id} missing standalone: true`).toContain('standalone: true');
      expect(code, `${record.id} missing bootstrapApplication`).toContain('bootstrapApplication');
      expect(code, `${record.id} missing name:`).toContain('name:');
      // Must NOT use old API
      expect(code, `${record.id} should not use createAngularMicroApp`).not.toContain('createAngularMicroApp');
    }
  });

  it('each category has exactly 60 records', () => {
    const categories = [...new Set(allRecords.map((r) => r.category as string))];
    expect(categories.length).toBe(10);
    for (const cat of categories) {
      const count = allRecords.filter((r) => r.category === cat).length;
      expect(count, `${cat} has wrong count`).toBe(EXPECTED_PER_CATEGORY);
    }
  });
});
