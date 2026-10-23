---
title: '@tuvix.js/vite'
---

<PackageHeader
  name="@tuvix.js/vite"
  title="Vite Island Assets"
  description="Vite plugin जो आपके सर्वर renderer को बताता है कि किसी island को कौन-सी stylesheets और JS chunks चाहिए, ताकि सर्वर पर रेंडर हुआ head उन्हें link करे और island पहले paint पर ही styled दिखे।"
  icon="⚡"
  npm="true"
/>

## इंस्टॉलेशन

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

plugin को Vite 6 या 7 चाहिए (peer range `^6.0.0 || ^7.0.0`)। test suite Vite 6 पर चलता है।

## इसे कब इस्तेमाल करें

आप किसी island (React, Vue, Svelte, Angular या plain DOM) को सर्वर पर रेंडर करते हैं, और उसका markup उसकी JavaScript से पहले ब्राउज़र तक पहुँचता है। Vite CSS Modules, Vue SFC के `<style>` blocks और Svelte styles उसी JavaScript के ज़रिए भेजता है, इसलिए bundle चलने तक ब्राउज़र island को बिना style के paint करता है। `@tuvix.js/vite` के साथ आपका सर्वर पूछता है "`src/islands/footer/index.ts` को कौन-सी stylesheets चाहिए?" और उनके `<link>` tags `<head>` में लिख देता है।

अगर आपके islands सिर्फ़ क्लाइंट पर रेंडर होते हैं, या आप एक global stylesheet link करते हैं जो पहले से हर island को कवर करती है, तो इसे छोड़ दें।

## क्विक स्टार्ट

plugin को उस Vite config में जोड़ें जिसे आप क्लाइंट build और SSR build के लिए इस्तेमाल करते हैं:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

virtual module के types को `tsconfig.json` में जोड़ें:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

अपनी सर्वर entry में assets माँगें और उन्हें `<head>` में लिखें:

```ts
// src/entry-server.ts
/// <reference types="@tuvix.js/vite/client" />
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { renderFooter } from './islands/footer/render';

export async function render(): Promise<string> {
  const assets = await getAssets(['src/islands/footer/index.ts']);
  return `<!doctype html>
<html>
  <head>${renderAssetTags(assets)}</head>
  <body><footer data-tuvix-app="footer">${await renderFooter()}</footer></body>
</html>`;
}
```

पहले क्लाइंट build करें, फिर सर्वर। SSR build क्लाइंट manifest पढ़ता है:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?)`

```ts no-check
function tuvix(options?: TuvixViteOptions): Plugin[];
```

तीन Vite plugins लौटाता है:

- `tuvix:assets` `virtual:tuvix/assets` देता है।
- `tuvix:client-build-info` (सिर्फ़ builds) क्लाइंट manifest के बगल में `.vite/tuvix-client.json` लिखता है। [Production builds](#production-builds) देखें।
- `tuvix:dev-css-handoff` (सिर्फ़ dev server) styling की ज़िम्मेदारी सर्वर पर रेंडर हुए `<link>` से Vite के अपने `<style>` tags को सौंपता है।

लौटाए गए array को ऊपर दिखाए तरीके से `plugins` में रखें; Vite nested plugin arrays को flat कर देता है।

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | क्लाइंट build की output directory, Vite root के सापेक्ष या absolute। SSR build `<clientOutDir>/.vite/manifest.json` पढ़ता है, फिर `<clientOutDir>/manifest.json` पर fallback करता है। |
| `base` | `string` | उस build या dev server का Vite `base` जो virtual module load करता है | वह public base जिससे ब्राउज़र क्लाइंट assets load करता है। इसे तब सेट करें जब क्लाइंट सर्वर bundle से अलग base से serve होता हो, जैसे vinxi का `/_build`। |

TanStack Start और vinxi क्लाइंट राउटर का build `/_build` के नीचे एक अलग फ़ोल्डर में लिखते हैं:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries)`

`virtual:tuvix/assets` इसे export करता है।

```ts no-check
function getAssets(entries: string[]): Promise<TuvixAssets>;
```

island entry modules को Vite root के सापेक्ष paths के रूप में पास करें, जैसे `'src/islands/footer/index.ts'`। function शुरुआती `./` या `/` को अनदेखा करता है। कई entries होने पर यह lists को entry के क्रम में merge करता है और duplicates हटा देता है।

`getAssets` promise लौटाता है, क्योंकि dev server को हर module के imports पढ़ने से पहले उसे transform करना पड़ता है। इसे सिर्फ़ सर्वर code से call करें।

