# 0.5 sürümüne geçiş

0.5, gözlemlenebilir davranışı değiştiren hataları düzeltir. Bu yüzden bazı düzeltmeler 0.4 kodunu bozar. Bu sayfa her breaking change'i paket paket ve değiştirmeniz gereken kodla birlikte listeler. Tüm `tuvix.js` ve `@tuvix.js/*` paketlerini aynı anda `^0.5.0` sürümüne yükseltin; aynı sayfada 0.4 ve 0.5 adaptörlerini karıştırmak desteklenmez.

```bash
pnpm up --latest "tuvix.js" "@tuvix.js/*"
```

0.5 öncesinde `create-tuvix-app` ile oluşturulan projeler `^0.1.0` aralığına bağlıdır. Bu aralık hiçbir zaman 0.4 ya da 0.5 sürümüne çözümlenmez. Bu aralıkları elle düzenleyin.

## Core

### Orchestrator global bus'ı kullanır

0.4 her orchestrator'a `getGlobalBus()` dışında, ona özel ayrı bir bus veriyordu. 0.5'te `eventBus` seçeneklerini vermediğiniz sürece orchestrator'ın bus'ı `getGlobalBus()` olur ve `destroy()` global bus'ı yok etmez.

```ts no-check
// 0.4: iki ayrı bus; getGlobalBus() dinleyen uygulamalar orchestrator olaylarını kaçırıyordu
const orchestrator = createOrchestrator();
orchestrator.getEventBus() === getGlobalBus(); // false
```

```ts
// 0.5
import { createOrchestrator, getGlobalBus } from 'tuvix.js';

const shared = createOrchestrator();
console.log(shared.getEventBus() === getGlobalBus()); // true

const isolated = createOrchestrator({ eventBus: {} }); // 0.4'teki gibi ayrı bir bus
console.log(isolated.getEventBus() === getGlobalBus()); // false
```

Uygulamalar bulabilsin diye orchestrator'ın bus'ını `window` üzerinde paylaştıysanız bunu kaldırabilirsiniz. Onun yerine mount context'indeki `bus` nesnesini ya da `getGlobalBus()` fonksiyonunu kullanın.

### Route değişiklikleri elle mount edilen uygulamalara dokunmaz

