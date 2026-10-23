# @tuvix.js/vite

> Vite plugin जो island CSS और modulepreload links को सर्वर पर रेंडर किए गए `<head>` में डालता है

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा। पूरे docs: [tuvix.js.org/hi/packages/vite](https://tuvix.js.org/hi/packages/vite)।

जब आप किसी micro-app island को सर्वर पर रेंडर करते हैं, तो उसका markup उसके JavaScript से पहले ब्राउज़र तक पहुँचता है। Vite island की CSS (CSS Modules, Vue SFC `<style>`, Svelte styles) उसी JavaScript के अंदर भेजता है, इसलिए पहले paint में बिना style वाला markup दिखता है। यह plugin आपके सर्वर को बताता है कि हर island को कौन-सी stylesheets चाहिए, ताकि आप उन्हें `<head>` में link कर सकें।

जब आप Vite के साथ islands को सर्वर पर रेंडर करते हैं, तब इसका इस्तेमाल करें। अगर आपके islands सिर्फ़ क्लाइंट पर रेंडर होते हैं, तो इसे छोड़ दें।

## इंस्टॉलेशन

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Vite 6 या 7 ज़रूरी है। test suite Vite 6 पर चलता है।

## क्विक स्टार्ट

जिस Vite config का इस्तेमाल आप क्लाइंट build और SSR build के लिए करते हैं, उसमें plugin जोड़ें:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

`tsconfig.json` में virtual module के types जोड़ें:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

अपनी सर्वर entry में assets माँगें और उन्हें `<head>` में print करें:

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

पहले क्लाइंट build करें, फिर सर्वर:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?: TuvixViteOptions): Plugin[]`

तीन plugins लौटाता है: `tuvix:assets` (`virtual:tuvix/assets` देता है), `tuvix:client-build-info` (सिर्फ़ build में; क्लाइंट build में `.vite/tuvix-client.json` लिखता है) और `tuvix:dev-css-handoff` (सिर्फ़ dev server)।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | क्लाइंट build की output directory, Vite root के सापेक्ष या absolute। SSR build पहले `<clientOutDir>/.vite/manifest.json` पढ़ता है, फिर `<clientOutDir>/manifest.json`। |
| `base` | `string` | Vite `base` | वह public base जिससे ब्राउज़र क्लाइंट assets लोड करता है। जब क्लाइंट को सर्वर bundle से अलग base से serve किया जाता है, तब इसे सेट करें। |

TanStack Start या vinxi के लिए plugin को क्लाइंट राउटर के output और base पर point करें:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries: string[]): Promise<TuvixAssets>`

`virtual:tuvix/assets` से। island entry modules को Vite root के सापेक्ष paths के रूप में पास करें, जैसे `'src/islands/footer/index.ts'`। शुरुआत का `./` या `/` अनदेखा होता है। कई entries होने पर `getAssets` lists को entry के क्रम में merge करता है और duplicates हटा देता है। सिर्फ़ सर्वर पर।

### `renderAssetTags(assets: TuvixAssets): string`

`virtual:tuvix/assets` से। पहले `css` के लिए `<link rel="stylesheet">` tags लौटाता है, फिर `modulepreload` के लिए `<link rel="modulepreload" crossorigin>` tags। यह attribute values को escape करता है और सर्वर तथा ब्राउज़र दोनों पर काम करता है।

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

| Type | अर्थ |
| --- | --- |
| `TuvixViteOptions` | `tuvix()` के विकल्प। |
| `TuvixAssets` | `{ css: string[]; modulepreload: string[] }`। `css` cascade क्रम में है; dev में `modulepreload` ख़ाली रहता है। |

## Production builds

- plugin क्लाइंट build में `build.manifest` चालू करता है, जब तक आप `build.manifest` ख़ुद सेट न करें।
- SSR build में यह क्लाइंट manifest पढ़ता है और हर entry और dynamic entry से उसके URLs तक का एक map inline करता है।
- क्लाइंट build manifest के बगल में `.vite/tuvix-client.json` भी लिखता है। यह हर entry और `import()` target को उस chunk से map करता है जिसमें Rollup ने उसे रखा। Rollup कभी-कभी दो dynamic entries को एक chunk में merge कर देता है, उदाहरण के लिए एक page और एक फ्रेमवर्क runtime जिसे adapter `import()` से लोड करता है। तब Vite का manifest उस chunk की key `_Page-<hash>.js` रखता है और दोनों में से कोई source नहीं दिखाता, और plugin उसे ढूँढने के लिए `tuvix-client.json` का इस्तेमाल करता है। इस file के बिना (`tuvix()` के बिना build किया गया क्लाइंट), सिर्फ़ वही modules resolve होते हैं जिनकी अपनी manifest key है।
- `build.cssCodeSplit: false` के साथ Vite सारी CSS एक `style-<hash>.css` में लिखता है, जिसे कोई manifest chunk list नहीं करता। `getAssets` हर entry के लिए वह file लौटाता है।
- हर entry के लिए यह entry chunk और हर उस chunk को इकट्ठा करता है जिसे वह statically import करता है, उनकी CSS के साथ। import किए गए chunks की CSS entry की अपनी CSS से पहले आती है, उसी क्रम में जिसमें Vite उन्हें लोड करता है।
- यह `import()` targets को छोड़ देता है, क्योंकि Vite उन chunks और उनकी CSS को तभी लोड करता है जब import चलता है। अगर कोई lazy module सर्वर पर रेंडर होता है, तो उसका path भी `getAssets` को पास करें।
- URLs `base` से शुरू होते हैं। जब ब्राउज़र बाद में island chunk लोड करता है, तो Vite का preload helper मौजूदा `<link>` को ढूँढ लेता है और दूसरा नहीं जोड़ता।

