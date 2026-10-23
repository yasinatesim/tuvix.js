# समस्या निवारण

हर entry पहले बताती है कि आपको क्या दिखता है, फिर कारण और समाधान।

## Svelte: onMount कभी नहीं चलता, या mount() lifecycle_function_unavailable throw करता है

**लक्षण।** Svelte island रेंडर होता है, लेकिन `onMount` callbacks कभी fire नहीं होते, या Svelte 5 का `mount()` `lifecycle_function_unavailable` throw करता है।

**कारण।** `svelte` एक ही import के तहत एक browser runtime और एक server runtime ship करता है। आपके client bundle ने server वाला चुन लिया। कुछ SSR setups (Vinxi, custom Vite environments, jsdom में Vitest) client को `browser` export condition के बिना resolve करते हैं, और फिर Vite का dependency optimizer server runtime को pre-bundle कर देता है। ब्राउज़र devtools में आपको client file की जगह `svelte/src/index-server.js` (Svelte 5) या `svelte/src/runtime/ssr.js` (Svelte 4) दिखती है।

**समाधान।** Client की resolve conditions में `browser` वापस जोड़ें, फिर Vite को `--force` के साथ restart करें ताकि वह optimized deps दोबारा build करे:

```ts
// vite.config.ts (the client build or client environment)
import { defaultClientConditions, defineConfig } from 'vite';

export default defineConfig({
  resolve: { conditions: ['browser', ...defaultClientConditions] },
});
```

jsdom के साथ Vitest में condition जोड़ें और Svelte को inline करें, ताकि Vite उसे resolve करे:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['browser'] },
  test: { environment: 'jsdom', server: { deps: { inline: [/svelte/] } } },
});
```

`svelte` को `optimizeDeps` से exclude न करें; तब esbuild "The entry point "svelte" cannot be marked as external" के साथ fail होता है।

## Vue: .vue files में ~ alias fail होता है

**लक्षण।** Production build `Rollup failed to resolve import "~/utils/x" from ".../Card.vue?vue&type=script..."` के साथ fail होता है, जबकि वही import `.ts` files में काम करता है और `.vue` files में `~/` से `import type` भी काम करता है।

**कारण।** `vite-tsconfig-paths` aliases सिर्फ़ उन files पर लगाता है जिन्हें उसका tsconfig `include` करता है। जो tsconfig `**/*.ts` और `**/*.tsx` include करता है, उसमें `.vue` files छूट जाती हैं। Type-only imports resolution से पहले हट जाते हैं, इसलिए वे कभी fail नहीं होते।

**समाधान।** उस tsconfig में `.vue` files include करें:

```json
{
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"]
}
```

या alias को Vite में ही declare करें:

```ts
// vite.config.ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) } },
});
```

Vue - Official (Volar) editor extension इस्तेमाल करें। Vetur `<script setup>` macros या `moduleResolution: "Bundler"` को नहीं समझता।

## Angular 15-17: clicks से view update नहीं होता

**लक्षण।** Angular island रेंडर होता है, लेकिन button handler कोई field बदलता है और template update नहीं होता।

**कारण।** Adapter Angular को zone.js के बिना चलाता है। Angular 18+ zoneless mode में change detection खुद schedule करता है; 15-17 पर adapter `NgZone` को no-op zone से बदल देता है, और DOM events के बाद कोई change detection नहीं चलाता।

**समाधान।** बदलाव के बाद `detectChanges()` call करें:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-like',
  standalone: true,
  template: `<button (click)="like()">{{ likes }}</button>`,
})
export class LikeComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  likes = 0;

  like(): void {
    this.likes += 1;
    this.cdr.detectChanges();
  }
}
```

या अपनी client entry के ऊपर `zone.js` import करें और `createAngularMicroApp` को `zone: true` दें। zone.js को सर्वर से दूर रखें: यह global `Promise` को patch करता है और server-side `fetch` तोड़ देता है।

## Dates से hydration mismatch

**लक्षण।** React error #418 report करता है (या Vue और Svelte hydration mismatch log करते हैं), सिर्फ़ कुछ users के लिए या सिर्फ़ आधी रात के आसपास। Diff में एक दिन के अंतर वाली date दिखती है, जैसे `21 Mart 2026` बनाम `22 Mart 2026`।