0.4, ne `activeWhen` değeri ne de router route'u olan bir uygulamayı bir sonraki route değişikliğinde unmount ediyordu. Aynısını `mountWhenVisible` uygulamalarına da yapıyordu. 0.5'te reconcile turu yalnızca `activeWhen` değerinin ya da bir route'un yönettiği uygulamalara dokunur. Elle mount ettiğiniz bir uygulamanın navigasyonla kaldırılmasına güveniyorsanız onu kendiniz unmount edin:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.unmountApp('cookie-banner');
```

### sandbox: true artık shadow root içinde render eder

0.4'te `register` üzerindeki `sandbox` seçeneği hiçbir şey yapmıyordu. 0.5'te `sandbox: true` uygulamayı bir shadow root içinde mount eder ve entry'deki `styles` dosyalarını oraya yükler. Sayfanın CSS'i artık uygulamaya ulaşmaz, uygulamanın entry stilleri de sayfaya ulaşmaz. Sayfa stillerine bağımlı uygulamalardan `sandbox: true` seçeneğini kaldırın. Ayrıntılar için [Sandbox](/tr/guide/sandbox) sayfasına bakın.

### prefetch: 'hover'

0.4, sayfanın herhangi bir yerindeki ilk fare hareketinde tüm uygulamaları prefetch ediyordu. 0.5 ise bir uygulamayı, path'i o uygulamayı aktif eden aynı origin'deki bir linke imleç girdiğinde ya da o link odak aldığında prefetch eder. Tüm uygulamaları baştan indirmek için `'idle'` ya da `'immediate'` kullanın.

### OrchestratorConfig.shared kaldırıldı

Orchestrator `shared` alanını hiç okumuyordu. Bu alanı silin, bağımlılıkları da `@tuvix.js/module-federation` paketiyle ya da import map'lerle paylaşın.

### activeWhen kalıpları

`activeWhen` string'leri artık `matchPath` kullanır. Query string ya da hash artık uygulamayı unmount etmez, `:param` segmentleri çalışır, `.` ve `(` gibi karakterler de birebir eşleşir.

```ts no-check
// 0.4: `.` regex joker karakteriydi ve '/v1x0' ile eşleşiyordu
activeWhen: '/v1.0/*'
// 0.4: query string'ler eşleşmeyi bozuyordu, bu yüzden fonksiyon yazılıyordu
activeWhen: (path) => path.split('?')[0].startsWith('/dashboard')
```

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'dashboard',
  entry: () => import('./apps/dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*', // /dashboard?tab=1 adresinde de aktif
});
```

## Router

### '/' route'u ve RouteConfig.exact

Route path'leri her yerde path'in tamamıyla eşleşir. `'/'` route'u artık yalnızca `/` adresinde aktif olur. 0.4'te `getActiveApps()` bu route'u her path için geçerli sayarken `match()` tam eşleşme arıyordu. `RouteConfig.exact` kaldırıldı, çünkü hiçbir şeyi değiştirmiyordu.

```ts no-check
// 0.4
routes: [{ path: '/', app: 'shell-nav' }, { path: '/settings', app: 'settings', exact: true }]
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({
  routes: [
    { path: '/*', app: 'shell-nav' }, // her path
    { path: '/settings', app: 'settings' }, // yalnızca /settings
  ],
});
void router;
```

`register` çağrısındaki `activeWhen: '/'` hâlâ her path ile eşleşir, çünkü `activeWhen` string'leri önek eşleşmesi kullanır.

### push ve replace base'i ekler

```ts no-check
// 0.4, base: '/app' ile
router.push('/app/settings'); // base'i kendiniz eklemeniz gerekiyordu
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({ base: '/app', routes: [] });
await router.push('/settings'); // URL: /app/settings
```

0.5'te `/app/settings` verirseniz URL `/app/app/settings` olur. Geri/ileri navigasyonunu iptal eden bir guard da URL'yi base ile birlikte geri yükler.

### Diğer router değişiklikleri

- `base` yalnızca segment sınırında kırpılır. `base: '/app'` ile `/application` yine `/application` kalır.
- `pathToRegex()` önbelleğe alınmış bir `RegExp` döndürür; onu değiştirmeyin. İkinci argümanı olan `exact` kaldırıldı.
- Kalıplardaki regex karakterleri birebir eşleşir. Kalıbın ortasındaki bir `*` tek bir segmentle eşleşir.
- `matchRoute()` ve `isPathActive()` path içindeki `#hash` kısmını yok sayar.

## Loader

### Kaldırılan seçenekler

`LoaderOptions.fetch` ve `EntryConfig.html` kaldırıldı. Loader bunları hiç okumuyordu; config'inizden silin.

```ts no-check
// 0.4
new ModuleLoader({ fetch: myFetch });
orchestrator.register({ name: 'x', entry: { scripts: ['/x.js'], html: '<div></div>' }, container: '#x' });
```

```ts
// 0.5
import { ModuleLoader } from '@tuvix.js/loader';

const loader = new ModuleLoader({ timeout: 10000 });
void loader;
```

### Module script'ler her URL için bir kez çalışır

`unload(name)` sonrasında, kendini `type: 'module'` script'iyle kaydeden bir uygulama aynı URL'den tekrar yüklenmez. Bunun nedeni tarayıcıların bir module script'i her URL için yalnızca bir kez çalıştırmasıdır. Unload edip yeniden yüklediğiniz uygulamalar için loader fonksiyonu entry'si kullanın:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

Önbellekteki bir modül için `load()` artık `0` yerine gerçek `duration` değerini bildirir.

## Module Federation

`federatedEntry` ve `createFederatedEntry` artık `{ scripts: [remoteEntry.js] }` yerine bir loader fonksiyonu döndürür. 0.4'teki entry container script'ini yüklüyor, ardından "no exports found" hatasıyla başarısız oluyordu.

```ts no-check
// 0.4
orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }),
  container: '#main',
});
```

```ts
// 0.5
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader, federatedEntry } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry(
    { name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' },
    './App', // expose edilen modülün path'i
  ),
  container: '#main',
  activeWhen: '/dashboard/*',
});

const remotes = createFederatedLoader({
  remotes: [{ name: 'settings', url: 'https://cdn.example.com/settings/remoteEntry.js' }],
  shareScope: {}, // 0.4'teki `shared` alanının yerine geçer
});

orchestrator.register({
  name: 'settings',
  entry: remotes.createFederatedEntry('settings', './App'),
  container: '#main',
  activeWhen: '/settings/*',
});
```

- `FederatedLoaderConfig.shared` yerini `shareScope` alanına bıraktı. 0.4 `shared` alanını hiç okumuyordu.
- `loadRemoteContainer` artık `any` yerine `FederatedContainer` döndürür.

## React

- `TuvixReactApp` bileşeninin sunucu HTML'i artık Suspense yorum işaretçileri (`<!--$-->...<!--/$-->`) içerir. İki tarafta da `@tuvix.js/react` 0.5 ile render ve hydrate edin.
- İlk render hata fırlatırsa `mount` reject olur. 0.4'te hata React'in root error handler'ına gidiyor ve `mount` resolve oluyordu. Orchestrator artık uygulamanın `fallback` içeriğini gösterir ve `onError` fonksiyonunu çağırır.
- Modülün hiç mount etmediği bir container üzerinde `unmount` hiçbir şey yapmaz. 0.4 bu container'ı temizliyordu.

## Vue

`update()` artık `app.config.globalProperties.$tuvixProps` alanına yazmaz. Props artık reaktif:

```vue
<!-- 0.4 -->
<template>{{ $tuvixProps.theme }}</template>
```

```vue
<!-- 0.5 -->
<script setup lang="ts">
defineProps<{ theme?: string }>();
</script>

<template>{{ theme }}</template>
```

Alt bileşenler `inject('tuvixProps')` çağırabilir. Bu çağrı aynı reaktif nesneyi döndürür.

- `VueSsrMicroAppConfig` artık `ssr` kabul etmez. Bu değeri `createSsrVueMicroApp` ayarlar.
- Modülün hiç mount etmediği bir container üzerinde `unmount` hiçbir şey yapmaz.

## Svelte

- `ssr` verilmediğinde `createSvelteMicroApp` render etmeden önce container'ı boşaltır. 0.4, Svelte 3/4 bileşenlerini mevcut markup'ın arkasına ekliyordu. Sunucu markup'ını koruyup hydrate etmek için `createSsrSvelteMicroApp` kullanın.
- Modülün hiç mount etmediği ya da mount işlemi başarısız olan bir container üzerinde `unmount` hiçbir şey yapmaz. 0.4 bu container'ı boşaltıyordu. Dört adaptörün hepsi artık böyle davranır.
- `renderSvelteToString`, `svelte/server` yüklenemediğinde artık `App.render` fonksiyonuna geri dönmez. `render` verildiğinde Svelte 5 kullanır. Verilmediğinde `svelte` paketi `mount` export ediyorsa Svelte 5 yolunu izler, `App.render` fonksiyonunu yalnızca Svelte 3/4 için çağırır. Svelte 5 import ya da render hataları size ulaşır.

Svelte 5 bileşenleri 0.5'te çalışır; 0.4'te `createSvelteMicroApp` bu bileşenlerde hata veriyordu. Svelte 5'te `update()` bileşeni yeniden mount eder. Config'e `svelte/reactivity` paketinden `SvelteMap` verirseniz props yerinde güncellenir:

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

## Angular

### Yeni config yapısı

```ts no-check
// 0.4
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

export default createAngularMicroApp({
  name: 'admin',
  module: AppModule,
  platform: platformBrowserDynamic,
  selector: 'app-root',
});
```

```ts
// 0.5
import { createAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AppComponent, // zorunlu
  module: AppModule, // yalnızca AppComponent bir NgModule içinde tanımlıysa
});
```

`platform` ve `compilerOptions` kaldırıldı. Entry dosyanızdan `import '@angular/compiler'` satırını silin; JIT bileşenleri için compiler'ı adaptör yükler.

### Varsayılan olarak zoneless

`zone: true` vermediğiniz sürece uygulamalar zone.js olmadan çalışır. Angular 15-17'de DOM olayları artık change detection tetiklemez. Handler'larda `ChangeDetectorRef.detectChanges()` çağırın ya da entry dosyanızda `zone.js` import edip `zone: true` verin. Angular 18+ change detection'ı zone.js olmadan planlar. Ayrıntılar için [Angular](/tr/guide/angular) sayfasına bakın.

### Props artık input

`update()` artık `window.__TUVIX_ANGULAR_PROPS__` alanına yazmaz. Bunun yerine `@Input()` property'leri tanımlayın; adaptör bunları `setInput` ile ayarlar.

```ts no-check
// 0.4
ngOnInit() {
  this.userId = (window as any).__TUVIX_ANGULAR_PROPS__?.admin?.userId;
}
```

```ts
// 0.5
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-admin', standalone: true, template: '{{ userId }}' })
export class AdminComponent {
  @Input() userId = '';
}
```

### Diğer Angular değişiklikleri

- `createSsrAngularMicroApp` artık `provideClientHydration()` eklemez. Sunucunun ürettiği host elemanının içine yeniden render eder.
- Modülün hiç mount etmediği bir container üzerinde `unmount` hiçbir şey yapmaz.

## Sandbox

- `Sandbox({ css: false }).activate(container)` `null` döndürür ve shadow root eklemez. `ISandbox.activate` `ShadowRoot | null` döndürür; `addStyle` çağırmadan önce `null` kontrolü yapın.
- `JsSandbox` strict modda engellenen bir yazma işleminde `TypeError` fırlatır. 0.4 bir uyarı logluyor ve değeri yine de kaydediyordu. Kodunuzun yazdığı global değişkenleri `allowedGlobals` listesine ekleyin.

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });
const shadow = sandbox.activate(container);
if (shadow) sandbox.css.addStyle(shadow, ':host { display: block; }');
```

## Server

- En az bir uygulama path ile eşleştiğinde ve tüm fragment istekleri başarısız olduğunda `createServerRenderer().render()` `statusCode: 502` döndürür. Hiçbir uygulama eşleşmediğinde ya da en az bir fragment başarılı olduğunda yine 200 döndürür. `createMiddleware` bu durum kodunu gönderir. Streaming renderer her zaman 200 gönderir.
- `createMiddleware` ve `createStreamingMiddleware`, render sırasında hata fırlatılırsa `next()` yerine `next(error)` çağırır. Böylece Express isteği sizin error handler'ınıza yönlendirir.

## Breaking change olmayan önemli düzeltmeler

- `require('@tuvix.js/core')` ve diğer CommonJS entry point'leri çalışır. 0.4'te beş paketin `require` alanı build'in hiç üretmediği dosyaları gösteriyordu.
- `getGlobalBus()` kendi instance'ını `window` üzerinde tutar. Böylece ayrı ayrı bundle'lanan mikro uygulamalar tek bir bus paylaşır.
- Adaptörler ve `defineMicroApp`, `tuvix:mounted`, `tuvix:unmounted` ve `tuvix:error` olaylarını tetikler. Ayrıntılar için [Lifecycle olayları](/tr/guide/lifecycle-events) sayfasına bakın.
- Hata fırlatan bir `bootstrap()` bir sonraki mount işleminde yeniden çalışır. 0.4 o andan sonra onu hep atlıyordu.
- `start()` sonrasında çağrılan `register()`, mevcut path uygulamayı aktif ediyorsa uygulamayı hemen mount eder. `mountWhenVisible` uygulamalarını da hemen gözlemlemeye başlar.
- Her lifecycle hatası bus üzerinde `{ name, error, phase }` içeriğiyle `tuvix:app:error` olayını yayınlar. 0.4 bu olayı yalnızca yükleme ve mount hatalarında yayınlıyordu.
- `maxListeners`, `debug` açık olsun olmasın, her olay için bir kez `console.warn` ile uyarı verir.
- `orchestrator.connectRouter()`, `setTimeout` + `reconcile()` köprülerinin yerini alır. Ayrıntılar için [Harici router](/tr/guide/external-router) sayfasına bakın.
