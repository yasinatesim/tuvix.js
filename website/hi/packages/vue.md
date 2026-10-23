---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Vue बाइंडिंग्स"
  description="किसी Vue 3 कंपोनेंट को reactive props, हर container के लिए एक Vue ऐप और SSR hydration के साथ Tuvix.js माइक्रो ऐप में बदलें। renderVueToString से इसे सर्वर पर रेंडर करें।"
  icon="💚"
  npm="true"
/>

## इंस्टॉलेशन

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

सर्वर रेंडरिंग के लिए Vue server renderer भी इंस्टॉल करें, जो एक optional peer डिपेंडेंसी है:

```bash
npm install @vue/server-renderer
# or pnpm add @vue/server-renderer
```

इस पैकेज को Vue 3 चाहिए (peer range `>=3.0.0`)। यह `@tuvix.js/loader` और `@tuvix.js/event-bus` पर निर्भर है।

## इसे कब इस्तेमाल करें

जब आपके Tuvix shell का कोई माइक्रो ऐप Vue 3 ऐप हो, तब `@tuvix.js/vue` का उपयोग करें। `createVueMicroApp` रूट कंपोनेंट को उस `{ bootstrap, mount, unmount, update }` मॉड्यूल में लपेटता है जिसे orchestrator और loader कॉल करते हैं। इसके बाद orchestrator उसे एक container में mount करता है, `updateAppProps` से नए props भेजता है, और route बदलने पर उसे unmount करता है।

