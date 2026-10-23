# @tuvix.js/vue

> Vue 3 कंपोनेंट्स को reactive props, हर container के लिए एक Vue ऐप और SSR hydration के साथ Tuvix.js माइक्रो ऐप्स में बदलें।

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

सर्वर रेंडरिंग के लिए optional peer `@vue/server-renderer` भी install करें।

## क्विक स्टार्ट

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Module `@tuvix.js/loader` के `registerModule` के ज़रिए खुद को `'settings'` नाम से register करता है, इसलिए script load होने के बाद orchestrator उसे ढूंढ लेता है। `App` orchestrator के props को कंपोनेंट props के रूप में पाता है। उन्हें `defineProps` से declare करें।

## API

### `createVueMicroApp(config)`

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | required | Registry नाम। Lifecycle events में यही नाम होता है। |
| `App` | `Component` | required | Root Vue कंपोनेंट। |
| `plugins` | `VuePluginEntry[]` | none | Plugins, या `[plugin, ...options]` tuples जो `app.use(plugin, ...options)` को दिए जाते हैं। |
| `bootstrap` | `() => void \| Promise<void>` | none | एक बार होने वाला setup। |
| `ssr` | `boolean` | `false` | Container में elements या non-whitespace text हो तो `createSSRApp` से सर्वर markup को hydrate करें। |

- हर container को अपना Vue ऐप और props मिलते हैं, इसलिए एक module कई जगह mount हो सकता है। हर mount plugins को फिर से install करता है।
- `mount({ container, props })` `hydrated` के साथ `tuvix:mounted` dispatch करता है।
- `update({ props, container })` एक `shallowReactive` props object की keys बदलता है (जो keys नहीं हैं, वे हटा दी जाती हैं) और `nextTick` के बाद resolve होता है। `container` न हो तो यह हर mount को update करता है। कंपोनेंट state बनी रहती है।
- `unmount({ container })` ऐप को unmount करता है, container खाली करता है और `tuvix:unmounted` dispatch करता है।

### `createSsrVueMicroApp(config)`

`createVueMicroApp({ ...config, ssr: true })`। विकल्प: `name`, `App`, `plugins`, `bootstrap`। Vue `renderVueToString` से आया markup अपनाता है। खाली container में सामान्य render होता है।

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString(App, props?, plugins?, ssrContext?)`

`@tuvix.js/vue/server` से। `App` का HTML लौटाता है, जिसे क्लाइंट वाले root wrapper के साथ ही रेंडर किया जाता है, इसलिए hydration मेल खाता है और सर्वर पर `inject('tuvixProps')` काम करता है। Vue `teleports` और `modules` को `ssrContext` में लिखता है।

सिर्फ़ सर्वर के लिए: इसे किसी सर्वर function से कॉल करें, isomorphic route loader से नहीं। ब्राउज़र में यह `''` लौटाता है, और इसे import करने वाला loader Vue server renderer को क्लाइंट तक ship कर देता है।

```ts
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from './App.vue';

export async function renderContact(): Promise<string> {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return `<div id="contact">${html}</div>`;
}
```

### `TUVIX_PROPS_KEY`

`'tuvixProps'`। Tree के किसी भी कंपोनेंट में `inject(TUVIX_PROPS_KEY)` वह reactive props object लौटाता है जिसमें `update` लिखता है।

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus(bus, event, handler)`

`onMounted` में subscribe करता है, `onUnmounted` में unsubscribe करता है, और पहले ही unsubscribe करने के लिए एक function लौटाता है। `@tuvix.js/event-bus` से `getGlobalBus()` दें। Adapter orchestrator का bus `App` को नहीं देता।

### `useTuvixProps(initialProps, bus?, updateEvent?)`

एक `ShallowRef<T>` लौटाता है जिसमें `bus` पर आए `updateEvent` (default `'tuvix:props:update'`) का हर payload merge होता है। Tuvix में कुछ भी यह event emit नहीं करता, इसे आप emit करते हैं। Orchestrator props के लिए `defineProps` या `inject(TUVIX_PROPS_KEY)` इस्तेमाल करें।

### Types

`@tuvix.js/vue` से `VueMicroAppConfig`, `VueSsrMicroAppConfig`, `VuePluginEntry`; `@tuvix.js/vue/server` से `VueSsrContext`।

## Edge cases

- `mount` के दौरान setup, render और hook एरर development और production दोनों builds में reject होते हैं। Adapter विफल ऐप को unmount करता है और `tuvix:error` dispatch करता है। किसी plugin का `app.config.errorHandler` फिर भी चलता है।
- जिस container को module पहले से रखता है, उस पर `mount` पहले पुराने ऐप को unmount करता है।
- जिस container को module ने कभी mount नहीं किया, उस पर `unmount` कुछ नहीं करता।
- जो props root कंपोनेंट declare नहीं करता, वे उसके root element पर attributes बन जाते हैं।
- `ssr: true` के साथ, सिर्फ़ whitespace या comments वाले container में नया render होता है।

## यह क्या नहीं करता

- Vue 2 को सपोर्ट करना।
- URL से modules load करना। `@tuvix.js/core` या `@tuvix.js/loader` इस्तेमाल करें।
- सर्वर पर CSS इकट्ठा करना या HTML stream करना। Stylesheet links के लिए `@tuvix.js/vite` इस्तेमाल करें।

## 0.5 में breaking changes

- `update()` अब `app.config.globalProperties.$tuvixProps` में नहीं लिखता। `defineProps` या `inject('tuvixProps')` इस्तेमाल करें।
- जिस container को module ने कभी mount नहीं किया, उस पर `unmount()` कुछ नहीं करता। पहले यह container खाली कर देता था।
- `VueSsrMicroAppConfig` अब `ssr` स्वीकार नहीं करता।

पूरा डॉक्यूमेंटेशन: [tuvix.js.org/hi/packages/vue](https://tuvix.js.org/hi/packages/vue)

## लाइसेंस

MIT
