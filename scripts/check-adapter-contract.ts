/**
 * check-adapter-contract.ts
 *
 * Checks the adapter contract (C4) across the repo with the TypeScript AST:
 *
 * - register:      the factory reaches a `registerModule(...)` call imported
 *                  from `@tuvix.js/loader`.
 * - lifecycle:     the factory reaches `emitLifecycle('mounted' | 'unmounted' |
 *                  'error', ...)` for all three types.
 * - per-container: the factory reaches `new WeakMap(...)`, so each container
 *                  keeps its own instance.
 * - no-zone:       no file of the package imports or requires `zone.js`.
 * - registry:      no source file outside packages/loader/src/runtime.ts writes
 *                  `__TUVIX_MODULES__` (assignment, delete, Object.assign,
 *                  Object.defineProperty, Reflect.set, or a write through a
 *                  variable that holds the registry).
 *
 * "Reaches" follows calls and references from the factory into top-level
 * functions and classes of the same package, across relative imports.
 *
 * Usage:  tsx scripts/check-adapter-contract.ts
 * Exit 0: every rule holds
 * Exit 1: one or more violations, printed with file and line
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename_ = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename_), '..');

export type Rule =
  'register' | 'lifecycle' | 'per-container' | 'no-zone' | 'registry';

export interface SourceInput {
  /** Repo-relative POSIX path, e.g. `packages/react/src/index.ts`. */
  path: string;
  text: string;
}

export interface AdapterTarget {
  /** Label used in messages, e.g. `@tuvix.js/react`. */
  name: string;
  /** Repo-relative POSIX source directory, e.g. `packages/react/src`. */
  dir: string;
  /** Exported factory that creates the micro app module. */
  factory: string;
  /** Rules that apply to this factory. `no-zone` covers the whole package. */
  rules: Rule[];
}

export interface Violation {
  rule: Rule;
  file: string;
  line?: number;
  message: string;
}

const ADAPTER_RULES: Rule[] = [
  'register',
  'lifecycle',
  'per-container',
  'no-zone',
];

/** The factories the contract covers. */
export const TARGETS: AdapterTarget[] = [
  {
    name: '@tuvix.js/react',
    dir: 'packages/react/src',
    factory: 'createReactMicroApp',
    rules: ADAPTER_RULES,
  },
  {
    name: '@tuvix.js/vue',
    dir: 'packages/vue/src',
    factory: 'createVueMicroApp',
    rules: ADAPTER_RULES,
  },
  {
    name: '@tuvix.js/svelte',
    dir: 'packages/svelte/src',
    factory: 'createSvelteMicroApp',
    rules: ADAPTER_RULES,
  },
  {
    name: '@tuvix.js/angular',
    dir: 'packages/angular/src',
    factory: 'createAngularMicroApp',
    rules: ADAPTER_RULES,
  },
  {
    // The user writes mount/unmount, so per-container state is theirs to keep.
    name: '@tuvix.js/core',
    dir: 'packages/core/src',
    factory: 'defineMicroApp',
    rules: ['register', 'lifecycle', 'no-zone'],
  },
];

/** The one file allowed to write the module registry. */
export const REGISTRY_OWNER = 'packages/loader/src/runtime.ts';
const REGISTRY_KEY = '__TUVIX_MODULES__';
const LOADER_PACKAGE = '@tuvix.js/loader';
const LIFECYCLE_TYPES = ['mounted', 'unmounted', 'error'] as const;

// ─── Parsing helpers ────────────────────────────────

