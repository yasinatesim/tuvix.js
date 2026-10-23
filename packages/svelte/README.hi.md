# @tuvix.js/svelte

> Tuvix.js माइक्रोफ्रंटएंड फ्रेमवर्क के लिए Svelte 3/4/5 bindings

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## क्विक स्टार्ट

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App });
```

Adapter `@tuvix.js/loader` के `registerModule` से module को register करता है, इसलिए orchestrator उसे नाम से ढूंढ लेता है। पहले mount पर यह `svelte` को import करता है और `mount` export की जांच करता है:

- **Svelte 5**: `svelte` से `mount()` / `hydrate()` / `unmount()`।
- **Svelte 3/4**: `new App({ target, props })`, `$set()` और `$destroy()`।

आपके bundler को `svelte` को उसके client build पर resolve करना होगा (`browser` export condition, जिसे `@sveltejs/vite-plugin-svelte` सेट करता है)। अगर bundler server build चुनता है, तो Svelte 5 का `mount()` `lifecycle_function_unavailable` throw करता है।

## API

### `createSvelteMicroApp(config)`

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | required | ऐप का नाम, `registerModule` से register होता है |
| `App` | `unknown` | required | Svelte 5 कंपोनेंट या Svelte 3/4 component class |
| `bootstrap` | `() => void \| Promise<void>` | none | एक बार होने वाला setup |
| `ssr` | `boolean` | `false` | Container में सर्वर markup हो तो उसे hydrate करें |
| `SvelteMap` | `SvelteMap` class | none | सिर्फ़ Svelte 5: `svelte/reactivity` से `SvelteMap`, ताकि `update()` remount करने के बजाय उसी जगह re-render करे |

- हर container को अपना instance मिलता है, इसलिए एक module कई containers में mount हो सकता है।
- `mount` container खाली करता है (जब तक hydrate न कर रहा हो), रेंडर करता है, और `onMount` callbacks और effects चलने के बाद `tuvix:mounted` dispatch करता है। विफल mount `tuvix:error` dispatch करता है और reject होता है।
- `unmount` instance को destroy करता है, container खाली करता है और `tuvix:unmounted` dispatch करता है। अगर `mount` अभी load हो रहा हो, तो यह mount का इंतज़ार करता है और फिर उसे हटा देता है।
- `update({ props, container? })` एक container को update करता है, या `container` न हो तो हर instance को। Svelte 3/4 `$set()` इस्तेमाल करता है। Svelte 5 default रूप से remount करता है: यह instance को unmount करता है, नए props के साथ नया instance mount करता है, और फिर से `tuvix:mounted` dispatch करता है, इसलिए DOM nodes और कंपोनेंट state खो जाते हैं। उसी जगह update करने के लिए `SvelteMap` दें (यह `$props()` और `export let` दोनों के साथ काम करता है):

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App, SvelteMap });
```

Adapter खुद `svelte/reactivity` को import नहीं करता: Svelte 3/4 में ऐसा कोई module नहीं है, और वह import Svelte 3/4 ऐप्स के builds तोड़ देगा।

Host orchestrator के ज़रिए नए props भेजता है:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
});
await orchestrator.start();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

### `createSsrSvelteMicroApp(config)`

`createSvelteMicroApp({ ...config, ssr: true })` जैसा ही। Container में elements या non-whitespace text हो तो यह hydrate करता है, नहीं तो नए सिरे से रेंडर करता है। Svelte 5 hydration को वे comment markers चाहिए जो `svelte/server` लिखता है। Svelte 3/4 कंपोनेंट्स को `hydratable: true` के साथ compile करें।

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `@tuvix.js/svelte/server` से `renderSvelteToString(App, props?, options?)`

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | none | `svelte/server` से `render`। इसके बिना adapter runtime पर `svelte/server` import करता है |

कंपोनेंट के `<style>` tags और उनके बाद उसका markup लौटाता है। `render` देने पर यह हमेशा Svelte 5 का `render` इस्तेमाल करता है। इसके बिना adapter `svelte` को import करता है: अगर वह module `mount` export करता है तो यह `svelte/server` (Svelte 5) load करता है, नहीं तो `App.render(props)` (Svelte 3/4) कॉल करता है और `css.code` को `<style>` में लपेटता है। `dev: true` के साथ compile हुए Svelte 5 कंपोनेंट्स (serve mode में vite-plugin-svelte) में एक `App.render` होता है जो throw करता है, इसलिए adapter कभी `App.render` के आधार पर फ़ैसला नहीं करता। इसे किसी सर्वर function से कॉल करें। ब्राउज़र में यह `''` लौटाता है।

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const footerHtml = await renderSvelteToString(
  Footer,
  { year: 2026 },
  { render }
);
```

### `@tuvix.js/svelte/server` से `renderSvelte(App, props?, options?)`

विकल्प वही हैं। यह `{ html, head, css }` लौटाता है, ताकि आप `<svelte:head>` का content document head में रख सकें।

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

const { html, head, css } = await renderSvelte(
  Footer,
  { year: 2026 },
  { render }
);
```

### Types

`SvelteMicroAppConfig`, `SvelteProps` (`@tuvix.js/svelte` से); `RenderSvelteOptions`, `SvelteServerRender`, `SvelteRenderResult` (`@tuvix.js/svelte/server` से)।

## Edge Cases

- Svelte 5 सर्वर output में CSS तभी देता है जब आप `css: 'injected'` के साथ compile करें (Vite: `svelte({ compilerOptions: { css: 'injected' } })`)। Default `css: 'external'` के साथ आपका bundler CSS को एक फ़ाइल में लिखता है।
- जब आपके सर्वर bundle में Svelte शामिल हो (Nitro, Vinxi, `noExternal` वाला Vite SSR build), तो `svelte/server` से `render` दें। जब कंपोनेंट और renderer Svelte की दो अलग copies से आते हैं, तो Svelte का server renderer विफल हो जाता है।
- हर update पूरा prop set बदल देता है। नए props में जो key नहीं है, वह Svelte 5 पर हटा दी जाती है (default लागू होता है) और Svelte 3/4 पर `undefined` सेट होती है।
- Mounted container पर `mount` पहले पुराने instance को unmount करता है। जिस container को module ने कभी mount नहीं किया, उस पर `unmount` कुछ नहीं करता: यह container के children को वैसे ही छोड़ देता है और कोई event dispatch नहीं करता।
- सर्वर पर Svelte 5 का import या render एरर reject होता है। `App.render` पर कोई fallback नहीं है।

## यह क्या नहीं करता

- यह `.svelte` फ़ाइलें compile नहीं करता, और यह नहीं जांचता कि आपके bundler ने कौन-सा Svelte build चुना।
- यह सिर्फ़ props देता है: host से slots, snippets या component events नहीं।
- यह `<svelte:head>` का content document में नहीं लिखता, और `css: 'external'` stylesheets को link नहीं करता।

पूरा डॉक्यूमेंटेशन: [tuvix.js.org/hi/packages/svelte](https://tuvix.js.org/hi/packages/svelte)

## लाइसेंस

MIT
