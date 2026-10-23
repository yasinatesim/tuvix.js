// @vitest-environment node
/**
 * Type-checks the TypeScript that create-tuvix-app generates, against the
 * real tuvix APIs. `tuvix.js` and `@tuvix.js/*` resolve to packages/<pkg>/src
 * through the same map validate-code-examples uses, so no build is needed.
 * Framework packages (react, vue, svelte, @angular/core, vite) resolve from
 * the adapter packages that install them.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import ts from 'typescript';
import { createProject } from '../../packages/cli/src/create-project';
import { buildTuvixModuleMap, ROOT } from '../validate-code-examples';

const TEMPLATES = [
  'shell',
  'react-app',
  'vue-app',
  'vanilla-app',
  'svelte-app',
  'angular-app',
];

const tuvixModules = buildTuvixModuleMap(ROOT);
const fallbackBases = [
  ROOT,
  ...fs
    .readdirSync(path.join(ROOT, 'packages'))
    .map((d) => path.join(ROOT, 'packages', d)),
]
  .filter((d) => fs.existsSync(path.join(d, 'package.json')))
  .map((d) => path.join(d, '__resolve__.ts'));

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

/** Returns formatted diagnostics for the project's `src` TypeScript files. */
function typeCheck(projectDir: string): string[] {
  const config = ts.readConfigFile(
    path.join(projectDir, 'tsconfig.json'),
    ts.sys.readFile
  );
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    projectDir
  );
  const options: ts.CompilerOptions = { ...parsed.options, noEmit: true };
  const rootNames = listFiles(path.join(projectDir, 'src')).filter((f) =>
    /\.tsx?$/.test(f)
  );

  const host = ts.createCompilerHost(options, true);
  host.resolveModuleNameLiterals = (literals, containingFile) =>
    literals.map((literal) => {
      const spec = literal.text;
      const tuvixFile = tuvixModules.get(spec);
      if (tuvixFile) {
        return {
          resolvedModule: {
            resolvedFileName: tuvixFile,
            extension: tuvixFile.endsWith('.tsx')
              ? ts.Extension.Tsx
              : tuvixFile.endsWith('.d.ts')
                ? ts.Extension.Dts
                : ts.Extension.Ts,
            isExternalLibraryImport: false,
          },
        };
      }
      const direct = ts.resolveModuleName(
        spec,
        containingFile,
        options,
        host
      ).resolvedModule;
      if (direct || spec.startsWith('.')) return { resolvedModule: direct };
      for (const base of fallbackBases) {
        const found = ts.resolveModuleName(spec, base, options, host);
        if (found.resolvedModule) return found;
      }
      return { resolvedModule: undefined };
    });

  host.resolveTypeReferenceDirectiveReferences = (
    refs,
    containingFile,
    redirected,
    opts
  ) =>
    refs.map((ref) => {
      const name = typeof ref === 'string' ? ref : ref.fileName;
      const direct = ts.resolveTypeReferenceDirective(
        name,
        containingFile,
        opts,
        host,
        redirected
      );
      if (direct.resolvedTypeReferenceDirective) return direct;
      for (const base of fallbackBases) {
        const found = ts.resolveTypeReferenceDirective(
          name,
          base,
          opts,
          host,
          redirected
        );
        if (found.resolvedTypeReferenceDirective) return found;
      }
      return direct;
    });

  const program = ts.createProgram({ rootNames, options, host });
  const diagnostics = [
    ...program.getOptionsDiagnostics(),
    ...rootNames.flatMap((file) => {
      const sf = program.getSourceFile(file);
      return sf
        ? [
            ...program.getSyntacticDiagnostics(sf),
            ...program.getSemanticDiagnostics(sf),
          ]
        : [];
    }),
  ];
  return diagnostics.map((d) => {
    const where =
      d.file && d.start !== undefined
        ? `${path.relative(projectDir, d.file.fileName)}:${
            d.file.getLineAndCharacterOfPosition(d.start).line + 1
          }`
        : '(options)';
    return `${where} TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`;
  });
}

let projectDir: string | undefined;

afterEach(() => {
  vi.restoreAllMocks();
  if (projectDir) fs.rmSync(projectDir, { recursive: true, force: true });
  projectDir = undefined;
});

describe('scaffolded TypeScript type-checks against the tuvix sources', () => {
  for (const template of TEMPLATES) {
    it(`${template}`, async () => {
      const name = `.tmp/types-${template}-${process.pid}`;
      projectDir = path.resolve(process.cwd(), name);
      fs.rmSync(projectDir, { recursive: true, force: true });
      vi.spyOn(console, 'log').mockImplementation(() => {});
      await createProject({ name, template, typescript: true });

      expect(typeCheck(projectDir)).toEqual([]);
    }, 60_000);
  }
});
