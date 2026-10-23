---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Svelte बाइंडिंग्स"
  description="Svelte 3, 4 या 5 कंपोनेंट को Tuvix.js माइक्रो ऐप में बदलता है: हर container के लिए एक instance, props का in-place update, सर्वर markup का hydration, और CSS के साथ सर्वर रेंडरिंग।"
  icon="🔥"
  npm="true"
/>

## इंस्टॉलेशन

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

peer range में Svelte 3, 4 और 5 आते हैं। पैकेज के दो entry points हैं: ब्राउज़र के लिए `@tuvix.js/svelte` और सर्वर रेंडरिंग के लिए `@tuvix.js/svelte/server`।

## इसे कब इस्तेमाल करें

यह पैकेज तब इस्तेमाल करें जब किसी Svelte कंपोनेंट को Tuvix.js माइक्रो ऐप की तरह चलाना हो: orchestrator किसी route पर उसे container में mount करता है, props देता है, उन्हें update करता है, और route बदलने पर उसे unmount करता है। islands भी इसी में आते हैं: आप कंपोनेंट को सर्वर पर रेंडर करते हैं, HTML को पेज में रखते हैं, और क्लाइंट उसे hydrate करता है।

जिस पेज को ऊपर से नीचे तक Svelte संभालता है (SvelteKit), उसके लिए आपको यह पैकेज नहीं चाहिए। वहाँ Svelte ख़ुद को mount करता है और बात करने के लिए कोई orchestrator नहीं होता।

## क्विक स्टार्ट

props वाला एक Svelte 5 कंपोनेंट:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { name, theme = 'light' }: { name: string; theme?: string } = $props();
</script>

<p class={theme}>Hello {name}</p>
```

माइक्रो ऐप entry इसे wrap करती है। `SvelteMap` देने पर props update होते ही कंपोनेंट उसी जगह दोबारा रेंडर होता है:

```ts
// profile-app.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

shell ऐप को register करता है और orchestrator शुरू करता है:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./profile-app'),
  container: '#profile',
  activeWhen: '/profile',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: the component re-renders in place, no remount.
await orchestrator.updateAppProps('profile', { name: 'Grace', theme: 'dark' });
```

क्लाइंट bundle को `svelte` को उसके ब्राउज़र build पर resolve करना होगा। `@sveltejs/vite-plugin-svelte` यह आपके लिए करता है। अगर आपका setup `browser` export condition हटा देता है, तो Svelte 5 का `mount()` `lifecycle_function_unavailable` throw करता है और `onMount` कभी नहीं चलता।

## API

### `createSvelteMicroApp`

```ts no-check
function createSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule;
```

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `name` | `string` | ज़रूरी | ऐप का नाम। adapter इसी नाम से module को `@tuvix.js/loader` के `registerModule` के ज़रिए register करता है। |
| `App` | `unknown` | ज़रूरी | Root कंपोनेंट: compiled Svelte 5 कंपोनेंट (एक function) या Svelte 3/4 कंपोनेंट class। |
| `bootstrap` | `() => void \| Promise<void>` | कोई नहीं | एक बार चलने वाला setup। module का `bootstrap()` इसका await करता है। |
| `ssr` | `boolean` | `false` | जब container में elements या whitespace के अलावा text हो, तो सर्वर markup को hydrate करें। वरना नए सिरे से रेंडर करें। |
| `SvelteMap` | `svelte/reactivity` की `SvelteMap` class | कोई नहीं | सिर्फ़ Svelte 5। इसके साथ `update()` उसी जगह दोबारा रेंडर करता है; इसके बिना Svelte 5 का `update()` कंपोनेंट को remount करता है। Svelte 3/4 इसे अनदेखा करते हैं। |

पहले mount पर adapter `svelte` को import करता है और `mount` export की जाँच करता है। वह नतीजे को पेज के लिए cache कर लेता है।

- **Svelte 5** (`mount` मौजूद है): `mount()` से रेंडर करता है, `hydrate()` से hydrate करता है, `unmount()` से हटाता है। `update()` कैसे काम करता है, यह `SvelteMap` पर निर्भर है:
  - `SvelteMap` के साथ कंपोनेंट को ऐसा props object मिलता है जिसके पीछे `SvelteMap` है। `update()` नई values को उस map में लिखता है, इसलिए template के जो हिस्से बदला हुआ prop पढ़ते हैं वे दोबारा रेंडर होते हैं, और कंपोनेंट अपने DOM nodes और state बनाए रखता है। यह `$props()` कंपोनेंट्स पर और Svelte 5 से compile हुए legacy `export let` कंपोनेंट्स पर काम करता है।
  - इसके बिना `update()` instance को unmount करता है, container खाली करता है, नए props के साथ नया instance mount करता है, और `hydrated: false` के साथ `tuvix:mounted` फिर से dispatch करता है। DOM nodes, focus और कंपोनेंट state खो जाते हैं।
- **Svelte 3/4** (`mount` नहीं है): `new App({ target, props, hydrate })`, `$set()` और `$destroy()`।

लौटाया गया module हर container के हिसाब से काम करता है। हर container को अपना instance मिलता है, इसलिए एक module एक साथ तीन containers में रेंडर कर सकता है।

- `mount({ container, props })` container खाली करता है (जब तक वह hydrate न कर रहा हो), रेंडर करता है, `onMount` callbacks और effects चलाता है, फिर container पर `hydrated: true | false` के साथ `tuvix:mounted` dispatch करता है। विफल होने पर यह `tuvix:error` dispatch करता है और मूल एरर के साथ reject करता है।
- `update({ props, container? })` `container` वाले instance को update करता है, या `container` न देने पर हर instance को। हर update पूरे prop set को बदल देता है: नए props में जो key नहीं है, वह Svelte 5 पर कंपोनेंट के default पर लौट जाती है और Svelte 3/4 पर `undefined` हो जाती है।
- `unmount({ container })` instance को नष्ट करता है, container खाली करता है और `tuvix:unmounted` dispatch करता है।

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import { onLifecycle } from '@tuvix.js/loader';
import Cart from './Cart.svelte';

const cart = createSvelteMicroApp({ name: 'cart', App: Cart, SvelteMap });

onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} mounted`, { hydrated });
});

