# Documentation Audit Report - Tuvix.js Website

**Date:** 2026-04-03
**Scope:** All .md files under `website/`

---

## 1. BROKEN SIDEBAR LINKS (English)

### File: `website/.vitepress/config/en.ts`

| Line | Sidebar Link | Target File | Status |
|------|-------------|-------------|--------|
| 89 | `/packages/create-tuvix-app` | `website/packages/create-tuvix-app.md` | OK |
| All other EN sidebar links | | | OK |

**English sidebar is clean** - all 21 links resolve to existing .md files.

---

## 2. BROKEN SIDEBAR LINKS (Locales)

Every non-English locale config defines sidebar links to guide pages that **do not exist**. Only `getting-started.md` exists for these locales. The Turkish locale (`tr`) is the most complete but still has gaps.

### Locales: es, de, fr, ja, zh, it, pt, hi

**Each of these 8 locales is missing ALL of the following guide files** (sidebar links that lead to 404):

| Config File | Broken Sidebar Link | Missing .md File |
|-------------|-------------------|------------------|
| `{locale}.ts` | `/{locale}/guide/what-is-tuvix` | `website/{locale}/guide/what-is-tuvix.md` |
| `{locale}.ts` | `/{locale}/guide/configuration` | `website/{locale}/guide/configuration.md` |
| `{locale}.ts` | `/{locale}/guide/architecture` | `website/{locale}/guide/architecture.md` |

**Total: 24 broken sidebar links** (3 missing files x 8 locales)

### Turkish locale (tr) - Missing guide files

The TR sidebar (`website/.vitepress/config/tr.ts`) links to these pages that **do not exist**:

| Line | Broken Sidebar Link | Missing File |
|------|-------------------|--------------|
| 29 | `/tr/guide/micro-apps` | `website/tr/guide/micro-apps.md` |
| 32 | `/tr/guide/routing` | `website/tr/guide/routing.md` |
| 39 | `/tr/guide/react` | `website/tr/guide/react.md` |
| 40 | `/tr/guide/vue` | `website/tr/guide/vue.md` |
| 41 | `/tr/guide/svelte` | `website/tr/guide/svelte.md` |
| 42 | `/tr/guide/angular` | `website/tr/guide/angular.md` |

**Total: 6 broken sidebar links** for Turkish

---

## 3. BROKEN NAV LINKS (Contributing)

Every locale nav bar links to a "Contributing" page:

| Config File | Nav Link | Missing File | Status |
|-------------|----------|--------------|--------|
| `en.ts` | `/contributing` | `website/contributing.md` | OK |
| `tr.ts` | `/tr/contributing` | `website/tr/contributing.md` | OK |
| `es.ts` | `/es/contributing` | `website/es/contributing.md` | MISSING |
| `de.ts` | `/de/contributing` | `website/de/contributing.md` | MISSING |
| `fr.ts` | `/fr/contributing` | `website/fr/contributing.md` | MISSING |
| `ja.ts` | `/ja/contributing` | `website/ja/contributing.md` | MISSING |
| `zh.ts` | `/zh/contributing` | `website/zh/contributing.md` | MISSING |
| `it.ts` | `/it/contributing` | `website/it/contributing.md` | MISSING |
| `pt.ts` | `/pt/contributing` | `website/pt/contributing.md` | MISSING |
| `hi.ts` | `/hi/contributing` | `website/hi/contributing.md` | MISSING |

**Total: 8 broken nav links**

---

## 4. LOCALE COMPLETENESS

### English (baseline) file set:
- `index.md`
- `contributing.md`
- `guide/`: what-is-tuvix, getting-started, configuration, architecture, micro-apps, lifecycle, routing, event-bus, sandbox, react, vue, svelte, angular (13 files)
- `packages/`: index, core, router, event-bus, loader, sandbox, react, vue, svelte, angular, devtools, server, module-federation, create-tuvix-app, tuvix (15 files)

### Per-locale status:

| Locale | index.md | contributing.md | guide/ files | packages/ files |
|--------|----------|----------------|--------------|-----------------|
| tr | OK | OK | 7 of 13 | 15 of 15 (OK) |
| es | OK | MISSING | 1 of 13 | 15 of 15 (OK) |
| de | OK | MISSING | 1 of 13 | 15 of 15 (OK) |
| fr | OK | MISSING | 1 of 13 | 15 of 15 (OK) |
| ja | OK | MISSING | 1 of 13 | 15 of 15 (OK) |
| zh | OK | MISSING | 1 of 13 | 15 of 15 (OK) |
| it | OK | MISSING | 1 of 13 | 15 of 15 (OK) |
| pt | OK | MISSING | 1 of 13 | 15 of 15 (OK) |
| hi | OK | MISSING | 1 of 13 | 15 of 15 (OK) |

### Missing guide files per locale (es, de, fr, ja, zh, it, pt, hi) - each missing 12 files:
- `guide/what-is-tuvix.md`
- `guide/configuration.md`
- `guide/architecture.md`
- `guide/micro-apps.md`
- `guide/lifecycle.md`
- `guide/routing.md`
- `guide/event-bus.md`
- `guide/sandbox.md`
- `guide/react.md`
- `guide/vue.md`
- `guide/svelte.md`
- `guide/angular.md`

### Missing guide files for Turkish (tr) - missing 6 files:
- `guide/micro-apps.md`
- `guide/routing.md`
- `guide/react.md`
- `guide/vue.md`
- `guide/svelte.md`
- `guide/angular.md`

