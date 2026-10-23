# SSR Islands

Island एक माइक्रो ऐप है जिसे सर्वर किसी React पेज के अंदर HTML में रेंडर करता है, और ब्राउज़र उसे उसके अपने फ्रेमवर्क से hydrate करता है। `@tuvix.js/react` के `TuvixIsland` से एक React होस्ट Vue, Svelte, Angular और React islands रख सकता है। कोई भी JavaScript चलने से पहले उपयोगकर्ता को styled content दिखता है, और हर island अपना फ्रेमवर्क load होने पर interactive हो जाता है।

## आपको क्या चाहिए

| हिस्सा | पैकेज | कहाँ चलता है |
| --- | --- | --- |
| सर्वर रेंडरिंग वाला React होस्ट पेज | आपका ऐप (`react-dom/server`, TanStack Start, ...) | सर्वर + क्लाइंट |
| `TuvixIsland`, `TuvixReactApp` | `@tuvix.js/react` | सर्वर + क्लाइंट |
| Island मॉड्यूल: `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`, `createSsrReactMicroApp` | adapters | क्लाइंट |
| `renderVueToString`, `renderSvelteToString`, `renderAngularToString` | `@tuvix.js/<adapter>/server` | सिर्फ़ सर्वर |
| `getAssets`, `renderAssetTags` | `@tuvix.js/vite` | सिर्फ़ सर्वर |

इसमें कोई orchestrator शामिल नहीं है। `TuvixIsland` island मॉड्यूल के `mount`, `update` और `unmount` खुद बुलाता है।

## एक request कैसे आगे बढ़ती है

```text
server                                         browser
──────                                         ───────
renderVueToString(Card, props) ─┐
                                ▼
<TuvixIsland ssrHtml={html}> renders           HTML arrives, CSS links in <head>
<div data-tuvix-app="card">…html…</div>   ──►  apply → styled first paint
getAssets([...]) → <link rel=stylesheet>
                                               hydrateRoot(host)
                                               TuvixIsland reads its innerHTML from the DOM
                                               React leaves the island's children alone
                                               useEffect → card.mount({ container, props })
                                               Vue adapter: createSSRApp → hydrates in place
                                               tuvix:mounted { hydrated: true }
```

## 1. Vite कॉन्फ़िगर करें

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [react(), vue(), svelte(), tuvix()],
});
```

`compilerOptions.types` में `"@tuvix.js/vite/client"` जोड़ें, ताकि TypeScript `virtual:tuvix/assets` को पहचाने।

## 2. Island मॉड्यूल बनाएँ

हर island अपने adapter के `Ssr` variant से बना मॉड्यूल export करता है। ये files ब्राउज़र में चलती हैं और इन्हें server renderers import नहीं करने चाहिए।

```ts
// src/islands/vue-card/index.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import VueCard from './VueCard.vue';

export const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: VueCard });
```

```ts
// src/islands/svelte-counter/index.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Counter from './Counter.svelte';

// SvelteMap makes TuvixIsland prop changes update in place instead of remounting.
export const svelteCounter = createSsrSvelteMicroApp({ name: 'svelte-counter', App: Counter, SvelteMap });
```

```ts
// src/islands/angular-contact/index.ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { ContactComponent } from './contact.component';

export const angularContact = createSsrAngularMicroApp({ name: 'angular-contact', component: ContactComponent });
```

## 3. सर्वर पर island HTML रेंडर करें

Server renderers को ऐसे मॉड्यूल में रखें जिसे सिर्फ़ सर्वर कोड import करता हो:

```ts
// src/server/render-islands.ts (server only)
import { renderVueToString } from '@tuvix.js/vue/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import { renderAngularToString } from '@tuvix.js/angular/server';
import { render } from 'svelte/server';
import VueCard from '../islands/vue-card/VueCard.vue';
import Counter from '../islands/svelte-counter/Counter.svelte';
import { ContactComponent } from '../islands/angular-contact/contact.component';

export async function renderIslands(): Promise<Record<string, string>> {
  const [card, counter, contact] = await Promise.all([
    renderVueToString(VueCard, { title: 'Hello' }),
    renderSvelteToString(Counter, { start: 3 }, { render }),
    renderAngularToString(ContactComponent, { appId: 'contact', props: { heading: 'Write to us' } }),
  ]);
  return { 'vue-card': card, 'svelte-counter': counter, 'angular-contact': contact };
}
```

`render*ToString` functions सिर्फ़ सर्वर के लिए हैं। ब्राउज़र में ये `''` लौटाते हैं। इन्हें ऐसे कोड से बुलाएँ जो कभी ब्राउज़र में नहीं चलता: आपकी server entry, कोई API route, या TanStack Start के `createServerFn` जैसा framework server function। इन्हें isomorphic route loader से न बुलाएँ। वह loader क्लाइंट navigation पर ब्राउज़र में भी चलता है, जहाँ उसे `''` मिलता है, और loader के import करने की वजह से आपका bundler Vue, Svelte या Angular server renderer को क्लाइंट तक ship कर देता है।

## 4. Islands को पेज में रखें

```tsx
// src/pages/Home.tsx
import { createContext, useContext } from 'react';
import { TuvixIsland } from '@tuvix.js/react';
import { vueCard } from '../islands/vue-card';
import { svelteCounter } from '../islands/svelte-counter';

