import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createProject } from '../create-project';

const TEMPLATES = ['shell', 'react-app', 'vue-app', 'vanilla-app'] as const;

const EXPECTED_IMPORTS: Record<string, string> = {
  shell: 'createOrchestrator',
  'react-app': 'createReactMicroApp',
  'vue-app': 'createVueMicroApp',
  'vanilla-app': 'defineMicroApp',
};

const MAIN_FILE: Record<string, string> = {
  shell: 'src/main.ts',
  'react-app': 'src/main.tsx',
  'vue-app': 'src/main.ts',
  'vanilla-app': 'src/main.ts',
};

describe('Template content validation', () => {
  for (const template of TEMPLATES) {
    describe(`${template} template`, () => {
      let tmpDir: string;

      const setup = async (): Promise<string> => {
        const tmpName = `.tmp/tuvix-tpl-${template}-${Date.now()}`;
        const dir = path.resolve(process.cwd(), tmpName);
        await createProject({
          name: tmpName,
          template,
          typescript: true,
        });
        return dir;
      };

      const cleanup = (dir: string): void => {
        fs.rmSync(dir, { recursive: true, force: true });
      };

      it('should have correct package.json fields', async () => {
        tmpDir = await setup();
        try {
          const pkg = JSON.parse(
            fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8')
          );
          expect(pkg.name).toBeDefined();
          expect(pkg.version).toBeDefined();
          expect(pkg.scripts.dev).toBeDefined();
          expect(pkg.scripts.build).toBeDefined();
          expect(pkg.dependencies['tuvix.js']).toBeDefined();
          expect(pkg.devDependencies.typescript).toBeDefined();
          expect(pkg.devDependencies.vite).toBeDefined();
        } finally {
          cleanup(tmpDir);
        }
      });

      it('should have correct tsconfig.json settings', async () => {
        tmpDir = await setup();
        try {
          const tsconfig = JSON.parse(
            fs.readFileSync(path.join(tmpDir, 'tsconfig.json'), 'utf-8')
          );
          expect(tsconfig.compilerOptions.strict).toBe(true);
          expect(tsconfig.compilerOptions.target).toBe('ES2020');
        } finally {
          cleanup(tmpDir);
        }
      });

      it('should have correct index.html structure', async () => {
        tmpDir = await setup();
        try {
          const html = fs.readFileSync(
            path.join(tmpDir, 'index.html'),
            'utf-8'
          );
          expect(html).toContain('<!DOCTYPE html>');
          expect(html).toContain('type="module"');
        } finally {
          cleanup(tmpDir);
        }
      });

      it('should have correct tuvix.js imports', async () => {
        tmpDir = await setup();
        try {
          const mainFile = MAIN_FILE[template]!;
          const source = fs.readFileSync(
            path.join(tmpDir, mainFile),
            'utf-8'
          );
          const expectedImport = EXPECTED_IMPORTS[template]!;
          expect(source).toContain(expectedImport);
        } finally {
          cleanup(tmpDir);
        }
      });
    });
  }
});
