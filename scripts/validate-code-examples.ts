/**
 * validate-code-examples.ts
 *
 * Finds all project markdown files (README.md + website docs), extracts
 * TypeScript/JavaScript code blocks, parses import statements, and validates
 * that imported symbols actually exist in the corresponding package exports.
 *
 * Usage:  npx tsx scripts/validate-code-examples.ts
 * Exit 0: all imports valid
 * Exit 1: one or more invalid imports found
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Configuration ──────────────────────────────────────

const __filename_ = fileURLToPath(import.meta.url);
const __dirname_ = path.dirname(__filename_);
const ROOT = path.resolve(__dirname_, '..');
const PACKAGES_DIR = path.join(ROOT, 'packages');

/** Package directory name to npm package name */
export const PACKAGE_NAME_MAP: Record<string, string> = {
  tuvix: 'tuvix.js',
  core: '@tuvix.js/core',
  router: '@tuvix.js/router',
  'event-bus': '@tuvix.js/event-bus',
  loader: '@tuvix.js/loader',
  sandbox: '@tuvix.js/sandbox',
  react: '@tuvix.js/react',
  vue: '@tuvix.js/vue',
  angular: '@tuvix.js/angular',
  devtools: '@tuvix.js/devtools',
  'module-federation': '@tuvix.js/module-federation',
  server: '@tuvix.js/server',
  svelte: '@tuvix.js/svelte',
  cli: 'create-tuvix-app',
};

/** Packages we validate imports for (derived from PACKAGE_NAME_MAP to avoid duplication) */
export const TUVIX_PACKAGES = new Set(Object.values(PACKAGE_NAME_MAP));

// ─── Export Parser ──────────────────────────────────────

/**
 * Parse TypeScript source content and return all exported symbol names.
 * Handles:
 *   export { A, B, C } from '...';
 *   export { A } from '...';
 *   export function foo(...) { ... }
 *   export class Bar { ... }
 *   export const baz = ...;
 *   export type { X, Y } from '...';
 *   export interface Foo { ... }
 *   export enum Bar { ... }
 */
export function parseExportsFromContent(rawContent: string): Set<string> {
  const exports = new Set<string>();

  // Strip block comments (/** ... */ and /* ... */) and single-line comments
  // to avoid matching exports inside JSDoc examples
  const content = rawContent
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');

  // Match: export { A, B, C } from '...';
  // Match: export type { A, B, C } from '...';
  // Match: export { A, B, C };
  const reExportBraces = /export\s+(?:type\s+)?\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = reExportBraces.exec(content)) !== null) {
    const symbols = match[1]!;
    for (const sym of symbols.split(',')) {
      const trimmed = sym.trim();
      if (!trimmed) continue;
      // Handle "Original as Alias" — export the alias
      const parts = trimmed.split(/\s+as\s+/);
      const exported = (parts.length > 1 ? parts[1] : parts[0])!.trim();
      if (exported) {
        exports.add(exported);
      }
    }
  }

  // Match: export function foo(
  const reFuncExport = /export\s+(?:async\s+)?function\s+(\w+)/g;
  while ((match = reFuncExport.exec(content)) !== null) {
    exports.add(match[1]!);
  }

  // Match: export class Foo
  const reClassExport = /export\s+class\s+(\w+)/g;
  while ((match = reClassExport.exec(content)) !== null) {
    exports.add(match[1]!);
  }

  // Match: export const foo / export let foo / export var foo
  const reVarExport = /export\s+(?:const|let|var)\s+(\w+)/g;
  while ((match = reVarExport.exec(content)) !== null) {
    exports.add(match[1]!);
  }

  // Match: export interface Foo
  const reInterfaceExport = /export\s+interface\s+(\w+)/g;
  while ((match = reInterfaceExport.exec(content)) !== null) {
    exports.add(match[1]!);
  }

  // Match: export enum Foo
  const reEnumExport = /export\s+enum\s+(\w+)/g;
  while ((match = reEnumExport.exec(content)) !== null) {
    exports.add(match[1]!);
  }

  // Match: export type Foo = ...
  const reTypeExport = /export\s+type\s+(\w+)\s*=/g;
  while ((match = reTypeExport.exec(content)) !== null) {
    exports.add(match[1]!);
  }

  return exports;
}

