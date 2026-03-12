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

## 安装

```bash
npm install @tuvix.js/devtools
```

## 使用方法

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { initDevtools } from '@tuvix.js/devtools';

const orchestrator = createOrchestrator({ container: '#app' });

// Enable devtools in development
if (process.env.NODE_ENV === 'development') {
  initDevtools(orchestrator);
}
```

## 可检查内容

- **Registered Apps** - names, entry URLs, sandbox config
- **Active Apps** - currently mounted micro apps
- **Event Bus** - live event stream, emitted events and their payloads
- **Loader** - cache entries, fetch status and timings
- **Performance** - mount/unmount durations for each app

## 键盘快捷键

Press `Ctrl+Shift+T` (or `Cmd+Shift+T` on Mac) to toggle the DevTools panel.

## 配置

```ts
initDevtools(orchestrator, {
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
  const { initDevtools } = await import('@tuvix.js/devtools');
  initDevtools(orchestrator);
}
```
:::
