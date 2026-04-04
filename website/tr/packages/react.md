---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="React Bağlamaları"
  description="Tuvix.js için React 18+ bağlamaları. createMicroApp sarmalayıcı, useMicroApp hook, useTuvixEvent hook."
  icon="⚛️"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/react react react-dom
```

## API

### `createMicroApp(Component)`

Bir React bileşenini Tuvix.js mikro uygulaması olarak sarar. Mount/unmount/update'i otomatik olarak yönetir.

```tsx
import { createReactMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createMicroApp(App);
```

### `useMicroApp()`

Mevcut mikro uygulama bağlamına erişir.

### `useTuvixEvent(event, handler)`

Event bus olaylarına otomatik temizleme ile abone olur.

## Tam Çalışma Örneği

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
  const bus = getGlobalBus();

  useTuvixBus(bus, 'theme:changed', ({ theme: t }) => setTheme(t));

  return (
    <div className={`app theme-${theme}`}>
      <h1>Dashboard</h1>
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

Daha fazla bilgi için [React Rehberi](/tr/guide/react) sayfasına bakın.
