import { init } from '@github/markdownlint-github';

/** @type {import('markdownlint-cli2').Options} */
const config = {
  config: init({
    // MD013 — line length: off (i18n files, tables, long URLs)
    MD013: false,

    // MD033 — no inline HTML: off (VitePress uses HTML in docs)
    MD033: false,

    // MD041 — first-line heading: off (some READMEs start with badges/shields)
    MD041: false,

    // MD060 — table column style: off (too noisy for existing docs)
    MD060: false,

    // MD040 — fenced code language: off for now (155 existing blocks across 107 i18n files)
    // TODO: enable once existing docs are updated — new code blocks should specify language
    MD040: false,
    'fenced-code-language': false,

    // MD004 — unordered list style: use dash (project convention)
    MD004: { style: 'dash' },
    'ul-style': { style: 'dash' },

    // MD024 — duplicate headings: off (intentional reuse like "Enable per app" under different H2 sections)
    MD024: false,
    'no-duplicate-heading': false,

    // MD025 / single-h1: off (VitePress uses frontmatter title + H1 together — intentional pattern)
    MD025: false,
    'single-title': false,
    'single-h1': false,
  }),

  // Files and directories to skip
  ignores: [
    // Dependencies
    'node_modules/**',
    '**/node_modules/**',
    '.pnpm-store/**',
    // Build output
    '**/dist/**',
    '**/.turbo/**',
    'website/.vitepress/cache/**',
    // Auto-generated
    '**/CHANGELOG.md',
    // Claude AI personal config (not part of the project)
    '.claude/**',
    // Memory files
    'memory/**',
    // Playwright test artifacts (auto-generated, may contain malformed markdown)
    'test-results/**',
  ],
};

export default config;
