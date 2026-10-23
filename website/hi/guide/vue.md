# Vue के साथ

`@tuvix.js/vue` किसी Vue 3 root कंपोनेंट को माइक्रो ऐप बनाता है, सर्वर पर रेंडर किए गए markup को hydrate करता है, और सर्वर पर कंपोनेंट्स को HTML में रेंडर करता है।

## इंस्टॉल करें

```bash
pnpm add @tuvix.js/vue vue
# for renderVueToString on the server
pnpm add @vue/server-renderer
```

## कंपोनेंट को माइक्रो ऐप बनाएँ

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import { createPinia } from 'pinia';
import { analytics } from './analytics-plugin';
import App from './App.vue';

export default createVueMicroApp({
  name: 'settings',
  App,
  plugins: [createPinia(), [analytics, { id: 'G-123' }]],
});
```

| विकल्प | Type | विवरण |
| --- | --- | --- |
| `name` | `string` | ज़रूरी। रजिस्टर किए गए ऐप के नाम से मेल खाना चाहिए। |
| `App` | `Component` | ज़रूरी। Root कंपोनेंट। |
| `plugins` | `Array<Plugin \| [Plugin, ...options]>` | हर mount पर `app.use(plugin, ...options)` से install होते हैं। |
| `bootstrap` | `() => void \| Promise<void>` | पहले mount से पहले एक बार चलता है। |
| `ssr` | `boolean` | सर्वर markup को hydrate करता है। `createSsrVueMicroApp` इसे सेट करता है। |

हर container को अपना Vue ऐप मिलता है, इसलिए हर mount हर plugin का `install` फिर से चलाता है। `createPinia()` जैसा plugin instance मॉड्यूल के सभी mounts में साझा होता है। जब हर mount को अपना store चाहिए, तो उसे किसी plugin function के अंदर बनाएँ।

जिस container में यह ऐप पहले से है, उसमें mount करने पर पुराना instance पहले unmount होता है। `unmount` ऐप को नष्ट करता है, container खाली करता है और `tuvix:unmounted` dispatch करता है।

## Props

Adapter props को root कंपोनेंट को देता है, और किसी भी descendant के लिए उन्हें `'tuvixProps'` (`TUVIX_PROPS_KEY`) के तहत provide भी करता है:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

defineProps<{ userId: string; theme?: 'light' | 'dark' }>();

const all = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
</script>

<template>
  <div :class="theme">User {{ userId }} ({{ Object.keys(all ?? {}).length }} props)</div>
</template>
```

`update({ props })` एक `shallowReactive` object में props बदलता है और Vue के अगले tick का इंतज़ार करता है। Root कंपोनेंट नई values के साथ फिर से render होता है और अपनी local state रखता है। नए props में जो keys नहीं हैं, वे हटा दी जाती हैं। `container` के बिना `update` मॉड्यूल के हर mount को update करता है।

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## सर्वर रेंडरिंग और hydration

सर्वर पर `renderVueToString` से रेंडर करें, और क्लाइंट पर `createSsrVueMicroApp` से hydrate करें:

```ts
// server-only module
import { renderVueToString } from '@tuvix.js/vue/server';
import Newsletter from './Newsletter.vue';

export async function renderNewsletter(list: string): Promise<string> {
  const ssrContext: { teleports?: Record<string, string> } = {};
  const html = await renderVueToString(Newsletter, { list }, [], ssrContext);
  return html; // ssrContext.teleports holds <Teleport> output
}
```

```ts
// client
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

export const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });
```

- `renderVueToString(App, props?, plugins?, ssrContext?)` `App` को उसी root में लपेटता है जो क्लाइंट इस्तेमाल करता है, इसलिए सर्वर पर `inject('tuvixProps')` काम करता है और hydration मेल खाता है।
- इसे सिर्फ़ सर्वर कोड से बुलाएँ: server function, API route या आपकी server entry। ब्राउज़र में यह `''` लौटाता है। Isomorphic route loader ब्राउज़र में भी चलता है, और तब bundler Vue server renderer को क्लाइंट तक ship कर देता है।
- `ssr: true` होने और container में सर्वर markup होने पर adapter `createSSRApp` बुलाता है और सर्वर के DOM nodes रखता है। खाली container को `createApp` से नया render मिलता है।
- HTML में कोई CSS नहीं होती। Vite SFC के `<style>` blocks को JavaScript से inject करता है, hydration शुरू होने के बाद। `@tuvix.js/vite` से `<head>` में stylesheets link करें; देखें [SSR Islands](/hi/guide/ssr-islands)।

React होस्ट के अंदर मॉड्यूल को `TuvixIsland` से mount करें।

## Composables

### useTuvixBus

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/vue';

const count = ref(0);
useTuvixBus<{ itemCount: number }>(getGlobalBus(), 'cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

यह `onMounted` में subscribe करता है, `onUnmounted` में unsubscribe करता है, और जल्दी cleanup के लिए एक function लौटाता है।

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` एक `ShallowRef` लौटाता है जिसमें `updateEvent` पर emit हुआ हर payload merge होता है। Tuvix.js में कोई भी इस event को emit नहीं करता। Adapter के साथ, `updateAppProps` से भेजे गए props कंपोनेंट को पहले ही फिर से render कर देते हैं, इसलिए आपको इसकी ज़रूरत कम ही पड़ती है।

## Edge cases

- `~/utils` जैसे path aliases `.vue` files में भी resolve होने चाहिए। अगर आपका alias `vite-tsconfig-paths` से आता है, तो उस tsconfig के `include` में `**/*.vue` जोड़ें, या Vite config में `resolve.alias` सेट करें। देखें [समस्या निवारण](/hi/guide/troubleshooting)।
- mount के दौरान setup, render या lifecycle-hook एरर `mount` को reject करता है और `tuvix:error` dispatch करता है, production builds में भी। किसी plugin का अपना `app.config.errorHandler` फिर भी चलता है।
- जिस container पर इस मॉड्यूल ने कभी mount नहीं किया, उस पर `unmount` कुछ नहीं करता।

## API

| Export | उद्देश्य |
| --- | --- |
| `createVueMicroApp({ name, App, plugins?, bootstrap?, ssr? })` | Vue माइक्रो ऐप मॉड्यूल |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | वही, `ssr: true` के साथ |
| `TUVIX_PROPS_KEY` | reactive props के लिए injection key (`'tuvixProps'`) |
| `useTuvixBus(bus, event, handler)` | कंपोनेंट से जुड़ा event bus subscription |
| `useTuvixProps(initial, bus?, event?)` | bus events से merge किया गया `ShallowRef` |
| `@tuvix.js/vue/server` से `renderVueToString(App, props?, plugins?, ssrContext?)` | सर्वर HTML |
