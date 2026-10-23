---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Angular Entegrasyonu"
  description="Angular 15+ bileşenini Tuvix.js mikro uygulamasına dönüştürür: varsayılan olarak zoneless, her container için ayrı bir uygulama, bileşen input'u olarak props ve stillerle birlikte sunucuda render."
  icon="🔺"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# veya pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

Bileşenleriniz AOT ile derlenmiyorsa (JIT) `@angular/compiler` paketini ekleyin. `renderAngularToString` çağırıyorsanız sunucuda `@angular/platform-server` ve `@angular/compiler` paketlerini de ekleyin. Client adaptörü Angular 15 veya üstünü, sunucu renderer'ı Angular 16 veya üstünü gerektirir.

## Ne zaman kullanılır

Bir Angular bileşeninin diğerlerinin arasında bir mikro uygulama olarak çalışması gerektiğinde bu paketi kullanın: orchestrator bileşeni bir route'ta container'a mount eder, props geçirir, bunları günceller ve route'tan çıkarken unmount eder. Her mount kendi Angular uygulamasını ve kendi host elemanını aldığı için birden fazla Angular uygulaması ya da aynı uygulamanın birden fazla kopyası aynı sayfayı paylaşabilir. Adaptör zone.js'i hiç yüklemez. Bu yüzden bir Angular island'ı, yanındaki React ya da Vue uygulamaları için `Promise` ya da `addEventListener` fonksiyonlarını patch'lemez.

Sayfanın tamamını Angular yönetiyorsa uygulamayı her zamanki gibi `bootstrapApplication` ile başlatın. Orada adaptör size bir şey kazandırmaz.

## Hızlı başlangıç

Input alan standalone bir bileşen:

```ts
// greeting.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}
```

Mikro uygulama entry'si bileşeni sarar:

```ts
// greeting-app.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { GreetingComponent } from './greeting.component';

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

Shell uygulamayı kaydeder ve orchestrator'ı başlatır:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'greeting',
  entry: () => import('./greeting-app'),
  container: '#greeting',
  activeWhen: '/hello',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Sonra: setInput('name', 'Grace') ve tek bir change detection turu.
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

Adaptör `#greeting` içinde bir `<app-greeting>` host elemanı oluşturur. Güncellemeden sonra eleman "Hello Grace" gösterir.

## API

### `createAngularMicroApp`