## Dev server

- `getAssets` dev server के क्लाइंट module graph में हर entry से static imports के साथ आगे बढ़ता है और `/src/islands/footer/footer.module.css?direct` जैसे URLs लौटाता है। Vite `?direct` requests का जवाब plain CSS से देता है।
- island तक किसी virtual module के ज़रिए पहुँचने वाली CSS भी काम करती है। `\0virtual:theme.css` जैसी virtual stylesheet `/@id/__x00__virtual:theme.css?direct` के रूप में आती है, इसलिए जो plugin इसे देता है उसे query वाले ids भी load करने होंगे।
- जब island का JavaScript चलता है, तो Vite हर CSS module के लिए अपना `<style>` inject करता है। तब plugin सर्वर पर रेंडर किए गए मिलते-जुलते `<link>` को `link.sheet.disabled` से बंद कर देता है, ताकि rules की पुरानी copy आपके HMR बदलावों को override न कर सके। `<link>` element DOM में बना रहता है, और hydrate किए गए React `<head>` को कोई बदलाव नहीं दिखता।
- CSS edit होने पर plugin `?direct` stylesheet को HMR update से बाहर रखता है। तब Vite page reload किए बिना और `<link>` बदले बिना अपना `<style>` update करता है। CSS Modules edit hashed class names बदल देता है, इसलिए island के अपने HMR (React Fast Refresh, Vue) को उसे फिर से रेंडर करना होता है। जिस island का JavaScript page ने अभी लोड नहीं किया है, वह reload करने तक सर्वर stylesheet ही रखता है।
- dev में `modulepreload` हमेशा ख़ाली रहता है।

## Edge cases

- अगर कोई path न build input है और न क्लाइंट build का `import()` target, तो `getAssets` reject करता है। island को `build.rollupOptions.input` में जोड़ें, या क्लाइंट code से उसे `import()` से लोड करें।
- क्लाइंट manifest न होने पर SSR build `[tuvix] No client manifest in <dir>` के साथ fail होता है।
- dev में `getAssets` को उसी Node process में dev server चाहिए (`ssrLoadModule` या Vite का default module runner)। जब SSR code किसी दूसरे process या worker runtime में चलता है, या dev server बंद होने के बाद, यह reject करता है। `server.restart()` के बाद भी यह काम करता रहता है।
- `virtual:tuvix/assets` का ब्राउज़र build एक ऐसा `getAssets` export करता है जो reject करता है, क्योंकि क्लाइंट bundle अपना manifest नहीं जान सकता।
- dev में walker `/node_modules/` के अंदर के modules में नहीं उतरता, इसलिए कोई पैकेज अपने JavaScript से जो CSS import करता है, वह इकट्ठा नहीं होती।
- `'./'` जैसा relative `base` relative URLs देता है, जो nested routes पर टूट जाते हैं। absolute base का इस्तेमाल करें।
- Svelte: `vite-plugin-svelte` का default `emitCss: true` रहने दें। `compilerOptions.css: 'injected'` के साथ styles JavaScript के अंदर रहती हैं, और plugin को link करने के लिए कोई stylesheet नहीं मिलती।

## यह क्या नहीं करता

- यह आपके HTML में tags नहीं लिखता। वे कहाँ जाएँगे, यह आप तय करते हैं।
- यह `import()` chains का पीछा नहीं करता।
- यह custom manifest file name (`build.manifest: 'name.json'`) सपोर्ट नहीं करता। `true` का इस्तेमाल करें।
- यह islands को रेंडर या hydrate नहीं करता। `@tuvix.js/react` (`TuvixIsland`), `@tuvix.js/vue` या `@tuvix.js/svelte` जैसे adapter का इस्तेमाल करें।

## License

MIT
