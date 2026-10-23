---
title: '@tuvix.js/vite'
---

<PackageHeader
  name="@tuvix.js/vite"
  title="Vite island asset'leri"
  description="Sunucu renderer'ınıza bir island'ın hangi stil dosyalarına ve JS chunk'larına ihtiyaç duyduğunu söyleyen Vite eklentisi. Sunucuda render edilen head bunları bağlar ve island ilk boyamada stilli görünür."
  icon="⚡"
  npm="true"
/>

## Kurulum

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Eklenti Vite 6 ya da 7 ister (peer aralığı `^6.0.0 || ^7.0.0`). Test paketi Vite 6 üzerinde çalışır.

## Ne zaman kullanılır

Bir island'ı (React, Vue, Svelte, Angular ya da düz DOM) sunucuda render ediyorsunuz ve markup'ı tarayıcıya JavaScript'inden önce ulaşıyor. Vite CSS Modules dosyalarını, Vue SFC `<style>` bloklarını ve Svelte stillerini bu JavaScript üzerinden yükler. Bu yüzden tarayıcı bundle çalışana kadar island'ı stilsiz boyar. `@tuvix.js/vite` ile sunucunuz "`src/islands/footer/index.ts` hangi stil dosyalarına ihtiyaç duyuyor?" diye sorar ve bunlar için `<head>` içine `<link>` etiketleri yazar.

Island'larınız yalnızca istemcide render ediliyorsa ya da tüm island'ları zaten kapsayan tek bir global stil dosyası bağlıyorsanız bu paketi kullanmayın.

## Hızlı başlangıç

Eklentiyi istemci build'i ve SSR build'i için kullandığınız Vite config'ine ekleyin:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [tuvix()],
});
```

Sanal modülün tiplerini `tsconfig.json` dosyasına ekleyin:

```json
{
  "compilerOptions": {
    "types": ["vite/client", "@tuvix.js/vite/client"]
  }
}
```

Sunucu entry'nizde asset'leri isteyin ve `<head>` içine yazın:

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

Önce istemciyi, sonra sunucuyu build edin. SSR build'i istemci manifest'ini okur:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?)`

```ts no-check
function tuvix(options?: TuvixViteOptions): Plugin[];
```

Üç Vite eklentisi döndürür:

