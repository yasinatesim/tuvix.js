# What is Tuvix.js?

Tuvix.js is a **lightweight, framework-agnostic microfrontend orchestrator** for building scalable frontend applications composed of independently deployable pieces.

## The Problem

As frontends grow, monolithic single-page applications become:

- Hard to scale across multiple teams
- Slow to build and deploy — one change rebuilds everything
- Locked into a single framework or version
- Difficult to test and reason about in isolation

## The Solution: Microfrontends

Microfrontends apply microservice principles to the frontend. Each **micro app** is:

- **Independently developed** — separate codebase, separate team
- **Independently deployed** — its own CI/CD pipeline
- **Framework-agnostic** — one team uses React, another Vue, another Svelte

Tuvix.js provides the **shell** — the thin orchestration layer that loads, mounts and coordinates all micro apps at runtime.

## Architecture

```
┌─────────────────────────────────────────────┐
│                Tuvix.js Shell               │
│                                             │
│  ┌────────────┐  ┌──────────┐  ┌────────┐  │
│  │ Orchestrator│  │  Router  │  │ Loader │  │
│  └────────────┘  └──────────┘  └────────┘  │
│                                             │
│  ┌─────────┐  ┌────────┐  ┌──────────────┐ │
│  │  React  │  │  Vue   │  │   Angular    │ │
│  │ Micro   │  │ Micro  │  │    Micro     │ │
│  │  App    │  │  App   │  │     App      │ │
│  └─────────┘  └────────┘  └──────────────┘ │
└─────────────────────────────────────────────┘
```

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Shell** | The host application — loads and coordinates micro apps |
| **Orchestrator** | Core engine that manages micro app registration and lifecycle |
| **Micro App** | An independently deployed frontend application |
| **Entry** | The JavaScript bundle URL of a micro app |
| **Lifecycle** | mount, unmount, update hooks each micro app implements |
| **Event Bus** | Typed pub/sub bridge between micro apps |
| **Sandbox** | CSS + JS isolation to prevent conflicts |

## How It Compares

| Feature | Tuvix.js | single-spa | Module Federation |
|---------|----------|------------|-------------------|
| Zero runtime deps | ✅ | ❌ | ✅ |
| Event Bus built-in | ✅ | ❌ | ❌ |
| CSS Sandbox | ✅ | ❌ | ❌ |
| SSR support | ✅ | Partial | ✅ |
| TypeScript-first | ✅ | Partial | ✅ |
| Framework bindings | React, Vue, Svelte, Angular | React, Vue | Any |

## Next Step

→ [Getting Started](/guide/getting-started)
