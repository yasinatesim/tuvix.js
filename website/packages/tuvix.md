---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js (Umbrella)"
  description="All-in-one package. Re-exports @tuvix.js/core, router, event-bus, loader, and sandbox for convenience."
  icon="🎁"
  github="tuvix"
/>

## Installation

```bash
npm install tuvix.js
```

## Usage

```ts
import { createOrchestrator } from 'tuvix.js/core';
import { createRouter } from 'tuvix.js/router';
import { getGlobalBus, createEventBus } from 'tuvix.js/event-bus';
import { createLoader } from 'tuvix.js/loader';
import { createSandbox } from 'tuvix.js/sandbox';
```

Or import everything at once:

```ts
import { createOrchestrator, createRouter, getGlobalBus, createEventBus } from 'tuvix.js';
```

## What's Included

| Export | From |
|--------|------|
| `createOrchestrator` | `@tuvix.js/core` |
| `createRouter` | `@tuvix.js/router` |
| `createEventBus`, `getGlobalBus` | `@tuvix.js/event-bus` |
| `createLoader` | `@tuvix.js/loader` |
| `createSandbox` | `@tuvix.js/sandbox` |

## When to Use Individual Packages

Use the umbrella `tuvix.js` when:
- You're starting out and want everything available
- Bundle size is not a concern (all packages are zero-dep and tiny)

Use individual packages when:
- You want to be explicit about dependencies
- You need tree-shaking control in a large monorepo
- You're building a micro app that only needs `@tuvix.js/event-bus`
