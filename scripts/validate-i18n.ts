/**
 * validate-i18n.ts
 *
 * Validates that all locale docs stay in sync with the English source of truth.
 *
 * Check 1 — SIDEBAR STRUCTURE:
 *   Every locale config must have the same number of sidebar groups and items
 *   per group as the English config. Catches "added a page to en.ts but forgot
 *   the other locales" mistakes.
 *
 * Check 2 — HEADING STRUCTURE:
 *   Every translated markdown file must have the same number of H2 headings as
 *   its English counterpart. VitePress auto-generates the "On this page" TOC
 *   from H2 headings, so a mismatch means a broken TOC in that language.
 *
 * Usage:  npx tsx scripts/validate-i18n.ts
 * Exit 0: all checks pass
 * Exit 1: one or more issues found
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename_ = fileURLToPath(import.meta.url);
const __dirname_ = path.dirname(__filename_);
const ROOT = path.resolve(__dirname_, '..');
const WEBSITE = path.join(ROOT, 'website');
const CONFIG_DIR = path.join(WEBSITE, '.vitepress', 'config');

const LOCALES = ['de', 'es', 'fr', 'hi', 'it', 'ja', 'pt', 'tr', 'zh'] as const;
type Locale = (typeof LOCALES)[number];

interface ValidationError {
  locale: string;
  file?: string;
  message: string;
}

// ─── Brace-balanced extraction ────────────────────────────────────────────────

/**
 * Extracts the content of the block starting after `key:` using brace counting.
 * Works for both `{ ... }` and `[ ... ]` blocks.
 */
function extractBlock(source: string, key: string): string | null {
  const keyIdx = source.indexOf(key);
  if (keyIdx === -1) return null;

  const afterKey = source.slice(keyIdx + key.length).trimStart();
  const open = afterKey[0];
  const close = open === '{' ? '}' : open === '[' ? ']' : null;
  if (!close) return null;

  let depth = 0;
  let start = -1;
  for (let i = 0; i < afterKey.length; i++) {
    if (afterKey[i] === open) {
      if (depth === 0) start = i;
      depth++;
    } else if (afterKey[i] === close) {
      depth--;
      if (depth === 0) return afterKey.slice(start, i + 1);
    }
  }
  return null;
}

// ─── Sidebar parsing ──────────────────────────────────────────────────────────

interface SidebarGroup {
  itemCount: number;
}

interface SidebarSection {
  groups: SidebarGroup[];
}

/**
 * Parses the sidebar block of a VitePress locale config file.
 * Returns an array of sections (one per route prefix), each with their groups.
 *
 * Structure: sidebar → route sections → groups → items
 */
