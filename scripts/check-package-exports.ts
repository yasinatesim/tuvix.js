/**
 * check-package-exports.ts
 *
 * Run after `pnpm build`. For every package in packages/*, checks that each
 * file named by `main`, `module`, `types`, `bin`, `typesVersions` and every
 * `exports` condition exists on disk, and that `import`/`require` targets
 * use an extension Node loads in that format. Without "type": "module",
 * import needs .mjs/.d.mts and require needs .cjs or .js / .d.cts or .d.ts.
 * With "type": "module" the rule flips.
 *
 * Usage:  tsx scripts/check-package-exports.ts
 * Exit 0: every target exists and has the right extension
 * Exit 1: one or more problems found
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename_ = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename_), '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');

export interface ExportTarget {
  /** Where the path came from, e.g. `exports["./server"].import.types`. */
  field: string;
  /** Relative path as written in package.json. */
  target: string;
  /** Nearest `import` or `require` condition above this target, if any. */
  format?: 'import' | 'require';
  /** True when the nearest condition key is `types`. */
  isTypes: boolean;
}

interface PackageJson {
  name?: string;
  type?: string;
  main?: string;
  module?: string;
  types?: string;
  typings?: string;
  bin?: string | Record<string, string>;
  exports?: unknown;
  typesVersions?: Record<string, Record<string, string[]>>;
}

/** Flattens a package.json `exports` value into its leaf file targets. */
export function collectExportTargets(
  value: unknown,
  field = 'exports',
  format?: 'import' | 'require',
  isTypes = false
): ExportTarget[] {
  if (typeof value === 'string') {
    return [{ field, target: value, format, isTypes }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((v, i) =>
      collectExportTargets(v, `${field}[${i}]`, format, isTypes)
    );
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, v]) => {
      const nextFormat = key === 'import' || key === 'require' ? key : format;
      const nextIsTypes = key === 'types' ? true : isTypes;
      const nextField = key.startsWith('.')
        ? `${field}["${key}"]`
        : `${field}.${key}`;
      return collectExportTargets(v, nextField, nextFormat, nextIsTypes);
    });
  }
  return [];
}

function extensionProblem(
  t: ExportTarget,
  pkgType: string | undefined
): string | null {
  if (!t.format || t.target.endsWith('.json')) return null;
  const esmPkg = pkgType === 'module';
  const file = t.target;
  if (t.isTypes) {
    const ok =
      t.format === 'import'
        ? file.endsWith('.d.mts') || (esmPkg && file.endsWith('.d.ts'))
        : file.endsWith('.d.cts') || (!esmPkg && file.endsWith('.d.ts'));
    return ok
      ? null
      : `${t.field} -> ${file}: ${t.format} types must be ${t.format === 'import' ? '.d.mts' : '.d.cts'}`;
  }
  const ok =
    t.format === 'import'
      ? file.endsWith('.mjs') || (esmPkg && file.endsWith('.js'))
      : file.endsWith('.cjs') || (!esmPkg && file.endsWith('.js'));
  return ok
    ? null
    : `${t.field} -> ${file}: ${t.format} target must be ${t.format === 'import' ? '.mjs' : '.cjs'}`;
}

/** Returns every problem found in one package directory. */
export function checkPackage(pkgDir: string): string[] {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')
  ) as PackageJson;

  const targets: ExportTarget[] = [];
  for (const field of ['main', 'module', 'types', 'typings'] as const) {
    const value = pkg[field];
    if (value) targets.push({ field, target: value, isTypes: false });
  }
  if (typeof pkg.bin === 'string') {
    targets.push({ field: 'bin', target: pkg.bin, isTypes: false });
  } else if (pkg.bin) {
    for (const [name, target] of Object.entries(pkg.bin)) {
      targets.push({ field: `bin.${name}`, target, isTypes: false });
    }
  }
  if (pkg.exports !== undefined) {
    targets.push(...collectExportTargets(pkg.exports));
  }
  for (const [range, map] of Object.entries(pkg.typesVersions ?? {})) {
    for (const [sub, files] of Object.entries(map)) {
      files.forEach((target, i) =>
        targets.push({
          field: `typesVersions["${range}"]["${sub}"][${i}]`,
          target,
          isTypes: true,
        })
      );
    }
  }

  const problems: string[] = [];
  for (const t of targets) {
    if (t.target.includes('*')) {
      problems.push(`${t.field} -> ${t.target}: wildcards are not checked`);
      continue;
    }
    if (!fs.existsSync(path.resolve(pkgDir, t.target))) {
      problems.push(`${t.field} -> ${t.target}: file does not exist`);
      continue;
    }
    const extProblem = extensionProblem(t, pkg.type);
    if (extProblem) problems.push(extProblem);
  }
  return problems;
}

/**
 * Checks every package directory under `packagesDir` and prints a report.
 * Returns the process exit code: 1 when a package has problems or when no
 * package was found (a wrong path must not pass as "all good").
 */
export function runCheck(packagesDir: string = PACKAGES_DIR): number {
  console.log('Checking package.json entry points against build output...\n');

  let failed = 0;
  const dirs = fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(packagesDir, d.name))
    .filter((dir) => fs.existsSync(path.join(dir, 'package.json')));

  if (dirs.length === 0) {
    console.error(`No packages found in ${packagesDir}.`);
    return 1;
  }

  for (const dir of dirs) {
    const name = path.relative(ROOT, dir);
    const problems = checkPackage(dir);
    if (problems.length === 0) {
      console.log(`   ✓ ${name}`);
      continue;
    }
    failed++;
    console.error(`   ✗ ${name}`);
    for (const p of problems) console.error(`       ${p}`);
  }

  if (failed > 0) {
    console.error(
      `\n${failed} package(s) point at missing or misnamed files. Run \`pnpm build\` first, then fix package.json or tsup.config.ts.`
    );
    return 1;
  }
  console.log(`\nAll ${dirs.length} packages resolve to built files.`);
  return 0;
}

const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (executedFilePath === path.resolve(__filename_)) {
  process.exit(runCheck());
}
