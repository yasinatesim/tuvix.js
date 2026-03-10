# Contributing to Tuvix.js

Thank you for your interest in contributing! This document provides guidelines for contributing to the Tuvix.js project.

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Development Workflow

1. **Create a branch** from `master` for your changes
2. **Make your changes** following the code style guidelines below
3. **Write tests** for new functionality
4. **Run the full test suite** with `pnpm test`
5. **Create a changeset** with `pnpm changeset` if your change affects published packages
6. **Submit a Pull Request**

## Project Structure

```
tuvix.js/
├── packages/
│   ├── core/           @tuvix.js/core — Orchestrator
│   ├── router/         @tuvix.js/router — URL routing
│   ├── event-bus/      @tuvix.js/event-bus — Inter-app communication
│   ├── loader/         @tuvix.js/loader — Dynamic module loading
│   ├── sandbox/        @tuvix.js/sandbox — CSS/JS isolation
│   ├── react/          @tuvix.js/react — React bindings
│   ├── vue/            @tuvix.js/vue — Vue bindings
│   ├── svelte/         @tuvix.js/svelte — Svelte bindings
│   ├── angular/        @tuvix.js/angular — Angular bindings
│   ├── devtools/       @tuvix.js/devtools — Debug panel
│   ├── server/         @tuvix.js/server — SSR composition
│   ├── module-federation/  @tuvix.js/module-federation
│   ├── create-tuvix-app/   CLI scaffolding tool
│   └── tuvix/          tuvix.js — Umbrella package
└── website/
    ├── .vitepress/     VitePress config and theme
    ├── guide/          English documentation (Markdown)
    ├── packages/       Package API docs (Markdown)
    ├── tr/             Turkish translations
    ├── es/             Spanish translations
    ├── de/             German translations
    ├── fr/             French translations
    ├── ja/             Japanese translations
    ├── zh/             Chinese translations
    ├── it/             Italian translations
    ├── pt/             Portuguese translations
    └── hi/             Hindi translations
```

## Working on the Website / Docs

The documentation is Markdown-based, powered by [VitePress](https://vitepress.dev).

```bash
cd website
pnpm install        # Install website deps
pnpm dev            # Start dev server at http://localhost:5173
pnpm build          # Build static docs
pnpm lint           # Lint Vue/JS files
```

### Adding or Improving Translations

Each language has its own directory under `website/`. To add or improve a translation:

1. Copy the relevant `.md` file from `website/guide/` (English) to `website/<lang>/guide/`
2. Translate the content — **keep all code blocks in English**
3. If the language isn't yet in the sidebar, update `website/.vitepress/config/<lang>.ts`
4. Run `pnpm dev` inside `website/` to preview

Supported languages: `en`, `tr`, `es`, `de`, `fr`, `ja`, `zh`, `it`, `pt`, `hi`

## Code Style

- **TypeScript** — All code must be written in TypeScript with strict mode enabled
- **Formatting** — We use Prettier. Run `pnpm format` to format code
- **No runtime dependencies** — All packages must have zero runtime dependencies (except workspace deps)
- **Named exports** — Use named exports, avoid default exports
- **Error messages** — All errors must start with `[Tuvix ...]` prefix and describe WHAT failed and WHY

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
feat: add new feature
fix: fix a bug
docs: documentation changes
chore: maintenance tasks
test: test changes
refactor: code refactoring
```

## Adding a Changeset

If your PR changes any published package, add a changeset:

```bash
pnpm changeset
```

Follow the prompts to describe what changed and select the semver bump level.

## Running Specific Packages

```bash
# Build a specific package
pnpm --filter @tuvix.js/core build

# Test a specific package
pnpm --filter @tuvix.js/event-bus test

# Watch mode for a specific package
pnpm --filter @tuvix.js/router dev
```

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