function scriptKind(file: string): ts.ScriptKind {
  if (file.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (file.endsWith('.jsx')) return ts.ScriptKind.JSX;
  if (/\.[cm]?js$/.test(file)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function parse(input: SourceInput): ts.SourceFile {
  return ts.createSourceFile(
    input.path,
    input.text,
    ts.ScriptTarget.Latest,
    true,
    scriptKind(input.path)
  );
}

function lineOf(sf: ts.SourceFile, node: ts.Node): number {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

function stripParens(node: ts.Expression): ts.Expression {
  let current = node;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function stringValue(
  node: ts.Expression,
  constants: Map<string, string>
): string | undefined {
  const inner = stripParens(node);
  if (ts.isStringLiteralLike(inner)) return inner.text;
  if (ts.isIdentifier(inner)) return constants.get(inner.text);
  return undefined;
}

/** Top-level `const NAME = 'literal'` bindings of a file. */
function collectStringConstants(sf: ts.SourceFile): Map<string, string> {
  const constants = new Map<string, string>();
  for (const statement of sf.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(decl.name) &&
        decl.initializer &&
        ts.isStringLiteralLike(stripParens(decl.initializer))
      ) {
        constants.set(
          decl.name.text,
          (stripParens(decl.initializer) as ts.StringLiteral).text
        );
      }
    }
  }
  return constants;
}

// ─── Rule: no zone.js ───────────────────────────────

function isZoneSpecifier(spec: string): boolean {
  return spec === 'zone.js' || spec.startsWith('zone.js/');
}

/** Finds `import 'zone.js'`, `export … from 'zone.js'`, `import('zone.js')` and `require('zone.js')`. */
export function findZoneImports(input: SourceInput): Violation[] {
  const sf = parse(input);
  const violations: Violation[] = [];
  const report = (node: ts.Node, spec: string): void => {
    violations.push({
      rule: 'no-zone',
      file: input.path,
      line: lineOf(sf, node),
      message: `imports "${spec}"; adapters must run without global-patching polyfills`,
    });
  };

  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier) &&
      isZoneSpecifier(node.moduleSpecifier.text)
    ) {
      report(node, node.moduleSpecifier.text);
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      ts.isStringLiteralLike(node.moduleReference.expression) &&
      isZoneSpecifier(node.moduleReference.expression.text)
    ) {
      report(node, node.moduleReference.expression.text);
    } else if (ts.isCallExpression(node) && node.arguments.length > 0) {
      const isDynamicImport =
        node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire =
        ts.isIdentifier(node.expression) && node.expression.text === 'require';
      const arg = node.arguments[0];
      if (
        (isDynamicImport || isRequire) &&
        ts.isStringLiteralLike(arg) &&
        isZoneSpecifier(arg.text)
      ) {
        report(node, arg.text);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return violations;
}

// ─── Rule: registry writes ──────────────────────────

/**
 * Finds writes to `__TUVIX_MODULES__`. Only {@link REGISTRY_OWNER} may write it;
 * everything else calls `registerModule`.
 */
export function findRegistryWrites(input: SourceInput): Violation[] {
  if (input.path === REGISTRY_OWNER) return [];
  const sf = parse(input);
  const constants = collectStringConstants(sf);
  const aliases = new Set<string>();
  const violations: Violation[] = [];

  /** True when the expression is the registry object itself. */
  const isRegistry = (node: ts.Expression): boolean => {
    const inner = stripParens(node);
    if (ts.isPropertyAccessExpression(inner))
      return inner.name.text === REGISTRY_KEY;
    if (ts.isElementAccessExpression(inner)) {
      return stringValue(inner.argumentExpression, constants) === REGISTRY_KEY;
    }
    if (ts.isIdentifier(inner)) return aliases.has(inner.text);
    if (ts.isBinaryExpression(inner)) {
      // `window.__TUVIX_MODULES__ ?? {}` / `|| {}` / `??=`
      return isRegistry(inner.left);
    }
    return false;
  };

  /** True when writing to this target changes the registry or one of its entries. */
  const touchesRegistry = (target: ts.Expression): boolean => {
    const inner = stripParens(target);
    if (isRegistry(inner)) return !ts.isIdentifier(inner);
    if (
      ts.isPropertyAccessExpression(inner) ||
      ts.isElementAccessExpression(inner)
    ) {
      return isRegistry(inner.expression);
    }
    return false;
  };

  const report = (node: ts.Node, what: string): void => {
    violations.push({
      rule: 'registry',
      file: input.path,
      line: lineOf(sf, node),
      message: `${what} ${REGISTRY_KEY}; call registerModule()/unregisterModule() from ${LOADER_PACKAGE} instead`,
    });
  };

  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer
    ) {
      if (isRegistry(node.initializer)) aliases.add(node.name.text);
    } else if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    ) {
      if (touchesRegistry(node.left)) report(node, 'writes');
      else if (ts.isIdentifier(node.left) && isRegistry(node.right))
        aliases.add(node.left.text);
    } else if (
      ts.isDeleteExpression(node) &&
      touchesRegistry(node.expression)
    ) {
      report(node, 'deletes from');
    } else if (ts.isCallExpression(node)) {
      const callee = stripParens(node.expression);
      if (
        ts.isPropertyAccessExpression(callee) &&
        ts.isIdentifier(callee.expression)
      ) {
        const owner = callee.expression.text;
        const method = callee.name.text;
        const [first, second] = node.arguments;
        if (
          owner === 'Object' &&
          method === 'assign' &&
          first &&
          isRegistry(first)
        ) {
          report(node, 'Object.assign() into');
        } else if (
          (owner === 'Object' || owner === 'Reflect') &&
          (method === 'defineProperty' ||
            method === 'set' ||
            method === 'deleteProperty') &&
          first &&
          (isRegistry(first) ||
            (second !== undefined &&
              stringValue(second, constants) === REGISTRY_KEY))
        ) {
          report(node, `${owner}.${method}() on`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return violations;
}

// ─── Rules reached from the factory ─────────────────

type Callable =
  | ts.FunctionDeclaration
  | ts.ClassDeclaration
  | ts.ArrowFunction
  | ts.FunctionExpression
  | ts.ClassExpression;

interface FileInfo {
  sf: ts.SourceFile;
  constants: Map<string, string>;
  /** Top-level functions and classes by local name. */
  declarations: Map<string, Callable>;
  /** Local name → imported binding. */
  imports: Map<string, { from: string; name: string; namespace: boolean }>;
  /** Exported name → re-exported binding (`export { a as b } from './x'`). */
  reexports: Map<string, { from: string; name: string }>;
}

function analyseFile(input: SourceInput): FileInfo {
  const sf = parse(input);
  const declarations = new Map<string, Callable>();
  const imports: FileInfo['imports'] = new Map();
  const reexports: FileInfo['reexports'] = new Map();

  for (const statement of sf.statements) {
    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement)) &&
      statement.name
    ) {
      declarations.set(statement.name.text, statement);
    } else if (ts.isVariableStatement(statement)) {
      for (const decl of statement.declarationList.declarations) {
        if (!ts.isIdentifier(decl.name) || !decl.initializer) continue;
        const init = stripParens(decl.initializer);
        if (
          ts.isArrowFunction(init) ||
          ts.isFunctionExpression(init) ||
          ts.isClassExpression(init)
        ) {
          declarations.set(decl.name.text, init);
        }
      }
    } else if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteralLike(statement.moduleSpecifier) &&
      statement.importClause
    ) {
      const from = statement.moduleSpecifier.text;
      const bindings = statement.importClause.namedBindings;
      if (statement.importClause.name) {
        imports.set(statement.importClause.name.text, {
          from,
          name: 'default',
          namespace: false,
        });
      }
      if (bindings && ts.isNamespaceImport(bindings)) {
        imports.set(bindings.name.text, { from, name: '*', namespace: true });
      } else if (bindings) {
        for (const el of bindings.elements) {
          imports.set(el.name.text, {
            from,
            name: (el.propertyName ?? el.name).text,
            namespace: false,
          });
        }
      }
    } else if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteralLike(statement.moduleSpecifier) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const el of statement.exportClause.elements) {
        reexports.set(el.name.text, {
          from: statement.moduleSpecifier.text,
          name: (el.propertyName ?? el.name).text,
        });
      }
    }
  }
  return {
    sf,
    constants: collectStringConstants(sf),
    declarations,
    imports,
    reexports,
  };
}

