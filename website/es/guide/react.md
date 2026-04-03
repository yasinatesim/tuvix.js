# Con React

`@tuvix.js/react` proporciona bindings de React 18+ para Tuvix.js.

## Instalación

```bash
npm install @tuvix.js/react react react-dom
```

## createMicroApp

La forma más sencilla de exponer un componente React como micro app:

```tsx
// src/main.tsx
import React from 'react';
import { createMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createMicroApp(App);
```

`createMicroApp` maneja el ciclo de vida `mount`, `unmount` y `update` automáticamente - crea un React root, renderiza tu componente con `props`, y lo destruye al desmontar.

## Props

Los props pasados desde el shell se reenvían a tu componente tal cual:

```tsx
// Shell
orchestrator.register('profile', {
  entry: '/profile.js',
  props: { userId: '42', theme: 'dark' },
});

// Componente React
interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile theme-${theme}`}>User: {userId}</div>;
}

export const app = createMicroApp(Profile);
```

## Hook useMicroApp

Accede al contexto de la micro app actual (props, nombre, contenedor) desde cualquier componente:

```tsx
import { useMicroApp } from '@tuvix.js/react';

function Dashboard() {
  const { props, name } = useMicroApp();
  return <div>App: {name}, Props: {JSON.stringify(props)}</div>;
}
```

## Hook useTuvixEvent

Suscríbete a eventos del event bus de forma reactiva, con limpieza automática al desmontar:

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

## Ejemplo Completo

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

## Ciclo de Vida Manual

Para control total, implementa el ciclo de vida tú mismo:

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