```ts no-check
function createAngularMicroApp<C>(config: AngularMicroAppConfig<C>): MicroAppModule;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Uygulama adı. Adaptör modülü bu adla, `@tuvix.js/loader` paketindeki `registerModule` fonksiyonuyla kaydeder. |
| `component` | `Type<C>` | zorunlu | Kök bileşen. Standalone bileşenler tek başına çalışır. |
| `module` | `Type<unknown>` | yok | `component` bileşenini tanımlayan NgModule. Adaptör bu modülün provider'larını `importProvidersFrom` ile ekler. |
| `providers` | `AngularProviders` | `[]` | Uygulamanın environment provider'ları, örneğin `provideHttpClient()`. |
| `selector` | `string` | bileşen selector'ının eleman kısmı, yoksa `'div'` | Adaptörün container içinde oluşturduğu host elemanının etiket adı. |
| `zone` | `boolean` | `false` | zone.js ile change detection kullanır. Client entry'niz önce `zone.js` import etmelidir. |
| `ssr` | `boolean` | `false` | `renderAngularToString` çıktısı olan markup'ı devralır. Bkz. `createSsrAngularMicroApp`. |
| `bootstrap` | `() => void \| Promise<void>` | yok | Bir kez çalışan kurulum. Modülün `bootstrap()` fonksiyonu bunu bekler. |

Her `mount({ container, props })` çağrısı:

1. `component` ya da `module` için AOT tanımı (`ɵcmp` / `ɵmod`) yoksa önce `@angular/compiler` paketini, ardından `@angular/core` ve `@angular/platform-browser` paketlerini yükler. Bu yalnızca adaptör, `@angular/core` dışında bir Angular paketini yükleyen ilk kodsa işe yarar. Bileşen dosyalarınız `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` ya da başka bir Angular kütüphanesini import ediyorsa bu paketler adaptör çalışmadan önce değerlendirilir ve "JIT compilation failed" hatasıyla başarısız olur. `import '@angular/compiler'` satırını client entry'nizin ilk satırı olarak tutun ya da AOT ile build alın.
2. Angular sürümünüze uygun change detection provider'ları (bkz. [Change detection](#change-detection)), modül provider'ları ve `providers` ile `createApplication({ providers })` çağırır.
3. Host elemanını oluşturur (`'app-greeting'` selector'ı için `<app-greeting>`, `'[card]'` gibi bir attribute selector'ı için `<div>`), container'a koyar ve bileşeni bu elemana bootstrap eder.
4. Props'u ilk change detection'dan önce `ComponentRef.setInput` ile bileşen input'larına yazar; böylece `ngOnInit` bunları baştan görür. `ComponentFactoryResolver` bulunmayan Angular sürümlerinde input'lar bootstrap'ten hemen sonra yazılır ve ardından bir tick çalışır.
5. Container üzerinde `tuvix:mounted` olayını tetikler. Hata olursa `tuvix:error` olayını tetikler ve orijinal hatayla reject olur.

`update({ props, container? })` yeni değerleri `setInput` ile yazar ve `appRef.tick()` çalıştırır. Bunu tek bir container için ya da `container` vermezseniz tüm mount'lar için yapar. Zoneless olsun ya da olmasın, her Angular sürümünde render eder.

`unmount({ container })` uygulamayı yok eder, container'ı boşaltır ve `tuvix:unmounted` olayını tetikler.

Bir NgModule içinde tanımlanmış bileşen:

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin/admin.component';
import { AdminModule } from './admin/admin.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  module: AdminModule,
  providers: [provideHttpClient()],
});
```

### `createSsrAngularMicroApp`

```ts no-check
function createSsrAngularMicroApp<C>(config: AngularSsrMicroAppConfig<C>): MicroAppModule;
```

`ssr` hariç `createAngularMicroApp` ile aynı seçenekleri alır ve `createAngularMicroApp({ ...config, ssr: true })` gibi davranır. Sunucunun `renderAngularToString` ile render ettiği island'lar için client tarafında kullanın.

