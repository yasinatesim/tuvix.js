# With React

`@tuvix.js/react` provides React 18+ bindings for Tuvix.js.

## Installation

```bash
npm install @tuvix.js/react react react-dom
```

## createReactMicroApp

The simplest way to expose a React component as a micro app:

```tsx
// src/main.tsx
import React from 'react';
import { createReactMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createReactMicroApp(App);
```

`createReactMicroApp` handles the `mount`, `unmount` and `update` lifecycle automatically - it creates a React root, renders your component with `props`, and tears it down on unmount.

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

export const app = createReactMicroApp(Profile);
```

## useTuvixBus Hook

Subscribe to event bus events reactively, with automatic cleanup on unmount:

```tsx
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

function CartBadge() {
  const [count, setCount] = useState(0);
  const bus = getGlobalBus();

  useTuvixBus(bus, 'cart:updated', ({ itemCount }) => {
    setCount(itemCount);
  });

  return <span className="badge">{count}</span>;
}
```

## Full Example

```tsx
// src/App.tsx
import React, { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

interface AppProps {
  apiUrl: string;
}

export function App({ apiUrl }: AppProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const bus = getGlobalBus();

  useTuvixBus(bus, 'theme:changed', ({ theme: t }) => {
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

export const app = createReactMicroApp(App);
```

## Manual Lifecycle

For full control, implement the lifecycle yourself:

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { MicroAppDefinition } from '@tuvix.js/core';
import App from './App';

let root: ReturnType<typeof createRoot> | null = null;

export const app: MicroAppDefinition = {
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
