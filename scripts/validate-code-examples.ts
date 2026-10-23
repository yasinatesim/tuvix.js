/**
 * validate-code-examples.ts
 *
 * Type-checks the code blocks in the project's markdown against the real
 * package types, so documentation cannot drift away from the API.
 *
 * What gets checked
 *   - Markdown: root `*.md`, `packages/<pkg>/README*.md`, `website/**\/*.md`
 *     (every locale), `examples/**\/*.md`. CHANGELOG.md files are skipped.
 *   - Blocks fenced as ts, typescript, tsx, mts or cts: always.
 *   - Blocks fenced as js, javascript, jsx or mjs: only when they import a
 *     tuvix package (checked with `checkJs`).
 *
 * How
 *   One in-memory TypeScript program holds every block as its own ES module
 *   (`export {}` is appended, so top-level await works and blocks never share
 *   globals). Options: strict, target ES2022, `moduleResolution: bundler`,
 *   `jsx: react-jsx`, lib es2022 + dom.
 *   - `tuvix.js`, `@tuvix.js/*` and their subpaths resolve through each
 *     package.json `exports` map to the package source (`src/<entry>.ts`), so
 *     the check needs no build. A subpath that is not exported fails.
 *   - Relative imports (`./App`, `./App.vue`, `../styles.css`) and third-party
 *     modules that are not installed anywhere in the workspace resolve to a
 *     generated shim in which every imported name is both an `any` value and
 *     an `any` type. Installed third-party modules (react, vue, svelte,
 *     @angular/core, vite, ...) resolve to their real types, searched from the
 *     repo root, every package directory and website/.
 *   - `@types/node` and `@tuvix.js/vite/client` (`virtual:tuvix/assets`) are
 *     loaded globally; vite/client too when installed.
 *
 * Opting a block out (intentionally partial snippets)
 *   ```ts no-check                  fence meta, combinable with VitePress
 *   ```ts [main.ts] no-check        labels and line highlights
 *   <!-- tuvix-validate: skip -->   on the last non-blank line before the fence
 *
 * Gating
 *   Errors in English and translated files fail the run (exit 1). Every locale
 *   was rewritten against the 0.5 API, so translated code blocks are held to
 *   the same bar. `STRICT_LOCALES_DEFAULT` below switches translated errors
 *   back to warnings if a future API change needs a staged translation pass;
 *   `--strict-locales` or `TUVIX_VALIDATE_STRICT_LOCALES=1` then re-enables
 *   the gate for a single run.
 *
 * Usage
 *   pnpm validate-docs
 *   pnpm tsx scripts/validate-code-examples.ts [--strict-locales] [--quiet-locales]
 *     [--filter <path-substring>]...
 *
 *   --filter limits the run to files whose repo-relative path contains the
 *   substring (repeatable). --quiet-locales prints only per-locale counts for
 *   translated files.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// ─── Configuration ──────────────────────────────────────

const __filename_ = fileURLToPath(import.meta.url);
const __dirname_ = path.dirname(__filename_);
export const ROOT = path.resolve(__dirname_, '..');

/** Set to `false` only while translations catch up with an API change. */
const STRICT_LOCALES_DEFAULT = true;

/** Locale codes used in `website/<locale>/` and `README.<locale>.md`. */
export const LOCALES = ['de', 'es', 'fr', 'hi', 'it', 'ja', 'pt', 'tr', 'zh'];

const TS_LANGUAGES: Record<string, ts.Extension> = {
  ts: ts.Extension.Ts,
  typescript: ts.Extension.Ts,
  mts: ts.Extension.Ts,
  cts: ts.Extension.Ts,
  tsx: ts.Extension.Tsx,
};

const JS_LANGUAGES: Record<string, ts.Extension> = {
  js: ts.Extension.Js,
  javascript: ts.Extension.Js,
  mjs: ts.Extension.Js,
  jsx: ts.Extension.Jsx,
};

const SKIP_COMMENT = /^<!--\s*tuvix-validate:\s*skip\s*-->$/;
const NO_CHECK_META = /(^|\s)no-check(\s|$)/;
const TUVIX_IMPORT =
  /(?:\bfrom\s*|\bimport\s*\(?\s*|\brequire\s*\(\s*)['"](?:tuvix\.js|@tuvix\.js\/[^'"]+|create-tuvix-app)['"]/;

/** Virtual directory for snippet modules; never written to disk. */
const VIRTUAL_DIR = path.join(ROOT, '.tuvix-docs-check');
const SHIM_DIR = path.join(VIRTUAL_DIR, '__shims__');

// ─── Markdown discovery ─────────────────────────────────

function collectMarkdown(dir: string, out: string[]): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    if (entry.name === 'dist' || entry.name === 'CHANGELOG.md') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectMarkdown(full, out);
    else if (entry.name.endsWith('.md')) out.push(full);
  }
}