Container sunucu markup'ı içeriyorsa ve host elemanı container'ın beklenen etikete sahip doğrudan çocuğuysa adaptör bu elemanı yeniden kullanır. Angular bu elemana render eder ve sunucudan gelen çocuk elemanların yerini alır. Angular bileşen stillerini `<head>` kısmına ekledikten sonra adaptör, sunucunun inline `<style>` etiketlerini ve host'un yanındaki diğer her şeyi kaldırır. `tuvix:mounted` olayı `hydrated: true` bildirir. Boş bir container normal bir client render'ı alır.

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString`

```ts no-check
// import from '@tuvix.js/angular/server'
function renderAngularToString(component: unknown, options?: AngularSsrOptions): Promise<string>;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `props` | `Record<string, unknown>` | `{}` | Input adına (ya da alias'ına) göre input değerleri. Client mount'ta olduğu gibi ilk change detection'dan önce yazılır. Input olmayan anahtarlar atlanır. |
| `providers` | `AngularProviders` | `[]` | Sunucu render'ı için environment provider'ları. |
| `appId` | `string` | `'ng'` (Angular'ın varsayılanı) | Angular `APP_ID`. Angular bunu stil etiketlerinin `ng-app-id` attribute'una yazar. |
| `document` | `string` | `<body>` içinde host elemanı bulunan boş bir doküman | Render edilecek HTML dokümanı. Host elemanını içermelidir. |
| `selector` | `string` | bileşen selector'ının eleman kısmı, yoksa `'app-root'` | Varsayılan doküman için host elemanı etiketi; Angular eşleştiği elemana bootstrap eder. |

Standalone bir bileşeni `@angular/platform-server` paketindeki `renderApplication` ile render eder ve tek bir fragment döndürür: önce render edilen `<head>` içindeki bileşen `<style>` etiketleri, ardından `<body>` içinin HTML'i. Fragment'i `createSsrAngularMicroApp` fonksiyonunun mount ettiği container'a koyun; island stilleri ilk boyamada hazır olur.

`props`, client `mount` fonksiyonunda olduğu gibi ilk change detection'dan önce `setInput` ile bileşene ulaşır. Böylece `ngOnInit` iki tarafta da bunları görür. Sunucu render'ına ve client mount'una aynı nesneyi verin, ikisi de aynı markup'ı üretir.

Render zoneless çalışır ve global `Promise` nesnesini hiç patch'lemez. Her zaman önce `@angular/compiler` paketini yükler, çünkü Node, Angular paketlerini `node_modules` içinden Angular linker olmadan yükler. Fonksiyonu tarayıcıda da çalışan koddan değil, bir sunucu fonksiyonundan çağırın: tarayıcıda `''` döndürür.

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAboutIsland(): Promise<string> {
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props: { title: 'About us' } });
  return `<section id="about" data-tuvix-app="about">${html}</section>`;
}
```

### Tipler

| Tip | Anlamı |
| --- | --- |
| `AngularMicroAppConfig<C>` | `createAngularMicroApp` seçenekleri. |
| `AngularSsrMicroAppConfig<C>` | `ssr` olmadan `AngularMicroAppConfig<C>`; `createSsrAngularMicroApp` seçenekleri. |
| `AngularSsrOptions` | `renderAngularToString` seçenekleri. Tipi `@tuvix.js/angular` paketinden import edin. |
| `AngularProviders` | `Array<Provider \| EnvironmentProviders>`: `createApplication` ve `bootstrapApplication` fonksiyonlarının kabul ettiği tip. |

## Change detection {#change-detection}

Adaptör zone.js'i hiç import etmez. `zone: true` vermediğiniz sürece Angular sürümünüzün desteklediği zoneless kurulumu seçer:

| Angular | Adaptörün eklediği provider | Change detection'ı ne tetikler |
| --- | --- | --- |
| 20 ve üstü | `provideZonelessChangeDetection()` | Template olay dinleyicileri, signal yazmaları, `markForCheck()`, `AsyncPipe`, `setInput` |
| 18 ve 19 | `provideExperimentalZonelessChangeDetection()` | 20 ile aynı |
| 15 ile 17 arası | `ɵNoopNgZone` ile değiştirilmiş `NgZone` | Kendiliğinden hiçbir şey. Host'tan gelen `update()` yine de render eder. |

Angular 18 ve üstünde, bir `setTimeout` ya da `fetch` callback'inde değiştirdiğiniz düz bir alan template'i yeniden render etmez. Bu state'i bir signal içinde tutun ya da `ChangeDetectorRef.markForCheck()` çağırın:

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  standalone: true,
  template: `<time>{{ now() }}</time>`,
})
export class ClockComponent {
  readonly now = signal(new Date().toLocaleTimeString());

  constructor() {
    setInterval(() => this.now.set(new Date().toLocaleTimeString()), 1000);
  }
}
```

Angular 15 ile 17 arasında tıklamalar ve diğer DOM olayları da change detection'ı tetiklemez. State'i değiştirdikten sonra `ChangeDetectorRef.detectChanges()` çağırın:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="increment()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  increment(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

Zone tabanlı change detection'ı korumak için adaptör mount etmeden önce client entry'nizde zone.js'i import edin ve `zone: true` verin. Adaptör bu durumda Angular'ın varsayılan `NgZone` nesnesini yerinde bırakır ve uygulamayı onun içinde bootstrap eder:

```ts
import 'zone.js';
import { createAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createAngularMicroApp({ name: 'dashboard', component: DashboardComponent, zone: true });
```