/**
 * Parse an index.ts file and return all exported symbol names.
 */
function parseExports(filePath: string): Set<string> {
  if (!fs.existsSync(filePath)) {
    return new Set<string>();
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return parseExportsFromContent(content);
}

// ─── Build Export Map ───────────────────────────────────

export function buildExportMap(): Map<string, Set<string>> {
  const exportMap = new Map<string, Set<string>>();

  const packageDirs = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true });

  for (const entry of packageDirs) {
    if (!entry.isDirectory()) continue;

    const dirName = entry.name;
    const packageName = PACKAGE_NAME_MAP[dirName];
    if (!packageName) continue;

    const indexPath = path.join(PACKAGES_DIR, dirName, 'src', 'index.ts');
    const exports = parseExports(indexPath);

    if (exports.size > 0) {
      exportMap.set(packageName, exports);
    }
  }

  return exportMap;
}

// ─── Markdown File Discovery ────────────────────────────

function collectMarkdownFiles(dir: string, results: string[]): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules
      if (entry.name === 'node_modules') continue;
      collectMarkdownFiles(fullPath, results);
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
}

export function findMarkdownFiles(): string[] {
  const files: string[] = [];

  // All root-level *.md files (README.md, README.*.md, CONTRIBUTING.md, etc.)
  const rootEntries = fs.readdirSync(ROOT, { withFileTypes: true });
  for (const entry of rootEntries) {
    if (!entry.isDirectory() && entry.name.endsWith('.md')) {
      files.push(path.join(ROOT, entry.name));
    }
  }

  // packages/**/*.md (recursive — covers README + any other docs)
  if (fs.existsSync(PACKAGES_DIR)) {
    collectMarkdownFiles(PACKAGES_DIR, files);
  }

  // website/**/*.md (recursive)
  const websiteDir = path.join(ROOT, 'website');
  if (fs.existsSync(websiteDir)) {
    collectMarkdownFiles(websiteDir, files);
  }

  // docs/**/*.md (recursive)
  const docsDir = path.join(ROOT, 'docs');
  if (fs.existsSync(docsDir)) {
    collectMarkdownFiles(docsDir, files);
  }

  // examples/**/*.md (recursive)
  const examplesDir = path.join(ROOT, 'examples');
  if (fs.existsSync(examplesDir)) {
    collectMarkdownFiles(examplesDir, files);
  }

  return files;
}

// ─── Code Block Extraction ──────────────────────────────

export interface CodeBlock {
  language: string;
  code: string;
  startLine: number;
}

export function extractCodeBlocks(content: string): CodeBlock[] {
  const blocks: CodeBlock[] = [];
  const lines = content.split('\n');

  let inBlock = false;
  let blockLang = '';
  let blockLines: string[] = [];
  let blockStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (!inBlock) {
      const openMatch = line.match(
        /^```(ts|typescript|tsx|js|javascript|jsx)\s*$/
      );
      if (openMatch) {
        inBlock = true;
        blockLang = openMatch[1]!;
        blockLines = [];
        blockStart = i + 1; // 0-indexed, will display as 1-indexed
      }
    } else {
      if (line.startsWith('```')) {
        blocks.push({
          language: blockLang,
          code: blockLines.join('\n'),
          startLine: blockStart + 1, // 1-indexed
        });
        inBlock = false;
      } else {
        blockLines.push(line);
      }
    }
  }

  return blocks;
}

// ─── Import Parser ──────────────────────────────────────

export interface ParsedImport {
  symbols: string[];
  packageName: string;
  line: number;
  raw: string;
}

