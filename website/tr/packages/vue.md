---
title: '@tuvix.js/vue'
---

<PackageHeader
  name="@tuvix.js/vue"
  title="Vue Entegrasyonu"
  description="Bir Vue 3 bileşenini reaktif props, container başına bir Vue uygulaması ve SSR hydration desteğiyle Tuvix.js mikro uygulamasına dönüştürün. Sunucuda renderVueToString ile render edin."
  icon="💚"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

Sunucuda render için opsiyonel bir peer dependency olan Vue server renderer paketini de kurun:

```bash
npm install @vue/server-renderer
# or pnpm add @vue/server-renderer
```

Paket Vue 3 ister (peer aralığı `>=3.0.0`). `@tuvix.js/loader` ve `@tuvix.js/event-bus` paketlerine bağımlıdır.

## Ne zaman kullanılır

Tuvix shell'inizdeki mikro uygulamalardan biri Vue 3 uygulamasıysa `@tuvix.js/vue` kullanın. `createVueMicroApp`, kök bileşeni orchestrator ile loader'ın çağırdığı `{ bootstrap, mount, unmount, update }` modülüne sarar. Ardından orchestrator onu bir container'a mount eder, `updateAppProps` ile yeni props gönderir ve route değiştiğinde unmount eder.

Vue uygulamasının SEO için ya da JavaScript çalışmadan önce boş bir alan kalmasın diye ilk HTML yanıtında görünmesi gerekiyorsa sunucuda render ekleyin. HTML'i bir sunucu fonksiyonunda `@tuvix.js/vue/server` paketinden `renderVueToString` ile render edin, container'a koyun ve `createSsrVueMicroApp` ile hydrate edin. Host sayfa React ise bu HTML'i [`TuvixIsland`](/tr/packages/react#tuvixisland) bileşenine verin.

Sayfanın tamamı tek bir Vue uygulamasıysa bu pakete ihtiyacınız yok; Vue'nun kendi `createApp` fonksiyonunu ya da Nuxt kullanın.

## Hızlı başlangıç

Kök bileşen, shell'in geçirdiği props'u tanımlar:

```vue
<!-- src/micro-apps/settings/App.vue -->
<script setup lang="ts">
defineProps<{ userId: string; theme: 'light' | 'dark' }>();
</script>

<template>
  <section :class="`settings theme-${theme}`">Settings for {{ userId }}</section>
</template>
```

Bileşeni bir modüle sarın:

```ts
// src/micro-apps/settings/index.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Modülü shell'e kaydedin:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'settings',
  entry: () => import('./micro-apps/settings'),
  container: '#app',
  activeWhen: '/settings/*',
  props: { userId: 'u_42', theme: 'light' },
});

await orchestrator.start();

// Re-renders App with theme="dark"; local component state survives.
await orchestrator.updateAppProps('settings', { theme: 'dark' });
```

## API

### `createVueMicroApp`

