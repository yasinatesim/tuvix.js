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

पूर्ण दस्तावेज़ → [Getting Started](/guide/getting-started)