zone.js, diğer framework'lerin uygulamaları dahil tüm sayfa için `Promise`, timer'ları ve DOM dinleyicilerini patch'ler.

## Sunucuda render

1. Sunucuda `renderAngularToString(Component)` çağırın ve fragment'i container elemanına koyun.
2. Client'ta island entry'sinden `createSsrAngularMicroApp({ name, component })` export edin.
3. Orchestrator uygulamayı bu container'a mount eder. Angular sunucunun host elemanına render eder, adaptör de sunucu stillerini kaldırır.

Adaptör sunucu DOM'unun üzerine yeniden render eder. Angular'ın yıkıcı olmayan hydration'ını (`provideClientHydration`) kullanmaz, çünkü o hydration sayfanın baştan sona Angular ile render edilmiş olmasını bekler: `<body>` elemanının doğrudan çocuğu olarak Angular'ın hydration işaret yorumunu ve bileşenlerde `ngh` işaretlerini arar. React, Vue ya da düz bir sunucu template'inin render ettiği sayfadaki bir island'da bunların hiçbiri yoktur. Bedeli şu: görünen markup ve stiller HTML ile birlikte gelir, ama island içindeki state (focus, yazılmış bir değer, kaydırma konumu) Angular devraldığında sıfırlanır ve o ana kadarki tıklamalar hiçbir şey yapmaz.

Client render'ının sunucu markup'ıyla eşleşmesi için sunucu render'ına ve client mount'una aynı props'u verin. Render, bileşenin başlattığı HTTP isteklerini ya da timer'ları beklemez: veriyi önce yükleyin ve props olarak verin.

```ts
// server.ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<{ html: string; props: { text: string } }> {
  const response = await fetch('https://api.example.com/about');
  const props = { text: await response.text() };
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props });
  return { html, props };
}
```

`props` değerini sayfayla birlikte tarayıcıya gönderin (örneğin bir `<script type="application/json">` etiketinde JSON olarak) ve uygulamayı bu değerle kaydedin:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const props = JSON.parse(document.getElementById('about-props')?.textContent ?? '{}') as Record<string, unknown>;
const orchestrator = createOrchestrator();