```ts no-check
function createVueMicroApp(config: VueMicroAppConfig): MicroAppModule;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Modülün `@tuvix.js/loader` paketindeki `registerModule` ile kaydedildiği ad. Lifecycle olayları bu adı taşır. |
| `App` | `Component` | zorunlu | Kök Vue bileşeni. |
| `plugins` | `VuePluginEntry[]` | yok | Her Vue uygulamasına kurulacak plugin'ler. Her giriş ya bir plugin ya da `app.use(plugin, ...options)` çağrısına geçirilen bir `[plugin, ...options]` tuple'ıdır. |
| `bootstrap` | `() => void \| Promise<void>` | yok | Tek seferlik kurulum. Modülün `bootstrap()` fonksiyonu bunu bekler. |
| `ssr` | `boolean` | `false` | Container eleman ya da boşluk dışı metin içeriyorsa sunucu markup'ını `createSSRApp` ile hydrate eder. Boş bir container `createApp` render'ı alır. |

Dönen modül:

- `mount({ container, props })` o container için bir Vue uygulaması oluşturur, plugin'leri kurar ve uygulamayı mount eder. Vue sunucu markup'ını sahiplendiyse container üzerinde `hydrated: true` ile `tuvix:mounted` olayını tetikler.
- `update({ props, container })` `props` değerini o container'ın reaktif props nesnesine yazar ve Vue yeniden render'ı uyguladıktan (`nextTick`) sonra resolve olur. Yeni props'ta olmayan anahtarlar silinir. `container` verilmezse modülün mount ettiği her container'ı günceller.
- `unmount({ container })` Vue uygulamasını unmount eder, container'ı `replaceChildren()` ile boşaltır ve `tuvix:unmounted` olayını tetikler.
- `bootstrap()` `config.bootstrap` fonksiyonunu çalıştırır.

Her container kendi Vue uygulamasını ve kendi props'unu alır, böylece tek bir modül aynı anda birkaç yere mount edilebilir:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Badge from './Badge.vue';

const badge = createVueMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

#### Bileşenlerde props okuma

Adaptör props'u bir `shallowReactive` nesnesinde tutar ve `App` bileşenini, bu değerleri bileşen props'u olarak geçiren bir kök sarmalayıcı üzerinden render eder. Sarmalayıcı kendine ait DOM render etmez. Props'u iki yoldan okursunuz:

- Kök bileşende **`defineProps`**. `update` bileşeni yeni değerlerle yeniden render eder.
- Ağaçtaki herhangi bir bileşende **`inject('tuvixProps')`** (veya `inject(TUVIX_PROPS_KEY)`). Aynı reaktif nesneyi alırsınız; bu yüzden onu okuyan bir `computed`, `update` sonrasında güncellenir. Props'u aşağıya tek tek geçirmek yerine derindeki alt bileşenlerde bunu kullanın.

```vue
<!-- src/micro-apps/settings/ThemeLabel.vue -->
<script setup lang="ts">
import { computed, inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

const tuvixProps = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
const theme = computed(() => String(tuvixProps.theme ?? 'light'));
</script>

<template>
  <span>Theme: {{ theme }}</span>
</template>
```

#### Seçenek alan plugin'ler

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import type { VuePluginEntry } from '@tuvix.js/vue';
import type { App as VueApp } from 'vue';
import App from './App.vue';

const analytics = {
  install(app: VueApp, options: { siteId: string }) {
    app.provide('analyticsSiteId', options.siteId);
  },
};

const plugins: VuePluginEntry[] = [[analytics, { siteId: 'site-42' }]];

export default createVueMicroApp({ name: 'checkout', App, plugins });
```

Her container kendi Vue uygulamasını aldığı için her mount, her plugin için `app.use` çağrısını yeniden yapar. Durum tutan bir plugin nesnesini (örneğin tek bir `createPinia()` sonucunu) modülün tüm container'ları paylaşır.

### `createSsrVueMicroApp`

```ts no-check
function createSsrVueMicroApp(config: VueSsrMicroAppConfig): MicroAppModule;
```

`createVueMicroApp({ ...config, ssr: true })` ile aynıdır. Seçenekler: yukarıdaki tablodaki `name`, `App`, `plugins`, `bootstrap`.

Container `renderVueToString` çıktısı markup'ı içeriyorsa Vue bu DOM node'larını `createSSRApp` ile sahiplenir ve listener'ları onlara bağlar. Sunucu ve istemci aynı kök sarmalayıcıyı kullandığı için bileşen ağaçları eşleşir. Sunucunun render ederken kullandığı props ile mount edin:

```ts
// src/micro-apps/contact/client.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString`

Bu fonksiyonu `@tuvix.js/vue/server` subpath'inden import edin.

```ts no-check
function renderVueToString(
  App: Component,
  props?: Record<string, unknown>,
  plugins?: VuePluginEntry[],
  ssrContext?: VueSsrContext
): Promise<string>;
```

| Argüman | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `App` | `Component` | zorunlu | Kök bileşen; `createSsrVueMicroApp` fonksiyonuna verdiğiniz bileşenin aynısı. |
| `props` | `Record<string, unknown>` | `{}` | `App` props'u. `inject('tuvixProps')` bunları SSR sırasında da görür. |
| `plugins` | `VuePluginEntry[]` | yok | Kurulacak plugin'ler; `createVueMicroApp` ile aynı tuple biçimini kullanır. |
| `ssrContext` | `VueSsrContext` | `{}` | Vue'nun render sırasında içine yazdığı nesne. Promise resolve olduktan sonra `teleports` ve `modules` alanlarını okuyun. |

Paylaşılan kök sarmalayıcıyla bir SSR uygulaması oluşturur, plugin'leri kurar ve `@vue/server-renderer` paketinin `renderToString` fonksiyonundan gelen HTML'i döndürür. O paketi kurun; `renderVueToString` onu ilk çağrıda import eder.

`renderVueToString` yalnızca sunucuda çalışır. Onu izomorfik bir route loader'ından değil, bir sunucu fonksiyonundan (TanStack Start `createServerFn` handler'ı, bir API route'u, Express handler'ınız) çağırın. Loader istemci tarafı navigasyonda tarayıcıda da çalışır; orada fonksiyon `''` döndürür ve loader onu import ettiği için bundler'ınız Vue server renderer'ı istemciye gönderir.

