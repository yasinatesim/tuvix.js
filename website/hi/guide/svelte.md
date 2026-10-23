# Svelte के साथ

`@tuvix.js/svelte` किसी Svelte कंपोनेंट को माइक्रो ऐप बनाता है। यह Svelte 5 और Svelte 3/4 को सपोर्ट करता है, सर्वर markup को hydrate करता है, और सर्वर पर कंपोनेंट्स को HTML में रेंडर करता है।

## इंस्टॉल करें

```bash
pnpm add @tuvix.js/svelte svelte
```

## कंपोनेंट को माइक्रो ऐप बनाएँ

```ts
// src/main.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

// SvelteMap (Svelte 5 only) lets update() re-render in place; drop it for Svelte 3/4.
export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

पहले mount पर adapter `svelte` को import करता है और जाँचता है कि उसमें कौन सा API है:

| Svelte | Mount | Hydrate | Update | Unmount |
| --- | --- | --- | --- | --- |
| 5 | `mount(App, { target, props })` | `hydrate(...)` | `SvelteMap` होने पर उसी जगह, वरना remount | `unmount(instance)` |
| 3 / 4 | `new App({ target, props })` | `new App({ hydrate: true })` | `instance.$set(props)` | `instance.$destroy()` |

आपके bundler को `svelte` को उसके browser build पर resolve करना होगा। अगर वह server build चुन ले, तो Svelte 5 का `mount()` `lifecycle_function_unavailable` throw करता है, या `onMount` callbacks कभी नहीं चलते। देखें [समस्या निवारण](/hi/guide/troubleshooting)।

हर container को अपना कंपोनेंट instance मिलता है। `onMount` callbacks और effects चलने के बाद `mount` `tuvix:mounted` dispatch करता है। `ssr` के बिना `mount` render करने से पहले container खाली करता है। जिस container पर इस मॉड्यूल ने कभी mount नहीं किया, या जिसका mount fail हुआ, उस पर `unmount` कुछ नहीं करता।

## Props

Runes के साथ Svelte 5:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { userId, theme = 'light' }: { userId: string; theme?: string } = $props();
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 3/4, या legacy mode में Svelte 5:

```svelte
<script lang="ts">
  export let userId: string;
  export let theme = 'light';
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 5 पर config में `svelte/reactivity` से `SvelteMap` दें। तब adapter कंपोनेंट को `SvelteMap` पर आधारित props object देता है, और `update({ props })` नई values उसमें लिखता है: सिर्फ़ वे हिस्से फिर से render होते हैं जो बदला हुआ prop पढ़ते हैं, और DOM nodes व कंपोनेंट की state बनी रहती है। यह `$props()` और `export let` दोनों के लिए काम करता है। `SvelteMap` के बिना Svelte 5 का `update()` instance को unmount करता है, नए props के साथ नया instance mount करता है और फिर से `tuvix:mounted` dispatch करता है, इसलिए local state reset हो जाती है। Adapter खुद `svelte/reactivity` को import नहीं करता, क्योंकि Svelte 3/4 में वह मॉड्यूल मौजूद नहीं है और उनके builds fail हो जाते।

Svelte 3/4 पर `update` `$set` बुलाता है और `SvelteMap` को अनदेखा करता है।

हर update पूरे prop set को बदल देता है। नए props में जो key नहीं है, वह Svelte 5 पर prop के default पर लौट जाती है और Svelte 3/4 पर `undefined` हो जाती है। Orchestrator हमेशा merge किए गए props भेजता है, इसलिए यह बात तभी मायने रखती है जब आप `update` खुद बुलाते हैं।

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

## सर्वर रेंडरिंग और hydration

```ts
// server-only module
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooter(): Promise<string> {
  return renderSvelteToString(Footer, { year: 2026 }, { render });
}
```

```ts
// client
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export const footer = createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

- `renderSvelteToString(App, props?, { render? })` कंपोनेंट के `<style>` tags और उनके बाद उसका markup लौटाता है। इसे सर्वर कोड से बुलाएँ; ब्राउज़र में यह `''` लौटाता है।
- जब आपके server bundle में Svelte शामिल हो (Nitro, Vinxi, `noExternal` वाला Vite SSR build), तो `svelte/server` से `render` दें। इसके बिना adapter runtime पर `svelte/server` import करता है, जिससे Svelte की दूसरी copy load हो सकती है, और अलग-अलग copies के बीच Svelte का server renderer fail हो जाता है।
- जब आपको `<svelte:head>` का output चाहिए, तो `renderSvelte(App, props?, { render? })` `{ html, head, css }` लौटाता है। `head` को document के `<head>` में खुद रखें; island में `<title>` या `<meta>` नहीं होना चाहिए।
- container में elements या non-whitespace text होने पर `createSsrSvelteMicroApp` hydrate करता है, वरना नया render करता है। Svelte 3/4 कंपोनेंट्स को `hydratable: true` के साथ compile करना ज़रूरी है।

### पहले paint पर CSS

इनमें से एक चुनें:

- **HTML में CSS।** `compilerOptions: { css: 'injected' }` के साथ compile करें। तब Svelte 5 कंपोनेंट की CSS को server output में रखता है, और `renderSvelteToString` उसे island के अंदर `<style>` tags के रूप में शामिल करता है।
- **Files के रूप में CSS।** Default `emitCss: true` रहने दें और `@tuvix.js/vite` से island की stylesheets `<head>` में link करें। देखें [SSR Islands](/hi/guide/ssr-islands)।

`css: 'injected'` के साथ कोई stylesheet file नहीं बनती, इसलिए `@tuvix.js/vite` को link करने के लिए कुछ नहीं मिलता। दोनों को साथ में इस्तेमाल न करें।

## Event bus

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getGlobalBus } from '@tuvix.js/event-bus';

  let count = $state(0);
  const off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) => {
    count = itemCount;
  });
  onDestroy(off);
</script>

<span class="badge">{count}</span>
```

## Adapter क्या नहीं करता

- यह `.svelte` files को compile नहीं करता; यह काम `@sveltejs/vite-plugin-svelte` करता है।
- यह सिर्फ़ props भेजता है। होस्ट से कोई slots, snippets या component events नहीं आते।
- यह नहीं जाँचता कि आपके bundler ने कौन सा Svelte build चुना।

## API

| Export | उद्देश्य |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap?, ssr?, SvelteMap? })` | Svelte माइक्रो ऐप मॉड्यूल |
| `createSsrSvelteMicroApp({ name, App, bootstrap?, SvelteMap? })` | वही, `ssr: true` के साथ |
| `@tuvix.js/svelte/server` से `renderSvelteToString(App, props?, options?)` | Styles + markup |
| `@tuvix.js/svelte/server` से `renderSvelte(App, props?, options?)` | `{ html, head, css }` |