**Total missing locale files: 8x12 + 6 + 8(contributing) = 110 missing files**

---

## 5. PACKAGE DOCS vs ACTUAL PACKAGES

### Actual packages in `packages/` directory:
angular, cli, core, devtools, event-bus, loader, module-federation, react, router, sandbox, server, svelte, tuvix, vue (14 packages)

### Package docs in `website/packages/`:
angular, core, devtools, event-bus, loader, module-federation, react, router, sandbox, server, svelte, tuvix, vue, create-tuvix-app (14 docs + index)

**Status: MATCH** - The `cli` package has `name: "create-tuvix-app"` in its package.json, so `create-tuvix-app.md` correctly documents it.

### Package doc content completeness:

| Package Doc | Has Name | Has Install | Has API | Has Examples |
|-------------|----------|-------------|---------|-------------|
| core.md | OK | OK | OK | OK |
| router.md | OK | OK | OK | OK |
| event-bus.md | OK | OK | OK | OK |
| loader.md | OK | OK | OK | OK |
| sandbox.md | OK | OK | OK | OK |
| react.md | OK | OK | OK | OK |
| vue.md | OK | OK | OK | OK |
| svelte.md | OK | OK | OK | OK |
| angular.md | OK | OK | OK | OK |
| devtools.md | OK | OK | OK | OK |
| server.md | OK | OK | OK | OK |
| module-federation.md | OK | OK | OK | OK |
| create-tuvix-app.md | OK | OK (Usage) | N/A (CLI) | OK |
| tuvix.md | OK | OK | N/A (umbrella) | OK |

---

## 6. INTERNAL LINK ISSUES IN MARKDOWN FILES

### Locale package docs linking to English guide pages

Multiple locale package docs contain links like `](/guide/react)` instead of `](/fr/guide/react)`. These resolve to English pages, not the locale's own (nonexistent) pages. This is technically functional but inconsistent.

| File | Line | Link | Issue |
|------|------|------|-------|
| `website/fr/packages/react.md` | 116 | `](/guide/react)` | Links to EN, not FR |
| `website/es/packages/react.md` | 116 | `](/guide/react)` | Links to EN, not ES |
| `website/de/packages/react.md` | 116 | `](/guide/react)` | Links to EN, not DE |
| `website/zh/packages/react.md` | 116 | `](/guide/react)` | Links to EN, not ZH |
| `website/ja/packages/react.md` | 116 | `](/guide/react)` | Links to EN, not JA |
| `website/pt/packages/react.md` | 116 | `](/guide/react)` | Links to EN, not PT |
| `website/hi/packages/react.md` | 116 | `](/guide/react)` | Links to EN, not HI |
| `website/it/packages/react.md` | 116 | `](/guide/react)` | Links to EN, not IT |
| (Same pattern for vue.md, svelte.md, angular.md in all 8 locales) | | | |

**Total: ~32 cross-locale link issues** (4 package files x 8 locales)

---

## 7. EXAMPLES REFERENCES

### create-tuvix-app.md lists these examples:

| Example | Exists in examples/ dir? |
|---------|------------------------|
| `with-react` | YES |
| `with-vue` | YES |
| `with-svelte` | YES |
| `with-angular` | YES |
| `with-ssr-react` | YES |
| `with-react-devtools` | YES |
| `with-react-event-bus` | YES |
| `with-react-router` | YES |
| `with-react-sandbox` | YES |
| `with-module-federation-react` | YES |
| `with-multiple-frameworks` | YES |

**All listed examples exist.** However, two example directories are NOT mentioned in docs:
- `with-vanilla` - exists but not listed in create-tuvix-app.md
- `with-ssr-vanilla` - exists but not listed in create-tuvix-app.md

---

## 8. CONTRIBUTING PAGE

- `website/contributing.md` - EXISTS and contains proper content
- `website/tr/contributing.md` - EXISTS
- All other locale contributing pages - MISSING (see Section 3)

---

## 9. MISCELLANEOUS ISSUES

### 9a. `ignoreDeadLinks` in shared.ts
- **File:** `website/.vitepress/config/shared.ts`, line 37
- `ignoreDeadLinks: [/localhost/]` only ignores localhost links. All broken locale links will produce build warnings/errors.

### 9b. No StackBlitz/CodeSandbox links
- No interactive playground links (StackBlitz, CodeSandbox) exist in any documentation. Consider adding them for better developer experience.

### 9c. No npm badge links
- Package docs use `npm="true"` in PackageHeader component but there are zero direct npmjs.com links in any .md file.

---

## SUMMARY

| Category | Issues Found |
|----------|-------------|
| Broken sidebar links (locales) | 30 |
| Broken nav links (contributing) | 8 |
| Missing locale guide files | 102 |
| Missing locale contributing files | 8 |
| Cross-locale link issues | ~32 |
| Undocumented examples | 2 |
| **Total issues** | **~182** |

### Priority Fixes:
1. **HIGH** - Add `ignoreDeadLinks: true` or create stub pages for locale guide files to prevent build failures
2. **HIGH** - Create contributing.md for all 8 locales (es, de, fr, ja, zh, it, pt, hi)
3. **MEDIUM** - Create missing Turkish guide files (6 files)
4. **MEDIUM** - Fix cross-locale links in package docs to point to locale-prefixed paths
5. **LOW** - Add `with-vanilla` and `with-ssr-vanilla` to create-tuvix-app.md examples table
6. **LOW** - Add StackBlitz/CodeSandbox interactive links
