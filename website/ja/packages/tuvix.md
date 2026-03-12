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

## インストール

```bash
npm install tuvix.js
```

## 使い方

```ts
import { createOrchestrator } from 'tuvix.js/core';
import { createRouter } from 'tuvix.js/router';
import { eventBus } from 'tuvix.js/event-bus';
import { loadMicroApp } from 'tuvix.js/loader';
import { createSandbox } from 'tuvix.js/sandbox';
```

Or import everything at once:

```ts
import { createOrchestrator, createRouter, eventBus } from 'tuvix.js';
```

## 含まれるもの

| Export | From |
|--------|------|
| `createOrchestrator` | `@tuvix.js/core` |
| `createRouter` | `@tuvix.js/router` |
| `eventBus`, `createEventBus` | `@tuvix.js/event-bus` |
| `loadMicroApp`, `createLoader` | `@tuvix.js/loader` |
| `createSandbox` | `@tuvix.js/sandbox` |

## 個別パッケージを使う場合

Use the umbrella `tuvix.js` when:
- You're starting out and want everything available
- Bundle size is not a concern (all packages are zero-dep and tiny)

Use individual packages when:
- You want to be explicit about dependencies
- You need tree-shaking control in a large monorepo
- You're building a micro app that only needs `@tuvix.js/event-bus`
