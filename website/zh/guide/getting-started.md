# 快速上手

## 安装

```bash
npm install tuvix.js
```

## 使用 CLI 初始化项目

```bash
npx create-tuvix-app my-app
cd my-app
npm install
npm run dev
```

## 基础配置

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });
const router = createRouter({
  orchestrator,
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
  ],
});
orchestrator.start();
```

## 使用 React

```tsx
import { createReactMicroApp } from '@tuvix.js/react';
import Dashboard from './Dashboard';

export const app = createReactMicroApp(Dashboard);
```

## 使用 Vue

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Dashboard from './Dashboard.vue';

export const app = createVueMicroApp(Dashboard);
```

## 下一步

- 阅读[架构概述](/zh/guide/architecture)
- 探索[生命周期钩子](/zh/guide/lifecycle)
- 配置[事件总线](/zh/guide/event-bus)
- 了解[沙箱隔离](/zh/guide/sandbox)
