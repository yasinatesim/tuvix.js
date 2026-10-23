---
title: '@tuvix.js/svelte'
---

<PackageHeader
  name="@tuvix.js/svelte"
  title="Svelte Entegrasyonu"
  description="Svelte 3, 4 veya 5 bileşenini Tuvix.js mikro uygulamasına dönüştürür: her container için ayrı bir instance, props'un yerinde güncellenmesi, sunucu markup'ının hydrate edilmesi ve CSS ile birlikte sunucuda render."
  icon="🔥"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/svelte svelte
# veya pnpm add @tuvix.js/svelte svelte
```

Peer dependency aralığı Svelte 3, 4 ve 5'i kapsar. Paketin iki entry noktası var: tarayıcı için `@tuvix.js/svelte`, sunucuda render için `@tuvix.js/svelte/server`.

## Ne zaman kullanılır

Bir Svelte bileşeninin Tuvix.js mikro uygulaması olarak çalışması gerektiğinde bu paketi kullanın: orchestrator bileşeni bir route'ta container'a mount eder, props geçirir, bunları günceller ve route değişince unmount eder. Paket island'ları da kapsar: bileşeni sunucuda render edersiniz, HTML'i sayfaya koyarsınız, client da onu hydrate eder.

Baştan sona Svelte'in yönettiği bir sayfa (SvelteKit) için bu pakete ihtiyacınız yok. O durumda Svelte kendini mount eder ve konuşacağı bir orchestrator yoktur.

## Hızlı başlangıç

Props alan bir Svelte 5 bileşeni:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { name, theme = 'light' }: { name: string; theme?: string } = $props();
</script>

<p class={theme}>Hello {name}</p>
```

Mikro uygulama entry'si bileşeni sarar. `SvelteMap` geçirirseniz props güncellemeleri bileşeni yerinde yeniden render eder:

```ts
// profile-app.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

Shell uygulamayı kaydeder ve orchestrator'ı başlatır:

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

// Sonra: bileşen yerinde yeniden render edilir, remount olmaz.
await orchestrator.updateAppProps('profile', { name: 'Grace', theme: 'dark' });
```

Client bundle'ı `svelte` paketini tarayıcı build'ine çözümlemelidir. `@sveltejs/vite-plugin-svelte` bunu sizin yerinize yapar. Kurulumunuz `browser` export koşulunu düşürürse Svelte 5 `mount()` fonksiyonu `lifecycle_function_unavailable` hatası fırlatır ve `onMount` hiç çalışmaz.

## API

### `createSvelteMicroApp`

```ts no-check
function createSvelteMicroApp(config: SvelteMicroAppConfig): MicroAppModule;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Uygulama adı. Adaptör modülü bu adla, `@tuvix.js/loader` paketindeki `registerModule` fonksiyonuyla kaydeder. |
| `App` | `unknown` | zorunlu | Kök bileşen: derlenmiş bir Svelte 5 bileşeni (fonksiyon) ya da bir Svelte 3/4 bileşen sınıfı. |
| `bootstrap` | `() => void \| Promise<void>` | yok | Bir kez çalışan kurulum. Modülün `bootstrap()` fonksiyonu bunu bekler. |
| `ssr` | `boolean` | `false` | Container eleman ya da boşluk dışı metin içeriyorsa sunucu markup'ını hydrate eder. Aksi halde sıfırdan render eder. |
| `SvelteMap` | `svelte/reactivity` modülündeki `SvelteMap` sınıfı | yok | Yalnızca Svelte 5. Verilirse `update()` yerinde yeniden render eder; verilmezse Svelte 5'te `update()` bileşeni remount eder. Svelte 3/4 bu seçeneği yok sayar. |

Adaptör ilk mount'ta `svelte` paketini import eder ve bir `mount` export'u olup olmadığına bakar. Sonucu sayfa boyunca önbellekte tutar.

- **Svelte 5** (`mount` var): `mount()` ile render eder, `hydrate()` ile hydrate eder, `unmount()` ile kaldırır. `update()` fonksiyonunun nasıl çalıştığı `SvelteMap` seçeneğine bağlıdır:
  - `SvelteMap` verildiğinde bileşen, arkasında bir `SvelteMap` duran bir props nesnesi alır. `update()` yeni değerleri bu map'e yazar. Böylece template'in değişen prop'u okuyan kısımları yeniden render edilir, bileşen de DOM düğümlerini ve state'ini korur. Bu, `$props()` kullanan bileşenlerde ve Svelte 5 ile derlenmiş eski `export let` bileşenlerinde çalışır.
  - Verilmediğinde `update()` instance'ı unmount eder, container'ı boşaltır, yeni props ile yeni bir instance mount eder ve `tuvix:mounted` olayını `hydrated: false` ile yeniden tetikler. DOM düğümleri, focus ve bileşen state'i kaybolur.
- **Svelte 3/4** (`mount` yok): `new App({ target, props, hydrate })`, `$set()` ve `$destroy()`.

Dönen modül container bazında çalışır. Her container kendi instance'ını alır, yani tek bir modül aynı anda üç container'a render edebilir.

- `mount({ container, props })` container'ı temizler (hydrate etmiyorsa), render eder, `onMount` callback'lerini ve effect'leri çalıştırır, ardından container üzerinde `hydrated: true | false` ile `tuvix:mounted` olayını tetikler. Hata olursa `tuvix:error` olayını tetikler ve orijinal hatayla reject olur.
- `update({ props, container? })` `container` içindeki instance'ı günceller; `container` vermezseniz tüm instance'ları günceller. Her güncelleme prop kümesinin tamamını değiştirir: yeni props'ta olmayan bir anahtar Svelte 5'te bileşenin varsayılan değerine döner, Svelte 3/4'te `undefined` olur.
- `unmount({ container })` instance'ı yok eder, container'ı boşaltır ve `tuvix:unmounted` olayını tetikler.

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

// Yalnızca sidebar instance'ını günceller.
await cart.update?.({ props: { compact: true }, container: sidebar });
```

