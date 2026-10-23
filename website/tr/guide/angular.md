# Angular ile

`@tuvix.js/angular` bir Angular bileşenini mikro uygulama olarak bootstrap eder ve varsayılanda zone.js kullanmaz. Standalone bileşenleri sunucuda HTML'e de render eder.

Angular 15 ve sonrasını destekler. `renderAngularToString` için Angular 16 veya sonrası ve `@angular/platform-server` gerekir.

## Kurulum

```bash
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
# JIT components (no AOT build step) also need the compiler
pnpm add @angular/compiler
# for renderAngularToString
pnpm add @angular/platform-server
```

## Bileşeni mikro uygulamaya dönüştürme

```ts
// src/main.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin.component';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  providers: [provideHttpClient()],
});
```

| Seçenek | Tip | Açıklama |
| --- | --- | --- |
| `name` | `string` | Zorunlu. Kayıtlı uygulama adıyla aynı olmalı. |
| `component` | `Type<C>` | Zorunlu. Kök bileşen; standalone ya da `module` içinde tanımlı. |
| `module` | `Type<unknown>` | `component` bileşenini tanımlayan NgModule. Provider'ları `importProvidersFrom` ile içe aktarılır. |
| `providers` | `Array<Provider \| EnvironmentProviders>` | Environment provider'ları. |
| `selector` | `string` | Host elemanının etiketi. Varsayılan: bileşen selector'ının eleman kısmı, o da yoksa `div`. |
| `zone` | `boolean` | zone.js ile change detection kullanır. Varsayılan `false`. |
| `ssr` | `boolean` | `renderAngularToString` çıktısı olan markup'ı devralır. `createSsrAngularMicroApp` bunu açar. |
| `bootstrap` | `() => void \| Promise<void>` | İlk mount'tan önce bir kez çalışır. |

Her mount `createApplication` çağırır ve bileşeni container içindeki kendi host elemanına bootstrap eder. Aynı sayfadaki iki Angular uygulaması ya da iki container'daki tek modül, ortak bir `app-root` üzerinde çakışmaz.

Bileşende derlenmiş `ɵcmp` yoksa (JIT), adaptör `@angular/compiler` paketini `@angular/platform-browser` paketinden önce yükler. Bu yalnızca adaptör, `@angular/core` dışında bir Angular paketini yükleyen ilk kodsa işe yarar. Bileşen dosyalarınız `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` ya da başka bir Angular kütüphanesini import ediyorsa bu paketler adaptör çalışmadan önce değerlendirilir ve "JIT compilation failed" hatasıyla başarısız olur. `import '@angular/compiler'` satırını client entry'nizin ilk satırı olarak tutun ya da AOT ile build alın.

## Props'tan gelen input'lar

Props'ları bileşen input'ları olarak tanımlayın:

```ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `<h1>Admin for {{ userId }}</h1>`,
})
export class AdminComponent {
  @Input() userId = '';
}
```

- Mount, input'ları ilk change detection'dan önce `ComponentRef.setInput` ile atar; böylece `ngOnInit` bunları görür.
- `update({ props })` yeni değerleri atar ve change detection çalıştırır. `container` verilirse yalnızca o mount'u günceller.
- Input olmayan anahtarlar atlanır. Yeni props'ta olmayan input'lar `undefined` değerine döner.

## zone.js olmadan change detection

Adaptör zone.js'i hiçbir zaman import etmez, bu yüzden sayfada ya da sunucuda `Promise`, zamanlayıcılar veya DOM olayları üzerinde yama yapmaz. Provider'ı Angular sürümüne göre seçer:

| Angular | Provider | DOM olayları change detection tetikler mi |
| --- | --- | --- |
| 20+ | `provideZonelessChangeDetection()` | evet |
| 18-19 | `provideExperimentalZonelessChangeDetection()` | evet |
| 15-17 | `NgZone` yerine işlem yapmayan bir zone | hayır |

Angular 15-17'de bir tıklamadan sonra change detection'ı hiçbir şey çalıştırmaz. Handler'larınızda `detectChanges()` çağırın:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="add()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  add(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

Zone tabanlı change detection'ı korumak için istemci entry'nizin en üstünde `zone.js` import edin ve `zone: true` geçirin. zone.js yüklü değilse `mount` reject olur.

## Sunucuda render

```ts
// server-only module
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<string> {
  return renderAngularToString(AboutComponent, { appId: 'about', props: { userId: '42' } });
}
```

```ts
// client
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export const about = createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

- `renderAngularToString(component, { props?, providers?, appId?, document?, selector? })` önce bileşenin `<style>` etiketlerini, ardından host elemanını döndürür. Böylece island ilk boyamada stilli görünür. Zone olmadan çalışır.
- `props`, istemcide `mount` ne yapıyorsa onu yapar: bileşen input'larını ilk change detection'dan önce atar. Input olmayan anahtarlar atlanır. İstemcide island'a aynı props'u verin, yoksa hydration farklı içerik gösterir.
- Bileşenin başlattığı HTTP isteklerini veya zamanlayıcıları beklemez. Veriyi önce yükleyin ve provide edin.
- Sunucu kodundan çağırın. Tarayıcıda `''` döndürür.

İstemcide `createSsrAngularMicroApp` sunucunun host elemanına render eder, Angular kendi stillerini ekledikten sonra sunucudan gelen satır içi `<style>` etiketlerini kaldırır. `tuvix:mounted` olayı `hydrated: true` bildirir. Bu işlem sunucu DOM'unu değiştirir. Angular'ın yıkıcı olmayan hydration'ı doğrudan `<body>` altında bir işaretçi ister; başka bir sayfanın içindeki island bunu sağlayamaz. Bu yüzden adaptör `provideClientHydration()` eklemez.

## Event bus

```ts
import { Component, OnDestroy, signal } from '@angular/core';
import { getGlobalBus } from '@tuvix.js/event-bus';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  template: `<span>{{ count() }}</span>`,
})
export class CartBadgeComponent implements OnDestroy {
  readonly count = signal(0);
  private readonly off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) =>
    this.count.set(itemCount),
  );

  ngOnDestroy(): void {
    this.off();
  }
}
```

Angular 18+ zoneless modda signal'lar change detection'ı kendileri planlar. 15-17'de `set` çağrısından sonra `ChangeDetectorRef.detectChanges()` çağırın.

## Adaptörün yapmadıkları

- zone.js'i veya `@angular/localize` paketini yüklemez. Gerekiyorsa entry dosyanızda import edin.
- Yıkıcı olmayan hydration yapmaz; yukarıya bakın.
- Mount'lar arasında state paylaştırmaz. Her mount kendi root injector'ı olan ayrı bir Angular uygulamasıdır, yani `providedIn: 'root'` bir servis her mount için bir kez oluşur.

## API

| Export | Amaç |
| --- | --- |
| `createAngularMicroApp({ name, component, module?, providers?, selector?, zone?, ssr?, bootstrap? })` | Angular mikro uygulama modülü |
| `createSsrAngularMicroApp(config)` | `ssr: true` ile aynısı |
| `@tuvix.js/angular/server` paketinden `renderAngularToString(component, options?)` | Stiller + host elemanı HTML'i |
