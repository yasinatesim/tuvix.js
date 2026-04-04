import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('CLI templates match documentation', () => {
  const DOCUMENTED_TEMPLATES = [
    'shell',
    'react-app',
    'vue-app',
    'vanilla-app',
  ];

  it('should have all documented templates available in code', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../create-project.ts'),
      'utf-8'
    );
    for (const template of DOCUMENTED_TEMPLATES) {
      expect(source).toContain(template);
    }
  });

  it('should list correct templates in help text', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../index.ts'),
      'utf-8'
    );
    for (const template of DOCUMENTED_TEMPLATES) {
      expect(source).toContain(template);
    }
  });
});

describe('CLI example names match actual directories', () => {
  it('all example directories should exist', () => {
    const examplesDir = path.resolve(__dirname, '../../../../examples');
    const expectedExamples = [
      'with-react',
      'with-vue',
      'with-svelte',
      'with-angular',
      'with-vanilla',
      'with-ssr-react',
      'with-ssr-vanilla',
      'with-react-router',
      'with-react-event-bus',
      'with-react-sandbox',
      'with-react-devtools',
      'with-multiple-frameworks',
      'with-module-federation-react',
    ];
    for (const example of expectedExamples) {
      const dir = path.join(examplesDir, example);
      expect(fs.existsSync(dir), `Example directory missing: ${example}`).toBe(
        true
      );
    }
  });
});