function resolveRelative(
  fromFile: string,
  spec: string,
  files: Map<string, FileInfo>
): string | undefined {
  if (!spec.startsWith('.')) return undefined;
  const base = path.posix.join(path.posix.dirname(fromFile), spec);
  const stem = base.replace(/\.(m|c)?js$/, '');
  const candidates = [
    base,
    `${stem}.ts`,
    `${stem}.tsx`,
    `${stem}.mts`,
    `${stem}.js`,
    `${stem}.jsx`,
    `${stem}/index.ts`,
    `${stem}/index.tsx`,
    `${stem}/index.js`,
  ];
  return candidates.find((c) => files.has(c));
}

interface Reached {
  register: boolean;
  lifecycle: Set<string>;
  weakMap: boolean;
}

/**
 * Walks everything the factory can reach inside the package and records the
 * contract calls it makes.
 */
function walkFactory(
  target: AdapterTarget,
  files: Map<string, FileInfo>
): { reached: Reached; start?: { file: string; node: Callable } } {
  const reached: Reached = {
    register: false,
    lifecycle: new Set(),
    weakMap: false,
  };

  const lookup = (
    file: string,
    name: string,
    seen = new Set<string>()
  ): { file: string; node: Callable } | undefined => {
    const key = `${file}#${name}`;
    if (seen.has(key)) return undefined;
    seen.add(key);
    const info = files.get(file);
    if (!info) return undefined;
    const local = info.declarations.get(name);
    if (local) return { file, node: local };
    const imported = info.imports.get(name);
    if (imported && !imported.namespace) {
      const resolved = resolveRelative(file, imported.from, files);
      if (resolved) return lookup(resolved, imported.name, seen);
    }
    const reexported = info.reexports.get(name);
    if (reexported) {
      const resolved = resolveRelative(file, reexported.from, files);
      if (resolved) return lookup(resolved, reexported.name, seen);
    }
    return undefined;
  };

  let start: { file: string; node: Callable } | undefined;
  for (const file of files.keys()) {
    const info = files.get(file)!;
    if (info.declarations.has(target.factory)) {
      start = { file, node: info.declarations.get(target.factory)! };
      break;
    }
  }
  if (!start) return { reached };

  const fromLoader = (file: string, spec: string): boolean =>
    spec === LOADER_PACKAGE ||
    // Inside the loader package itself, './runtime' is the owner of the registry.
    resolveRelative(file, spec, files) === REGISTRY_OWNER;

  const isLoaderFunction = (
    info: FileInfo,
    file: string,
    callee: ts.Expression,
    fnName: string
  ): boolean => {
    const inner = stripParens(callee);
    if (ts.isIdentifier(inner)) {
      const binding = info.imports.get(inner.text);
      return (
        !!binding &&
        !binding.namespace &&
        binding.name === fnName &&
        fromLoader(file, binding.from)
      );
    }
    if (
      ts.isPropertyAccessExpression(inner) &&
      ts.isIdentifier(inner.expression)
    ) {
      const binding = info.imports.get(inner.expression.text);
      return (
        !!binding &&
        binding.namespace &&
        inner.name.text === fnName &&
        fromLoader(file, binding.from)
      );
    }
    return false;
  };

  const visited = new Set<Callable>();
  const queue: Array<{ file: string; node: Callable }> = [start];
  while (queue.length > 0) {
    const { file, node } = queue.shift()!;
    if (visited.has(node)) continue;
    visited.add(node);
    const info = files.get(file)!;

    const visit = (child: ts.Node): void => {
      if (ts.isCallExpression(child)) {
        if (isLoaderFunction(info, file, child.expression, 'registerModule')) {
          reached.register = true;
        }
        if (
          isLoaderFunction(info, file, child.expression, 'emitLifecycle') &&
          child.arguments[0]
        ) {
          const type = stringValue(child.arguments[0], info.constants);
          if (type) reached.lifecycle.add(type);
        }
      }
      if (
        ts.isNewExpression(child) &&
        ts.isIdentifier(child.expression) &&
        child.expression.text === 'WeakMap'
      ) {
        reached.weakMap = true;
      }
      // Follow every reference to a top-level function or class: direct calls,
      // callbacks and `new` all count.
      if (ts.isIdentifier(child) && !isDeclarationName(child)) {
        const next = lookup(file, child.text);
        if (next && !visited.has(next.node)) queue.push(next);
      }
      ts.forEachChild(child, visit);
    };
    ts.forEachChild(node, visit);
  }
  return { reached, start };
}

