---
title: '@tuvix.js/devtools'
---

<PackageHeader
  name="@tuvix.js/devtools"
  title="DevTools"
  description="In-browser debug panel. Inspect registered micro apps, active routes, event bus traffic, loader state, and performance metrics."
  icon="🛠️"
  npm="true"
/>

## インストール

```bash
npm install @tuvix.js/devtools
```

## 使い方

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { installDevTools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator({ container: '#app' });

// Enable devtools in development
if (process.env.NODE_ENV === 'development') {
  installDevTools(orchestrator);
}
```

## 検査できるもの

- **Registered Apps** - names, entry URLs, sandbox config
- **Active Apps** - currently mounted micro apps
- **Event Bus** - live event stream, emitted events and their payloads
- **Loader** - cache entries, fetch status and timings
- **Performance** - mount/unmount durations for each app

## キーボードショートカット

Press `Ctrl+Shift+T` (or `Cmd+Shift+T` on Mac) to toggle the DevTools panel.

## 設定

```ts
installDevTools(orchestrator, {
  /**
   * Position of the devtools panel.
   * @default 'bottom-right'
   */
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left',

  /**
   * Initial panel height in px.
   * @default 300
   */
  height: 300,

  /**
   * Whether to show the panel on load.
   * @default false
   */
  open: false,
});
```

::: warning Production
Never ship devtools in production. Use environment checks:

```ts
if (import.meta.env.DEV) {
  const { installDevTools } = await import('@tuvix.js/devtools');
  installDevTools(orchestrator);
}
```
:::
