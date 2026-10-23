# Mikro uygulamalar

Mikro uygulama, `mount` ve `unmount` fonksiyonlarına sahip bir modüldür. Shell `mount` fonksiyonunu bir container elemanı ve props ile çağırır; uygulama o elemanın içine render eder. Uygulamanın sayfadan çıkması gerektiğinde shell `unmount` fonksiyonunu çağırır; uygulama render ettiği her şeyi kaldırır.

## Modülün yapısı

```ts
import type { MicroAppModule } from '@tuvix.js/loader';

const app: MicroAppModule = {
  bootstrap: async () => {},
  mount: async ({ container, props, name, bus }) => {
    container.textContent = `${name ?? 'app'} mounted`;
    void props;
    void bus;
  },
  update: async ({ props, container }) => {
    if (container) container.dataset.props = JSON.stringify(props);
  },
  unmount: async ({ container }) => {
    container.replaceChildren();
  },
};
```

| Hook | Zorunlu | Ne zaman çağrılır |
| --- | --- | --- |
| `bootstrap()` | hayır | İlk yüklemeden sonra, ilk `mount` çağrısından önce, bir kez. |
| `mount({ container, props, name, bus })` | evet | Uygulama her aktif olduğunda. |
| `update({ props, container })` | hayır | Uygulama mount edilmişken shell `updateAppProps` çağırdığında. |
| `unmount({ container })` | evet | Uygulama her pasif olduğunda. |

Her hook bir promise döndürebilir. Orchestrator bir sonraki adıma geçmeden önce bu promise'i bekler.

## Elle yazma

`defineMicroApp` hook'ları doğrular, modülü `name` altında kaydeder, container üzerinde `tuvix:mounted`, `tuvix:unmounted` ve `tuvix:error` olaylarını tetikler ve modülü döndürür:

```ts
import { defineMicroApp } from '@tuvix.js/core';

let off: (() => void) | undefined;

export default defineMicroApp({
  name: 'notifications',

  mount({ container, props, bus }) {
    const list = document.createElement('ul');
    container.replaceChildren(list);
    off = bus?.on<{ text: string }>('notify', ({ text }) => {
      const item = document.createElement('li');
      item.textContent = text;
      list.append(item);
    });
    container.dataset.user = String(props?.user ?? '');
  },

  unmount({ container }) {
    off?.();
    off = undefined;
    container.replaceChildren();
  },
});
```

Mount context'indeki `bus` değerini kullanın. Bu orchestrator'ın bus'ıdır. Shell `eventBus` seçenekleri vermediyse `getGlobalBus()` ile aynı bus'tır.

## Adaptör kullanma

Adaptörler modülü bir bileşenden oluşturur ve aksi halde sizin yazacağınız ayrıntıları üstlenir:

- container başına bir framework instance'ı, böylece bir modül birden fazla yere mount edilebilir;
- `update`, remount yapmadan yeni props ile yeniden render eder;
- `mount` hâlâ yüklenirken gelen bir `unmount` çağrısı bekler ve geride boş bir container bırakır;
- container üzerinde `tuvix:mounted`, `tuvix:unmounted` ve `tuvix:error` olayları;
- `ssr: true` verdiğinizde sunucuda render edilmiş markup'ın hydrate edilmesi.

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Cart({ items }: { items: number }) {
  return <p>{items} items</p>;
}

export default createReactMicroApp({ name: 'cart', App: Cart });
```

## Modülü loader'a açma

Orchestrator modülü uygulamanın `entry` değeri üzerinden alır:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

// Shell ile birlikte bundle'lanır, bundler'ınız code-split eder.
orchestrator.register({
  name: 'cart',
  entry: () => import('./apps/cart'),
  container: '#cart',
  activeWhen: '/shop/*',
});

// Ayrı deploy edilir. Script kendini adıyla kaydeder.
orchestrator.register({
  name: 'notifications',
  entry: { scripts: ['https://cdn.example.com/notifications/main.js'], type: 'module' },
  container: '#notifications',
  activeWhen: '/',
});
```

URL entry'sinde modül ya `registerModule(name, module)` çağırmalı (adaptörler ve `defineMicroApp` bunu yapar) ya da `mount` fonksiyonu olan bir UMD global'i sunmalıdır. Loader fonksiyonunun ise yalnızca modüle ya da `{ default: module }` değerine resolve olması yeterlidir.

## Props geçme

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'profile',
  entry: () => import('./apps/profile'),
  container: '#app',
  activeWhen: '/profile/*',
  props: { userId: '42', theme: 'dark' },
});

await orchestrator.updateAppProps('profile', { theme: 'light' });
// Uygulamanın props'ları artık { userId: '42', theme: 'light' }.
```

- Props'lar yüzeysel (shallow) birleşir. Bir anahtarı kaldırmak için değerini `undefined` yapın.
- Uygulama mount edilmişse ve `update` fonksiyonu varsa orchestrator bu fonksiyonu çağırır ve fonksiyon tamamlandıktan sonra resolve olur. Reject olan bir `update` uygulamayı `error` durumuna geçirir ve `onError` çağrılır.
- Uygulama mount edilmemişse ya da `update` fonksiyonu yoksa orchestrator birleştirilmiş props'ları bir sonraki mount için saklar. Uygulamayı remount etmez.

## Bir modülü birden fazla yere mount etme

Adaptörler her container için ayrı bir instance tutar. `TuvixIsland` ve kendi kodunuz aynı modülle iki container üzerinde `mount` çağırabilir:

```ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Price from './Price.vue';

const price = createVueMicroApp({ name: 'price', App: Price });

const first = document.querySelector<HTMLElement>('#price-1');
const second = document.querySelector<HTMLElement>('#price-2');
if (first && second) {
  await price.mount({ container: first, props: { sku: 'a' } });
  await price.mount({ container: second, props: { sku: 'b' } });
  await price.update?.({ props: { sku: 'c' }, container: second }); // yalnızca #price-2
}
```

`container` verilmezse `update` o modülün tüm mount'larını günceller. Orchestrator her zaman `container` geçer.

## Build ve deploy

Her uygulamayı ES module bundle'ı olarak build edip `type: 'module'` ile kaydedin ya da IIFE/UMD bundle'ı olarak build edip URL'sini klasik script olarak kaydedin. Vite ile:

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', formats: ['es'], fileName: 'main' },
    // Shell sağlamıyorsa bağımlılıkları bundle içinde bırakın.
  },
});
```

Framework kopyalarını göz önünde bulundurun: her biri React'i kendi bundle'ına koyan iki mikro uygulama React'i iki kez gönderir. Sayfa yine çalışır, çünkü her uygulama kendi root'unu render eder. Tek bir kopyayı paylaşmak için import map, Module Federation (`@tuvix.js/module-federation`) kullanın ya da uygulamaları loader fonksiyonu entry'leri ile shell'in bundle'ına dahil edin.

## Bir mikro uygulamanın yapmaması gerekenler

- Kendi container'ının dışına yazmak. Tuvix.js bunu engellemez ve o container'a sonra gelen uygulama bunu beklemez.
- `unmount` sonrasında geride listener, timer veya abonelik bırakmak.
- `bootstrap` fonksiyonunun birden fazla kez çalışacağına güvenmek. Yüklenen her modül için bir kez çalışır.