function isDeclarationName(node: ts.Identifier): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if (ts.isPropertyAccessExpression(parent) && parent.name === node)
    return true;
  if (ts.isPropertyAssignment(parent) && parent.name === node) return true;
  if (
    ts.isImportSpecifier(parent) ||
    ts.isExportSpecifier(parent) ||
    ts.isImportClause(parent)
  )
    return true;
  if (
    (ts.isFunctionDeclaration(parent) ||
      ts.isClassDeclaration(parent) ||
      ts.isVariableDeclaration(parent) ||
      ts.isParameter(parent) ||
      ts.isMethodDeclaration(parent) ||
      ts.isPropertyDeclaration(parent)) &&
    parent.name === node
  ) {
    return true;
  }
  return false;
}

/**
 * Checks one factory against its rules. `sources` are the package's source
 * files (tests excluded).
 */
export function checkAdapter(
  target: AdapterTarget,
  sources: SourceInput[]
): Violation[] {
  const files = new Map<string, FileInfo>();
  for (const source of sources) files.set(source.path, analyseFile(source));

  const violations: Violation[] = [];
  const at = (
    rule: Rule,
    message: string,
    where?: { file: string; node: ts.Node }
  ): void => {
    const sf = where ? files.get(where.file)!.sf : undefined;
    violations.push({
      rule,
      file: where?.file ?? target.dir,
      line: where && sf ? lineOf(sf, where.node) : undefined,
      message: `${target.name} ${target.factory}: ${message}`,
    });
  };

  if (target.rules.includes('no-zone')) {
    for (const source of sources) violations.push(...findZoneImports(source));
  }

  const needsWalk = target.rules.some(
    (r) => r === 'register' || r === 'lifecycle' || r === 'per-container'
  );
  if (!needsWalk) return violations;

  const { reached, start } = walkFactory(target, files);
  if (!start) {
    at('register', `factory "${target.factory}" not found in ${target.dir}`);
    return violations;
  }

  if (target.rules.includes('register') && !reached.register) {
    at(
      'register',
      `never calls registerModule() from ${LOADER_PACKAGE}`,
      start
    );
  }
  if (target.rules.includes('lifecycle')) {
    const missing = LIFECYCLE_TYPES.filter((t) => !reached.lifecycle.has(t));
    if (missing.length > 0) {
      at(
        'lifecycle',
        `never calls emitLifecycle() with ${missing.map((t) => `'${t}'`).join(', ')}`,
        start
      );
    }
  }
  if (target.rules.includes('per-container') && !reached.weakMap) {
    at(
      'per-container',
      'keeps no WeakMap<HTMLElement, Instance>; each container needs its own instance',
      start
    );
  }
  return violations;
}

