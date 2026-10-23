# माइक्रो ऐप्स

माइक्रो ऐप `mount` और `unmount` functions वाला एक module है। shell एक container element और props के साथ `mount` call करता है; ऐप उस element में रेंडर होता है। जब ऐप को पेज से हटना हो, तब shell `unmount` call करता है; ऐप अपना रेंडर किया हुआ सब हटा देता है।

## Module का shape

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  bootstrap: async () => {},
  mount: async ({ container, props, name, bus }) => {
    container.textContent = `${name ?? 'app'} mounted`;
    void props;
    void bus;
  },
  update: async ({ props, container }) => {
    if (container) container.dataset.props = JSON.stringify(props);
  },
  unmount: async ({ container }) => {
    container.replaceChildren();
  },
};
```

| Hook | ज़रूरी | कब call होता है |
| --- | --- | --- |
| `bootstrap()` | नहीं | एक बार, पहले लोड के बाद और पहले `mount` से पहले। |
| `mount({ container, props, name, bus })` | हाँ | हर बार जब ऐप सक्रिय होता है। |
| `update({ props, container })` | नहीं | जब ऐप mount रहते हुए shell `updateAppProps` call करता है। |
| `unmount({ container })` | हाँ | हर बार जब ऐप निष्क्रिय होता है। |

हर hook एक promise लौटा सकता है। अगले step से पहले orchestrator उसका इंतज़ार करता है।

## हाथ से लिखें

`defineMicroApp` hooks को validate करता है, module को `name` से register करता है, container पर `tuvix:mounted`, `tuvix:unmounted` और `tuvix:error` dispatch करता है, और module लौटाता है:

```ts
import { defineMicroApp } from '@tuvix.js/core';

let off: (() => void) | undefined;

export default defineMicroApp({
  name: 'notifications',

  mount({ container, props, bus }) {
    const list = document.createElement('ul');
    container.replaceChildren(list);
    off = bus?.on<{ text: string }>('notify', ({ text }) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    });
    container.dataset.user = String(props?.user ?? '');
  },

  unmount({ container }) {
    off?.();
    off = undefined;
    container.replaceChildren();
  },
});
```

mount context से मिला `bus` इस्तेमाल करें। यह orchestrator का bus है, जो `getGlobalBus()` ही होता है, जब तक shell ने `eventBus` विकल्प न दिए हों।

## Adapter इस्तेमाल करें

adapters एक कंपोनेंट से module बनाते हैं और वे बारीकियाँ संभालते हैं जो वरना आपको ख़ुद लिखनी पड़तीं:

- हर container के लिए एक फ्रेमवर्क instance, ताकि एक module कई जगह mount हो सके;
- `update` नए props के साथ remount किए बिना फिर से रेंडर करता है;
- `mount` के लोड होते समय आया `unmount` इंतज़ार करता है और container खाली छोड़ता है;
- container पर `tuvix:mounted`, `tuvix:unmounted` और `tuvix:error` events;
- `ssr: true` देने पर सर्वर पर रेंडर हुए markup का hydration।

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Cart({ items }: { items: number }) {
  return <p>{items} items</p>;
}

export default createReactMicroApp({ name: 'cart', App: Cart });
```

## Module को loader के सामने रखें

orchestrator ऐप की `entry` के ज़रिए module पाता है:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

// Bundled with the shell, code-split by your bundler.
orchestrator.register({
  name: 'cart',
  entry: () => import('./apps/cart'),
  container: '#cart',
  activeWhen: '/shop/*',
});

// Deployed on its own. The script registers itself by name.
orchestrator.register({
  name: 'notifications',
  entry: { scripts: ['https://cdn.example.com/notifications/main.js'], type: 'module' },
  container: '#notifications',
  activeWhen: '/',
});
```

URL entry के लिए module को `registerModule(name, module)` call करना होगा (adapters और `defineMicroApp` यह करते हैं) या `mount` function वाला UMD global expose करना होगा। loader function को केवल module या `{ default: module }` पर resolve होना होता है।

## Props दें

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./apps/profile'),
  container: '#app',
  activeWhen: '/profile/*',
  props: { userId: '42', theme: 'dark' },
});

await orchestrator.updateAppProps('profile', { theme: 'light' });
// The app now has { userId: '42', theme: 'light' }.
```

- Props shallow रूप से merge होते हैं। किसी key को हटाने के लिए उसे `undefined` सेट करें।
- जब ऐप mount है और उसमें `update` है, तो orchestrator उसे call करता है और उसके settle होने के बाद resolve होता है। reject हुआ `update` ऐप को `error` status में डालता है और `onError` call करता है।
- जब ऐप mount नहीं है, या उसमें `update` नहीं है, तो orchestrator merge हुए props अगले mount के लिए रख लेता है। यह ऐप को remount नहीं करता।

## एक module को कई जगह mount करें

adapters हर container के लिए अलग instance रखते हैं। `TuvixIsland` और आपका अपना कोड एक ही module के साथ दो containers पर `mount` call कर सकते हैं:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Price from './Price.vue';

const price = createVueMicroApp({ name: 'price', App: Price });

const first = document.querySelector<HTMLElement>('#price-1');
const second = document.querySelector<HTMLElement>('#price-2');
if (first && second) {
  await price.mount({ container: first, props: { sku: 'a' } });
  await price.mount({ container: second, props: { sku: 'b' } });
  await price.update?.({ props: { sku: 'c' }, container: second }); // only #price-2
}
```

`container` के बिना `update` उस module के हर mount को update करता है। orchestrator हमेशा `container` देता है।

## Build और deploy

हर ऐप को ES module bundle के रूप में build करें और `type: 'module'` के साथ register करें, या IIFE/UMD bundle के रूप में build करें और उसका URL classic script के रूप में register करें। Vite के साथ:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'main' },
    // Leave dependencies bundled unless the shell provides them.
  },
});
```

फ्रेमवर्क की कॉपियों का ध्यान रखें: अगर दो माइक्रो ऐप्स में से हर एक React bundle करता है, तो React दो बार ship होता है। पेज फिर भी काम करता है, क्योंकि हर ऐप अपना root रेंडर करता है। एक कॉपी साझा करने के लिए import maps, Module Federation (`@tuvix.js/module-federation`) इस्तेमाल करें, या shell से loader-function entries के ज़रिए ऐप्स bundle करवाएँ।

## माइक्रो ऐप को क्या नहीं करना चाहिए

- अपने container के बाहर लिखना। Tuvix.js इसे नहीं रोकता, और उस container में आने वाला अगला ऐप इसकी उम्मीद नहीं करेगा।
- `unmount` के बाद listeners, timers या subscriptions पीछे छोड़ना।
- यह मानकर चलना कि `bootstrap` एक से ज़्यादा बार चलेगा। यह हर लोड हुए module के लिए एक बार चलता है।
