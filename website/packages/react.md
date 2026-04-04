---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="React Bindings"
  description="React 18+ bindings for Tuvix.js. createReactMicroApp wrapper, useTuvixBus hook, useTuvixProps hook."
  icon="⚛️"
  npm="true"
/>

## Installation

```bash
npm install @tuvix.js/react react react-dom
```

## API

### `createReactMicroApp(Component)`

Wrap a React component as a Tuvix.js micro app. Handles mount/unmount/update automatically.

```tsx
import { createReactMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createReactMicroApp(App);
```

### `useTuvixBus(bus, event, handler)`

Subscribe to event bus events with automatic cleanup:

```tsx
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

function Notifications() {
  const [messages, setMessages] = useState<string[]>([]);
  const bus = getGlobalBus();

  useTuvixBus(bus, 'notification:received', ({ message }) => {
    setMessages((prev) => [...prev, message]);
  });

  return (
    <ul>
      {messages.map((m, i) => <li key={i}>{m}</li>)}
    </ul>
  );
}
```

## Full Working Example

```tsx
// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

interface AppProps {
  apiUrl: string;
  userId: string;
}

export function App({ apiUrl, userId }: AppProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [data, setData] = useState(null);
  const bus = getGlobalBus();

  // React to cross-app events
  useTuvixBus(bus, 'theme:changed', ({ theme: t }) => setTheme(t));

  useEffect(() => {
    fetch(`${apiUrl}/users/${userId}`)
      .then((r) => r.json())
      .then(setData);
  }, [apiUrl, userId]);

  const handleAction = () => {
    // Communicate back to other micro apps
    bus.emit('dashboard:action', { type: 'refresh' });
  };

  return (
    <div className={`app theme-${theme}`}>
      <h1>Dashboard</h1>
      <button onClick={handleAction}>Refresh All</button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
```

```tsx
// src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export const app = createReactMicroApp(App);
```

See the [React Guide](/guide/react) for more details.
