# Svelte ile

`@tuvix.js/svelte` bir Svelte bileşenini mikro uygulamaya dönüştürür. Svelte 5 ve Svelte 3/4'ü destekler, sunucu markup'ını hydrate eder ve sunucuda bileşenleri HTML'e render eder.

## Kurulum

```bash
pnpm add @tuvix.js/svelte svelte
```

## Bileşeni mikro uygulamaya dönüştürme

```ts
// src/main.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

// SvelteMap (Svelte 5 only) lets update() re-render in place; drop it for Svelte 3/4.
export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

Adaptör ilk mount'ta `svelte` paketini import eder ve hangi API'nin bulunduğuna bakar:

| Svelte | Mount | Hydrate | Update | Unmount |
| --- | --- | --- | --- | --- |
| 5 | `mount(App, { target, props })` | `hydrate(...)` | `SvelteMap` varsa yerinde, yoksa yeniden mount | `unmount(instance)` |
| 3 / 4 | `new App({ target, props })` | `new App({ hydrate: true })` | `instance.$set(props)` | `instance.$destroy()` |

Bundler'ınız `svelte` paketini tarayıcı build'ine çözmelidir. Sunucu build'ini seçerse Svelte 5'te `mount()` çağrısı `lifecycle_function_unavailable` hatası fırlatır ya da `onMount` callback'leri hiç çalışmaz. Bkz. [Sorun giderme](/tr/guide/troubleshooting).

Her container kendi bileşen instance'ını alır. `mount`, `onMount` callback'leri ve effect'ler çalıştıktan sonra `tuvix:mounted` olayını tetikler. `ssr` kapalıyken `mount` render etmeden önce container'ı boşaltır. Bu modülün hiç mount etmediği ya da mount'u başarısız olmuş bir container'da `unmount` hiçbir şey yapmaz.

## Props

Rune'larla Svelte 5:

```svelte
<!-- Profile.svelte -->
<script lang="ts">
  let { userId, theme = 'light' }: { userId: string; theme?: string } = $props();
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 3/4 ya da legacy moddaki Svelte 5:

```svelte
<script lang="ts">
  export let userId: string;
  export let theme = 'light';
</script>

<div class="theme-{theme}">User {userId}</div>
```

Svelte 5'te yapılandırmaya `svelte/reactivity` modülünden `SvelteMap` geçirin. Adaptör de bileşene `SvelteMap` destekli bir props nesnesi verir ve `update({ props })` yeni değerleri bu nesneye yazar: yalnızca değişen prop'u okuyan kısımlar yeniden render edilir, DOM düğümleri ve bileşen state'i korunur. Bu hem `$props()` hem de `export let` için çalışır. `SvelteMap` olmadan Svelte 5'te `update()` instance'ı unmount eder, yeni props ile yeni bir instance mount eder ve `tuvix:mounted` olayını yeniden tetikler; yerel state sıfırlanır. Adaptör `svelte/reactivity` modülünü kendisi import etmez, çünkü bu modül Svelte 3/4'te yoktur ve onların build'leri kırılırdı.

Svelte 3/4'te `update`, `$set` çağırır ve `SvelteMap` değerini yok sayar.

Her güncelleme prop kümesinin tamamını değiştirir. Yeni props'ta olmayan bir anahtar Svelte 5'te prop'un varsayılan değerine döner, Svelte 3/4'te `undefined` olur. Orchestrator her zaman birleştirilmiş props'u gönderir, bu yüzden bu yalnızca `update` fonksiyonunu kendiniz çağırdığınızda önemlidir.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'dark' });
```

## Sunucuda render ve hydration

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

- `renderSvelteToString(App, props?, { render? })` önce bileşenin `<style>` etiketlerini, ardından markup'ını döndürür. Sunucu kodundan çağırın; tarayıcıda `''` döndürür.
- Sunucu bundle'ınız Svelte'i içeriyorsa (Nitro, Vinxi, `noExternal` ile bir Vite SSR build'i) `svelte/server` modülünden `render` fonksiyonunu geçirin. Geçirmezseniz adaptör `svelte/server` modülünü çalışma zamanında import eder. Bu, Svelte'in ikinci bir kopyasını yükleyebilir ve Svelte'in sunucu renderer'ı kopyalar arasında çalışmaz.
- `<svelte:head>` çıktısına ihtiyacınız varsa `renderSvelte(App, props?, { render? })` size `{ html, head, css }` döndürür. `head` içeriğini doküman `<head>` bölümüne kendiniz koyun; island `<title>` veya `<meta>` içermemelidir.
- `createSsrSvelteMicroApp`, container eleman ya da boşluk dışı metin içeriyorsa hydrate eder, yoksa sıfırdan render eder. Svelte 3/4 bileşenleri `hydratable: true` ile derlenmelidir.

### İlk boyamada CSS

Birini seçin:

- **CSS HTML'in içinde.** `compilerOptions: { css: 'injected' }` ile derleyin. Svelte 5 bileşen CSS'ini sunucu çıktısına koyar, `renderSvelteToString` de bunu island'ın içine `<style>` etiketleri halinde ekler.
- **CSS dosya olarak.** Varsayılan `emitCss: true` ayarını koruyun ve island'ın stil dosyalarını `@tuvix.js/vite` ile `<head>` içine bağlayın. Bkz. [SSR island'ları](/tr/guide/ssr-islands).

`css: 'injected'` ile stil dosyası oluşmaz, bu yüzden `@tuvix.js/vite` bağlayacak bir şey bulamaz. İkisini birlikte kullanmayın.

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

## Adaptörün yapmadıkları

- `.svelte` dosyalarını derlemez; bunu `@sveltejs/vite-plugin-svelte` yapar.
- Yalnızca props geçirir. Slot'lar, snippet'ler ve bileşen olayları host'tan geçmez.
- Bundler'ınızın hangi Svelte build'ini seçtiğini denetlemez.

## API

| Export | Amaç |
| --- | --- |
| `createSvelteMicroApp({ name, App, bootstrap?, ssr?, SvelteMap? })` | Svelte mikro uygulama modülü |
| `createSsrSvelteMicroApp({ name, App, bootstrap?, SvelteMap? })` | `ssr: true` ile aynısı |
| `@tuvix.js/svelte/server` paketinden `renderSvelteToString(App, props?, options?)` | Stiller + markup |
| `@tuvix.js/svelte/server` paketinden `renderSvelte(App, props?, options?)` | `{ html, head, css }` |