- `tuvix:assets`, `virtual:tuvix/assets` modülünü sağlar.
- `tuvix:client-build-info` (yalnızca build'lerde) istemci manifest'inin yanına `.vite/tuvix-client.json` dosyasını yazar. Bkz. [Production build'leri](#production-builds).
- `tuvix:dev-css-handoff` (yalnızca dev sunucusunda) stil işini sunucuda render edilen `<link>` etiketinden Vite'ın kendi `<style>` etiketlerine devreder.

Dönen diziyi yukarıdaki gibi `plugins` içine koyun; Vite iç içe eklenti dizilerini düzleştirir.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | İstemci build'inin çıktı klasörü. Vite root'una göre göreli ya da mutlak olabilir. SSR build'i `<clientOutDir>/.vite/manifest.json` dosyasını okur, bulamazsa `<clientOutDir>/manifest.json` dosyasına düşer. |
| `base` | `string` | Sanal modülü yükleyen build'in ya da dev sunucusunun Vite `base` değeri | Tarayıcının istemci asset'lerini yüklediği public base. İstemci sunucu bundle'ından farklı bir base altında sunuluyorsa ayarlayın, örneğin vinxi'deki `/_build`. |

TanStack Start ve vinxi, istemci router'ının build'ini `/_build` altında ayrı bir klasöre yazar:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries)`

`virtual:tuvix/assets` modülünden export edilir.

```ts no-check
function getAssets(entries: string[]): Promise<TuvixAssets>;
```

Island entry modüllerini Vite root'una göre göreli path olarak verin, örneğin `'src/islands/footer/index.ts'`. Fonksiyon baştaki `./` ya da `/` karakterlerini yok sayar. Birden fazla entry verirseniz listeleri entry sırasıyla birleştirir ve tekrarları atar.

`getAssets` bir promise döndürür, çünkü dev sunucusu bir modülün import'larını okuyabilmek için önce onu transform etmek zorundadır. Fonksiyonu yalnızca sunucu kodundan çağırın.

### `renderAssetTags(assets)`

`virtual:tuvix/assets` modülünden export edilir.

```ts no-check
function renderAssetTags(assets: TuvixAssets): string;
```

`assets.css` içindeki her URL için bir `<link rel="stylesheet">` etiketi, ardından `assets.modulepreload` içindeki her URL için bir `<link rel="modulepreload" crossorigin>` etiketi döndürür. `href` değerlerini HTML escape eder. Hem sunucuda hem tarayıcıda çalışır.

`<head>` bölümünüz bir React bileşeniyse listeleri kendiniz render edin:

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

### Tipler

| Tip | Nereden export edilir | Anlamı |
| --- | --- | --- |
| `TuvixViteOptions` | `@tuvix.js/vite` | `tuvix()` seçenekleri: `clientOutDir?`, `base?`. |
| `TuvixAssets` | `@tuvix.js/vite`, `virtual:tuvix/assets` | `{ css: string[]; modulepreload: string[] }`. `css` cascade sırasındadır. `modulepreload` dev ortamında boştur. |
| `@tuvix.js/vite/client` | tip entry'si | `virtual:tuvix/assets` modülünü tanımlar. `compilerOptions.types` içine ekleyin ya da `/// <reference types="@tuvix.js/vite/client" />` ile referans verin. |

## Production build'leri {#production-builds}

- İstemci build'inde eklenti `build.manifest` seçeneğini açar. `build.manifest` değerini kendiniz ayarladıysanız dokunmaz.
- İstemci build'i manifest'in yanına `{ modules, sharedCss }` yapısında bir `.vite/tuvix-client.json` dosyası da yazar. `modules` her entry'yi ve `import()` hedefini, Vite root'una göre göreli path'iyle, Rollup'ın onu koyduğu chunk'a eşler. `sharedCss`, `build.cssCodeSplit: false` kullanan bir build'in tek stil dosyasını listeler.
- SSR build'inde istemci manifest'ini ve `tuvix-client.json` dosyasını okur. Manifest'te entry (`isEntry`) ya da dinamik entry (`isDynamicEntry`) olan her anahtardan URL'lerine giden bir map'i koda gömer.
- Rollup bazen iki dinamik entry'yi tek bir chunk'ta birleştirir. Örneğin bir sayfayı ve bir adaptörün `import()` ile yüklediği bir framework runtime'ını. Vite'ın manifest'i o chunk'ı `_Page-<hash>.js` anahtarıyla kaydeder ve iki kaynağı da listelemez. Eklenti chunk'ı `tuvix-client.json` içindeki `modules` üzerinden bulur.
- `build.cssCodeSplit: false` ile Vite tüm CSS'i, hiçbir manifest chunk'ının listelemediği tek bir `style-<hash>.css` dosyasına yazar. `getAssets` bu dosyayı her entry için, entry'nin kendi CSS'inden önce döndürür.
- `tuvix-client.json` yoksa (istemci `tuvix()` olmadan build edildiyse) yalnızca kendi manifest anahtarı olan modüller çözülür. Hiçbir chunk'ın listelemediği bir `style.css` manifest asset'i yine `cssCodeSplit: false` build'inin tek stil dosyası sayılır.
- Her entry için entry chunk'ını ve onun statik olarak, transitif şekilde import ettiği tüm chunk'ları, CSS'leriyle birlikte toplar. Import edilen chunk'ların CSS'i entry'nin kendi CSS'inden önce gelir. Vite da onları bu sırayla yükler.
- `modulepreload` entry chunk'ını ve statik import'larını listeler. URL'ler `base + file` şeklindedir.
- Map, `import()` hedeflerini atlar, çünkü Vite bu chunk'ları ve CSS'lerini ancak import çalıştığında yükler. Lazy yüklenen bir modül sunucuda render ediliyorsa path'ini `getAssets` fonksiyonuna ayrı bir entry olarak verin.
- Tarayıcı daha sonra island chunk'ını yüklediğinde Vite'ın preload helper'ı sunucunuzun yazdığı `<link>` etiketini bulur ve ikinci bir tane eklemez.

## Dev sunucusu

- `getAssets` dev sunucusunun istemci modül grafiğini her entry'den başlayarak statik import'lar boyunca, import sırasıyla dolaşır. `/src/islands/footer/footer.module.css?direct` gibi URL'ler döndürür; Vite `?direct` isteklerine düz CSS ile yanıt verir. Vue blokları `/src/App.vue?direct&vue&type=style&index=0&...&lang.css` şeklinde gelir.
- Island'ın sanal bir modül üzerinden ulaştığı CSS de toplanır. `\0virtual:theme.css` gibi sanal bir stil dosyası `/@id/__x00__virtual:theme.css?direct` şeklinde gelir. Bu yüzden onu sağlayan eklenti query taşıyan id'leri de yükleyebilmelidir.
- Island'ın JavaScript'i çalıştıktan sonra Vite her CSS modülü için kendi `<style>` etiketini ekler. Ardından `tuvix:dev-css-handoff` eklentisi aynı href'e sahip, sunucuda render edilmiş `<link>` için `link.sheet.disabled = true` ayarlar. Böylece kuralların eski bir kopyası HMR düzenlemelerinizi ezemez. `<link>` elemanı DOM'da kalır, bu yüzden hydrate edilmiş bir React `<head>` herhangi bir değişiklik görmez.
- CSS düzenlendiğinde `tuvix:dev-css-handoff`, `?direct` stil dosyasını HMR güncellemesinin dışında bırakır. Vite de kendi `<style>` etiketini sayfayı yeniden yüklemeden ve `<link>` etiketini değiştirmeden günceller. İki sınır vardır:
  - CSS Modules düzenlemesi hash'li sınıf adlarını değiştirir. Bu yüzden island'ı kendi HMR mekanizmasının (React Fast Refresh, Vue) yeniden render etmesi gerekir.
  - JavaScript'ini sayfanın henüz yüklemediği bir island, siz sayfayı yenileyene kadar sunucudaki stil dosyasıyla kalır.
- `modulepreload` dev ortamında her zaman boştur.
- `getAssets` aynı Node sürecindeki dev sunucusuyla konuşur. `ssrLoadModule` ve Vite'ın varsayılan module runner'ı ile çalışır, `server.restart()` sonrasında da çalışmaya devam eder.

## Sınır durumlar

- Ne build input'u ne de istemci build'inde bir `import()` hedefi olan bir entry `[tuvix] "<key>" is not an entry or a dynamically imported module in <manifest>` hatasıyla reject olur. Island'ı `build.rollupOptions.input` içine ekleyin ya da istemci kodundan `import()` ile yükleyin.
- İstemci manifest'i yoksa SSR build'i `[tuvix] No client manifest in <dir>` hatasıyla başarısız olur. Önce istemciyi build edin ya da `clientOutDir` değerini düzeltin.
- Dev ortamında SSR kodunuz başka bir süreçte ya da bir worker runtime'ında çalışıyorsa veya dev sunucusu kapandıysa `getAssets` `found no running Vite dev server with the tuvix() plugin in this process` hatasıyla reject olur.
- `virtual:tuvix/assets` modülünün tarayıcı build'inde `getAssets` `runs during server rendering only` hatasıyla reject olur. İstemci bundle'ı kendi manifest'ini bilemez.
- Dev ortamında modül grafiğini dolaşan kod `/node_modules/` altındaki modüllere inmez. Kendi kodunuzun bir paketten import ettiği stil dosyası toplanır; bir paketin kendi JavaScript'inden import ettiği stil dosyası toplanmaz.
- `'./'` gibi göreli bir `base` göreli URL'ler üretir ve bunlar iç içe route'larda bozulur. Mutlak bir base kullanın.
- Svelte: `vite-plugin-svelte` eklentisinin varsayılanı olan `emitCss: true` ayarını koruyun. `compilerOptions.css: 'injected'` ile stiller JavaScript'in içinde yaşar ve eklenti bağlanacak bir stil dosyası bulamaz.

## Ne yapmaz

- HTML'inize etiket yazmaz. `renderAssetTags` çıktısının nereye gideceğine siz karar verirsiniz.
- `import()` zincirlerini takip etmez. Sunucuda render edilen lazy modülleri ayrı entry'ler olarak verin.
- Özel manifest dosya adını (`build.manifest: 'name.json'`) desteklemez. `true` kullanın.
- Island'ları render etmez, hydrate da etmez. Onu [`@tuvix.js/react`](/tr/packages/react) (`TuvixIsland`), [`@tuvix.js/vue`](/tr/packages/vue) ya da [`@tuvix.js/svelte`](/tr/packages/svelte) gibi bir adaptörle birlikte kullanın.