const header = document.querySelector<HTMLElement>('#cart-header')!;
const sidebar = document.querySelector<HTMLElement>('#cart-sidebar')!;

await cart.mount({ container: header, props: { compact: true } });
await cart.mount({ container: sidebar, props: { compact: false } });

// Updates the sidebar instance only.
await cart.update?.({ props: { compact: true }, container: sidebar });
```

### `createSsrSvelteMicroApp`

```ts no-check
function createSsrSvelteMicroApp(config: Omit<SvelteMicroAppConfig, 'ssr'>): MicroAppModule;
```

यह `createSvelteMicroApp({ ...config, ssr: true })` जैसा ही है। इसे क्लाइंट पर उन islands के लिए इस्तेमाल करें जिन्हें सर्वर ने `renderSvelteToString` या `renderSvelte` से रेंडर किया है।

- **Svelte 5**: `hydrate(App, { target, props })`। markup `svelte/server` से ही आना चाहिए, क्योंकि hydration उसके लिखे comment markers (`<!--[-->`) पढ़ता है।
- **Svelte 3/4**: `new App({ target, props, hydrate: true })`। कंपोनेंट को `hydratable: true` के साथ compile करें।

hydration सर्वर के DOM nodes को बनाए रखता है और उन पर event handlers जोड़ता है। जिस container में सिर्फ़ whitespace या comments हों, उसे नया render मिलता है।

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `renderSvelteToString`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelteToString(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<string>;
```

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | कोई नहीं | `svelte/server` का `render`। इसके बिना adapter runtime पर `svelte/server` import करता है। |

कंपोनेंट को सर्वर पर रेंडर करता है और उसके `<style>` tags के बाद उसका markup लौटाता है। इस string को island container के अंदर रखें और `createSsrSvelteMicroApp` से mount करें। string में `<svelte:head>` का content नहीं होता; उसकी ज़रूरत हो तो `renderSvelte` इस्तेमाल करें।

function runtime पर Svelte version चुनता है। `render` देने पर वह हमेशा Svelte 5 वाला रास्ता लेता है और `render(App, { props })` call करता है। इसके बिना adapter `svelte` import करता है: अगर वह module `mount` export करता है, तो adapter `svelte/server` load करके Svelte 5 से रेंडर करता है। वरना वह `App.render(props)` call करता है (Svelte 3/4, `generate: 'ssr'` के साथ compiled) और `css.code` को `<style>` tag में लपेटता है। adapter `App.render` देखकर कभी फ़ैसला नहीं करता, क्योंकि `dev: true` के साथ compile हुए Svelte 5 कंपोनेंट्स (serve mode में vite-plugin-svelte) में एक `App.render` stub होता है जो throw करता है।

इसे किसी सर्वर function से call करें, ऐसे code से नहीं जो ब्राउज़र में भी चलता है। ब्राउज़र में यह `''` लौटाता है।

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

export async function renderFooterIsland(): Promise<string> {
  const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
  return `<footer id="footer" data-tuvix-app="footer">${html}</footer>`;
}
```

### `renderSvelte`

```ts no-check
// import from '@tuvix.js/svelte/server'
function renderSvelte(
  App: unknown,
  props?: Record<string, unknown>,
  options?: RenderSvelteOptions
): Promise<SvelteRenderResult>;
```

यह `renderSvelteToString` वाले ही arguments और विकल्प लेता है और हिस्सों को अलग-अलग लौटाता है:

| Field | मतलब |
| --- | --- |
| `html` | कंपोनेंट का markup। Svelte 5 के output में hydration comments होते हैं। |
| `head` | कंपोनेंट के `<style>` tags के बिना `<svelte:head>` का content। इसे document के `<head>` में रखें। |
| `css` | `<style>` tags के रूप में कंपोनेंट CSS, या compiler ने कुछ न दिया हो तो `''`। |

ब्राउज़र में तीनों fields `''` होते हैं।

```ts
import { render } from 'svelte/server';
import { renderSvelte } from '@tuvix.js/svelte/server';
import Article from './Article.svelte';

export async function renderArticlePage(slug: string): Promise<string> {
  const { html, head, css } = await renderSvelte(Article, { slug }, { render });
  return `<!doctype html>
<html>
  <head>${head}${css}</head>
  <body>
    <main id="article" data-tuvix-app="article">${html}</main>
    <script type="module" src="/client.js"></script>
  </body>
</html>`;
}
```

### Types

| Type | Entry | मतलब |
| --- | --- | --- |
| `SvelteMicroAppConfig` | `@tuvix.js/svelte` | `createSvelteMicroApp` के विकल्प। |
| `SvelteProps` | `@tuvix.js/svelte` | `Record<string, unknown>`: वे props जो orchestrator कंपोनेंट को देता है। |
| `RenderSvelteOptions` | `@tuvix.js/svelte/server` | `{ render?: SvelteServerRender }`। |
| `SvelteServerRender` | `@tuvix.js/svelte/server` | `svelte/server` के Svelte 5 `render` का आकार। |
| `SvelteRenderResult` | `@tuvix.js/svelte/server` | `{ html, head, css }`, जिसे `renderSvelte` लौटाता है। |

## सर्वर रेंडरिंग

एक island तीन चरणों से गुज़रता है: सर्वर पर रेंडर, container के अंदर HTML भेजना, क्लाइंट पर hydrate करना।

1. किसी सर्वर function में `renderSvelteToString` (या `renderSvelte`) call करें और नतीजे को container element में रखें।
2. क्लाइंट entry load करें, जो `createSsrSvelteMicroApp({ name, App })` export करती है।
3. orchestrator ऐप को उसी container में mount करता है। adapter markup देखता है और उसे hydrate करता है।

**CSS।** Svelte 5 कंपोनेंट CSS को render output में तभी रखता है जब आप `css: 'injected'` के साथ compile करते हैं। default `css: 'external'` के साथ आपका bundler CSS को एक फ़ाइल में लिखता है और string में कोई `<style>` tag नहीं होता। Vite में:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
});
```

अगर आप `css: 'external'` रखते हैं, तो बनी हुई stylesheet को पेज के head से link करें। [`@tuvix.js/vite`](/hi/packages/vite) आपके सर्वर को बताता है कि किसी island entry को कौन-सी stylesheets चाहिए।

**Svelte की एक ही copy।** जब आपके सर्वर bundle में Svelte शामिल हो (Nitro, Vinxi, `noExternal` वाला Vite SSR build), तो `svelte/server` से `render` पास करें। तब कंपोनेंट और renderer Svelte की एक ही copy इस्तेमाल करते हैं। इस विकल्प के बिना adapter runtime पर `svelte/server` import करता है, जो `node_modules` से दूसरी copy load कर सकता है। Svelte का सर्वर renderer `instanceof` जाँच करता है और कंपोनेंट और renderer अलग-अलग copies से आने पर विफल हो जाता है।

## Edge cases

- अगर container में उसी module का instance पहले से है, तो उस पर `mount` पहले पुराने instance को unmount करता है।
- जब `mount` अभी `svelte` load कर रहा हो, तब call किया गया `unmount` mount पूरा होने का इंतज़ार करता है, फिर instance को नष्ट करता है। कोई अनाथ कंपोनेंट पीछे नहीं छूटता।
- जिस container को इस module ने कभी mount नहीं किया, या जिसका mount विफल हुआ, उस पर `unmount` कुछ नहीं करता: container के children बने रहते हैं और कोई event नहीं चलता।
- mount pending रहते हुए call किया गया `update` उसका इंतज़ार करता है, फिर props लागू करता है। विफल mount के लिए update कुछ नहीं करता।
- Svelte 3/4 पर नए props में जो prop नहीं है, वह `undefined` हो जाता है। `export let name = 'x'` वाला default वापस नहीं आता। Svelte 5 पर default लागू होता है, `SvelteMap` के साथ या उसके बिना।
- adapter ख़ुद `svelte/reactivity` import नहीं करता। Svelte 3/4 में ऐसा कोई module नहीं है, और उसे reference करने वाले Svelte 3/4 ऐप को bundler build नहीं कर पाएगा, इसलिए यह import आपकी Svelte 5 entry में रहता है।
- Svelte 5 remount (`SvelteMap` के बिना) `tuvix:mounted` फिर से dispatch करता है, लेकिन बीच में कोई `tuvix:unmounted` नहीं। अगर नया render throw करता है, तो `update()` उस एरर के साथ reject करता है और पुराना instance पहले ही हट चुका होता है।
- `ssr` के बिना `mount` रेंडर करने से पहले container खाली करता है, इसलिए loading placeholders ग़ायब हो जाते हैं।
- `ssr` के साथ adapter तब hydrate करता है जब container में कोई element या whitespace के अलावा text हो। सिर्फ़ comments और whitespace होने पर नया render होता है।
- adapter हर पेज पर Svelte version एक बार पहचानता है। अगर `import('svelte')` विफल होता है, तो अगला mount फिर से कोशिश करता है।
- सर्वर पर Svelte 5 का import या render एरर आपको rejected promise के रूप में मिलता है। adapter `App.render` पर fallback नहीं करता।
- Svelte 5 का `render` promise लौटा सकता है (async सर्वर रेंडरिंग)। दोनों सर्वर functions उसका await करते हैं।

## यह क्या नहीं करता

- यह `.svelte` फ़ाइलें compile नहीं करता। यह काम आपका bundler `@sveltejs/vite-plugin-svelte` या `svelte/compiler` से करता है।
- यह नहीं जाँचता कि आपके bundler ने कौन-सा Svelte build चुना। जो क्लाइंट bundle `svelte` को सर्वर build पर resolve करता है, वह mount पर विफल होता है।
- यह सिर्फ़ props पास करता है। slots, snippets और कंपोनेंट events के लिए होस्ट से कोई channel नहीं है। ऐप्स के बीच बात करने के लिए [`@tuvix.js/event-bus`](/hi/packages/event-bus) इस्तेमाल करें।
- यह `<svelte:head>` का content document में नहीं लिखता। `renderSvelte` उसे लौटाता है; आपका सर्वर उसे `<head>` में रखता है।
- यह `css: 'external'` से compile हुई CSS को link नहीं करता। [`@tuvix.js/vite`](/hi/packages/vite) देखें।
- यह सर्वर पर data का इंतज़ार नहीं करता। पहले data load करें और उसे props के रूप में पास करें।

## 0.4 से माइग्रेशन

- **Svelte 5 काम करता है।** 0.4 में adapter हर कंपोनेंट पर `new App()` call करता था, इसलिए Svelte 5 कंपोनेंट्स विफल होते थे, और `createSsrSvelteMicroApp` hydrate करने के बजाय दूसरी copy रेंडर करता था। mount करने के लिए code बदलने की ज़रूरत नहीं है। props के in-place update के लिए config में `svelte/reactivity` से `SvelteMap` पास करें; इसके बिना हर Svelte 5 update कंपोनेंट को remount करता है।
- **mount पर container खाली होता है।** `ssr` के बिना Svelte 3/4 कंपोनेंट को container में पहले से मौजूद markup के बाद जोड़ता था। अब adapter पहले container खाली करता है। अगर आप कंपोनेंट के बगल में markup बने रहने पर निर्भर थे, तो उसे container के बाहर ले जाएँ।
- **सर्वर पर कोई चुपचाप fallback नहीं।** पहले `svelte/server` load न होने पर `renderSvelteToString` `App.render` पर fallback करता था। अब `render` पास करने पर या `svelte` के `mount` export करने पर यह Svelte 5 वाला रास्ता लेता है, `App.render` सिर्फ़ Svelte 3/4 पर call करता है, और Svelte 5 के import या render एरर पर reject करता है। Vite dev SSR में Svelte 5 dev builds Svelte 5 वाला रास्ता लेते हैं, भले ही उनमें `App.render` stub हो।
- **अनजान container पर `unmount` कुछ नहीं करता।** पहले जिस container को module ने कभी mount नहीं किया, उस पर `unmount({ container })` उसे खाली कर देता था। अब यह container को नहीं छूता, React, Vue और Angular adapters की तरह।
- **`render` पास करें।** जब आपके सर्वर bundle में Svelte शामिल हो, तो तीसरे argument के रूप में `svelte/server` से `{ render }` जोड़ें:

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

// 0.4: await renderSvelteToString(Footer, { year: 2026 });
const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
```

पूरे ऐप के लिए [Svelte गाइड](/hi/guide/svelte) देखें।