/** Every markdown file the validator checks, as absolute paths. */
export function findMarkdownFiles(root: string = ROOT): string[] {
  const files: string[] = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (
      entry.isFile() &&
      entry.name.endsWith('.md') &&
      entry.name !== 'CHANGELOG.md'
    ) {
      files.push(path.join(root, entry.name));
    }
  }

  const packagesDir = path.join(root, 'packages');
  if (fs.existsSync(packagesDir)) {
    for (const pkg of fs.readdirSync(packagesDir, { withFileTypes: true })) {
      if (!pkg.isDirectory()) continue;
      const pkgDir = path.join(packagesDir, pkg.name);
      for (const name of fs.readdirSync(pkgDir)) {
        if (/^README(\.[\w-]+)?\.md$/.test(name))
          files.push(path.join(pkgDir, name));
      }
    }
  }

  for (const dir of ['website', 'examples']) {
    const full = path.join(root, dir);
    if (fs.existsSync(full)) collectMarkdown(full, files);
  }

  return files.sort();
}

/**
 * Locale of a repo-relative markdown path, or `null` for English.
 * `website/tr/guide/x.md` and `packages/core/README.tr.md` are `tr`.
 */
export function getLocale(relPath: string): string | null {
  const parts = relPath.split(/[\\/]/);
  if (parts[0] === 'website' && parts[1] && LOCALES.includes(parts[1])) {
    return parts[1];
  }
  const readme = /^README\.([\w-]+)\.md$/.exec(parts[parts.length - 1] ?? '');
  if (readme && LOCALES.includes(readme[1]!)) return readme[1]!;
  return null;
}

// ─── Code block extraction ──────────────────────────────

export interface CodeBlock {
  /** Fence language, lower-cased (`ts`, `tsx`, `js`, ...). */
  language: string;
  /** Rest of the fence info string (VitePress label, `no-check`, ...). */
  meta: string;
  code: string;
  /** 1-based markdown line of the first code line. */
  startLine: number;
  /** Columns of fence indentation stripped from each code line. */
  indent: number;
  /** `no-check` meta or a preceding skip comment. */
  skip: boolean;
}

