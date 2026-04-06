// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { join } from 'path';

const ANGULAR_TEMPLATE_DIR = join(process.cwd(), 'scripts/templates/angular');

const CATEGORIES = [
  'card', 'footer', 'form', 'header', 'layout',
  'modal', 'navigation', 'notification', 'sidebar', 'table',
];

const REQUIRED_FIELDS = ['variant', 'description', 'tags', 'code', 'dependencies'];
const REQUIRED_ANGULAR_IMPORTS = ['@angular/core', 'defineMicroApp', 'tuvix.js', 'bootstrapApplication'];
const REQUIRED_API_FIELDS = ['standalone: true', 'defineMicroApp', 'mount', 'unmount'];

describe('Angular template files', () => {
  for (const category of CATEGORIES) {
    describe(`${category} templates`, () => {
      let templates: Array<Record<string, unknown>>;

      it('loads without errors', async () => {
        const mod = await import(join(ANGULAR_TEMPLATE_DIR, `${category}.ts`));
        templates = mod.default;
        expect(Array.isArray(templates)).toBe(true);
        expect(templates.length).toBeGreaterThan(0);
      });

      it('all templates have required fields', async () => {
        const mod = await import(join(ANGULAR_TEMPLATE_DIR, `${category}.ts`));
        const tmplList: Array<Record<string, unknown>> = mod.default;

        for (const tmpl of tmplList) {
          for (const field of REQUIRED_FIELDS) {
            expect(tmpl[field], `${category}/${tmpl.variant} missing "${field}"`).toBeDefined();
          }
        }
      });

      it('all templates have non-empty description and variant', async () => {
        const mod = await import(join(ANGULAR_TEMPLATE_DIR, `${category}.ts`));
        const tmplList: Array<Record<string, unknown>> = mod.default;

        for (const tmpl of tmplList) {
          expect(typeof tmpl.variant).toBe('string');
          expect((tmpl.variant as string).length).toBeGreaterThan(0);
          expect(typeof tmpl.description).toBe('string');
          expect((tmpl.description as string).length).toBeGreaterThan(0);
        }
      });

      it('all templates have tags array', async () => {
        const mod = await import(join(ANGULAR_TEMPLATE_DIR, `${category}.ts`));
        const tmplList: Array<Record<string, unknown>> = mod.default;

        for (const tmpl of tmplList) {
          expect(Array.isArray(tmpl.tags), `${category}/${tmpl.variant} tags must be array`).toBe(true);
        }
      });

      it('all template code uses correct Angular and tuvix.js imports', async () => {
        const mod = await import(join(ANGULAR_TEMPLATE_DIR, `${category}.ts`));
        const tmplList: Array<Record<string, unknown>> = mod.default;

        for (const tmpl of tmplList) {
          const code = tmpl.code as string;
          for (const required of REQUIRED_ANGULAR_IMPORTS) {
            expect(code, `${category}/${tmpl.variant} missing "${required}"`).toContain(required);
          }
        }
      });

      it('all template code uses correct defineMicroApp API pattern', async () => {
        const mod = await import(join(ANGULAR_TEMPLATE_DIR, `${category}.ts`));
        const tmplList: Array<Record<string, unknown>> = mod.default;

        for (const tmpl of tmplList) {
          const code = tmpl.code as string;
          for (const field of REQUIRED_API_FIELDS) {
            expect(code, `${category}/${tmpl.variant} missing API field "${field}"`).toContain(field);
          }
          // Must NOT use old API
          expect(code, `${category}/${tmpl.variant} should not use createAngularMicroApp`).not.toContain('createAngularMicroApp');
          expect(code, `${category}/${tmpl.variant} should not use NgModule`).not.toContain('NgModule');
        }
      });
    });
  }
});
