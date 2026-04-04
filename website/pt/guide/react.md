# Com React

`@tuvix.js/react` fornece bindings React 18+ para Tuvix.js.

## Instalação

```bash
npm install @tuvix.js/react react react-dom
```

## createMicroApp

A maneira mais simples de expor um componente React como micro app:

```tsx
// src/main.tsx
import React from 'react';
import { createReactMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createMicroApp(App);
```

`createMicroApp` lida com o ciclo de vida `mount`, `unmount` e `update` automaticamente - cria um React root, renderiza seu componente com `props` e o destrói na desmontagem.

## Props

Props passadas do shell são encaminhadas para seu componente como estão:

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

Acesse o contexto da micro app atual (props, nome, contêiner) de qualquer componente:

```tsx

function Dashboard() {
  const { props, name } = useMicroApp();
  return <div>App: {name}, Props: {JSON.stringify(props)}</div>;
}
```

## Hook useTuvixEvent

Inscreva-se nos eventos do event bus de forma reativa, com limpeza automática na desmontagem:

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

## Exemplo Completo

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

## Ciclo de Vida Manual

Para controle total, implemente o ciclo de vida você mesmo:

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
