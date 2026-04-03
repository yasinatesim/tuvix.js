---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="React Bindings"
  description="React 18+ bindings for Tuvix.js. createMicroApp wrapper, useMicroApp hook, useTuvixEvent hook."
  icon="⚛️"
  npm="true"
/>

## Installazione

```bash
npm install @tuvix.js/react react react-dom
```

## API

### `createMicroApp(Component)`

Wrap a React component as a Tuvix.js micro app. Handles mount/unmount/update automatically.

```tsx
import { createMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createMicroApp(App);
```

### `useMicroApp()`

Access the current micro app context:

```tsx
import { useMicroApp } from '@tuvix.js/react';

function MyComponent() {
  const { name, props, container } = useMicroApp();
  return <div>App: {name}</div>;
}
```

### `useTuvixEvent(event, handler)`

Subscribe to event bus events with automatic cleanup:

```tsx
import { useTuvixEvent } from '@tuvix.js/react';

function Notifications() {
  const [messages, setMessages] = useState<string[]>([]);

  useTuvixEvent('notification:received', ({ message }) => {
    setMessages((prev) => [...prev, message]);
  });

  return (
    <ul>
      {messages.map((m, i) => <li key={i}>{m}</li>)}
    </ul>
  );
}
```

## Esempio Completo

```tsx
// src/App.tsx
import React, { useState, useEffect } from 'react';
import { useTuvixEvent } from '@tuvix.js/react';
import { eventBus } from '@tuvix.js/event-bus';

interface AppProps {
  apiUrl: string;
  userId: string;
}

export function App({ apiUrl, userId }: AppProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [data, setData] = useState(null);

  // React to cross-app events
  useTuvixEvent('theme:changed', ({ theme: t }) => setTheme(t));

  useEffect(() => {
    fetch(`${apiUrl}/users/${userId}`)
      .then((r) => r.json())
      .then(setData);
  }, [apiUrl, userId]);

  const handleAction = () => {
    // Communicate back to other micro apps
    eventBus.emit('dashboard:action', { type: 'refresh' });
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
import { createMicroApp } from '@tuvix.js/react';
import { App } from './App';

export const app = createMicroApp(App);
```

See the [React Guide](/it/guide/react) for more details.
