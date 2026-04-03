# 使用 React

`@tuvix.js/react` 为 Tuvix.js 提供 React 18+ 绑定。

## 安装

```bash
npm install @tuvix.js/react react react-dom
```

## createMicroApp

将 React 组件暴露为微应用的最简单方式：

```tsx
// src/main.tsx
import React from 'react';
import { createMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createMicroApp(App);
```

`createMicroApp` 自动处理 `mount`、`unmount` 和 `update` 生命周期 - 它创建一个 React root，用 `props` 渲染你的组件，并在卸载时销毁它。

## Props

从 shell 传递的 props 会原样转发给你的组件：

```tsx
// Shell
orchestrator.register('profile', {
  entry: '/profile.js',
  props: { userId: '42', theme: 'dark' },
});

// React 组件
interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile theme-${theme}`}>User: {userId}</div>;
}

export const app = createMicroApp(Profile);
```

## useMicroApp Hook

从任何组件访问当前微应用上下文（props、名称、容器）：

```tsx
import { useMicroApp } from '@tuvix.js/react';

function Dashboard() {
  const { props, name } = useMicroApp();
  return <div>App: {name}, Props: {JSON.stringify(props)}</div>;
}
```

## useTuvixEvent Hook

响应式订阅 Event Bus 事件，卸载时自动清理：

```tsx
import { useTuvixEvent } from '@tuvix.js/react';

function CartBadge() {
  const [count, setCount] = useState(0);

  useTuvixEvent('cart:updated', ({ itemCount }) => {
    setCount(itemCount);
  });

  return <span className="badge">{count}</span>;
}
```

## 完整示例

```tsx
// src/App.tsx
import React, { useState } from 'react';
import { useTuvixEvent } from '@tuvix.js/react';

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
import { createMicroApp } from '@tuvix.js/react';
import { App } from './App';

export const app = createMicroApp(App);
```

## 手动生命周期

如需完全控制，可以自己实现生命周期：

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { MicroApp } from '@tuvix.js/core';
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
