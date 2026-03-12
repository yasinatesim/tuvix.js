---
title: '@tuvix.js/router'
---

<PackageHeader
  name="@tuvix.js/router"
  title="Router"
  description="URL-based micro app routing with history and hash mode. Mounts and unmounts micro apps as the URL changes."
  icon="🔀"
  npm="true"
/>

## 安装

```bash
npm install @tuvix.js/router
```

## 快速开始

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });

const router = createRouter({
  orchestrator,
  mode: 'history',
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
    { path: '/users/:id', app: 'user-profile' },
  ],
});

orchestrator.start();
```

## API

### `createRouter(options)`

```ts
interface RouterOptions {
  orchestrator: Orchestrator;
  mode?: 'history' | 'hash';
  routes: Route[];
}

interface Route {
  path: string;
  app: string;
  guard?: () => boolean | Promise<boolean>;
}
```

### `router.navigate(path)`

Navigate programmatically.

```ts
router.navigate('/dashboard');
router.navigate('/users/42?tab=posts');
```

### `router.replace(path)`

Navigate without adding to history stack.

### `router.go(n)`

Go back (`-1`) or forward (`1`) in history.

### `router.currentRoute`

The currently active route object.

### `router.onRouteChange(handler)`

Subscribe to route changes:

```ts
const unsub = router.onRouteChange((route) => {
  analytics.page(route.path);
});
```

## 路由守卫

```ts
routes: [
  {
    path: '/admin',
    app: 'admin',
    guard: async () => {
      return await checkUserIsAdmin();
    },
  },
],
```

Return `false` (or resolve to `false`) to block navigation.

## 动态段

```ts
{ path: '/users/:id', app: 'user-profile' }
// Match: /users/42 → props.params = { id: '42' }

{ path: '/files/*', app: 'file-browser' }
// Match: /files/a/b/c → props.params = { '*': 'a/b/c' }
```