orchestrator.register({ name: 'about', entry: () => import('./about-app'), container: '#about', props });
await orchestrator.start();
```

API base URL'i gibi input olmayan değerler için bunun yerine iki tarafta da `providers` verin.

## Sınır durumlar

- Sayfada zone.js yokken `zone: true` verilirse mount `[tuvix.js/angular] "<name>" sets zone: true, but zone.js is not loaded. Import 'zone.js' in your client entry before mounting, or drop zone: true.` hatasıyla reject olur ve `tuvix:error` olayını tetikler.
- Anahtarı bileşen input'u olmayan props atlanır, böylece Angular NG0303 uyarısı loglamaz. Input'lar public adlarıyla (tanımladıysanız alias ile) eşleştirilir.
- Eski props'ta olup yeni props'ta olmayan bir input `undefined` yapılır. Alan başlatıcısı (`name = ''`) yeniden çalışmaz.
- Mount bitmeden gelen `update` props'u saklar; bekleyen bootstrap en son değerleri kullanır. Bu modülün mount etmediği bir container için `update({ container })` hiçbir şey yapmaz.
- `mount` hâlâ Angular'ı yüklerken gelen `unmount` mount'u iptal eder: uygulama yok edilir, container boş kalır ve `tuvix:mounted` tetiklenmez. İptal bootstrap'ten sonra gelirse önce `tuvix:mounted`, ardından `tuvix:unmounted` alırsınız.
- Aynı container'da ikinci bir `mount`, yenisini bootstrap etmeden önce ilk uygulamayı yok eder.
- Bu modülün hiç mount etmediği bir container'da `unmount` hiçbir şey yapmaz.
- Uygulamayı yok etmek hata fırlatırsa adaptör container'ı boşaltır, `tuvix:error` olayını tetikler ve hatayı yeniden fırlatır.
- SSR ile, markup'ında host etiketine uyan doğrudan çocuk bulunmayan bir container yeni bir host elemanı alır. Container markup içerdiği için `hydrated` yine `true` olur.
- Sunucuda attribute selector'lı bir bileşen (`'[card]'`) bir `<app-root>` host'una düşer ve selector bu elemanla eşleşmez. `<body>` kısmında eşleşen bir eleman bulunan bir `document` verin.
- Angular 16'da `@angular/platform-server`, sunucu render'ı sırasında Domino'nun DOM sınıflarını (`Event`, `Node` ve diğerleri) Node global nesnesine kopyalar. Bunu adaptör değil, Angular yapar.
- Angular compiler plugin'i olmadan kullanılan JIT bileşenleri yine TypeScript `experimentalDecorators` ayarına ihtiyaç duyar; Angular standart decorator önerisini desteklemez.

## Ne yapmaz

- zone.js'i ya da başka bir polyfill'i yüklemez.
- `provideClientHydration()` eklemez ve yıkıcı olmayan hydration yapmaz.
- Sunucu props'unu tarayıcıya göndermez. Bunları sayfaya kendiniz serialize edin ve aynı nesneyi client mount'una verin.
- Bileşenin sunucu render'ı sırasında başlattığı HTTP çağrılarını, timer'ları ya da `PendingTasks` görevlerini beklemez.
- Client devraldığında sunucunun DOM düğümlerini, focus'u ya da form state'ini korumaz.
- Bileşene bir Tuvix props servisi ya da bus vermez. Props için input tanımlayın, diğer uygulamalarla iletişim için [`@tuvix.js/event-bus`](/tr/packages/event-bus) kullanın.

## 0.4 sürümünden geçiş

**`createAngularMicroApp` bir bileşen alır.** `platform` ve `compilerOptions` kaldırıldı. Kök bileşeni `component` olarak, bir NgModule içinde tanımlıysa modülü de `module` olarak verin.

```ts no-check
// 0.4
createAngularMicroApp({
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

export default createAngularMicroApp({ name: 'admin', component: AppComponent, module: AppModule });
```

**Props input'tur.** `update()` artık `window.__TUVIX_ANGULAR_PROPS__` alanına yazmaz. Bu global'i okuyan servisleri silin ve bunun yerine prop adlarıyla `@Input()` alanları tanımlayın.

**Varsayılan olarak zoneless.** `zone: true` vermediğiniz sürece uygulamalar zone.js olmadan çalışır. Angular 15 ile 17 arasında DOM olayları artık change detection'ı tetiklemez; handler'larda `ChangeDetectorRef.detectChanges()` çağırın ya da zone.js'i açın. Entry'nizden `provideZonelessChangeDetection()` satırını kaldırabilirsiniz. `import '@angular/compiler'` satırını yalnızca bileşen dosyalarınız `@angular/core` dışında Angular'dan hiçbir şey import etmiyorsa kaldırın; aksi halde onu client entry'nin ilk satırı olarak tutun ya da AOT ile build alın.

**Otomatik `provideClientHydration()` yok.** `createSsrAngularMicroApp` sunucu markup'ının üzerine yeniden render eder. `provideClientHydration()` çağrısını bu fonksiyonun `providers` listesine koymayın.

**`appId` artık etkili.** 0.4'te `renderAngularToString`, `appId` değerini kabul edip yok sayıyordu. Artık Angular'ın `APP_ID` değerini ayarlar, bu yüzden stil etiketlerindeki `ng-app-id` attribute'u `ng` yerine sizin değerinizi alır.

**Host elemanı.** Client'ta ve sunucuda host etiketi sabit bir `'app-root'` yerine bileşen selector'ından gelir ve client adaptörü bu elemanı container içinde oluşturur. Modülün hiç mount etmediği bir container'da `unmount` artık container'ı temizlemez.

Eksiksiz bir uygulama için [Angular rehberine](/tr/guide/angular) bakın.
