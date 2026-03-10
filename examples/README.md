# Tuvix.js Examples

Ready-to-run examples demonstrating how to use Tuvix.js with each supported framework.

Each example contains:
- A **shell** (`shell/index.ts`) — boots the orchestrator and registers two micro apps
- Two **micro apps** (`apps/home/`, `apps/profile/`) — demonstrate mounting, unmounting, props, and event bus communication

> **Note on `entry` paths:** The shell files use local source file paths for illustration. In production, `entry` must point to a built JS bundle URL (e.g. `https://cdn.example.com/home/main.js`).

> **Note on the event bus:** Each framework example creates a module-level `bus` instance. In a real multi-repo setup you would share a single bus instance (e.g. via a shared npm package or a global provided by the shell).

## Examples

| Directory | Framework | Version |
| --- | --- | --- |
| [`react/`](./react) | React | 18+ |
| [`vue/`](./vue) | Vue | 3 |
| [`svelte/`](./svelte) | Svelte | 5 |
| [`angular/`](./angular) | Angular | 15+ (standalone API) |
| [`vanilla/`](./vanilla) | Vanilla JS | — |
