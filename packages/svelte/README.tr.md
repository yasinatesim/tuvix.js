# @tuvix.js/svelte

> Tuvix.js mikro frontend framework'ü için Svelte 3/4/5 bağlamaları

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır.

## Kurulum

```bash
npm install @tuvix.js/svelte svelte
# or pnpm add @tuvix.js/svelte svelte
```

## Hızlı başlangıç

```ts
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App });
```

Adaptör modülü `@tuvix.js/loader` paketindeki `registerModule` fonksiyonuyla kaydeder. Böylece orchestrator onu adıyla bulur. İlk mount'ta `svelte` paketini import eder ve bir `mount` export'u olup olmadığına bakar:

- **Svelte 5**: `svelte` paketinden `mount()` / `hydrate()` / `unmount()`.
- **Svelte 3/4**: `new App({ target, props })`, `$set()` ve `$destroy()`.

Bundler'ınız `svelte` paketini istemci build'ine çözümlemelidir (`browser` export koşulu; `@sveltejs/vite-plugin-svelte` bunu ayarlar). Sunucu build'ini seçerse Svelte 5 `mount()` fonksiyonu `lifecycle_function_unavailable` hatası fırlatır.

## API

### `createSvelteMicroApp(config)`

| Seçenek | Tür | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | `registerModule` ile kaydedilen uygulama adı |
| `App` | `unknown` | zorunlu | Svelte 5 bileşeni veya Svelte 3/4 bileşen sınıfı |
| `bootstrap` | `() => void \| Promise<void>` | yok | Tek seferlik kurulum |
| `ssr` | `boolean` | `false` | Container sunucu markup'ı içeriyorsa onu hydrate eder |
| `SvelteMap` | `SvelteMap` sınıfı | yok | Yalnızca Svelte 5: `svelte/reactivity` içinden `SvelteMap`. Böylece `update()` yeniden mount etmek yerine yerinde yeniden render eder |

- Her container kendi instance'ını alır. Bu sayede tek bir modül birden fazla container'a mount edilebilir.
- `mount` container'ı temizler (hydrate etmiyorsa), render eder ve `onMount` callback'leri ile effect'ler çalıştıktan sonra `tuvix:mounted` olayını tetikler. Başarısız bir mount `tuvix:error` olayını tetikler ve reject olur.
- `unmount` instance'ı yok eder, container'ı boşaltır ve `tuvix:unmounted` olayını tetikler. `mount` hâlâ yüklenirken çağrılırsa mount'u bekler, ardından onu kaldırır.
- `update({ props, container? })` tek bir container'ı, `container` verilmezse tüm instance'ları günceller. Svelte 3/4 `$set()` kullanır. Svelte 5 varsayılan olarak yeniden mount eder: instance'ı unmount eder, yeni props'larla yenisini mount eder ve `tuvix:mounted` olayını yeniden tetikler. Bu yüzden DOM node'ları ve bileşen state'i kaybolur. Bunun yerine yerinde güncellemek için `SvelteMap` verin (`$props()` ve `export let` ile çalışır):

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({ name: 'profile', App, SvelteMap });
```

Adaptör `svelte/reactivity` modülünü kendisi import etmez: Svelte 3/4'te böyle bir modül yoktur ve bu import Svelte 3/4 uygulamalarının build'ini bozar.

Host yeni props'ları orchestrator üzerinden gönderir:

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

`createSvelteMicroApp({ ...config, ssr: true })` ile aynıdır. Container eleman veya boşluk dışı metin içeriyorsa hydrate eder, aksi halde sıfırdan render eder. Svelte 5 hydration'ı, `svelte/server` modülünün yazdığı yorum işaretlerine ihtiyaç duyar. Svelte 3/4 bileşenlerini `hydratable: true` ile derleyin.

```ts
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Footer from './Footer.svelte';

export default createSsrSvelteMicroApp({ name: 'footer', App: Footer });
```

### `@tuvix.js/svelte/server` içinden `renderSvelteToString(App, props?, options?)`

| Seçenek | Tür | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `render` | `SvelteServerRender` | yok | `svelte/server` içindeki `render`; verilmezse adaptör `svelte/server` modülünü çalışma anında import eder |

Bileşenin `<style>` etiketlerini ve ardından markup'ını döndürür. `render` verildiğinde her zaman Svelte 5 `render` fonksiyonunu kullanır. Verilmezse adaptör `svelte` paketini import eder: bu modül `mount` export ediyorsa `svelte/server` modülünü yükler (Svelte 5), etmiyorsa `App.render(props)` çağırır (Svelte 3/4) ve `css.code` değerini `<style>` içine sarar. `dev: true` ile derlenmiş Svelte 5 bileşenleri (serve modundaki vite-plugin-svelte) hata fırlatan bir `App.render` taşır. Bu yüzden adaptör kararını hiçbir zaman `App.render` üzerinden vermez. Bir sunucu fonksiyonundan çağırın; tarayıcıda `''` döndürür.

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

### `@tuvix.js/svelte/server` içinden `renderSvelte(App, props?, options?)`

Seçenekler aynıdır. `{ html, head, css }` döndürür, böylece `<svelte:head>` içeriğini belgenin head bölümüne koyabilirsiniz.

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

### Tipler

`SvelteMicroAppConfig`, `SvelteProps` (`@tuvix.js/svelte` paketinden); `RenderSvelteOptions`, `SvelteServerRender`, `SvelteRenderResult` (`@tuvix.js/svelte/server` paketinden).

## Sınır durumlar

- Svelte 5, sunucu çıktısına CSS'i yalnızca `css: 'injected'` ile derlediğinizde ekler (Vite: `svelte({ compilerOptions: { css: 'injected' } })`). Varsayılan `css: 'external'` ile CSS'i bundler'ınız bir dosyaya yazar.
- Sunucu bundle'ınız Svelte'i içeriyorsa (Nitro, Vinxi, `noExternal` bir Vite SSR build'i) `svelte/server` içindeki `render` fonksiyonunu verin. Bileşen ve renderer iki ayrı Svelte kopyasından gelirse Svelte'in sunucu renderer'ı başarısız olur.
- Her güncelleme props kümesinin tamamını değiştirir. Yeni props'larda olmayan bir anahtar Svelte 5'te silinir (varsayılan değer geçerli olur), Svelte 3/4'te `undefined` yapılır.
- Mount edilmiş bir container üzerinde `mount` önce eski instance'ı unmount eder. Modülün hiç mount etmediği bir container üzerinde `unmount` hiçbir şey yapmaz: container'ın çocuk elemanlarını yerinde bırakır ve olay tetiklemez.
- Sunucudaki bir Svelte 5 import veya render hatası reject olur; `App.render` fallback'i yoktur.

## Ne yapmaz

- `.svelte` dosyalarını derlemez ve bundler'ınızın hangi Svelte build'ini seçtiğini kontrol etmez.
- Yalnızca props geçirir: host'tan slot, snippet veya bileşen olayı geçirmez.
- `<svelte:head>` içeriğini belgeye yazmaz ve `css: 'external'` stil dosyalarını linklemez.

Dokümantasyonun tamamı: [tuvix.js.org/tr/packages/svelte](https://tuvix.js.org/tr/packages/svelte)

## Lisans

MIT