/** Every fenced code block in a markdown document, in order. */
export function extractCodeBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const lines = content.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const open = /^( *)(`{3,}|~{3,})\s*([^\s{:[`]*)([^`]*)$/.exec(lines[i]!);
    if (!open) {
      i++;
      continue;
    }
    const indent = open[1]!.length;
    const fence = open[2]!;
    const language = open[3]!.toLowerCase();
    const meta = open[4]!.trim();

    let prev = i - 1;
    while (prev >= 0 && lines[prev]!.trim() === '') prev--;
    const skipComment = prev >= 0 && SKIP_COMMENT.test(lines[prev]!.trim());

    const close = new RegExp(`^ {0,3}${fence[0]}{${fence.length},}\\s*$`);
    const body: string[] = [];
    let j = i + 1;
    while (j < lines.length && !close.test(lines[j]!)) {
      const line = lines[j]!;
      const lead = /^ */.exec(line)![0].length;
      body.push(line.slice(Math.min(lead, indent)));
      j++;
    }

    blocks.push({
      language,
      meta,
      code: body.join('\n'),
      startLine: i + 2,
      indent,
      skip: skipComment || NO_CHECK_META.test(meta),
    });
    i = j + 1;
  }

  return blocks;
}

/** File extension the block is checked as, or `null` when it is not checked. */
export function checkedExtension(block: CodeBlock): ts.Extension | null {
  if (block.skip) return null;
  const tsExt = TS_LANGUAGES[block.language];
  if (tsExt) return tsExt;
  const jsExt = JS_LANGUAGES[block.language];
  if (jsExt && TUVIX_IMPORT.test(block.code)) return jsExt;
  return null;
}

// ─── Module resolution ──────────────────────────────────

function isTuvixSpecifier(spec: string): boolean {
  return (
    spec === 'tuvix.js' ||
    spec.startsWith('tuvix.js/') ||
    spec.startsWith('@tuvix.js/') ||
    spec === 'create-tuvix-app' ||
    spec.startsWith('virtual:tuvix')
  );
}

type ExportTarget = string | { [condition: string]: ExportTarget } | null;

function pickTypes(target: ExportTarget): string | null {
  if (typeof target === 'string')
    return target.endsWith('.d.ts') ? target : null;
  if (!target) return null;
  if (typeof target.types === 'string') return target.types;
  for (const key of ['import', 'default', 'require']) {
    const found = target[key] !== undefined ? pickTypes(target[key]!) : null;
    if (found) return found;
  }
  return null;
}

/**
 * Map of tuvix specifier (`@tuvix.js/vue/server`) to the type entry file:
 * the package source when it exists, otherwise the declared types file.
 */
export function buildTuvixModuleMap(root: string = ROOT): Map<string, string> {
  const map = new Map<string, string>();
  const packagesDir = path.join(root, 'packages');
  for (const dir of fs.readdirSync(packagesDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;
    const pkgDir = path.join(packagesDir, dir.name);
    const manifest = path.join(pkgDir, 'package.json');
    if (!fs.existsSync(manifest)) continue;
    const pkg = JSON.parse(fs.readFileSync(manifest, 'utf-8')) as {
      name: string;
      types?: string;
      exports?: Record<string, ExportTarget>;
    };
    const entries: [string, string | null][] = pkg.exports
      ? Object.entries(pkg.exports).map(([key, target]) => [
          key,
          pickTypes(target),
        ])
      : [['.', pkg.types ?? null]];

    for (const [key, typesPath] of entries) {
      if (!typesPath || key === './package.json') continue;
      const spec =
        key === '.' ? pkg.name : `${pkg.name}/${key.replace(/^\.\//, '')}`;
      const dist = /^\.\/dist\/(.+)\.d\.[mc]?ts$/.exec(typesPath);
      const candidates = dist
        ? [`src/${dist[1]}.ts`, `src/${dist[1]}.tsx`, typesPath]
        : [typesPath];
      const file = candidates
        .map((c) => path.join(pkgDir, c))
        .find((c) => fs.existsSync(c));
      if (file) map.set(spec, file);
    }
  }
  return map;
}

interface ShimRequest {
  names: Set<string>;
  /** Namespace or dynamic import: the shim must be `any` as a whole. */
  wholeModule: boolean;
}

function collectShimRequest(sf: ts.SourceFile, spec: string): ShimRequest {
  const request: ShimRequest = { names: new Set(), wholeModule: false };
  const visit = (node: ts.Node): void => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === spec
    ) {
      const bindings = node.importClause?.namedBindings;
      if (bindings && ts.isNamespaceImport(bindings))
        request.wholeModule = true;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const el of bindings.elements) {
          request.names.add((el.propertyName ?? el.name).text);
        }
      }
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === spec
    ) {
      if (!node.exportClause || ts.isNamespaceExport(node.exportClause)) {
        request.wholeModule = true;
      } else {
        for (const el of node.exportClause.elements) {
          request.names.add((el.propertyName ?? el.name).text);
        }
      }
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      node.arguments[0].text === spec
    ) {
      request.wholeModule = true;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return request;
}

function renderShim(request: ShimRequest): string {
  if (request.wholeModule && request.names.size === 0) {
    return 'declare const __shim: any;\nexport = __shim;\n';
  }
  const lines = ['declare const __default: any;', 'export default __default;'];
  for (const name of request.names) {
    if (name === 'default') continue;
    lines.push(`export declare const ${name}: any;`);
    lines.push(`export type ${name}<A = any, B = any, C = any> = any;`);
  }
  return `${lines.join('\n')}\n`;
}

// ─── Type checking ──────────────────────────────────────

export interface MarkdownInput {
  /** Absolute path, used for locale classification and reporting. */
  path: string;
  content: string;
}

export interface DocDiagnostic {
  /** Repo-relative markdown path. */
  file: string;
  line: number;
  column: number;
  code: number;
  message: string;
  /** Locale code, or `null` for English (gating) files. */
  locale: string | null;
}

export interface CheckResult {
  diagnostics: DocDiagnostic[];
  checkedBlocks: number;
  skippedBlocks: number;
}

interface Snippet {
  md: string;
  locale: string | null;
  block: CodeBlock;
}

function compilerOptions(): ts.CompilerOptions {
  return {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts', 'lib.dom.iterable.d.ts'],
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    noEmit: true,
    allowJs: true,
    checkJs: true,
    esModuleInterop: true,
    allowImportingTsExtensions: true,
    allowArbitraryExtensions: true,
    resolveJsonModule: true,
    experimentalDecorators: true,
    skipLibCheck: true,
    types: ['node'],
  };
}

/**
 * Type-checks every checked code block of the given markdown documents in a
 * single TypeScript program and returns diagnostics mapped to markdown
 * line/column.
 */