```ts
// src/server/contact.ts
import { createServerFn } from '@tanstack/react-start';
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from '../micro-apps/contact/App.vue';

export const renderContact = createServerFn().handler(async () => {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return { html, teleports: ssrContext.teleports ?? {} };
});
```

`html` değerini sayfanızdaki container elemanının (`<div id="contact">…</div>`) içine koyun, ardından istemcide yukarıda gösterildiği gibi `createSsrVueMicroApp` ile mount edin. Bir `<Teleport>` hedefinin HTML'i döndürülen string'de değil, `ssrContext.teleports['#target']` içindedir; onu hedefin bulunduğu yere yazın.

### `TUVIX_PROPS_KEY`

```ts no-check
const TUVIX_PROPS_KEY = 'tuvixProps';
```

Reaktif props nesnesinin injection anahtarı. `inject(TUVIX_PROPS_KEY)` ve `inject('tuvixProps')` hem istemcide hem `renderVueToString` sırasında aynı nesneyi döndürür.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): Unsubscribe;
```

`onMounted` içinde `handler` fonksiyonunu `event` olayına abone eder ve `onUnmounted` içinde aboneliği kaldırır. Dönen fonksiyon aboneliği erkenden kaldırır. Bu composable'ı `setup` sırasında çağırın. `onMounted` sunucu render'ı sırasında çalışmaz, bu yüzden abonelik yalnızca istemcide vardır.

Adaptör orchestrator'ın bus'ını `App` bileşenine geçirmez. Orchestrator, siz `eventBus` seçeneklerini vermediyseniz `getGlobalBus()` kullanır:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useTuvixBus } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const count = ref(0);

useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
  count.value = items.length;
});
</script>

<template>
  <span>{{ count }}</span>
</template>
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): ShallowRef<T>;
```

| Argüman | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `initialProps` | `T` | zorunlu | Başlangıç değeri, bir kez kopyalanır. |
| `bus` | `IEventBus` | yok | Dinlenecek bus. Verilmezse ref `initialProps` değerinde kalır. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Composable'ın payload'unu ref ile birleştirdiği olay (`{ ...prev, ...payload }`). |

Ne orchestrator ne de adaptör `tuvix:props:update` olayını yayınlar; bu olayı kendiniz yayınlarsınız. Orchestrator'dan gelen props için bus gerektirmeden `update` ile senkron kalan `defineProps` veya `inject(TUVIX_PROPS_KEY)` kullanın.

```vue
<script setup lang="ts">
import { useTuvixProps } from '@tuvix.js/vue';
import { getGlobalBus } from '@tuvix.js/event-bus';

const settings = useTuvixProps({ theme: 'light' }, getGlobalBus());
// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
</script>

<template>
  <p>Theme: {{ settings.theme }}</p>
</template>
```

### Tipler

| Tip | Dışa aktarıldığı yer | Anlamı |
| --- | --- | --- |
| `VueMicroAppConfig` | `@tuvix.js/vue` | `createVueMicroApp` config'i: `name`, `App`, `plugins?`, `bootstrap?`, `ssr?`. |
| `VueSsrMicroAppConfig` | `@tuvix.js/vue` | `ssr` alanı olmayan `VueMicroAppConfig`; `createSsrVueMicroApp` config'i. |
| `VuePluginEntry` | `@tuvix.js/vue` | `Plugin \| [Plugin, ...any[]]`: bir plugin ya da bir plugin ile onun `app.use` seçenekleri. |
| `VueSsrContext` | `@tuvix.js/vue/server` | `{ teleports?: Record<string, string>; modules?: Set<string>; [key: string]: unknown }`. Vue ve plugin'leri bu nesneyi `renderVueToString` sırasında doldurur. `@vitejs/plugin-vue`, render edilen bileşen modüllerini `modules` alanına kaydeder. |