// ─── Repo scan ──────────────────────────────────────

const SOURCE_EXT = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const SKIP_DIRS: Record<string, true> = {
  node_modules: true,
  dist: true,
  __tests__: true,
  e2e: true,
  coverage: true,
  'test-results': true,
};

function isTestFile(file: string): boolean {
  return /\.(test|spec)\.[cm]?[jt]sx?$/.test(file) || file.endsWith('.d.ts');
}

function listSources(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.isDirectory()) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS[entry.name]) out.push(...listSources(full));
    } else if (SOURCE_EXT.test(entry.name) && !isTestFile(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function readSources(root: string, files: string[]): SourceInput[] {
  return files.map((full) => ({
    path: path.relative(root, full).split(path.sep).join('/'),
    text: fs.readFileSync(full, 'utf8'),
  }));
}

/** Runs every rule over the repo at `root`. */
export function checkRepo(root: string = ROOT): Violation[] {
  const violations: Violation[] = [];

  for (const target of TARGETS) {
    const sources = readSources(root, listSources(path.join(root, target.dir)));
    violations.push(...checkAdapter(target, sources));
  }

  // Registry writes: shipped package code and every example.
  const packagesDir = path.join(root, 'packages');
  const scanned = [
    ...fs
      .readdirSync(packagesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .flatMap((d) => listSources(path.join(packagesDir, d.name, 'src'))),
    ...listSources(path.join(root, 'examples')),
  ];
  for (const source of readSources(root, scanned)) {
    violations.push(...findRegistryWrites(source));
  }
  return violations;
}

function main(): void {
  console.log('Checking the adapter contract (C4)...\n');
  const violations = checkRepo();
  if (violations.length === 0) {
    for (const target of TARGETS)
      console.log(
        `   ✓ ${target.name} ${target.factory}: ${target.rules.join(', ')}`
      );
    console.log(`   ✓ only ${REGISTRY_OWNER} writes ${REGISTRY_KEY}`);
    console.log('\nAdapter contract holds.');
    return;
  }
  for (const v of violations) {
    const where = v.line ? `${v.file}:${v.line}` : v.file;
    console.error(`   ✗ [${v.rule}] ${where}  ${v.message}`);
  }
  console.error(`\n${violations.length} contract violation(s).`);
  process.exit(1);
}

const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (executedFilePath === path.resolve(__filename_)) {
  main();
}
