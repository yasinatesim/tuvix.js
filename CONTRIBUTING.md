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
packages/
├── core/           # @tuvix.js/core — Orchestrator
├── router/         # @tuvix.js/router — URL routing
├── event-bus/      # @tuvix.js/event-bus — Inter-app communication
├── loader/         # @tuvix.js/loader — Dynamic module loading
└── tuvix/          # tuvix.js — Umbrella package
```

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