**कारण।** सर्वर dates को अपने time zone (आमतौर पर UTC) में format करता है और ब्राउज़र user के zone में। `timeZone` के बिना `new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' })` दोनों तरफ़ अलग text देता है।

**समाधान।** सर्वर जिन dates को रेंडर करता है, उन्हें जहाँ भी format करें, वहाँ स्पष्ट `timeZone` दें:

```ts
const format = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Istanbul',
});

console.log(format.format(new Date('2026-03-21T22:30:00Z'))); // 22 Mart 2026 on server and client
```

यही बात `toLocaleString`, relative times ("3 hours ago") और render के दौरान `Date.now()` इस्तेमाल करने वाली हर चीज़ पर लागू होती है।

## एक request का डेटा दूसरी request में दिखता है

**लक्षण।** सर्वर पर रेंडर हुआ island पुराना डेटा या किसी दूसरे user की request का डेटा दिखाता है, और फिर क्लाइंट अलग content के साथ दोबारा रेंडर करता है।

**कारण।** Module-level cache, जैसे कई माइक्रो ऐप्स में import होने वाला `export const queryClient = new QueryClient()`, server process के पूरे जीवनकाल तक बना रहता है। हर request उसी instance को पढ़ती और लिखती है।

**समाधान।** सर्वर पर हर request के लिए cache बनाएँ और island को जो चाहिए वह props के रूप में दें। Module-level client सिर्फ़ browser code में रखें।

```ts
import { QueryClient } from '@tanstack/query-core';

export function createRequestQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
}
```

[Per-request state](/hi/guide/ssr-islands#per-request-state) देखें।

## Unload के बाद module-script ऐप load नहीं होता

**लक्षण।** `orchestrator.unregister(name)` या `loader.unload(name)` के बाद उसी ऐप को फिर से register और mount करने पर `Module "<name>" loaded but no exports found` एरर आता है।

**कारण।** ब्राउज़र हर URL के लिए module script एक बार चलाते हैं। उसी URL के लिए दूसरा `<script type="module" src="...">` कुछ नहीं करता, इसलिए ऐप दोबारा `registerModule` call नहीं करता।

**समाधान।** Loader-function entry इस्तेमाल करें, जो module को bundler के module cache में रखती है, या URL बदलें (जैसे version query string जोड़कर):

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

## "loaded but no exports found"

**लक्षण।** `[Tuvix Loader] Module "dashboard" loaded but no exports found.`

**कारण और समाधान**, इसी क्रम में जाँचें:

1. Bundle जिस नाम से register करता है, वह register किए गए नाम से अलग है। `createReactMicroApp({ name: 'Dashboard' })` और `register({ name: 'dashboard' })` match नहीं करते। एक ही string इस्तेमाल करें।
2. ES module bundle classic script के रूप में load हुआ। Vite का ES output `.js` पर खत्म होता है; entry में `type: 'module'` जोड़ें।
3. Bundle module को export करता है, लेकिन कभी register नहीं करता। Adapter या `defineMicroApp` इस्तेमाल करें, या `registerModule(name, module)` खुद call करें।

## Container नहीं मिला

**लक्षण।** `[Tuvix] Container "#app" not found in DOM.`

**कारण।** Orchestrator ऐप को mount करते समय container खोजता है। हो सकता है बाहरी राउटर के route component ने उसे अभी तक रेंडर न किया हो।

**समाधान।** Containers को ऐसे layout में रखें जो navigation से पहले मौजूद हो, या उस ऐप को route component के अंदर `TuvixIsland` से होस्ट करें। [बाहरी राउटर](/hi/guide/external-router#containers-rendered-by-routes) देखें।

## बिना style का पहला paint

**लक्षण।** JavaScript बंद होने पर, या धीमे connections पर कुछ पल के लिए, सर्वर पर रेंडर हुए islands बिना CSS के दिखते हैं।

**कारण।** Vite CSS Modules, Vue `<style>` और Svelte styles को JavaScript से inject करता है। सर्वर HTML इनमें से किसी को link नहीं करता।

**समाधान।** अपने Vite config में `@tuvix.js/vite` से `tuvix()` जोड़ें और `<head>` में `renderAssetTags(await getAssets([...]))` print करें। [SSR Islands](/hi/guide/ssr-islands) देखें।
