# With React

`@tuvix.js/react` provides React 18+ bindings for Tuvix.js.

## Installation

```bash
npm install @tuvix.js/react react react-dom
```

## createMicroApp

The simplest way to expose a React component as a micro app:

```tsx
// src/main.tsx
import React from 'react';
import { createMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createMicroApp(App);
```

`createMicroApp` handles the `mount`, `unmount` and `update` lifecycle automatically — it creates a React root, renders your component with `props`, and tears it down on unmount.

## Props

Props passed from the shell are forwarded to your component as-is:

```tsx
// Shell
orchestrator.register('profile', {
  entry: '/profile.js',
  props: { userId: '42', theme: 'dark' },
});

// React component
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

Access the current micro app context (props, name, container) from any component:

```tsx
import { useMicroApp } from '@tuvix.js/react';

function Dashboard() {
  const { props, name } = useMicroApp();
  return <div>App: {name}, Props: {JSON.stringify(props)}</div>;
}
```

## useTuvixEvent Hook

Subscribe to event bus events reactively, with automatic cleanup on unmount:

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

## Full Example

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

## Manual Lifecycle

For full control, implement the lifecycle yourself:

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
