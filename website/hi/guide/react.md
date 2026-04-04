# React के साथ

`@tuvix.js/react` Tuvix.js के लिए React 18+ बाइंडिंग प्रदान करता है।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/react react react-dom
```

## createMicroApp

React कंपोनेंट को माइक्रो ऐप के रूप में उजागर करने का सबसे सरल तरीका:

```tsx
// src/main.tsx
import React from 'react';
import { createReactMicroApp } from '@tuvix.js/react';
import App from './App';

export const app = createMicroApp(App);
```

`createMicroApp` स्वचालित रूप से `mount`, `unmount` और `update` लाइफसाइकल को संभालता है - यह एक React root बनाता है, आपके कंपोनेंट को `props` के साथ रेंडर करता है, और अनमाउंट पर नष्ट करता है।

## Props

शेल से पास किए गए Props जैसे हैं वैसे ही आपके कंपोनेंट को भेजे जाते हैं:

```tsx
// शेल
orchestrator.register('profile', {
  entry: '/profile.js',
  props: { userId: '42', theme: 'dark' },
});

// React कंपोनेंट
interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile theme-${theme}`}>User: {userId}</div>;
}

export const app = createMicroApp(Profile);
```

## useTuvixBus हुक

Event Bus इवेंट्स को रिएक्टिव रूप से सब्सक्राइब करें, अनमाउंट पर स्वचालित क्लीनअप के साथ:

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

## पूर्ण उदाहरण

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

## मैनुअल लाइफसाइकल

पूर्ण नियंत्रण के लिए, लाइफसाइकल स्वयं लागू करें:

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