## Sınır durumlar

- **Mount hataları.** `mount` sırasında oluşan setup, render ve lifecycle hook'u hataları hem development hem production build'lerinde promise'i reject eder. Adaptör başarısız uygulamayı unmount eder ve `tuvix:error` olayını tetikler. Bir plugin'in kendi `app.config.errorHandler` işleyicisi hatayı yine alır.
- **Aynı container'a iki kez mount.** Modülün zaten tuttuğu bir container üzerindeki ikinci `mount`, önce eski uygulamayı unmount eder (`tuvix:unmounted` olayını tetikler ve container'ı boşaltır), sonra yenisini mount eder. `ssr: true` ile bu ikinci mount sıfırdan render eder, çünkü container boştur.
- **Bilinmeyen container.** Modülün hiç mount etmediği bir container üzerinde `unmount` hiçbir şey yapmaz. Böyle bir `container` ile çağrılan `update` hiçbir şeyi değiştirmez.
- **Props'un tamamı değişir.** Modülün `update` fonksiyonu props'u verdiğiniz nesneye eşitler ve eksik anahtarları siler. `orchestrator.updateAppProps` ise `update` çağrısından önce yeni props'u kayıtlı olanların üzerine birleştirir.
- **Tanımlanmamış props.** Kök bileşenin `defineProps` ile tanımlamadığı props ona attribute olarak ulaşır ve Vue'nun her bileşende yaptığı gibi kök elemana aktarılır. `lang` alanını tanımlamadıysanız ya da `inheritAttrs: false` ayarlamadıysanız `{ lang: 'en' }` kök elemanda `lang="en"` olarak render edilir.
- **`ssr: true` ile yalnızca boşluk içeren container.** `hasServerMarkup` boşluk metnini ve yorumları yok saydığı için adaptör `createApp` ile render eder. Vue boş bir container'ı hydrate etmekle ilgili uyarı vermez.
- **Tarayıcıda `renderVueToString`.** `window` tanımlıysa `''` döndürür.
- **Unmount hatası.** `app.unmount()` hata fırlatırsa adaptör container'ı boşaltır, `tuvix:error` olayını tetikler ve hatayı yeniden fırlatır.
- **Aynı ad iki kez.** `registerModule` bir ad altında en son oluşturulan modülü tutar.

## Ne yapmaz

- Vue 2'yi desteklemez.
- Modülleri URL ile yüklemez. Modülü import edin ya da [`@tuvix.js/core`](/tr/packages/core) paketinin bir `entry` üzerinden yüklemesine izin verin.
- `MountContext.bus` veya `MountContext.name` değerini bileşenlerinize geçirmez. `@tuvix.js/event-bus` paketinden `getGlobalBus()` kullanın.
- `renderVueToString` stream etmez ve CSS toplamaz. Sunucuda render edilmiş island'ların stil dosyası linklerini yazmak için [`@tuvix.js/vite`](/tr/packages/vite) kullanın.
- Teleport edilen HTML'i sizin yerinize yerleştirmez. `ssrContext.teleports` değerini okuyup sayfaya yazın.

## 0.4 sürümünden geçiş

**`$tuvixProps` kaldırıldı.** `update()` artık `app.config.globalProperties.$tuvixProps` alanına yazmıyor. Props'u `defineProps` veya `inject` ile okuyun:

```vue
<!-- Before (0.4) -->
<template>
  <span>{{ $tuvixProps.theme }}</span>
</template>
```

```vue
<!-- After (0.5) -->
<script setup lang="ts">
defineProps<{ theme: string }>();
</script>

<template>
  <span>{{ theme }}</span>
</template>
```

**Bilinmeyen bir container üzerinde `unmount` hiçbir şey yapmaz.** 0.4'te container'ı temizliyordu. Buna güveniyorsanız `container.replaceChildren()` çağrısını kendiniz yapın.

**`VueSsrMicroAppConfig` içinde `ssr` alanı yok.** `createSsrVueMicroApp` fonksiyonuna verdiğiniz config'ten `ssr` alanını kaldırın.

**Config nesnesi.** Bu sayfanın önceki sürümleri `createVueMicroApp(App)` kullanımını gösteriyordu. Fonksiyon bir config nesnesi alır: `createVueMicroApp({ name: 'settings', App })`.

Daha fazla adım adım anlatım için [Vue rehberine](/tr/guide/vue) bakın.
