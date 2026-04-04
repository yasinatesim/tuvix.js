# React ile

`@tuvix.js/react`, Tuvix.js için React 18+ bağlamaları sağlar.

## Kurulum

```bash
npm install @tuvix.js/react react react-dom
```

## createMicroApp

Bir React bileşenini mikro uygulama olarak sunmanın en basit yolu:

```tsx
// src/main.tsx
import React from 'react';
import { createReactMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createMicroApp(App);
```

`createMicroApp`, `mount`, `unmount` ve `update` yaşam döngüsünü otomatik olarak yönetir - bir React root oluşturur, bileşeninizi `props` ile render eder ve unmount sırasında yok eder.

## Props

Shell'den geçirilen props, bileşeninize olduğu gibi iletilir:

```tsx
// Shell
orchestrator.register('profile', {
  entry: '/profile.js',
  props: { userId: '42', theme: 'dark' },
});

// React bileşeni
interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile theme-${theme}`}>User: {userId}</div>;
}

export const app = createMicroApp(Profile);
```

## useTuvixBus Hook'u

Event bus olaylarına reaktif olarak abone olun, unmount sırasında otomatik temizlik ile:

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

## Tam Örnek

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

## Manuel Yaşam Döngüsü

Tam kontrol için yaşam döngüsünü kendiniz uygulayın:

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