function parseSidebar(configPath: string): SidebarSection[] {
  if (!fs.existsSync(configPath)) return [];
  const content = fs.readFileSync(configPath, 'utf-8');

  const sidebarBlock = extractBlock(content, 'sidebar:');
  if (!sidebarBlock) return [];

  // Find each route section array: the value after '/guide/': [ ... ]
  // We look for patterns like `'/...': [` or `"/...": [`
  const sections: SidebarSection[] = [];
  const sectionRegex = /['"](\/[^'"]+)['"]\s*:\s*\[/g;
  let sectionMatch: RegExpExecArray | null;

  while ((sectionMatch = sectionRegex.exec(sidebarBlock)) !== null) {
    // Extract the array block for this section
    const afterColon = sidebarBlock.slice(
      sectionMatch.index + sectionMatch[0].length - 1
    );
    const arrayBlock = extractBlock(afterColon, '');
    if (!arrayBlock) continue;

    // Within this array, find each group object { text: ..., items: [...] }
    const groups: SidebarGroup[] = [];
    const groupRegex = /\{\s*\n?\s*text:/g;
    let groupMatch: RegExpExecArray | null;

    while ((groupMatch = groupRegex.exec(arrayBlock)) !== null) {
      const afterGroup = arrayBlock.slice(groupMatch.index);
      const groupBlock = extractBlock(afterGroup, '');
      if (!groupBlock) continue;

      // Count items inside this group's items array
      const itemsBlock = extractBlock(groupBlock, 'items:');
      if (!itemsBlock) continue;

      const itemCount = (itemsBlock.match(/link:/g) || []).length;
      groups.push({ itemCount });
    }

    if (groups.length > 0) {
      sections.push({ groups });
    }
  }

  return sections;
}

function validateSidebar(): ValidationError[] {
  const errors: ValidationError[] = [];
  const enSections = parseSidebar(path.join(CONFIG_DIR, 'en.ts'));

  for (const locale of LOCALES) {
    const configPath = path.join(CONFIG_DIR, `${locale}.ts`);

    if (!fs.existsSync(configPath)) {
      errors.push({ locale, message: `Config file missing: .vitepress/config/${locale}.ts` });
      continue;
    }

    const localeSections = parseSidebar(configPath);

    // Compare section count
    if (localeSections.length !== enSections.length) {
      errors.push({
        locale,
        message: `Sidebar has ${localeSections.length} route section(s) but English has ${enSections.length}`,
      });
    }

    const minSections = Math.min(enSections.length, localeSections.length);

    for (let s = 0; s < minSections; s++) {
      const enSection = enSections[s]!;
      const locSection = localeSections[s]!;

      // Compare group count per section
      if (locSection.groups.length !== enSection.groups.length) {
        errors.push({
          locale,
          message: `Sidebar section ${s + 1}: has ${locSection.groups.length} group(s) but English has ${enSection.groups.length}`,
        });
      }

      const minGroups = Math.min(enSection.groups.length, locSection.groups.length);
      for (let g = 0; g < minGroups; g++) {
        const enGroup = enSection.groups[g]!;
        const locGroup = locSection.groups[g]!;
        if (locGroup.itemCount !== enGroup.itemCount) {
          errors.push({
            locale,
            message: `Sidebar section ${s + 1}, group ${g + 1}: has ${locGroup.itemCount} item(s) but English has ${enGroup.itemCount}`,
          });
        }
      }
    }
  }

  return errors;
}

// ─── Heading structure validation ────────────────────────────────────────────

function extractH2Headings(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
  return lines
    .filter((l) => l.startsWith('## '))
    .map((l) => l.slice(3).trim());
}

function findMdFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...findMdFiles(full));
    } else if (entry.name.endsWith('.md')) {
      results.push(full);
    }
  }
  return results;
}

function validateHeadings(): ValidationError[] {
  const errors: ValidationError[] = [];

  // English guide + packages are the source of truth
  const enFiles = [
    ...findMdFiles(path.join(WEBSITE, 'guide')),
    ...findMdFiles(path.join(WEBSITE, 'packages')),
  ];

  for (const enFile of enFiles) {
    const relToWebsite = path.relative(WEBSITE, enFile);
    const enHeadings = extractH2Headings(enFile);

    for (const locale of LOCALES) {
      const translatedFile = path.join(WEBSITE, locale, relToWebsite);

      if (!fs.existsSync(translatedFile)) {
        errors.push({
          locale,
          file: path.join(locale, relToWebsite),
          message: `Missing file (English has ${enHeadings.length} H2 headings)`,
        });
        continue;
      }

      const translatedHeadings = extractH2Headings(translatedFile);

      if (translatedHeadings.length !== enHeadings.length) {
        errors.push({
          locale,
          file: path.join(locale, relToWebsite),
          message:
            `H2 count mismatch: has ${translatedHeadings.length} but English has ${enHeadings.length}. ` +
            `English headings: [${enHeadings.join(' | ')}]`,
        });
      }
    }
  }

  return errors;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  console.log('Validating i18n documentation sync...\n');

  let hasErrors = false;

  console.log('1. Checking sidebar structure across all locales...');
  const sidebarErrors = validateSidebar();
  if (sidebarErrors.length === 0) {
    console.log('   ✓ All locale sidebars match English structure\n');
  } else {
    hasErrors = true;
    console.error(`   ✗ ${sidebarErrors.length} sidebar issue(s):\n`);
    for (const err of sidebarErrors) {
      console.error(`   [${err.locale}] ${err.message}`);
    }
    console.log('');
  }

  console.log('2. Checking H2 heading counts across all locale docs...');
  const headingErrors = validateHeadings();
  if (headingErrors.length === 0) {
    console.log('   ✓ All translated files match English H2 heading counts\n');
  } else {
    hasErrors = true;
    console.error(`   ✗ ${headingErrors.length} heading issue(s):\n`);
    for (const err of headingErrors) {
      const loc = err.file ?? err.locale;
      console.error(`   [${loc}] ${err.message}`);
    }
    console.log('');
  }

  if (hasErrors) {
    console.error('i18n validation failed.');
    process.exit(1);
  } else {
    console.log('All i18n checks passed.');
    process.exit(0);
  }
}

const currentFilePath = path.resolve(__filename_);
const executedFilePath = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (executedFilePath === currentFilePath) {
  main();
}
