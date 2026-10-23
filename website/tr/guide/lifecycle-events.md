# Lifecycle olayları

Adaptörler ve `defineMicroApp`, bir mikro uygulama mount edildiğinde, unmount edildiğinde ya da hata verdiğinde sayfaya haber verir. DOM olaylarını dinleyebilir, `whenMounted(name)` sonucunu bekleyebilir ya da `isMounted(name)` ile sorabilirsiniz. Bir island etkileşime hazır olunca animasyon başlatmak, skeleton'ı gizlemek ya da hataları raporlamak için DOM'u sürekli yoklamak veya `__vue_app__` gibi framework iç alanlarını okumak yerine bunları kullanın.

## Olaylar

| DOM olayı | Ne zaman tetiklenir |
| --- | --- |
| `tuvix:mounted` | Uygulama render ya da hydrate edildikten ve framework'ün mount callback'leri çalıştıktan sonra. |
| `tuvix:unmounted` | Uygulama yok edildikten ve container'ı boşaltıldıktan sonra. |
| `tuvix:error` | `mount` ya da `unmount` hata fırlattığında veya bir React uygulaması mount sonrasında render sırasında hata fırlattığında. |

Her olay, uygulamanın container elemanı üzerinde tetiklenen bir `CustomEvent<LifecycleDetail>` nesnesidir. Olay bubble eder ve `composed` ayarlıdır, bu yüzden shadow root içinden tetiklense bile `document` üzerindeki dinleyiciye ulaşır. Container artık DOM'da değilse (React bir island'ı, modülü `unmounted` bildirmeden önce kaldırdıysa) olay `document` üzerinde tetiklenir ve `detail.container` yine o elemanı gösterir.

```ts
import type { LifecycleDetail } from '@tuvix.js/loader';

const detail: LifecycleDetail = {
  name: 'footer', // uygulamanın adı
  container: document.body, // uygulamanın render edildiği eleman
  hydrated: true, // adaptör sunucu markup'ını devraldıysa true
  error: undefined, // fırlatılan değer, yalnızca 'error' olayında
};
```

## onLifecycle ile dinleme

```ts
import { onLifecycle } from 'tuvix.js';

const stopMounted = onLifecycle('mounted', ({ name, hydrated }) => {
  console.log(`${name} is interactive (hydrated: ${hydrated})`);
});

const stopErrors = onLifecycle('error', ({ name, error }) => {
  console.error(`${name} failed`, error);
});

// daha sonra
stopMounted();
stopErrors();
```

`onLifecycle(type, handler, target = document)` dinleyiciyi kaldıran bir fonksiyon döndürür. Yalnızca tek bir bölgeyi dinlemek için `target` olarak bir container verin. Düz bir `addEventListener('tuvix:mounted', ...)` çağrısı da işe yarar.

## whenMounted ile bekleme

```ts
import { whenMounted } from 'tuvix.js';

const controller = new AbortController();
setTimeout(() => controller.abort(new Error('footer did not mount in 5 s')), 5000);

const { container } = await whenMounted('footer', { signal: controller.signal });
container.classList.add('is-ready');
```

- Uygulama zaten mount edilmişse promise hemen resolve olur. Kodunuzun ve mount işleminin hangi sırayla çalıştığı önemli değildir.
- Mount başarısız olursa promise reject olmaz. Zaman aşımı olan bir `signal` verin ya da ayrıca `tuvix:error` olayını dinleyin.
- Signal abort edildiğinde promise, signal'in reason değeriyle reject olur.

## isMounted ile kontrol

```ts
import { isMounted } from 'tuvix.js';

if (isMounted('footer')) {
  console.log('footer is on the page');
}
```

## Framework tespitinden kurtulun

Lifecycle olayları olmadan host, bir island'ın ne zaman hazır olduğunu tahmin etmek zorunda kalır. Örneğin bir framework'ün özel alanlarını aralıklarla kontrol eder:

