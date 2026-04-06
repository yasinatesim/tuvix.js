// @vitest-environment node
/**
 * Compilation tests for all component templates (4 frameworks × 10 categories).
 *
 * Each template's `code` field is compiled with esbuild.transform() to verify
 * that the code is syntactically and semantically valid TypeScript/JSX.
 * String-based checks alone would miss broken JSX, bad syntax, or decorator errors.
 */
import { describe, it, expect } from 'vitest';
import { transform } from 'esbuild';
import { join } from 'path';

const TEMPLATE_DIR = join(process.cwd(), 'scripts/templates');

const CATEGORIES = [
  'card', 'footer', 'form', 'header', 'layout',
  'modal', 'navigation', 'notification', 'sidebar', 'table',
] as const;

type Category = typeof CATEGORIES[number];

interface Template {
  variant: string;
  description: string;
  tags: string[];
  code: string;
  dependencies: string[];
}

async function loadTemplates(framework: string, category: Category): Promise<Template[]> {
  const mod = await import(join(TEMPLATE_DIR, framework, `${category}.ts`));
  return mod.default as Template[];
}

/** Extract the <script> block from a Vue or Svelte SFC */
function extractScriptBlock(code: string): string {
  const match = code.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('No <script> block found in SFC code');
  return match[1].trim();
}

// ─── React ───────────────────────────────────────────────────────────────────
describe('React template compilation', () => {
  for (const category of CATEGORIES) {
    describe(category, () => {
      it('all variants compile as TSX without errors', async () => {
        const templates = await loadTemplates('react', category);
        expect(templates.length).toBeGreaterThan(0);

        for (const tmpl of templates) {
          const result = await transform(tmpl.code, {
            loader: 'tsx',
            jsx: 'transform',
            jsxFactory: 'React.createElement',
            jsxFragment: 'React.Fragment',
          }).catch((err) => {
            throw new Error(
              `react/${category}/${tmpl.variant} failed to compile:\n${err.message}`,
            );
          });

          expect(result.code.length).toBeGreaterThan(0);
        }
      });
    });
  }
});

// ─── Angular ─────────────────────────────────────────────────────────────────
describe('Angular template compilation', () => {
  for (const category of CATEGORIES) {
    describe(category, () => {
      it('all variants compile as TypeScript (with decorators) without errors', async () => {
        const templates = await loadTemplates('angular', category);
        expect(templates.length).toBeGreaterThan(0);

        for (const tmpl of templates) {
          const result = await transform(tmpl.code, {
            loader: 'ts',
            tsconfigRaw: {
              compilerOptions: { experimentalDecorators: true },
            },
          }).catch((err) => {
            throw new Error(
              `angular/${category}/${tmpl.variant} failed to compile:\n${err.message}`,
            );
          });

          expect(result.code.length).toBeGreaterThan(0);
        }
      });
    });
  }
});

// ─── Vue ─────────────────────────────────────────────────────────────────────
describe('Vue template compilation (script block)', () => {
  for (const category of CATEGORIES) {
    describe(category, () => {
      it('all variants <script> block compiles as TypeScript without errors', async () => {
        const templates = await loadTemplates('vue', category);
        expect(templates.length).toBeGreaterThan(0);

        for (const tmpl of templates) {
          let scriptContent: string;
          try {
            scriptContent = extractScriptBlock(tmpl.code);
          } catch {
            throw new Error(
              `vue/${category}/${tmpl.variant}: could not extract <script> block`,
            );
          }

          const result = await transform(scriptContent, {
            loader: 'ts',
          }).catch((err) => {
            throw new Error(
              `vue/${category}/${tmpl.variant} script failed to compile:\n${err.message}`,
            );
          });

          expect(result.code.length).toBeGreaterThan(0);
        }
      });
    });
  }
});

// ─── Svelte ──────────────────────────────────────────────────────────────────
describe('Svelte template compilation (script block)', () => {
  for (const category of CATEGORIES) {
    describe(category, () => {
      it('all variants <script> block compiles as JavaScript without errors', async () => {
        const templates = await loadTemplates('svelte', category);
        expect(templates.length).toBeGreaterThan(0);

        for (const tmpl of templates) {
          let scriptContent: string;
          try {
            scriptContent = extractScriptBlock(tmpl.code);
          } catch {
            throw new Error(
              `svelte/${category}/${tmpl.variant}: could not extract <script> block`,
            );
          }

          const result = await transform(scriptContent, {
            loader: 'js',
          }).catch((err) => {
            throw new Error(
              `svelte/${category}/${tmpl.variant} script failed to compile:\n${err.message}`,
            );
          });

          expect(result.code.length).toBeGreaterThan(0);
        }
      });
    });
  }
});