### `renderAssetTags(assets)`

`virtual:tuvix/assets` इसे export करता है।

```ts no-check
function renderAssetTags(assets: TuvixAssets): string;
```

`assets.css` के हर URL के लिए एक `<link rel="stylesheet">` tag लौटाता है, फिर `assets.modulepreload` के हर URL के लिए एक `<link rel="modulepreload" crossorigin>` tag। यह `href` values को HTML-escape करता है। यह सर्वर और ब्राउज़र दोनों पर काम करता है।

अगर आपका `<head>` एक React कंपोनेंट है, तो lists को ख़ुद रेंडर करें:

```tsx
import type { TuvixAssets } from '@tuvix.js/vite';

export function IslandAssets({ assets }: { assets: TuvixAssets }) {
  return (
    <>
      {assets.css.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      {assets.modulepreload.map((href) => (
        <link key={href} rel="modulepreload" crossOrigin="" href={href} />
      ))}
    </>
  );
}
```

### Types

| Type | कहाँ से export होता है | मतलब |
| --- | --- | --- |
| `TuvixViteOptions` | `@tuvix.js/vite` | `tuvix()` के विकल्प: `clientOutDir?`, `base?`। |
| `TuvixAssets` | `@tuvix.js/vite`, `virtual:tuvix/assets` | `{ css: string[]; modulepreload: string[] }`। `css` cascade के क्रम में है। dev में `modulepreload` ख़ाली रहता है। |
| `@tuvix.js/vite/client` | type entry | `virtual:tuvix/assets` module को declare करता है। इसे `compilerOptions.types` में जोड़ें या `/// <reference types="@tuvix.js/vite/client" />` से reference करें। |

## Production builds

- क्लाइंट build में plugin `build.manifest` चालू करता है, जब तक आपने `build.manifest` ख़ुद सेट न किया हो।
- क्लाइंट build manifest के बगल में `.vite/tuvix-client.json` भी लिखता है, जिसका आकार `{ modules, sharedCss }` है। `modules` हर entry और `import()` target को, Vite root के सापेक्ष, उस chunk से map करता है जिसमें Rollup ने उसे रखा। `sharedCss` में `build.cssCodeSplit: false` वाले build की इकलौती stylesheet होती है।
- SSR build में यह क्लाइंट manifest और `tuvix-client.json` पढ़ता है, और एक map inline करता है, जो manifest की हर entry (`isEntry`) या dynamic entry (`isDynamicEntry`) key से उसके URLs तक जाता है।
- Rollup कभी-कभी दो dynamic entries को एक chunk में merge कर देता है, जैसे एक page और एक फ्रेमवर्क runtime जिसे कोई adapter `import()` से load करता है। तब Vite का manifest उस chunk की key `_Page-<hash>.js` रखता है और दोनों में से किसी source को list नहीं करता। plugin `tuvix-client.json` के `modules` के ज़रिए उस chunk को ढूँढ लेता है।
- `build.cssCodeSplit: false` के साथ Vite सारी CSS एक `style-<hash>.css` में लिखता है, जिसे कोई manifest chunk list नहीं करता। `getAssets` हर entry के लिए वह file लौटाता है, entry की अपनी CSS से पहले।
- `tuvix-client.json` के बिना (यानी `tuvix()` के बिना build हुआ क्लाइंट), सिर्फ़ वे modules resolve होते हैं जिनकी अपनी manifest key है। जिस `style.css` manifest asset को कोई chunk list नहीं करता, उसे तब भी `cssCodeSplit: false` की इकलौती stylesheet माना जाता है।
- हर entry के लिए यह entry chunk और वे सारे chunks इकट्ठा करता है जिन्हें वह static रूप से, transitively, import करता है, साथ में उनकी CSS। import हुए chunks की CSS entry की अपनी CSS से पहले आती है, उसी क्रम में जिसमें Vite उन्हें load करता है।
- `modulepreload` में entry chunk और उसके static imports होते हैं। URLs `base + file` होते हैं।
- map `import()` targets को छोड़ देता है, क्योंकि Vite उन chunks और उनकी CSS को तभी load करता है जब import चलता है। अगर कोई lazy module सर्वर पर रेंडर होता है, तो उसका path `getAssets` को अलग entry के रूप में पास करें।
- जब ब्राउज़र बाद में island chunk load करता है, तो Vite का preload helper आपके सर्वर का लिखा `<link>` ढूँढ लेता है और दूसरा नहीं जोड़ता।

## Dev server