```ts no-check
// Svelte'te, Angular'da ve bu alanı yeniden adlandıran her Vue sürümünde bozulur.
const timer = setInterval(() => {
  if ((container as any).__vue_app__) {
    clearInterval(timer);
    startReveal(container);
  }
}, 50);
```

Lifecycle olaylarıyla tek bir dinleyici bütün adaptörlerde çalışır:

```ts
import { onLifecycle } from 'tuvix.js';

declare function startReveal(container: HTMLElement): void;

onLifecycle('mounted', ({ name, container }) => {
  if (name === 'footer') startReveal(container);
});
```

## Olayları kim tetikler

| Kaynak | Tetikledikleri |
| --- | --- |
| `createReactMicroApp`, `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp` (ve `Ssr` varyantları) | üçü de |
| `TuvixReactApp` | üçü de |
| `TuvixIsland` | kendisi hiçbirini tetiklemez; barındırdığı modül tetikler |
| `defineMicroApp` | üçü de; `ssr: true` ile, container `mount` öncesinde markup içeriyorsa `hydrated` değeri `true` olur |
| Düz `{ mount, unmount }` nesneleri | hiçbiri, `emitLifecycle` çağırmadığınız sürece |
| Orchestrator | hiçbiri; onun yerine event bus üzerinde `tuvix:app:*` olaylarını yayınlar |

`defineMicroApp`, sizin `mount` fonksiyonunuz resolve olduktan sonra `tuvix:mounted`, `unmount` fonksiyonunuz resolve olduktan sonra `tuvix:unmounted` olayını tetikler. İkisinden biri hata fırlatırsa `tuvix:error` olayını tetikler ve hatayı yeniden fırlatır. `mount` işlemi hâlâ süren bir container için gelen `unmount` çağrısı, mount işleminin bitmesini bekler:

```ts
import { defineMicroApp } from '@tuvix.js/core';

export default defineMicroApp({
  name: 'clock',
  ssr: true, // sunucu saati container'a render etti
  mount({ container }) {
    container.textContent = new Date().toISOString();
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

Düz nesne olarak yazılmış bir modül olayları kendisi tetikleyebilir:

```ts
import { emitLifecycle, type MicroAppModule } from '@tuvix.js/loader';

export const clock: MicroAppModule = {
  mount({ container }) {
    container.textContent = new Date().toISOString();
    emitLifecycle('mounted', { name: 'clock', container, hydrated: false });
  },
  unmount({ container }) {
    container.replaceChildren();
    emitLifecycle('unmounted', { name: 'clock', container, hydrated: false });
  },
};
```

## Sınır durumlar

- Bir modül birden fazla container'a mount edilebilir. Bunlardan herhangi biri mount edilmiş durumdaysa `isMounted(name)` değeri `true` kalır ve `whenMounted(name)`, hâlâ mount edilmiş olan en eski container ile resolve olur. Bunları ayırt etmeniz gerekiyorsa her yerleşime ayrı bir ad verin.
- DOM'dan ayrılmış bir container için tetiklenen `tuvix:unmounted` olayı `document` dinleyicilerine bir kez ulaşır. `target` olarak container verilen `onLifecycle` bu olayı görmez, çünkü olay artık o elemanın içinden geçmez.
- State `window.__TUVIX_RUNTIME__` üzerinde tutulur. Bu sayede `@tuvix.js/loader` paketinin ayrı bundle edilmiş kopyaları aynı state'i paylaşır.
- Sunucuda DOM yoktur, olay da yoktur. `whenMounted` fonksiyonunu orada çağırmayın; hiçbir zaman resolve olmaz.

## Ne yapmaz

- Yükleme ilerlemesini bildirmez. Bunun için orchestrator'ın `onStatusChange` seçeneği `bootstrapping`, `mounting` ve diğer durumları kapsar.
- Yeniden denemez, kurtarma yapmaz. Orchestrator'ın `fallback` seçeneğini ya da `TuvixIsland` ve `TuvixReactApp` üzerindeki `fallback` prop'unu kullanın.
