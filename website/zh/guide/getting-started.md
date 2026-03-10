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

完整文档 → [Getting Started (EN)](/guide/getting-started)
