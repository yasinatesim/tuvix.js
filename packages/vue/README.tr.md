# @tuvix.js/vue

> Vue 3 bileşenlerini reaktif props, container başına bir Vue uygulaması ve SSR hydration desteğiyle Tuvix.js mikro uygulamalarına dönüştürün.

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır.

## Kurulum

```bash
npm install @tuvix.js/vue vue
# or pnpm add @tuvix.js/vue vue
```

Sunucuda render için isteğe bağlı peer dependency olan `@vue/server-renderer` paketini de kurun.

## Hızlı başlangıç

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({ name: 'settings', App });
```

Modül, `@tuvix.js/loader` paketindeki `registerModule` fonksiyonuyla kendini `'settings'` adıyla kaydeder. Böylece script yüklendikten sonra orchestrator onu bulur. `App`, orchestrator props'larını bileşen props'ları olarak alır; bunları `defineProps` ile tanımlayın.

## API

### `createVueMicroApp(config)`

| Seçenek | Tür | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Kayıt adı; lifecycle olayları bu adı taşır. |
| `App` | `Component` | zorunlu | Kök Vue bileşeni. |
| `plugins` | `VuePluginEntry[]` | yok | Plugin'ler ya da `app.use(plugin, ...options)` çağrısına geçirilen `[plugin, ...options]` tuple'ları. |
| `bootstrap` | `() => void \| Promise<void>` | yok | Tek seferlik kurulum. |
| `ssr` | `boolean` | `false` | Container eleman veya boşluk dışı metin içeriyorsa sunucu markup'ını `createSSRApp` ile hydrate eder. |

- Her container kendi Vue uygulamasını ve props'larını alır. Bu sayede tek bir modül birden fazla yerde mount edilebilir. Her mount plugin'leri yeniden kurar.
- `mount({ container, props })`, `hydrated` alanıyla `tuvix:mounted` olayını tetikler.
- `update({ props, container })` bir `shallowReactive` props nesnesinin anahtarlarını değiştirir (eksik anahtarlar silinir) ve `nextTick` sonrasında resolve olur. `container` verilmezse her mount'u günceller. Bileşen state'i korunur.
- `unmount({ container })` uygulamayı unmount eder, container'ı boşaltır ve `tuvix:unmounted` olayını tetikler.

### `createSsrVueMicroApp(config)`

`createVueMicroApp({ ...config, ssr: true })` ile aynıdır. Seçenekler: `name`, `App`, `plugins`, `bootstrap`. Vue, `renderVueToString` çıktısı olan markup'ı devralır; boş bir container normal render alır.

```ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import ContactApp from './App.vue';

const contact = createSsrVueMicroApp({ name: 'contact', App: ContactApp });

await contact.mount({ container: document.getElementById('contact')!, props: { lang: 'en' } });
```

### `renderVueToString(App, props?, plugins?, ssrContext?)`

`@tuvix.js/vue/server` içinden gelir. `App` bileşenini istemcinin kullandığı kök sarmalayıcıyla render edip HTML'ini döndürür. Böylece hydration eşleşir ve `inject('tuvixProps')` sunucuda da çalışır. Vue, `teleports` ve `modules` alanlarını `ssrContext` içine yazar.

Yalnızca sunucuda kullanılır: izomorfik bir route loader'dan değil, bir sunucu fonksiyonundan çağırın. Tarayıcıda `''` döndürür. Bu fonksiyonu import eden bir loader, Vue'nun sunucu renderer'ını istemci bundle'ına taşır.

```ts
import { renderVueToString } from '@tuvix.js/vue/server';
import type { VueSsrContext } from '@tuvix.js/vue/server';
import ContactApp from './App.vue';

export async function renderContact(): Promise<string> {
  const ssrContext: VueSsrContext = {};
  const html = await renderVueToString(ContactApp, { lang: 'en' }, [], ssrContext);
  return `<div id="contact">${html}</div>`;
}
```

### `TUVIX_PROPS_KEY`

`'tuvixProps'` değeridir. Ağaçtaki herhangi bir bileşende `inject(TUVIX_PROPS_KEY)`, `update` fonksiyonunun yazdığı reaktif props nesnesini döndürür.

```ts
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

export function useTheme(): string {
  const props = inject<Record<string, unknown>>(TUVIX_PROPS_KEY, {});
  return String(props.theme ?? 'light');
}
```

### `useTuvixBus(bus, event, handler)`

`onMounted` içinde abone olur, `onUnmounted` içinde aboneliği bırakır ve aboneliği erken bırakmak için bir fonksiyon döndürür. `@tuvix.js/event-bus` paketindeki `getGlobalBus()` değerini verin; adaptör orchestrator bus'ını `App` bileşenine iletmez.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

`bus` üzerindeki her `updateEvent` (varsayılan `'tuvix:props:update'`) payload'ını birleştiren bir `ShallowRef<T>` döndürür. Tuvix'te bu olayı yayınlayan hiçbir şey yoktur; olayı siz yayınlarsınız. Orchestrator props'ları için `defineProps` veya `inject(TUVIX_PROPS_KEY)` kullanın.

### Tipler

`@tuvix.js/vue` paketinden `VueMicroAppConfig`, `VueSsrMicroAppConfig`, `VuePluginEntry`; `@tuvix.js/vue/server` paketinden `VueSsrContext`.

## Sınır durumlar

- `mount` sırasında setup, render veya hook hatası oluşursa işlem hem geliştirme hem production build'lerinde reject olur; adaptör başarısız uygulamayı unmount eder ve `tuvix:error` olayını tetikler. Bir plugin'in `app.config.errorHandler` fonksiyonu yine çalışır.
- Modülün zaten tuttuğu bir container üzerinde `mount` önce eski uygulamayı unmount eder.
- Modülün hiç mount etmediği bir container üzerinde `unmount` hiçbir şey yapmaz.
- Kök bileşenin tanımlamadığı props'lar, kök elemanına öznitelik olarak düşer.
- `ssr: true` iken yalnızca boşluk veya yorum içeren bir container sıfırdan render alır.

## Ne yapmaz

- Vue 2'yi desteklemez.
- Modülleri URL ile yüklemez. Bunun için `@tuvix.js/core` veya `@tuvix.js/loader` kullanın.
- Sunucuda CSS toplamaz veya HTML stream etmez. Stil dosyası linkleri için `@tuvix.js/vite` kullanın.

## 0.5 sürümündeki breaking change'ler

- `update()` artık `app.config.globalProperties.$tuvixProps` alanına yazmaz. `defineProps` veya `inject('tuvixProps')` kullanın.
- Modülün hiç mount etmediği bir container üzerinde `unmount()` hiçbir şey yapmaz; önceden container'ı temizliyordu.
- `VueSsrMicroAppConfig` artık `ssr` kabul etmez.

Dokümantasyonun tamamı: [tuvix.js.org/tr/packages/vue](https://tuvix.js.org/tr/packages/vue)

## Lisans

MIT
