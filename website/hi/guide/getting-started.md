# शुरुआत करें

## स्थापना

```bash
npm install tuvix.js
```

## CLI से प्रोजेक्ट बनाएं

```bash
npx create-tuvix-app mera-app
cd mera-app
npm install
npm run dev
```

## बुनियादी सेटअप

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createRouter } from '@tuvix.js/router';

const orchestrator = createOrchestrator({ container: '#app' });
const router = createRouter({
  orchestrator,
  routes: [
    { path: '/', app: 'home' },
    { path: '/dashboard', app: 'dashboard' },
  ],
});
orchestrator.start();
```

## React के साथ

```tsx
import { createReactMicroApp } from '@tuvix.js/react';
import Dashboard from './Dashboard';

export const app = createReactMicroApp(Dashboard);
```

## Vue के साथ

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Dashboard from './Dashboard.vue';

export const app = createVueMicroApp(Dashboard);
```

## अगले कदम

- [आर्किटेक्चर अवलोकन](/hi/guide/architecture) पढ़ें
- [Lifecycle Hooks](/hi/guide/lifecycle) एक्सप्लोर करें
- [Event Bus](/hi/guide/event-bus) सेट करें
- [Sandboxing](/hi/guide/sandbox) के बारे में जानें
