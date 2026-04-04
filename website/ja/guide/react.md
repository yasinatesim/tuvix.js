# React と使う

`@tuvix.js/react` は Tuvix.js 用の React 18+ バインディングを提供します。

## インストール

```bash
npm install @tuvix.js/react react react-dom
```

## createMicroApp

React コンポーネントをマイクロアプリとして公開する最も簡単な方法：

```tsx
// src/main.tsx
import React from 'react';
import { createReactMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createMicroApp(App);
```

`createMicroApp` は `mount`、`unmount`、`update` のライフサイクルを自動的に処理します - React root を作成し、コンポーネントを `props` でレンダリングし、アンマウント時に破棄します。

## Props

シェルから渡された Props はそのままコンポーネントに転送されます：

```tsx
// シェル
orchestrator.register('profile', {
  entry: '/profile.js',
  props: { userId: '42', theme: 'dark' },
});

// React コンポーネント
interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile theme-${theme}`}>User: {userId}</div>;
}

export const app = createMicroApp(Profile);
```

## useMicroApp フック

任意のコンポーネントから現在のマイクロアプリコンテキスト（props、名前、コンテナ）にアクセスできます：

```tsx

function Dashboard() {
  const { props, name } = useMicroApp();
  return <div>App: {name}, Props: {JSON.stringify(props)}</div>;
}
```

## useTuvixEvent フック

Event Bus のイベントをリアクティブにサブスクライブし、アンマウント時に自動クリーンアップします：

```tsx
import { useTuvixBus } from '@tuvix.js/react';

function CartBadge() {
  const [count, setCount] = useState(0);

  useTuvixEvent('cart:updated', ({ itemCount }) => {
    setCount(itemCount);
  });

  return <span className="badge">{count}</span>;
}
```

## 完全な例

```tsx
// src/App.tsx
import React, { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';

interface AppProps {
  apiUrl: string;
}

export function App({ apiUrl }: AppProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useTuvixEvent('theme:changed', ({ theme: t }) => {
    setTheme(t);
  });

  return (
    <div className={`app theme-${theme}`}>
      <h1>My Micro App</h1>
      <p>API: {apiUrl}</p>
    </div>
  );
}

// src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export const app = createMicroApp(App);
```

## 手動ライフサイクル

完全な制御が必要な場合、ライフサイクルを自分で実装できます：

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { MicroAppDefinition } from '@tuvix.js/core';
import App from './App';

let root: ReturnType<typeof createRoot> | null = null;

export const app: MicroApp = {
  async mount(container, props) {
    const el = document.createElement('div');
    container.appendChild(el);
    root = createRoot(el);
    root.render(<App {...(props as any)} />);
  },

  async unmount() {
    root?.unmount();
    root = null;
  },

  async update(container, props) {
    root?.render(<App {...(props as any)} />);
  },
};
```