// Filled by the server entry; empty on the client.
export const IslandHtml = createContext<Record<string, string>>({});

export function Home() {
  const html = useContext(IslandHtml);
  return (
    <main>
      <TuvixIsland
        name="vue-card"
        app={vueCard}
        props={{ title: 'Hello' }}
        ssrHtml={html['vue-card']}
        fallback={<p>The card failed to load.</p>}
      />
      <TuvixIsland name="svelte-counter" app={svelteCounter} props={{ start: 3 }} ssrHtml={html['svelte-counter']} />
    </main>
  );
}
```

सर्वर और क्लाइंट पर एक जैसे props दें। अगर सर्वर ने `{ start: 3 }` रेंडर किया और क्लाइंट `{ start: 4 }` के साथ mount करे, तो फ्रेमवर्क को hydration mismatch दिखता है।

## 5. Head में island CSS link करें

Vite CSS Modules, Vue के `<style>` blocks और Svelte styles को JavaScript से inject करता है। मदद के बिना सर्वर HTML उस JavaScript से पहले ब्राउज़र तक पहुँचता है, और पहला paint बिना styles के होता है (FOUC)। `getAssets` किसी entry को चाहिए stylesheet URLs लौटाता है, ताकि सर्वर उन्हें `<head>` में link कर सके:

```tsx
// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { Home, IslandHtml } from './pages/Home';
import { renderIslands } from './server/render-islands';