export function checkMarkdown(
  inputs: MarkdownInput[],
  root: string = ROOT
): CheckResult {
  const options = compilerOptions();
  const snippets = new Map<string, Snippet>();
  const virtualFiles = new Map<string, string>();
  let skippedBlocks = 0;

  for (const input of inputs) {
    const rel = path.relative(root, input.path);
    const locale = getLocale(rel);
    for (const block of extractCodeBlocks(input.content)) {
      const ext = checkedExtension(block);
      if (!ext) {
        if (block.skip) skippedBlocks++;
        continue;
      }
      const fileName = path.join(
        VIRTUAL_DIR,
        `${rel}.L${block.startLine}${ext}`
      );
      snippets.set(fileName, { md: rel, locale, block });
      virtualFiles.set(fileName, `${block.code}\nexport {};\n`);
    }
  }

  const tuvixModules = buildTuvixModuleMap(root);
  const extraRoots = [path.join(root, 'packages/vite/client.d.ts')];
  const viteClient = ts.resolveModuleName(
    'vite/client',
    path.join(root, 'packages/vite/package.json'),
    options,
    ts.sys
  ).resolvedModule?.resolvedFileName;
  if (viteClient) extraRoots.push(viteClient);

  const host = ts.createCompilerHost(options, true);
  const baseGetSourceFile = host.getSourceFile.bind(host);
  host.fileExists = (f) => virtualFiles.has(f) || ts.sys.fileExists(f);
  host.readFile = (f) => virtualFiles.get(f) ?? ts.sys.readFile(f);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
    const text = virtualFiles.get(fileName);
    if (text !== undefined)
      return ts.createSourceFile(fileName, text, languageVersion, true);
    return baseGetSourceFile(fileName, languageVersion, onError, shouldCreate);
  };

  const fallbackBases = [
    root,
    ...fs
      .readdirSync(path.join(root, 'packages'))
      .map((d) => path.join(root, 'packages', d)),
    path.join(root, 'website'),
  ]
    .filter((d) => fs.existsSync(path.join(d, 'package.json')))
    .map((d) => path.join(d, '__resolve__.ts'));
  const thirdPartyCache = new Map<string, ts.ResolvedModuleFull | undefined>();
  let shimCount = 0;

  const resolveOne = (
    spec: string,
    containingFile: string,
    containingSourceFile: ts.SourceFile | undefined
  ): ts.ResolvedModuleFull | undefined => {
    if (isTuvixSpecifier(spec)) {
      const file = tuvixModules.get(spec);
      if (!file) return undefined;
      return {
        resolvedFileName: file,
        extension: file.endsWith('.tsx')
          ? ts.Extension.Tsx
          : file.endsWith('.d.ts')
            ? ts.Extension.Dts
            : ts.Extension.Ts,
        isExternalLibraryImport: false,
      };
    }

    const isSnippet = snippets.has(containingFile);
    if (!isSnippet) {
      return ts.resolveModuleName(spec, containingFile, options, host)
        .resolvedModule;
    }

    const relative = spec.startsWith('.') || spec.startsWith('/');
    if (!relative) {
      if (!thirdPartyCache.has(spec)) {
        let found: ts.ResolvedModuleFull | undefined;
        for (const base of fallbackBases) {
          found = ts.resolveModuleName(
            spec,
            base,
            options,
            host
          ).resolvedModule;
          if (found) break;
        }
        thirdPartyCache.set(spec, found);
      }
      const found = thirdPartyCache.get(spec);
      if (found) return found;
    }

    const request = containingSourceFile
      ? collectShimRequest(containingSourceFile, spec)
      : { names: new Set<string>(), wholeModule: true };
    const shimFile = path.join(SHIM_DIR, `${shimCount++}.d.ts`);
    virtualFiles.set(shimFile, renderShim(request));
    return {
      resolvedFileName: shimFile,
      extension: ts.Extension.Dts,
      isExternalLibraryImport: false,
    };
  };

  host.resolveModuleNameLiterals = (
    literals,
    containingFile,
    _ref,
    _opts,
    containingSourceFile
  ) =>
    literals.map((literal) => ({
      resolvedModule: resolveOne(
        literal.text,
        containingFile,
        containingSourceFile
      ),
    }));

  // `/// <reference types="@tuvix.js/vite/client" />` goes through type
  // reference resolution, not module resolution.
  host.resolveTypeReferenceDirectiveReferences = (
    refs,
    containingFile,
    redirected,
    opts
  ) =>
    refs.map((ref) => {
      const name = typeof ref === 'string' ? ref : ref.fileName;
      const file = isTuvixSpecifier(name) ? tuvixModules.get(name) : undefined;
      if (file) {
        return {
          resolvedTypeReferenceDirective: {
            primary: true,
            resolvedFileName: file,
            isExternalLibraryImport: false,
          },
        };
      }
      return ts.resolveTypeReferenceDirective(
        name,
        containingFile,
        opts,
        host,
        redirected
      );
    });

  const program = ts.createProgram({
    rootNames: [
      ...snippets.keys(),
      ...extraRoots.filter((f) => fs.existsSync(f)),
    ],
    options,
    host,
  });

  const diagnostics: DocDiagnostic[] = [];
  for (const [fileName, snippet] of snippets) {
    const sf = program.getSourceFile(fileName);
    if (!sf) continue;
    const found = [
      ...program.getSyntacticDiagnostics(sf),
      ...program.getSemanticDiagnostics(sf),
    ];
    for (const d of found) {
      const pos =
        d.start !== undefined
          ? sf.getLineAndCharacterOfPosition(d.start)
          : null;
      diagnostics.push({
        file: snippet.md,
        line: snippet.block.startLine + (pos?.line ?? 0),
        column: (pos?.character ?? 0) + 1 + snippet.block.indent,
        code: d.code,
        message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
        locale: snippet.locale,
      });
    }
  }

  for (const d of program.getOptionsDiagnostics()) {
    diagnostics.push({
      file: '(compiler options)',
      line: 0,
      column: 0,
      code: d.code,
      message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
      locale: null,
    });
  }

  diagnostics.sort(
    (a, b) =>
      a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column
  );
  return { diagnostics, checkedBlocks: snippets.size, skippedBlocks };
}