जब Vue ऐप को पहले HTML response में दिखना ज़रूरी हो, SEO के लिए या JavaScript चलने से पहले खाली जगह से बचने के लिए, तब सर्वर रेंडरिंग जोड़ें। सर्वर function में `@tuvix.js/vue/server` के `renderVueToString` से HTML रेंडर करें, उसे container में रखें, और `createSsrVueMicroApp` से hydrate करें। React होस्ट पेज के अंदर वह HTML [`TuvixIsland`](/hi/packages/react#tuvixisland) को पास करें।

अगर पूरा पेज एक ही Vue ऐप है, तो आपको इस पैकेज की ज़रूरत नहीं है; Vue का अपना `createApp` या Nuxt इस्तेमाल करें।

## क्विक स्टार्ट

रूट कंपोनेंट उन props को declare करता है जो shell पास करता है:

```vue
<!-- src/micro-apps/settings/App.vue -->
<script setup lang="ts">
defineProps<{ userId: string; theme: 'light' | 'dark' }>();
</script>

<template>
  <section :class="`settings theme-${theme}`">Settings for {{ userId }}</section>
</template>
```

इसे एक मॉड्यूल में लपेटें:

```ts
// src/micro-apps/settings/index.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

इसे shell में रजिस्टर करें:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'settings',
  entry: () => import('./micro-apps/settings'),
  container: '#app',
  activeWhen: '/settings/*',
  props: { userId: 'u_42', theme: 'light' },
});

await orchestrator.start();

// Re-renders App with theme="dark"; local component state survives.
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## API

### `createVueMicroApp`

```ts no-check
function createVueMicroApp(config: VueMicroAppConfig): MicroAppModule;
```

| विकल्प | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | आवश्यक | वह नाम जिसके तहत मॉड्यूल `@tuvix.js/loader` के `registerModule` से रजिस्टर होता है। lifecycle events में यही नाम रहता है। |
| `App` | `Component` | आवश्यक | रूट Vue कंपोनेंट। |
| `plugins` | `VuePluginEntry[]` | कोई नहीं | हर Vue ऐप पर इंस्टॉल होने वाले plugins। हर entry एक plugin होती है, या `[plugin, ...options]` tuple जो `app.use(plugin, ...options)` को पास होता है। |
| `bootstrap` | `() => void \| Promise<void>` | कोई नहीं | एक बार का setup। मॉड्यूल का `bootstrap()` इसका await करता है। |
| `ssr` | `boolean` | `false` | जब container में elements या non-whitespace text हो, तब `createSSRApp` से सर्वर markup को hydrate करें। खाली container को `createApp` render मिलता है। |

लौटाया गया मॉड्यूल:

- `mount({ container, props })` उस container के लिए एक Vue ऐप बनाता है, plugins इंस्टॉल करता है और उसे mount करता है। जब Vue सर्वर markup को अपना लेता है, तब यह container पर `hydrated: true` के साथ `tuvix:mounted` dispatch करता है।
- `update({ props, container })` `props` को उस container के reactive props object में लिखता है और Vue के re-render flush करने (`nextTick`) के बाद resolve होता है। नए props में जो keys नहीं हैं, वे हटा दी जाती हैं। `container` के बिना यह उन सभी containers को update करता है जिनमें मॉड्यूल mount हुआ है।
- `unmount({ container })` Vue ऐप को unmount करता है, `replaceChildren()` से container खाली करता है और `tuvix:unmounted` dispatch करता है।
- `bootstrap()` `config.bootstrap` को चलाता है।

हर container को अपना Vue ऐप और अपने props मिलते हैं, इसलिए एक मॉड्यूल एक साथ कई जगहों पर mount हो सकता है:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Badge from './Badge.vue';

const badge = createVueMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

#### कंपोनेंट्स में props पढ़ना

adapter props को एक `shallowReactive` object में रखता है और `App` को एक root wrapper के ज़रिए रेंडर करता है, जो उन्हें कंपोनेंट props के रूप में पास करता है। wrapper अपना कोई DOM रेंडर नहीं करता। आप props दो में से किसी एक तरीके से पढ़ते हैं:

- रूट कंपोनेंट में **`defineProps`**। `update` उसे नए मानों के साथ फिर से रेंडर करता है।
- tree के किसी भी कंपोनेंट में **`inject('tuvixProps')`** (या `inject(TUVIX_PROPS_KEY)`)। आपको वही reactive object मिलता है, इसलिए उसे पढ़ने वाला `computed` `update` के बाद update होता है। props को नीचे तक पास करने के बजाय गहरे children में इसका उपयोग करें।

```vue
<!-- src/micro-apps/settings/ThemeLabel.vue -->
<script setup lang="ts">
import { computed, inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

const tuvixProps = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
const theme = computed(() => String(tuvixProps.theme ?? 'light'));
</script>

<template>
  <span>Theme: {{ theme }}</span>
</template>
```

#### विकल्पों वाले plugins

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import type { VuePluginEntry } from '@tuvix.js/vue';
import type { App as VueApp } from 'vue';
import App from './App.vue';

const analytics = {
  install(app: VueApp, options: { siteId: string }) {
    app.provide('analyticsSiteId', options.siteId);
  },
};

const plugins: VuePluginEntry[] = [[analytics, { siteId: 'site-42' }]];

export default createVueMicroApp({ name: 'checkout', App, plugins });
```

हर container को अपना Vue ऐप मिलता है, इसलिए हर mount हर plugin के लिए फिर से `app.use` कॉल करता है। stateful plugin object, जैसे एक `createPinia()` का परिणाम, मॉड्यूल के सभी containers के बीच साझा रहता है।

### `createSsrVueMicroApp`

```ts no-check
function createSsrVueMicroApp(config: VueSsrMicroAppConfig): MicroAppModule;
```

यह `createVueMicroApp({ ...config, ssr: true })` के समान है। विकल्प: `name`, `App`, `plugins`, `bootstrap`, ऊपर की तालिका की तरह।

जब container में `renderVueToString` से आया markup हो, तब Vue `createSSRApp` के ज़रिए उन DOM nodes को अपना लेता है और उन पर listeners जोड़ता है। सर्वर और क्लाइंट एक ही root wrapper का उपयोग करते हैं, इसलिए कंपोनेंट trees मेल खाते हैं। उन्हीं props के साथ mount करें जिनसे सर्वर ने रेंडर किया था:

```ts
// src/micro-apps/contact/client.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString`

इसे `@tuvix.js/vue/server` subpath से import करें।

```ts no-check
function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: VuePluginEntry[],
  ssrContext?: VueSsrContext
): Promise<string>;
```

| आर्गुमेंट | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `App` | `Component` | आवश्यक | रूट कंपोनेंट, वही जो आप `createSsrVueMicroApp` को पास करते हैं। |
| `props` | `Record<string, unknown>` | `{}` | `App` के लिए props। `inject('tuvixProps')` इन्हें SSR के दौरान भी देखता है। |
| `plugins` | `VuePluginEntry[]` | कोई नहीं | इंस्टॉल होने वाले plugins, `createVueMicroApp` वाले उसी tuple रूप में। |
| `ssrContext` | `VueSsrContext` | `{}` | वह object जिसमें Vue render के दौरान लिखता है। promise resolve होने के बाद `teleports` और `modules` पढ़ें। |

यह साझा root wrapper के साथ एक SSR ऐप बनाता है, plugins इंस्टॉल करता है, और `@vue/server-renderer` के `renderToString` से मिला HTML लौटाता है। वह पैकेज इंस्टॉल करें; `renderVueToString` पहली कॉल पर उसे import करता है।

`renderVueToString` सिर्फ़ सर्वर के लिए है। इसे सर्वर function (TanStack Start का `createServerFn` handler, कोई API route, आपका Express handler) से कॉल करें, isomorphic route loader से नहीं। loader क्लाइंट navigation के दौरान ब्राउज़र में भी चलता है, जहाँ यह function `''` लौटाता है, और loader इसे import करता है इसलिए आपका bundler Vue server renderer को क्लाइंट तक भेज देता है।

```ts
// src/server/contact.ts
import { createServerFn } from '@tanstack/react-start';
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from '../micro-apps/contact/App.vue';

export const renderContact = createServerFn().handler(async () => {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return { html, teleports: ssrContext.teleports ?? {} };
});
```

`html` को अपने पेज में container element (`<div id="contact">…</div>`) के अंदर रखें, फिर ऊपर दिखाए अनुसार क्लाइंट पर `createSsrVueMicroApp` mount करें। `<Teleport>` target का HTML लौटाई गई string में नहीं, `ssrContext.teleports['#target']` में होता है; उसे वहाँ प्रिंट करें जहाँ target मौजूद है।

### `TUVIX_PROPS_KEY`

```ts no-check
const TUVIX_PROPS_KEY = 'tuvixProps';
```

reactive props object की injection key। `inject(TUVIX_PROPS_KEY)` और `inject('tuvixProps')` क्लाइंट पर और `renderVueToString` के दौरान, दोनों जगह एक ही object लौटाते हैं।

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): Unsubscribe;
```

`onMounted` में `handler` को `event` के लिए subscribe करता है और `onUnmounted` में unsubscribe करता है। लौटाया गया function पहले ही unsubscribe कर देता है। इसे `setup` के दौरान कॉल करें। सर्वर रेंडरिंग के दौरान `onMounted` नहीं चलता, इसलिए subscription सिर्फ़ क्लाइंट पर मौजूद रहता है।

adapter orchestrator की bus को `App` में पास नहीं करता। जब तक आपने orchestrator को `eventBus` विकल्प नहीं दिए, वह `getGlobalBus()` का उपयोग करता है:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const count = ref(0);

useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
  count.value = items.length;
});
</script>

<template>
  <span>{{ count }}</span>
</template>
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): ShallowRef<T>;
```

| आर्गुमेंट | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `initialProps` | `T` | आवश्यक | शुरुआती मान, एक बार copy होता है। |
| `bus` | `IEventBus` | कोई नहीं | जिस bus को सुनना है। इसके बिना ref में `initialProps` ही रहता है। |
| `updateEvent` | `string` | `'tuvix:props:update'` | वह event जिसका payload composable ref में merge करता है (`{ ...prev, ...payload }`)। |

न orchestrator और न adapter `tuvix:props:update` emit करते हैं; इसे आप खुद emit करते हैं। orchestrator से आने वाले props के लिए `defineProps` या `inject(TUVIX_PROPS_KEY)` का उपयोग करें, जो बिना bus के `update` का पालन करते हैं।

```vue
<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const settings = useTuvixProps({ theme: 'light' }, getGlobalBus());
// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
</script>

<template>
  <p>Theme: {{ settings.theme }}</p>
</template>
```

### Types

| टाइप | कहाँ से export होता है | अर्थ |
| --- | --- | --- |
| `VueMicroAppConfig` | `@tuvix.js/vue` | `createVueMicroApp` का config: `name`, `App`, `plugins?`, `bootstrap?`, `ssr?`। |
| `VueSsrMicroAppConfig` | `@tuvix.js/vue` | `ssr` के बिना `VueMicroAppConfig`; `createSsrVueMicroApp` का config। |
| `VuePluginEntry` | `@tuvix.js/vue` | `Plugin \| [Plugin, ...any[]]`: एक plugin, या एक plugin और उसके `app.use` विकल्प। |
| `VueSsrContext` | `@tuvix.js/vue/server` | `{ teleports?: Record<string, string>; modules?: Set<string>; [key: string]: unknown }`, जिसे `renderVueToString` के दौरान Vue और उसके plugins भरते हैं। `@vitejs/plugin-vue` रेंडर हुए कंपोनेंट मॉड्यूल्स को `modules` में दर्ज करता है। |

## Edge cases

- **Mount एरर।** `mount` के दौरान setup, render और lifecycle hook के एरर development और production दोनों builds में promise को reject करते हैं। adapter fail हुए ऐप को unmount करता है और `tuvix:error` dispatch करता है। किसी plugin का अपना `app.config.errorHandler` भी एरर पाता है।
- **एक container में दो बार mount।** जिस container को मॉड्यूल पहले से रखता है, उस पर दूसरा `mount` पहले पुराने ऐप को unmount करता है (`tuvix:unmounted` dispatch करते हुए और container खाली करते हुए), फिर नया ऐप mount करता है। `ssr: true` के साथ वह दूसरा mount नए सिरे से रेंडर करता है, क्योंकि container खाली होता है।
- **अज्ञात container।** जिस container में मॉड्यूल कभी mount नहीं हुआ, उस पर `unmount` कुछ नहीं करता। ऐसे `container` के साथ `update` कुछ नहीं बदलता।
- **Props बदल दिए जाते हैं।** मॉड्यूल का `update` props को उस object पर सेट करता है जो आप पास करते हैं और गायब keys को हटा देता है। `orchestrator.updateAppProps` `update` को कॉल करने से पहले नए props को रजिस्टर किए गए props के ऊपर merge करता है।
- **Undeclared props।** जिन props को रूट कंपोनेंट `defineProps` से declare नहीं करता, वे उसे attributes के रूप में मिलते हैं और उसके root element तक fall through होते हैं, जैसा Vue किसी भी कंपोनेंट के लिए करता है। जब तक आप `lang` declare नहीं करते या `inheritAttrs: false` सेट नहीं करते, `{ lang: 'en' }` root element पर `lang="en"` रेंडर करता है।
- **`ssr: true` के साथ सिर्फ़ whitespace वाला container।** adapter `createApp` से रेंडर करता है, क्योंकि `hasServerMarkup` whitespace text और comments को अनदेखा करता है। Vue खाली container को hydrate करने के बारे में चेतावनी नहीं देता।
- **ब्राउज़र में `renderVueToString`।** जब `window` मौजूद हो, तब यह `''` लौटाता है।
- **Unmount एरर।** अगर `app.unmount()` throw करे, तो adapter container खाली करता है, `tuvix:error` dispatch करता है और एरर को फिर से throw करता है।
- **एक ही नाम दो बार।** `registerModule` किसी नाम के तहत बने आख़िरी मॉड्यूल को रखता है।

## यह क्या नहीं करता

- यह Vue 2 को सपोर्ट नहीं करता।
- यह URL से मॉड्यूल लोड नहीं करता। मॉड्यूल को import करें, या [`@tuvix.js/core`](/hi/packages/core) को `entry` के ज़रिए उसे लोड करने दें।
- यह `MountContext.bus` या `MountContext.name` को आपके कंपोनेंट्स में पास नहीं करता। `@tuvix.js/event-bus` से `getGlobalBus()` का उपयोग करें।
- `renderVueToString` stream नहीं करता और CSS इकट्ठा नहीं करता। सर्वर पर रेंडर हुए islands के stylesheet links प्रिंट करने के लिए [`@tuvix.js/vite`](/hi/packages/vite) का उपयोग करें।
- यह teleported HTML को आपके लिए सही जगह नहीं रखता। `ssrContext.teleports` पढ़ें और उसे प्रिंट करें।

## 0.4 से माइग्रेशन

**`$tuvixProps` हटा दिया गया है।** `update()` अब `app.config.globalProperties.$tuvixProps` में नहीं लिखता। props को `defineProps` या `inject` से पढ़ें:

```vue
<!-- Before (0.4) -->
<template>
  <span>{{ $tuvixProps.theme }}</span>
</template>
```

```vue
<!-- After (0.5) -->
<script setup lang="ts">
defineProps<{ theme: string }>();
</script>

<template>
  <span>{{ theme }}</span>
</template>
```

**अज्ञात container पर `unmount` कुछ नहीं करता।** 0.4 में यह container को साफ़ कर देता था। अगर आप उस पर निर्भर थे, तो `container.replaceChildren()` खुद कॉल करें।

**`VueSsrMicroAppConfig` में कोई `ssr` field नहीं है।** `createSsrVueMicroApp` को पास किए जाने वाले config से `ssr` हटा दें।

**Config object।** इस पेज के पुराने वर्शन में `createVueMicroApp(App)` दिखाया गया था। यह function एक config object लेता है: `createVueMicroApp({ name: 'settings', App })`।

और walkthroughs के लिए [Vue गाइड](/hi/guide/vue) देखें।