export async function render(): Promise<string> {
  const [islandHtml, assets] = await Promise.all([
    renderIslands(),
    getAssets(['src/entry-client.tsx', 'src/pages/Home.tsx']),
  ]);

  const body = renderToString(
    <IslandHtml.Provider value={islandHtml}>
      <Home />
    </IslandHtml.Provider>,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <title>Home</title>
    ${renderAssetTags(assets)}
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;
}
```

- मॉड्यूल paths Vite root के सापेक्ष दें। Production build में हर path build input होना चाहिए या client build में किसी `import()` का target; बाकी किसी भी path पर यह reject करता है।
- अगर Rollup दो `import()` targets को एक chunk में मिला दे, तो manifest उस chunk को आपके मॉड्यूल path की जगह उसके hashed नाम से दर्ज करता है, और उस path के लिए `getAssets` reject करता है। उदाहरण में यह तब होता है जब `@angular/core` किसी page chunk में पहुँच जाता है, और उदाहरण इसे `manualChunks` से ठीक करता है जो `@angular/core` को उसका अपना chunk देते हैं।
- `getAssets` static imports को follow करता है और `import()` targets को छोड़ देता है। सर्वर पर रेंडर होने वाले lazily import किए गए पेज या island को list में अपनी अलग entry चाहिए।
- Dev में यह `?direct` CSS URLs लौटाता है, और Vite के अपना `<style>` inject करते ही मेल खाने वाले `<link>` को disable कर देता है, ताकि HMR edits लागू हों।
- Angular islands अपनी styles inline रखते हैं: `renderAngularToString` कंपोनेंट के `<style>` tags markup के आगे रखता है।
- Svelte: या तो `css: 'injected'` के साथ compile करें (styles island HTML में inline), या `emitCss` रखें और उन्हें `getAssets` से link करें। दोनों नहीं।

## 6. क्लाइंट पर hydrate करें

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Home } from './pages/Home';

hydrateRoot(document.getElementById('app')!, <Home />);
```

क्लाइंट island HTML के बिना render करता है। Hydration के दौरान हर `TuvixIsland` अपना markup पेज से पढ़ता है, React उन nodes को रखता है, और island मॉड्यूल उन्हें hydrate करता है।

## HTML दो बार क्यों नहीं भेजा जाता

एक सीधा-सादा island दोनों तरफ़ सर्वर HTML को prop के रूप में देता है। तब React को `dangerouslySetInnerHTML` hydrate करने के लिए क्लाइंट पर वह string चाहिए, इसलिए HTML एक बार document में और फिर hydration data में जाता है। नए `{ __html }` object के साथ हर parent re-render पर React `innerHTML` फिर से assign करता है, जो island के फ्रेमवर्क के जोड़े गए DOM और listeners मिटा देता है।

`TuvixIsland` दोनों से बचता है:

- सर्वर पर यह `ssrHtml` को `<div data-tuvix-app={name} data-tuvix-island={id}>` में लिखता है।
- Hydration के दौरान यह उस element को उसके `useId` पर आधारित `data-tuvix-island` attribute से ढूँढता है और `innerHTML` एक बार पढ़ता है। क्लाइंट को कभी `ssrHtml` नहीं चाहिए।
- यह `{ __html }` object को state में रखता है, इसलिए बाद के renders React को वही object देते हैं और React island के children कभी दोबारा नहीं लिखता।

आपका फ्रेमवर्क loader data के साथ क्या करता है, यह अलग मामला है। अगर आप TanStack Start या Remix loader से island HTML लौटाते हैं, तो फ्रेमवर्क उस loader result को भी पेज में serialize करता है। HTML को island तक ऐसी चीज़ से पहुँचाएँ जिसे फ्रेमवर्क serialize नहीं करता, जैसे React context जिसे आपकी server entry भरती है, जैसा step 4 में है।

## हर request की state {#per-request-state}

सर्वर कोड एक process में कई requests संभालता है। Module scope पर आप जो भी बनाते हैं, वह उन सभी requests में बना रहता है।

- TanStack Query के `QueryClient` जैसा data cache हर request के लिए बनाएँ, module scope पर नहीं। सर्वर पर module-level client requests और users के बीच data मिला देता है, और उसकी पुरानी entries hydration mismatch पैदा करती हैं।
- Island को जो data चाहिए, उसे request के अपने cache से props के रूप में दें। Island मॉड्यूल mount पर अपनी client-side state खुद बनाता है।
- तारीखें और संख्याएँ explicit `timeZone` और locale के साथ format करें। सर्वर आमतौर पर UTC में चलता है और ब्राउज़र उपयोगकर्ता के zone में; `timeZone` के बिना `Intl.DateTimeFormat` आधी रात के आसपास अलग दिन रेंडर करता है और hydration तोड़ देता है।

```tsx
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

declare function createRequestCache(): { dehydrate(): unknown };
declare function Page(props: { data: unknown }): ReactElement;

export function renderRequest(): string {
  const cache = createRequestCache(); // one per request
  return renderToString(<Page data={cache.dehydrate()} />);
}
```

## Head और meta tags होस्ट की ज़िम्मेदारी हैं

Islands body के एक `<div>` में रेंडर होते हैं। उन्हें `<title>`, `<meta>` या `<link rel=canonical>` emit नहीं करने चाहिए। इन्हें होस्ट में सेट करें (आपके फ्रेमवर्क का head API, या HTML template)। `<svelte:head>` इस्तेमाल करने वाले Svelte कंपोनेंट्स के लिए `renderSvelteToString` की जगह `renderSvelte` बुलाएँ और उसका `head` output document head में खुद रखें।

## एरर

- अगर island का `mount` या `update` reject हो, तो `TuvixIsland` उसकी जगह `fallback` रेंडर करता है। Adapter पहले ही `tuvix:error` dispatch कर चुका होता है।
- अगर कोई server renderer throw करे, तो फ़ैसला आपका सर्वर कोड करता है: उसे catch करें और `ssrHtml` न दें, तब island खाली शुरू होता है और क्लाइंट पर रेंडर होता है।
- `TuvixReactApp` अपने कंपोनेंट को `<Suspense>` में लपेटता है, इसलिए सर्वर render एरर सिर्फ़ उसी ऐप को उसके `fallback` से बदलता है, और React क्लाइंट पर उसे फिर से आज़माता है।

पेज कोड से islands पर `onLifecycle('mounted', ...)` और `onLifecycle('error', ...)` से नज़र रखें; देखें [Lifecycle Events](/hi/guide/lifecycle-events)।

## उदाहरण प्रोजेक्ट

Repository में `examples/with-ssr-islands` यह सब एक साथ जोड़ता है: React 19 होस्ट वाला Express + Vite सर्वर, एक Vue 3 card, एक Svelte 5 counter, एक zoneless Angular 20 contact form (JIT; compiler एक lazy chunk के रूप में load होता है), एक `TuvixReactApp` newsletter, और एक island जो अपना fallback दिखाने के लिए जानबूझकर fail होता है। `src/server/render-islands.ts` में server renderers हैं, `src/entry-server.tsx` `getAssets` से assets link करता है, और `src/runtime/islands.ts` lifecycle events पर प्रतिक्रिया देता है। Angular island को अपना `heading` input सर्वर पर `props` विकल्प से मिलता है और क्लाइंट पर वही object मिलता है। Repository root से `pnpm --filter with-ssr-islands dev` चलाएँ (port 5186), या `build` और फिर `start` (port 5185; `PORT` इसे बदलता है)। उदाहरण का README हर हिस्से को और उसके Playwright spec के checks को समझाता है।

## Islands क्या नहीं करते

- `TuvixIsland` मॉड्यूल को URL से load नहीं करता। Island मॉड्यूल को होस्ट bundle में import करें।
- यह islands के बीच state साझा नहीं करता। Props, event bus या अपना store इस्तेमाल करें।
- Angular islands सर्वर DOM को non-destructive तरीके से hydrate करने की जगह उस पर फिर से रेंडर करते हैं; देखें [Angular](/hi/guide/angular)।
- यहाँ कुछ भी सर्वर render step के बिना नहीं चलता। Client-only islands के लिए `ssrHtml` छोड़ दें और non-`Ssr` adapters इस्तेमाल करें।
