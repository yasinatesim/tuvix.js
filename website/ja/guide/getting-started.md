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

## Reactで使う

```tsx
import { createReactMicroApp } from '@tuvix.js/react';
import Dashboard from './Dashboard';

export const app = createReactMicroApp(Dashboard);
```

## Vueで使う

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Dashboard from './Dashboard.vue';

export const app = createVueMicroApp(Dashboard);
```

## 次のステップ

- [アーキテクチャ概要](/ja/guide/architecture)を読む
- [ライフサイクルフック](/ja/guide/lifecycle)を探索する
- [イベントバス](/ja/guide/event-bus)を設定する
- [サンドボックス](/ja/guide/sandbox)について学ぶ
