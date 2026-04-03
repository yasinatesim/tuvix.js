# はじめ方

## インストール

```bash
npm install tuvix.js
```

## CLIでのスキャフォールディング

```bash
npx create-tuvix-app my-app
cd my-app
npm install
npm run dev
```

## 基本セットアップ

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

完全なドキュメント → [Getting Started](/ja/guide/getting-started)