### `createSsrSvelteMicroApp`

```ts no-check
function createSsrSvelteMicroApp(config: Omit<SvelteMicroAppConfig, 'ssr'>): MicroAppModule;
```

`createSvelteMicroApp({ ...config, ssr: true })` ile aynıdır. Sunucunun `renderSvelteToString` ya da `renderSvelte` ile render ettiği island'lar için client tarafında kullanın.

- **Svelte 5**: `hydrate(App, { target, props })`. Markup `svelte/server` modülünden gelmelidir, çünkü hydration onun yazdığı yorum işaretlerini (`<!--[-->`) okur.
- **Svelte 3/4**: `new App({ target, props, hydrate: true })`. Bileşeni `hydratable: true` ile derleyin.

Hydration sunucunun DOM düğümlerini korur ve olay dinleyicilerini bunlara bağlar. Yalnızca boşluk ya da yorum içeren bir container sıfırdan render edilir.

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

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | yok | `svelte/server` modülündeki `render`. Verilmezse adaptör `svelte/server` modülünü çalışma anında import eder. |

Bileşeni sunucuda render eder ve önce `<style>` etiketlerini, ardından markup'ı içeren bir string döndürür. Bu string'i island container'ının içine koyun ve `createSsrSvelteMicroApp` ile mount edin. String `<svelte:head>` içeriğini içermez; buna ihtiyacınız varsa `renderSvelte` kullanın.

Fonksiyon Svelte sürümünü çalışma anında seçer. `render` verildiğinde her zaman Svelte 5 yolunu izler ve `render(App, { props })` çağırır. Verilmediğinde adaptör `svelte` paketini import eder: bu modül `mount` export ediyorsa `svelte/server` modülünü yükler ve Svelte 5 ile render eder. Aksi halde `App.render(props)` çağırır (Svelte 3/4, `generate: 'ssr'` ile derlenmiş) ve `css.code` değerini bir `<style>` etiketine sarar. Adaptör bu kararı hiçbir zaman `App.render` varlığına bakarak vermez, çünkü `dev: true` ile derlenen Svelte 5 bileşenleri (serve modundaki vite-plugin-svelte) hata fırlatan bir `App.render` taslağı taşır.

Fonksiyonu tarayıcıda da çalışan koddan değil, bir sunucu fonksiyonundan çağırın. Tarayıcıda `''` döndürür.

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

`renderSvelteToString` ile aynı argümanları ve seçenekleri alır, parçaları ayrı ayrı döndürür:

| Alan | Anlamı |
| --- | --- |
| `html` | Bileşen markup'ı. Svelte 5 çıktısı hydration yorumlarını içerir. |
| `head` | Bileşenin `<style>` etiketleri hariç `<svelte:head>` içeriği. Bunu dokümanın `<head>` kısmına koyun. |
| `css` | `<style>` etiketleri halinde bileşen CSS'i; derleyici CSS üretmediyse `''`. |

Tarayıcıda üç alan da `''` olur.

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

### Tipler

| Tip | Entry | Anlamı |
| --- | --- | --- |
| `SvelteMicroAppConfig` | `@tuvix.js/svelte` | `createSvelteMicroApp` seçenekleri. |
| `SvelteProps` | `@tuvix.js/svelte` | `Record<string, unknown>`: orchestrator'ın bileşene geçirdiği props. |
| `RenderSvelteOptions` | `@tuvix.js/svelte/server` | `{ render?: SvelteServerRender }`. |
| `SvelteServerRender` | `@tuvix.js/svelte/server` | `svelte/server` modülündeki Svelte 5 `render` fonksiyonunun tipi. |
| `SvelteRenderResult` | `@tuvix.js/svelte/server` | `renderSvelte` fonksiyonunun döndürdüğü `{ html, head, css }`. |

## Sunucuda render

Bir island üç adımdan geçer: sunucuda render edilir, HTML container içinde gönderilir, client'ta hydrate edilir.

1. Bir sunucu fonksiyonunda `renderSvelteToString` (ya da `renderSvelte`) çağırın ve sonucu container elemanına koyun.
2. `createSsrSvelteMicroApp({ name, App })` export eden client entry'sini yükleyin.
3. Orchestrator uygulamayı aynı container'a mount eder. Adaptör markup'ı görür ve hydrate eder.

