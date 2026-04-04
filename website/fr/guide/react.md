# Avec React

`@tuvix.js/react` fournit des bindings React 18+ pour Tuvix.js.

## Installation

```bash
npm install @tuvix.js/react react react-dom
```

## createMicroApp

Le moyen le plus simple d'exposer un composant React comme micro app :

```tsx
// src/main.tsx
import React from 'react';
import { createReactMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createMicroApp(App);
```

`createMicroApp` gère le cycle de vie `mount`, `unmount` et `update` automatiquement - il crée un React root, rend votre composant avec les `props`, et le détruit au démontage.

## Props

Les props passés depuis le shell sont transmis tels quels à votre composant :

```tsx
// Shell
orchestrator.register('profile', {
  entry: '/profile.js',
  props: { userId: '42', theme: 'dark' },
});

// Composant React
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

Accédez au contexte de la micro app courante (props, nom, conteneur) depuis n'importe quel composant :

```tsx

function Dashboard() {
  const { props, name } = useMicroApp();
  return <div>App: {name}, Props: {JSON.stringify(props)}</div>;
}
```

## Hook useTuvixEvent

Abonnez-vous aux événements du bus de manière réactive, avec nettoyage automatique au démontage :

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

## Exemple Complet

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

## Cycle de Vie Manuel

Pour un contrôle total, implémentez le cycle de vie vous-même :

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