// ─── CLI ────────────────────────────────────────────────

function formatDiagnostic(d: DocDiagnostic): string {
  const [first, ...rest] = d.message.split('\n');
  const head = `${d.file}:${d.line}:${d.column} TS${d.code}: ${first}`;
  return [head, ...rest.map((l) => `    ${l}`)].join('\n');
}

interface CliOptions {
  strictLocales: boolean;
  quietLocales: boolean;
  filters: string[];
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    strictLocales:
      STRICT_LOCALES_DEFAULT ||
      process.env.TUVIX_VALIDATE_STRICT_LOCALES === '1',
    quietLocales: false,
    filters: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--strict-locales') options.strictLocales = true;
    else if (arg === '--quiet-locales') options.quietLocales = true;
    else if (arg === '--filter' && argv[i + 1])
      options.filters.push(argv[++i]!);
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function main(argv: string[]): number {
  const cli = parseArgs(argv);
  const started = Date.now();
  const files = findMarkdownFiles().filter(
    (f) =>
      cli.filters.length === 0 ||
      cli.filters.some((s) => path.relative(ROOT, f).includes(s))
  );
  const inputs = files.map((f) => ({
    path: f,
    content: fs.readFileSync(f, 'utf-8'),
  }));
  const result = checkMarkdown(inputs);

  const english = result.diagnostics.filter((d) => d.locale === null);
  const translated = result.diagnostics.filter((d) => d.locale !== null);

  if (english.length > 0) {
    console.error(`Errors (English docs, gate CI): ${english.length}\n`);
    for (const d of english) console.error(formatDiagnostic(d));
    console.error('');
  }

  if (translated.length > 0) {
    const label = cli.strictLocales ? 'Errors' : 'Warnings';
    if (!cli.quietLocales) {
      console.warn(`${label} (translated docs): ${translated.length}\n`);
      for (const d of translated) console.warn(formatDiagnostic(d));
      console.warn('');
    }
    const perLocale = new Map<string, number>();
    for (const d of translated)
      perLocale.set(d.locale!, (perLocale.get(d.locale!) ?? 0) + 1);
    console.warn(
      `${label} per locale: ${[...perLocale]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([l, n]) => `${l} ${n}`)
        .join(', ')}`
    );
  }

  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(
    `Checked ${result.checkedBlocks} code blocks in ${files.length} markdown files ` +
      `(${result.skippedBlocks} skipped by marker) in ${seconds}s: ` +
      `${english.length} English error(s), ${translated.length} translated ` +
      `${cli.strictLocales ? 'error(s)' : 'warning(s)'}.`
  );

  const failed =
    english.length > 0 || (cli.strictLocales && translated.length > 0);
  return failed ? 1 : 0;
}

// Run only when executed directly, not when imported by tests.
const executed = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (executed === path.resolve(__filename_)) {
  process.exitCode = main(process.argv.slice(2));
}
