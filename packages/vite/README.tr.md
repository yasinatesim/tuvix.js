# @tuvix.js/vite

> Island CSS'ini ve modulepreload link'lerini sunucuda render edilmiş `<head>` içine ekleyen Vite eklentisi

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır. Dokümantasyonun tamamı: [tuvix.js.org/tr/packages/vite](https://tuvix.js.org/tr/packages/vite).

Bir mikro uygulama island'ını sunucuda render ettiğinizde markup tarayıcıya JavaScript'ten önce ulaşır. Vite island'ın CSS'ini (CSS Modules, Vue SFC `<style>`, Svelte stilleri) bu JavaScript'in içinde gönderir, bu yüzden ilk boyamada markup stilsiz görünür. Bu eklenti sunucunuza her island'ın hangi stil dosyalarına ihtiyaç duyduğunu söyler, siz de bunları `<head>` içinde bağlarsınız.

Island'ları Vite ile sunucuda render ediyorsanız kullanın. Island'larınız yalnızca istemcide render ediliyorsa kullanmayın.

## Kurulum

```bash
npm install -D @tuvix.js/vite
# or pnpm add -D @tuvix.js/vite
```

Vite 6 ya da 7 gerekir. Test paketi Vite 6 üzerinde çalışır.

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

Önce istemciyi, sonra sunucuyu build edin:

```bash
vite build --outDir dist/client
vite build --ssr src/entry-server.ts --outDir dist/server
```

## API

### `tuvix(options?: TuvixViteOptions): Plugin[]`

Üç eklenti döndürür: `tuvix:assets` (`virtual:tuvix/assets` modülünü sağlar), `tuvix:client-build-info` (yalnızca build'lerde; istemci build'inde `.vite/tuvix-client.json` dosyasını yazar) ve `tuvix:dev-css-handoff` (yalnızca dev sunucusunda).

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `clientOutDir` | `string` | `'dist/client'` | İstemci build'inin çıktı klasörü. Vite root'una göre göreli ya da mutlak olabilir. SSR build'i `<clientOutDir>/.vite/manifest.json` dosyasını, ardından `<clientOutDir>/manifest.json` dosyasını okur. |
| `base` | `string` | Vite `base` | Tarayıcının istemci asset'lerini yüklediği public base. İstemci sunucu bundle'ından farklı bir base altında sunuluyorsa ayarlayın. |

TanStack Start ya da vinxi için eklentiye istemci router'ının çıktı klasörünü ve base değerini verin:

```ts
import { tuvix } from '@tuvix.js/vite';

export const islandAssets = tuvix({ clientOutDir: '.vinxi/build/client/_build', base: '/_build' });
```

### `getAssets(entries: string[]): Promise<TuvixAssets>`

`virtual:tuvix/assets` modülünden gelir. Island entry modüllerini Vite root'una göre göreli path olarak verin, örneğin `'src/islands/footer/index.ts'`. Baştaki `./` ya da `/` yok sayılır. Birden fazla entry verirseniz `getAssets` listeleri entry sırasıyla birleştirir ve tekrarları atar. Yalnızca sunucuda çalışır.

### `renderAssetTags(assets: TuvixAssets): string`

`virtual:tuvix/assets` modülünden gelir. Önce `css` için `<link rel="stylesheet">` etiketlerini, sonra `modulepreload` için `<link rel="modulepreload" crossorigin>` etiketlerini döndürür. Attribute değerlerini escape eder, hem sunucuda hem tarayıcıda çalışır.

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

| Tip | Anlamı |
| --- | --- |
| `TuvixViteOptions` | `tuvix()` seçenekleri. |
| `TuvixAssets` | `{ css: string[]; modulepreload: string[] }`. `css` cascade sırasındadır; `modulepreload` dev ortamında boştur. |

## Production build'leri

- Eklenti istemci build'inde `build.manifest` seçeneğini açar. `build.manifest` değerini kendiniz ayarladıysanız dokunmaz.
- SSR build'inde istemci manifest'ini okur ve her entry ile dinamik entry'den URL'lerine giden bir map'i koda gömer.
- İstemci build'i manifest'in yanına `.vite/tuvix-client.json` dosyasını da yazar. Bu dosya her entry'yi ve `import()` hedefini, Rollup'ın onu koyduğu chunk'a eşler. Rollup bazen iki dinamik entry'yi tek chunk'ta birleştirir, örneğin bir sayfayı ve bir adaptörün `import()` ile yüklediği bir framework runtime'ını. Vite'ın manifest'i o chunk'ı `_Page-<hash>.js` anahtarıyla kaydeder ve iki kaynağı da listelemez; eklenti chunk'ı `tuvix-client.json` dosyasıyla bulur. Bu dosya yoksa (istemci `tuvix()` olmadan build edildiyse) yalnızca kendi manifest anahtarı olan modüller çözülür.
- `build.cssCodeSplit: false` ile Vite tüm CSS'i, hiçbir manifest chunk'ının listelemediği tek bir `style-<hash>.css` dosyasına yazar. `getAssets` bu dosyayı her entry için döndürür.
- Eklenti her entry için entry chunk'ını ve onun statik olarak import ettiği her chunk'ı CSS'leriyle birlikte toplar. Import edilen chunk'ların CSS'i entry'nin kendi CSS'inden önce gelir; Vite da onları bu sırayla yükler.
- `import()` hedeflerini atlar, çünkü Vite bu chunk'ları ve CSS'lerini ancak import çalıştığında yükler. Lazy bir modül sunucuda render ediliyorsa onun path'ini de `getAssets` fonksiyonuna verin.
- URL'ler `base` ile başlar. Tarayıcı daha sonra island chunk'ını yüklediğinde Vite'ın preload helper'ı mevcut `<link>` etiketini bulur ve ikincisini eklemez.

## Dev sunucusu

- `getAssets` dev sunucusunun istemci modül grafiğini her entry'den başlayıp statik import'lar boyunca dolaşır ve `/src/islands/footer/footer.module.css?direct` gibi URL'ler döndürür. Vite `?direct` isteklerine düz CSS ile yanıt verir.
- Island'ın sanal bir modül üzerinden ulaştığı CSS de çalışır. `\0virtual:theme.css` gibi sanal bir stil dosyası `/@id/__x00__virtual:theme.css?direct` şeklinde gelir. Bu yüzden onu sağlayan eklenti query taşıyan id'leri de yükleyebilmelidir.
- Island'ın JavaScript'i çalıştığında Vite her CSS modülü için kendi `<style>` etiketini ekler. Eklenti ardından sunucuda render edilmiş eşleşen `<link>` etiketini `link.sheet.disabled` ile devre dışı bırakır; böylece kuralların eski bir kopyası HMR düzenlemelerinizi ezemez. `<link>` elemanı DOM'da kalır ve hydrate edilmiş bir React `<head>` herhangi bir değişiklik görmez.
- CSS düzenlendiğinde eklenti `?direct` stil dosyasını HMR güncellemesinin dışında bırakır. Vite de kendi `<style>` etiketini sayfayı yeniden yüklemeden ve `<link>` etiketini değiştirmeden günceller. CSS Modules düzenlemesi hash'li sınıf adlarını değiştirir, bu yüzden island'ı kendi HMR mekanizmasının (React Fast Refresh, Vue) yeniden render etmesi gerekir. JavaScript'ini sayfanın henüz yüklemediği bir island, siz sayfayı yenileyene kadar sunucudaki stil dosyasıyla kalır.
- `modulepreload` dev ortamında her zaman boştur.

## Sınır durumlar

- Ne build input'u ne de istemci build'inde bir `import()` hedefi olan bir path için `getAssets` reject olur. Island'ı `build.rollupOptions.input` içine ekleyin ya da istemci kodundan `import()` ile yükleyin.
- İstemci manifest'i yoksa SSR build'i `[tuvix] No client manifest in <dir>` hatasıyla başarısız olur.
- Dev ortamında `getAssets` dev sunucusunun aynı Node sürecinde olmasını ister (`ssrLoadModule` ya da Vite'ın varsayılan module runner'ı). SSR kodu başka bir süreçte ya da bir worker runtime'ında çalışıyorsa veya dev sunucusu kapandıysa reject olur. `server.restart()` sonrasında da çalışmaya devam eder.
- `virtual:tuvix/assets` modülünün tarayıcı build'i reject olan bir `getAssets` export eder, çünkü istemci bundle'ı kendi manifest'ini bilemez.
- Dev ortamında modül grafiğini dolaşan kod `/node_modules/` altındaki modüllere inmez. Bu yüzden bir paketin kendi JavaScript'inden import ettiği CSS toplanmaz.
- `'./'` gibi göreli bir `base` göreli URL'ler üretir ve bunlar iç içe route'larda bozulur. Mutlak bir base kullanın.
- Svelte: `vite-plugin-svelte` eklentisinin varsayılanı olan `emitCss: true` ayarını koruyun. `compilerOptions.css: 'injected'` ile stiller JavaScript'in içinde yaşar ve eklenti bağlanacak bir stil dosyası bulamaz.

## Ne yapmaz

- HTML'inize etiket yazmaz. Etiketlerin nereye gideceğini siz seçersiniz.
- `import()` zincirlerini takip etmez.
- Özel manifest dosya adını (`build.manifest: 'name.json'`) desteklemez. `true` kullanın.
- Island'ları render etmez, hydrate da etmez. `@tuvix.js/react` (`TuvixIsland`), `@tuvix.js/vue` ya da `@tuvix.js/svelte` gibi bir adaptör kullanın.

## Lisans

MIT