**CSS.** Svelte 5, bileşen CSS'ini render çıktısına yalnızca `css: 'injected'` ile derlediğinizde koyar. Varsayılan `css: 'external'` ayarında bundler'ınız CSS'i bir dosyaya yazar ve string'de hiç `<style>` etiketi olmaz. Vite'ta:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ compilerOptions: { css: 'injected' } })],
});
```

`css: 'external'` ayarını korursanız üretilen stil dosyasını sayfanın head kısmından bağlayın. [`@tuvix.js/vite`](/tr/packages/vite), bir island entry'sinin hangi stil dosyalarına ihtiyaç duyduğunu sunucunuza bildirir.

**Tek Svelte kopyası.** Sunucu bundle'ınız Svelte'i içeriyorsa (Nitro, Vinxi, `noExternal` kullanan bir Vite SSR build'i) `svelte/server` modülündeki `render` fonksiyonunu geçirin. Böylece bileşen ve renderer aynı Svelte kopyasını paylaşır. Bu seçenek olmadan adaptör `svelte/server` modülünü çalışma anında import eder ve bu, `node_modules` içinden ikinci bir kopya yükleyebilir. Svelte'in sunucu renderer'ı `instanceof` kontrolleri kullanır; bileşen ve renderer farklı kopyalardan geldiğinde başarısız olur.

## Sınır durumlar

- Aynı modülün bir instance'ını zaten barındıran container'da `mount` çağrılırsa önce eski instance unmount edilir.
- `mount` hâlâ `svelte` paketini yüklerken çağrılan `unmount`, mount'un bitmesini bekler ve sonra instance'ı yok eder. Geride sahipsiz bir bileşen kalmaz.
- Bu modülün hiç mount etmediği ya da mount'u başarısız olan bir container'da `unmount` hiçbir şey yapmaz: container çocuk elemanlarını korur ve hiçbir olay tetiklenmez.
- Bekleyen bir mount sırasında çağrılan `update` onu bekler, sonra props'u uygular. Başarısız olmuş bir mount için yapılan update hiçbir şey yapmaz.
- Svelte 3/4'te yeni props'ta olmayan bir prop `undefined` olur. `export let name = 'x'` varsayılanı geri gelmez. Svelte 5'te `SvelteMap` olsun ya da olmasın varsayılan değer uygulanır.
- Adaptör `svelte/reactivity` modülünü kendisi import etmez. Svelte 3/4'te böyle bir modül yoktur ve ona referans veren bir Svelte 3/4 uygulamasını bundler build edemez. Bu yüzden import sizin Svelte 5 entry'nizde durur.
- Svelte 5 remount'u (`SvelteMap` olmadan) `tuvix:mounted` olayını yeniden tetikler ama arada `tuvix:unmounted` tetiklemez. Yeni render hata fırlatırsa `update()` bu hatayla reject olur ve eski instance o noktada zaten gitmiştir.
- `ssr` olmadan `mount`, render etmeden önce container'ı temizler; yükleme placeholder'ları kaybolur.
- `ssr` ile adaptör, container'da bir eleman ya da boşluk dışı metin varsa hydrate eder. Yalnızca yorum ve boşluk varsa sıfırdan render eder.
- Adaptör Svelte sürümünü sayfa başına bir kez tespit eder. `import('svelte')` başarısız olursa sonraki mount yeniden dener.
- Sunucuda bir Svelte 5 import ya da render hatası size reject olan bir promise olarak ulaşır. Adaptör `App.render` fallback'ine geçmez.
- Svelte 5 `render` bir promise döndürebilir (async sunucu render'ı). İki sunucu fonksiyonu da bunu bekler.

## Ne yapmaz

- `.svelte` dosyalarını derlemez. Bunu bundler'ınız `@sveltejs/vite-plugin-svelte` ya da `svelte/compiler` ile yapar.
- Bundler'ınızın hangi Svelte build'ini seçtiğini kontrol etmez. `svelte` paketini sunucu build'ine çözümleyen bir client bundle'ı mount sırasında başarısız olur.
- Yalnızca props geçirir. Slot'lar, snippet'ler ve bileşen olayları için host'tan gelen bir kanal yoktur. Uygulamalar arası iletişim için [`@tuvix.js/event-bus`](/tr/packages/event-bus) kullanın.
- `<svelte:head>` içeriğini dokümana yazmaz. `renderSvelte` bunu döndürür; sunucunuz `<head>` içine koyar.
- `css: 'external'` ile derlenmiş CSS'i bağlamaz. Bkz. [`@tuvix.js/vite`](/tr/packages/vite).
- Sunucuda veri beklemez. Veriyi önce yükleyin ve props olarak geçirin.

## 0.4 sürümünden geçiş

- **Svelte 5 çalışıyor.** 0.4'te adaptör her bileşende `new App()` çağırıyordu. Bu yüzden Svelte 5 bileşenleri başarısız oluyor, `createSsrSvelteMicroApp` de hydrate etmek yerine ikinci bir kopya render ediyordu. Mount için kod değişikliği gerekmez. Props'un yerinde güncellenmesi için config'e `svelte/reactivity` modülündeki `SvelteMap` sınıfını geçirin; geçirmezseniz her Svelte 5 güncellemesi bileşeni remount eder.
- **Container mount sırasında temizlenir.** `ssr` olmadan Svelte 3/4, bileşeni container'da zaten bulunan markup'ın arkasına ekliyordu. Artık adaptör önce container'ı boşaltır. Bileşenin yanında markup kalmasına güveniyorsanız o markup'ı container'ın dışına taşıyın.
- **Sunucuda sessiz fallback yok.** `renderSvelteToString`, `svelte/server` yüklenemediğinde `App.render` fallback'ine geçiyordu. Artık `render` verdiğinizde ya da `svelte` paketi `mount` export ettiğinde Svelte 5 yolunu izler, `App.render` fonksiyonunu yalnızca Svelte 3/4'te çağırır ve Svelte 5 import ya da render hatasında reject olur. Vite dev SSR'daki Svelte 5 dev build'leri, bir `App.render` taslağı taşısalar da Svelte 5 yolunu izler.
- **Bilinmeyen container'da `unmount` hiçbir şey yapmaz.** Modülün hiç mount etmediği bir container'da `unmount({ container })` eskiden container'ı boşaltıyordu. Artık React, Vue ve Angular adaptörlerinde olduğu gibi container'a dokunmaz.
- **`render` geçirin.** Sunucu bundle'ınız Svelte'i içeriyorsa `svelte/server` modülündeki `{ render }` değerini üçüncü argüman olarak ekleyin:

```ts
import { render } from 'svelte/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import Footer from './Footer.svelte';

// 0.4: await renderSvelteToString(Footer, { year: 2026 });
const html = await renderSvelteToString(Footer, { year: 2026 }, { render });
```

Eksiksiz bir uygulama için [Svelte rehberine](/tr/guide/svelte) bakın.
