# @tuvix.js/angular

> Tuvix.js mikro frontend framework'ü için Angular 15+ bağlamaları

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır.

## Kurulum

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

JIT bileşenleri için `@angular/compiler` paketini ekleyin. `renderAngularToString` için sunucuda `@angular/platform-server` ve `@angular/compiler` paketlerini ekleyin (Angular 16+).

## Hızlı başlangıç

```ts
import { Component, Input } from '@angular/core';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

Adaptör modülü `@tuvix.js/loader` paketindeki `registerModule` fonksiyonuyla kaydeder. Orchestrator'dan gelen props'lar bileşen input'larına dönüşür:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'greeting', entry: () => import('./greeting-app'), container: '#greeting', props: { name: 'Ada' } });
await orchestrator.start();
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

## API

### `createAngularMicroApp(config)`

| Seçenek | Tür | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | `registerModule` ile kaydedilen uygulama adı |
| `component` | `Type<C>` | zorunlu | Kök bileşen |
| `module` | `Type<unknown>` | yok | `component` bileşenini tanımlayan NgModule; provider'ları `importProvidersFrom` ile eklenir |
| `providers` | `AngularProviders` | `[]` | `provideHttpClient()` gibi environment provider'ları |
| `selector` | `string` | bileşen selector'ının eleman kısmı, yoksa `'div'` | Host elemanının etiket adı |
| `zone` | `boolean` | `false` | zone.js kullanır; entry dosyanız önce `zone.js` import etmelidir |
| `ssr` | `boolean` | `false` | `renderAngularToString` çıktısı olan markup'ı devralır |
| `bootstrap` | `() => void \| Promise<void>` | yok | Tek seferlik kurulum |

- Her mount `createApplication` çağırır ve bileşeni container içindeki kendi host elemanına bootstrap eder. Böylece iki Angular uygulaması (ya da aynı uygulamanın iki kopyası) tek bir `app-root` üzerinde hiçbir zaman çakışmaz.
- Props'lar ilk change detection'dan önce `ComponentRef.setInput` ile atanır, bu yüzden `ngOnInit` onları görür. Input olmayan anahtarlar atlanır.
- `update({ props, container? })` yeni input'ları atar ve tek bir container ya da tüm mount'lar için `appRef.tick()` çalıştırır. Yeni props'larda olmayan input'lar `undefined` değerine sıfırlanır.
- JIT bileşenleri (`ɵcmp` olmayanlar) için `@angular/compiler`, `@angular/platform-browser` paketinden önce yüklenir. Bu yalnızca adaptör, `@angular/core` dışında bir Angular paketini yükleyen ilk kodsa işe yarar. Bileşen dosyalarınız `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` ya da başka bir Angular kütüphanesini import ediyorsa bu paketler adaptör çalışmadan önce değerlendirilir ve "JIT compilation failed" hatasıyla başarısız olur. `import '@angular/compiler'` satırını client entry'nizin ilk satırı olarak tutun ya da AOT ile build alın.
- `unmount` uygulamayı yok eder, container'ı boşaltır ve `tuvix:unmounted` olayını tetikler. `mount` hâlâ yüklenirken çağrılırsa mount'u iptal eder.

### `createSsrAngularMicroApp(config)`

`createAngularMicroApp({ ...config, ssr: true })` ile aynıdır. Container sunucu markup'ı içeriyorsa Angular sunucunun host elemanına render eder ve adaptör sunucunun satır içi `<style>` etiketlerini kaldırır. `tuvix:mounted`, `hydrated: true` bildirir.

Bu, sunucu DOM'unun üzerine yeniden render eder. Angular'ın yıkıcı olmayan hydration'ı (`provideClientHydration`), doğrudan `<body>` altında bir hydration işaretçi yorumuna ihtiyaç duyar. Başka bir sayfanın içindeki bir island bunu sağlayamaz, bu yüzden adaptör onu eklemez.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `@tuvix.js/angular/server` içinden `renderAngularToString(component, options?)`

| Seçenek | Tür | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `providers` | `AngularProviders` | `[]` | Sunucu render'ı için provider'lar |
| `appId` | `string` | `'ng'` | Angular `APP_ID` |
| `document` | `string` | host elemanını içeren boş belge | Render edilecek belge |
| `selector` | `string` | bileşen selector'ının eleman kısmı, yoksa `'app-root'` | Varsayılan belge için host etiketi |
| `props` | `Record<string, unknown>` | `{}` | Bileşen input'larının değerleri, ilk change detection'dan önce atanır |

Bileşenin `<style>` etiketlerini ve ardından body markup'ını döndürür. Zoneless çalışır, `Promise` nesnesini hiçbir zaman patch'lemez ve bileşenin başlattığı HTTP isteklerini beklemez. Bir sunucu fonksiyonundan çağırın; tarayıcıda `''` döndürür.

`props` istemci props'ları gibi çalışır: anahtarlar input adlarıdır (veya alias'ları), input olmayan anahtarlar atlanır ve `ngOnInit` değerleri görür. İki tarafın aynı markup'ı render etmesi için sunucu render'ına ve `mount` fonksiyonuna aynı nesneyi verin.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

const props = { name: 'Ada' };
const aboutHtml = await renderAngularToString(AboutComponent, { appId: 'about', props });
// İstemci: aboutApp.mount({ container, props })
```

### Tipler

`AngularMicroAppConfig<C>`, `AngularSsrMicroAppConfig<C>`, `AngularSsrOptions`, `AngularProviders` (hepsi `@tuvix.js/angular` paketinden).

## Change detection

Adaptör zone.js'i hiçbir zaman import etmez. `zone: true` yoksa Angular 20+ sürümünde `provideZonelessChangeDetection()`, 18-19 sürümlerinde `provideExperimentalZonelessChangeDetection()` ekler, 15-17 sürümlerinde de `NgZone` yerine `ɵNoopNgZone` koyar.

- Angular 18+: event listener'lar, signal'ler, `markForCheck()` ve `AsyncPipe` change detection planlar. Bir timer veya `fetch` callback'i içinde değiştirilen düz bir alan planlamaz; signal veya `markForCheck()` kullanın.
- Angular 15-17: DOM olayları change detection tetiklemez. State'i değiştirdikten sonra `ChangeDetectorRef.detectChanges()` çağırın ya da `zone: true` verin.

## Sınır durumlar

- zone.js yüklenmeden `zone: true` kullanılırsa mount reject olur ve `tuvix:error` olayı tetiklenir.
- Bu modülün hiç mount etmediği bir container üzerinde `unmount` hiçbir şey yapmaz.
- Angular 16'da `@angular/platform-server`, sunucu render'ı sırasında Domino'nun DOM sınıflarını (`Event`, `Node`, ...) Node global nesnesine kopyalar. Bunu adaptör değil, Angular yapar.
- Attribute selector kullanan bileşenler sunucuda eşleşen bir host elemanı içeren bir `document` ister.

## Ne yapmaz

- zone.js yüklemez, `provideClientHydration()` eklemez, sunucu DOM node'larını ve form state'ini korumaz.
- `window.__TUVIX_ANGULAR_PROPS__` alanına yazmaz; input tanımlayın.

Dokümantasyonun tamamı: [tuvix.js.org/tr/packages/angular](https://tuvix.js.org/tr/packages/angular)

## Lisans

MIT