- `getAssets` हर entry से शुरू करके static imports के साथ, import के क्रम में, dev server के क्लाइंट module graph पर चलता है। यह `/src/islands/footer/footer.module.css?direct` जैसे URLs लौटाता है; Vite `?direct` requests का जवाब plain CSS से देता है। Vue blocks `/src/App.vue?direct&vue&type=style&index=0&...&lang.css` के रूप में आते हैं।
- island तक किसी virtual module के ज़रिए पहुँचने वाली CSS भी इकट्ठा होती है। `\0virtual:theme.css` जैसी virtual stylesheet `/@id/__x00__virtual:theme.css?direct` के रूप में आती है, इसलिए जो plugin इसे देता है उसे query वाले ids भी load करने होंगे।
- island की JavaScript चलने पर Vite हर CSS module के लिए अपना `<style>` inject करता है। फिर `tuvix:dev-css-handoff` plugin उसी href वाले सर्वर पर रेंडर हुए `<link>` पर `link.sheet.disabled = true` सेट करता है, ताकि rules की पुरानी copy आपके HMR edits को override न कर सके। `<link>` element DOM में बना रहता है, इसलिए hydrate हुए React `<head>` को कोई बदलाव नहीं दिखता।
- CSS edit होने पर `tuvix:dev-css-handoff` `?direct` stylesheet को HMR update से बाहर रखता है। तब Vite page reload किए बिना और `<link>` बदले बिना अपना `<style>` update करता है। दो सीमाएँ लागू होती हैं:
  - CSS Modules edit hashed class names बदल देता है, इसलिए island के अपने HMR (React Fast Refresh, Vue) को उसे फिर से रेंडर करना होता है।
  - जिस island की JavaScript page ने अभी load नहीं की है, वह reload करने तक सर्वर stylesheet ही रखता है।
- dev में `modulepreload` हमेशा ख़ाली रहता है।
- `getAssets` उसी Node process में dev server से बात करता है। यह `ssrLoadModule` और Vite के default module runner के साथ काम करता है, और `server.restart()` के बाद भी काम करता रहता है।

## Edge cases

- जो entry न build input है और न क्लाइंट build का कोई `import()` target, वह `[tuvix] "<key>" is not an entry or a dynamically imported module in <manifest>` के साथ reject होती है। island को `build.rollupOptions.input` में जोड़ें, या उसे क्लाइंट code से `import()` के साथ load करें।
- क्लाइंट manifest न होने पर SSR build `[tuvix] No client manifest in <dir>` के साथ विफल होता है। पहले क्लाइंट build करें, या `clientOutDir` ठीक करें।
- dev में, जब आपका SSR code किसी दूसरे process या worker runtime में चलता है, या dev server बंद होने के बाद, `getAssets` `found no running Vite dev server with the tuvix() plugin in this process` के साथ reject करता है।
- `virtual:tuvix/assets` के ब्राउज़र build में `getAssets` `runs during server rendering only` के साथ reject करता है। क्लाइंट bundle अपना manifest नहीं जान सकता।
- dev में walker `/node_modules/` के नीचे के modules में नहीं उतरता। जो stylesheet आपका अपना code किसी पैकेज से import करता है, वह इकट्ठा होती है; जो stylesheet कोई पैकेज अपनी JavaScript से import करता है, वह नहीं।
- `'./'` जैसा relative `base` relative URLs देता है, जो nested routes पर टूट जाते हैं। absolute base इस्तेमाल करें।
- Svelte: `vite-plugin-svelte` का default `emitCss: true` बनाए रखें। `compilerOptions.css: 'injected'` के साथ styles JavaScript के अंदर रहती हैं, और plugin को link करने के लिए कोई stylesheet नहीं मिलती।

## यह क्या नहीं करता

- यह आपके HTML में tags नहीं लिखता। `renderAssetTags` का output कहाँ जाए, यह आप तय करते हैं।
- यह `import()` chains को follow नहीं करता। सर्वर पर रेंडर होने वाले lazy modules को उनकी अपनी entries के रूप में पास करें।
- यह custom manifest file name (`build.manifest: 'name.json'`) सपोर्ट नहीं करता। `true` इस्तेमाल करें।
- यह islands को रेंडर या hydrate नहीं करता। इसे [`@tuvix.js/react`](/hi/packages/react) (`TuvixIsland`), [`@tuvix.js/vue`](/hi/packages/vue) या [`@tuvix.js/svelte`](/hi/packages/svelte) जैसे adapter के साथ इस्तेमाल करें।