export function parseImports(
  code: string,
  blockStartLine: number
): ParsedImport[] {
  const imports: ParsedImport[] = [];
  const codeLines = code.split('\n');

  for (let i = 0; i < codeLines.length; i++) {
    const line = codeLines[i]!;

    // Match: import { A, B, C } from 'package-name';
    // Match: import type { A, B } from 'package-name';
    const importMatch = line.match(
      /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/
    );
    if (importMatch) {
      const symbolsStr = importMatch[1]!;
      const packageName = importMatch[2]!;

      const symbols = symbolsStr
        .split(',')
        .map((s) => {
          const trimmed = s.trim();
          // Handle "Original as Alias" — the imported name is Original
          const parts = trimmed.split(/\s+as\s+/);
          return parts[0]!.trim();
        })
        .filter((s) => s.length > 0);

      imports.push({
        symbols,
        packageName,
        line: blockStartLine + i,
        raw: line.trim(),
      });
    }

    // Match: import DefaultExport from 'package-name';
    const defaultMatch = line.match(
      /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/
    );
    if (defaultMatch && !importMatch) {
      imports.push({
        symbols: [defaultMatch[1]!],
        packageName: defaultMatch[2]!,
        line: blockStartLine + i,
        raw: line.trim(),
      });
    }
  }

  return imports;
}

// ─── Validation ─────────────────────────────────────────

export interface ValidationError {
  file: string;
  line: number;
  symbol: string;
  packageName: string;
  message: string;
}

export function validateContent(
  content: string,
  filePath: string,
  exportMap: Map<string, Set<string>>,
  tuvixPackages: Set<string>,
  rootDir: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const codeBlocks = extractCodeBlocks(content);

  for (const block of codeBlocks) {
    const imports = parseImports(block.code, block.startLine);

    for (const imp of imports) {
      // Only validate tuvix ecosystem imports
      if (!tuvixPackages.has(imp.packageName)) continue;

      const knownExports = exportMap.get(imp.packageName);

      if (!knownExports) {
        for (const sym of imp.symbols) {
          errors.push({
            file: path.relative(rootDir, filePath),
            line: imp.line,
            symbol: sym,
            packageName: imp.packageName,
            message: `Package "${imp.packageName}" has no known exports (index.ts not found or empty)`,
          });
        }
        continue;
      }

      for (const sym of imp.symbols) {
        if (!knownExports.has(sym)) {
          errors.push({
            file: path.relative(rootDir, filePath),
            line: imp.line,
            symbol: sym,
            packageName: imp.packageName,
            message: `Symbol "${sym}" is not exported by "${imp.packageName}"`,
          });
        }
      }
    }
  }

  return errors;
}

function validate(
  exportMap: Map<string, Set<string>>,
  mdFiles: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const file of mdFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const fileErrors = validateContent(
      content,
      file,
      exportMap,
      TUVIX_PACKAGES,
      ROOT
    );
    errors.push(...fileErrors);
  }

  return errors;
}

// ─── Main ───────────────────────────────────────────────

function main(): void {
  console.log('Validating code examples in documentation...\n');

  // Step 1: Build export map from actual index.ts files
  const exportMap = buildExportMap();

  console.log('Package exports discovered:');
  for (const [pkg, exports] of exportMap) {
    console.log(`  ${pkg}: ${[...exports].join(', ')}`);
  }
  console.log('');

  // Step 2: Find all markdown files
  const mdFiles = findMarkdownFiles();
  console.log(`Found ${mdFiles.length} markdown files to scan.\n`);

  // Step 3: Validate imports
  const errors = validate(exportMap, mdFiles);

  // Step 4: Report results
  if (errors.length === 0) {
    console.log('All code example imports are valid.');
    process.exit(0);
  } else {
    console.error(`Found ${errors.length} invalid import(s):\n`);
    for (const err of errors) {
      console.error(`  ${err.file}:${err.line}`);
      console.error(`    ${err.message}`);
      console.error('');
    }
    process.exit(1);
  }
}

// Only run main when executed directly (not imported for testing).
// When invoked via `npx tsx scripts/validate-code-examples.ts`, tsx sets
// process.argv[1] to the resolved script path.
const currentFilePath = path.resolve(__filename_);
const executedFilePath = process.argv[1]
  ? path.resolve(process.argv[1])
  : '';

if (executedFilePath === currentFilePath) {
  main();
}
