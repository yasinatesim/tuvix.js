# Contributing to Tuvix.js

Thank you for your interest in contributing! Whether it's a bug fix, new feature, documentation improvement, or translation - all contributions are welcome.

## Ways to Contribute

- **Bug reports** - [Open an issue](https://github.com/yasinatesim/tuvix.js/issues/new?template=bug_report.md)
- **Feature requests** - [Start a discussion](https://github.com/yasinatesim/tuvix.js/issues)
- **Code** - Fix bugs, add features, improve tests
- **Documentation** - Fix typos, add examples, improve clarity
- **Translations** - Add or improve documentation in other languages

## Getting Started

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/tuvix.js.git
cd tuvix.js
```

### 2. Install Dependencies

We use [pnpm](https://pnpm.io) and [Node.js ≥ 18](https://nodejs.org).

```bash
pnpm install
```

### 3. Build All Packages

```bash
pnpm build
```

### 4. Run Tests

```bash
pnpm test
```

### 5. Start the Docs Dev Server

```bash
cd website
pnpm install
pnpm dev
```

Open `http://localhost:5173` in your browser to preview the docs.

## Project Structure

```
tuvix.js/
├── packages/
│   ├── core/           @tuvix.js/core
│   ├── router/         @tuvix.js/router
│   ├── event-bus/      @tuvix.js/event-bus
│   ├── loader/         @tuvix.js/loader
│   ├── sandbox/        @tuvix.js/sandbox
│   ├── react/          @tuvix.js/react
│   ├── vue/            @tuvix.js/vue
│   ├── svelte/         @tuvix.js/svelte
│   ├── angular/        @tuvix.js/angular
│   ├── devtools/       @tuvix.js/devtools
│   ├── server/         @tuvix.js/server
│   ├── module-federation/
│   ├── create-tuvix-app/
│   └── tuvix/          tuvix.js umbrella
└── website/
    ├── .vitepress/     VitePress config and theme
    ├── guide/          English documentation
    ├── packages/       Package API docs
    ├── tr/             Turkish translations
    ├── es/             Spanish translations
    └── ...             Other languages
```

## Code Style

- **TypeScript** - strict mode, all code must be typed
- **Prettier** - run `pnpm format` to format
- **No runtime dependencies** - packages must have zero runtime deps
- **Named exports** - avoid default exports
- **Error messages** - prefix with `[Tuvix ...]`

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add hash mode to router
fix(sandbox): clean up event listeners on unmount
docs: add Angular guide example
chore: bump vitepress to 1.7.0
test(event-bus): add once() edge case tests
```

## Pull Request Process

1. Create a branch from `master`:

   ```bash
   git checkout -b feat/my-feature
   ```

2. Make your changes and add tests

3. Run the full test suite:

   ```bash
   pnpm test
   pnpm check-types
   pnpm lint
   ```

4. If your change affects a published package, add a changeset:

   ```bash
   pnpm changeset
   ```

5. Push and open a PR against `master`

6. A maintainer will review your PR. Please respond to feedback within 7 days.

## Adding a Translation

All documentation is in Markdown under `website/`. Each language has its own directory:

```
website/
├── index.md              ← English (root)
├── guide/                ← English guides
├── tr/                   ← Turkish
│   ├── index.md
│   ├── guide/
│   └── packages/
├── es/                   ← Spanish
└── ...
```

### Steps to add or improve a translation

1. Copy English files from `website/guide/` to `website/<lang>/guide/`
2. Translate the Markdown content (keep code blocks in English)
3. Update the sidebar config in `website/.vitepress/config/<lang>.ts`
4. Run `cd website && pnpm dev` to preview

::: tip Translation Tips

- Keep all code examples in English
- Translate UI labels, descriptions, and explanatory text
- Use native terminology where standard translations exist
:::

## Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English  | `en` | Complete (reference) |
| Turkish  | `tr` | In progress |
| Spanish  | `es` | In progress |
| German   | `de` | In progress |
| French   | `fr` | In progress |
| Japanese | `ja` | In progress |
| Chinese  | `zh` | In progress |
| Italian  | `it` | In progress |
| Portuguese | `pt` | In progress |
| Hindi    | `hi` | In progress |

If you'd like to contribute to any of these languages, please check [open translation issues](https://github.com/yasinatesim/tuvix.js/labels/translation) or open a new one.

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/). Be respectful and constructive.

## License

By contributing, you agree your contributions will be licensed under the MIT License.
