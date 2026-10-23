# Vue ile

`@tuvix.js/vue` bir Vue 3 kök bileşenini mikro uygulamaya dönüştürür, sunucuda render edilmiş markup'ı hydrate eder ve sunucuda bileşenleri HTML'e render eder.

## Kurulum

```bash
pnpm add @tuvix.js/vue vue
# for renderVueToString on the server
pnpm add @vue/server-renderer
```

## Bileşeni mikro uygulamaya dönüştürme

```ts
// src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import { createPinia } from 'pinia';
import { analytics } from './analytics-plugin';
import App from './App.vue';

export default createVueMicroApp({
  name: 'settings',
  App,
  plugins: [createPinia(), [analytics, { id: 'G-123' }]],
});
```

| Seçenek | Tip | Açıklama |
| --- | --- | --- |
| `name` | `string` | Zorunlu. Kayıtlı uygulama adıyla aynı olmalı. |
| `App` | `Component` | Zorunlu. Kök bileşen. |
| `plugins` | `Array<Plugin \| [Plugin, ...options]>` | Her mount'ta `app.use(plugin, ...options)` ile kurulur. |
| `bootstrap` | `() => void \| Promise<void>` | İlk mount'tan önce bir kez çalışır. |
| `ssr` | `boolean` | Sunucu markup'ını hydrate eder. `createSsrVueMicroApp` bunu açar. |

Her container kendi Vue uygulamasını alır, bu yüzden her mount her plugin'in `install` fonksiyonunu yeniden çalıştırır. `createPinia()` gibi bir plugin instance'ını modülün tüm mount'ları paylaşır. Her mount'un kendi store'u olması gerekiyorsa instance'ı bir plugin fonksiyonunun içinde oluşturun.

Bu uygulamayı zaten barındıran bir container'a mount ettiğinizde adaptör önce eski instance'ı unmount eder. `unmount` uygulamayı yok eder, container'ı boşaltır ve `tuvix:unmounted` olayını tetikler.

## Props

Adaptör props'ları kök bileşene geçirir, ayrıca alt bileşenlerin hepsi erişebilsin diye bunları `'tuvixProps'` (`TUVIX_PROPS_KEY`) anahtarıyla provide eder:

```vue
<!-- App.vue -->
<script setup lang="ts">
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

defineProps<{ userId: string; theme?: 'light' | 'dark' }>();

const all = inject<Record<string, unknown>>(TUVIX_PROPS_KEY);
</script>

<template>
  <div :class="theme">User {{ userId }} ({{ Object.keys(all ?? {}).length }} props)</div>
</template>
```

`update({ props })` props'ları bir `shallowReactive` nesnesinde değiştirir ve Vue'nun bir sonraki tick'ini bekler. Kök bileşen yeni değerlerle yeniden render edilir ve yerel state'ini korur. Yeni props'ta olmayan anahtarlar silinir. `container` verilmezse `update` modülün tüm mount'larını günceller.

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## Sunucuda render ve hydration

Sunucuda `renderVueToString` ile render edin, istemcide `createSsrVueMicroApp` ile hydrate edin:

```ts
// server-only module
import { renderVueToString } from '@tuvix.js/vue/server';
import Newsletter from './Newsletter.vue';

export async function renderNewsletter(list: string): Promise<string> {
  const ssrContext: { teleports?: Record<string, string> } = {};
  const html = await renderVueToString(Newsletter, { list }, [], ssrContext);
  return html; // ssrContext.teleports holds <Teleport> output
}
```

```ts
// client
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

export const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });
```

- `renderVueToString(App, props?, plugins?, ssrContext?)` `App` bileşenini istemcinin kullandığı kökle sarar. Böylece `inject('tuvixProps')` sunucuda da çalışır ve hydration eşleşir.
- Bu fonksiyonu yalnızca sunucu kodundan çağırın: bir server function, bir API route'u ya da sunucu entry'niz. Tarayıcıda `''` döndürür. İzomorfik bir route loader tarayıcıda da çalışır, bundler da bu yüzden Vue'nun sunucu renderer'ını istemciye taşır.
- `ssr: true` açıkken container'da sunucu markup'ı varsa adaptör `createSSRApp` çağırır ve sunucunun DOM düğümlerini korur. Boş bir container sıfırdan bir `createApp` render'ı alır.
- HTML'de CSS yoktur. Vite, SFC `<style>` bloklarını hydration başladıktan sonra JavaScript'ten enjekte eder. Stil dosyalarını `@tuvix.js/vite` ile `<head>` içine bağlayın; ayrıntılar [SSR island'ları](/tr/guide/ssr-islands) sayfasında.

React host içinde modülü `TuvixIsland` ile mount edin.

## Composable'lar

### useTuvixBus

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/vue';

const count = ref(0);
useTuvixBus<{ itemCount: number }>(getGlobalBus(), 'cart:updated', ({ itemCount }) => {
  count.value = itemCount;
});
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>
```

`onMounted` içinde abone olur, `onUnmounted` içinde aboneliği bırakır ve erken temizlik için bir fonksiyon döndürür.

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` bir `ShallowRef` döndürür ve `updateEvent` üzerinde yayınlanan her payload'u buna birleştirir. Tuvix.js bu olayı hiçbir yerde yayınlamaz. Adaptörle birlikte `updateAppProps` üzerinden gelen props zaten bileşeni yeniden render ettiği için buna nadiren ihtiyaç duyarsınız.

## Sınır durumlar

- `~/utils` gibi path alias'ları `.vue` dosyalarında da çözülmelidir. Alias'ınız `vite-tsconfig-paths` üzerinden geliyorsa o tsconfig'in `include` listesine `**/*.vue` ekleyin ya da Vite yapılandırmasında `resolve.alias` tanımlayın. Bkz. [Sorun giderme](/tr/guide/troubleshooting).
- Mount sırasında setup, render veya lifecycle hook'unda hata oluşursa production build'lerde de `mount` reject olur ve `tuvix:error` olayı tetiklenir. Bir plugin'in kendi `app.config.errorHandler` fonksiyonu yine çalışır.
- Bu modülün hiç mount etmediği bir container'da `unmount` hiçbir şey yapmaz.

## API

| Export | Amaç |
| --- | --- |
| `createVueMicroApp({ name, App, plugins?, bootstrap?, ssr? })` | Vue mikro uygulama modülü |
| `createSsrVueMicroApp({ name, App, plugins?, bootstrap? })` | `ssr: true` ile aynısı |
| `TUVIX_PROPS_KEY` | Reaktif props için injection anahtarı (`'tuvixProps'`) |
| `useTuvixBus(bus, event, handler)` | Bileşene bağlı event bus aboneliği |
| `useTuvixProps(initial, bus?, event?)` | Bus olaylarından birleştirilen `ShallowRef` |
| `@tuvix.js/vue/server` paketinden `renderVueToString(App, props?, plugins?, ssrContext?)` | Sunucu HTML'i |
