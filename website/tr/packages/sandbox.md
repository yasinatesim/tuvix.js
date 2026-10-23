---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="Sandbox"
  description="Yeniden kullanılabilir bir Shadow DOM root içinde CSS izolasyonu, stil dosyalarının bu root'a alınması ve script global'lerini gerçek window'dan uzak tutan bir Proxy window."
  icon="🔒"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Ne zaman kullanılır

Bir mikro uygulamanın CSS'i ile sayfanın CSS'i birbirine dokunmamalıysa `CssSandbox` kullanın. Uygulamanın DOM'unu container üzerindeki açık bir shadow root'a taşır; böylece uygulamanın seçicileri içeride, sayfanın seçicileri dışarıda kalır. `@tuvix.js/core` içindeki orchestrator, bir uygulamayı `sandbox: true` ile kaydettiğinizde bunu sizin yerinize yapar. Uygulamaları orchestrator olmadan mount ediyorsanız bu paketi kendiniz çağırın.

Üçüncü parti script metni çalıştırıyorsanız ve global yazmalarının gerçek `window` nesnesine ulaşmasını istemiyorsanız `JsSandbox` kullanın. Kodu `execScript` ile çalıştırırsınız; bu fonksiyon `window`, `this` ve serbest identifier'ları bir Proxy üzerinden çözer. Orchestrator bunu uygulamaz.

Güvenilmeyen kod için sıkı bir izolasyon gerekiyorsa başka bir şey seçin. `sandbox` attribute'lu bir `<iframe>`, koda kendi global nesnesini ve origin'ini verir; bu paket vermez.

## Hızlı başlangıç

Orchestrator üzerinden (yalnızca CSS):

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'cart',
  entry: { scripts: ['/apps/cart/main.js'], styles: ['/apps/cart/style.css'] },
  container: '#cart',
  activeWhen: '/cart/*',
  sandbox: true,
});

await orchestrator.start();
```

Orchestrator `#cart` elemanını bir shadow root ile sarar, uygulamayı onun içindeki bir `<div data-tuvix-sandbox-root="cart">` elemanına render eder ve `style.css` dosyasını `<head>` yerine shadow root'a yükler. Mount bu stil dosyalarını loader `timeout` süresi boyunca (varsayılan 10000 ms) bekler. Uygulama yeniden mount edildiğinde orchestrator aynı shadow root'u kullanır.

Elle:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container);
const target = shadowRoot ?? container;

const adopted = sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });
await adopted.ready;
target.append(Object.assign(document.createElement('p'), { textContent: 'Cart' }));

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // children back in the light DOM, styles set aside
sandbox.activate(container); // same shadow root, styles restored
sandbox.destroy(container);
```

## API

### `createSandbox`

```ts
import type { ISandbox, SandboxOptions } from '@tuvix.js/sandbox';

declare function createSandbox(options?: SandboxOptions): ISandbox;
```

`new Sandbox(options)` döndürür.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` container'ı bir shadow root ile sarar. `false` olduğunda `activate` `null` döndürür ve hiçbir şey eklemez. |
| `js` | `boolean` | `true` | `activate`/`deactivate`, `sandbox.js.active` değerini açıp kapatır. `sandbox.js.proxyWindow` üzerindeki proxy her iki durumda da yazmaları gerçek `window` nesnesinden uzak tutar. |
| `allowedGlobals` | `string[]` | `[]` | Strict modun sandbox içindeki koda atama izni verdiği ek global adları. Bunlara yapılan yazmalar da proxy üzerinde kalır. |
| `strict` | `boolean` | `false` | Sandbox içindeki kod yerleşik izin listesi ve `allowedGlobals` dışındaki bir global'e atama yaptığında veya onu tanımladığında `TypeError` fırlatır. |

### `Sandbox`

```ts
import { Sandbox } from '@tuvix.js/sandbox';

const sandbox = new Sandbox({ css: false, js: true });
console.log(sandbox.activate(document.body)); // null
```

`createSandbox` arkasındaki sınıf. `ISandbox` arayüzünü uygular:

| Üye | İmza | Davranış |
| --- | --- | --- |
| `css` | `readonly ICssSandbox` | Kullandığı `CssSandbox` instance'ı. |
| `js` | `readonly IJsSandbox` | Kullandığı `JsSandbox` instance'ı. |
| `activate` | `(container: HTMLElement) => ShadowRoot \| null` | `css` açıksa `css.wrap(container)`, ardından `js` açıksa `js.activate()` çağırır. Shadow root'u ya da `null` döndürür. |
| `deactivate` | `(container: HTMLElement) => void` | `js.deactivate()`, ardından `css.unwrap(container)` çağırır. |
| `destroy` | `(container: HTMLElement) => void` | `deactivate(container)`, ardından saklanan tüm global'leri temizleyen `js.reset()` çağırır. |

### `CssSandbox`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const container = document.querySelector<HTMLElement>('#widget')!;

const shadowRoot = cssSandbox.wrap(container);
const style = cssSandbox.addStyle(shadowRoot, ':host { display: block; } p { color: teal; }');
cssSandbox.unwrap(container); // the <style> leaves the DOM and waits for the next wrap
cssSandbox.removeStyle(shadowRoot, style); // removed for good: the next wrap does not restore it
```

| Metot | İmza | Davranış |
| --- | --- | --- |
| `wrap` | `(container: HTMLElement) => ShadowRoot` | Container'ın alt elemanlarını açık bir shadow root'a taşır ve onu döndürür. |
| `unwrap` | `(container: HTMLElement) => void` | Alt elemanları light DOM'a geri taşır, shadow root'un stil dosyalarını kenara ayırır ve shadow root içinde bir `<slot>` bırakır. |
| `addStyle` | `(shadowRoot: ShadowRoot, css: string) => HTMLStyleElement` | Shadow root'un sonuna `css` içeren bir `<style>` ekler. |
| `removeStyle` | `(shadowRoot: ShadowRoot, styleEl: HTMLStyleElement) => void` | `styleEl` elemanını kaldırır. Host unwrap durumdaysa `styleEl` elemanını kenara ayrılanlar listesinden de çıkarır, böylece sonraki `wrap` onu geri getirmez. |
| `adoptStyles` | `(shadowRoot: ShadowRoot, styles: AdoptStylesOptions) => AdoptedStyles` | Shadow root'un başına `<link>` ve `<style>` elemanları ekler. |

#### `wrap` ve yeniden mount'lar

Bir DOM elemanı, eklendikten sonra shadow root'unu kaybedemez. `wrap` bunu şöyle ele alır:

1. Bu `CssSandbox` instance'ı container'ı zaten sardıysa ve henüz unwrap etmediyse `wrap` aynı shadow root'u döndürür ve hiçbir şeyi taşımaz.
2. Container'ın açık bir `shadowRoot` alanı varsa (önceki bir `wrap`, bir `unwrap` ya da başka bir `CssSandbox` instance'ından), `wrap` `unwrap` fonksiyonunun bıraktığı `<slot>` elemanını kaldırır, `unwrap` fonksiyonunun kenara ayırdığı stil dosyalarını (başa, orijinal sıralarıyla) geri koyar ve root'u yeniden kullanır.
3. Aksi halde `container.attachShadow({ mode: 'open' })` çağırır.

Ardından light DOM'daki her alt elemanı shadow root'a taşır. `wrap` yalnızca `attachShadow` başarısız olduğunda hata fırlatır. Örneğin shadow root barındıramayan bir elemanda (`<img>`, `<input>`) ya da zaten kapalı bir root'u olan bir elemanda: `[Tuvix Sandbox] Cannot attach Shadow DOM to <img>: ...`.

#### `unwrap` ve slot

`unwrap` shadow root'un alt elemanlarını container'a geri taşır. `addStyle`, `adoptStyles` ya da uygulamadan gelmiş olsun, `<style>` ve `<link rel="stylesheet">` node'larını DOM'dan çıkarır; böylece uygulamanın CSS'i uygulanmayı bırakır ve hiçbir zaman sayfaya ulaşmaz. Bu node'ları shadow root ile birlikte saklar. Shadow root yerinde kalır ve tek bir `<slot data-tuvix-sandbox-slot>` içerir; tarayıcı geri taşınan alt elemanları bu slot üzerinden render eder. `unwrap`, bu instance'ın sarmadığı bir container için hiçbir şey yapmaz.

O host'un bir sonraki `wrap` çağrısı, ister bu ister başka bir `CssSandbox` instance'ından gelsin, slot'u kaldırır, kenara ayrılan stil dosyalarını sırasıyla geri koyar ve alt elemanları yeniden içeri taşır. Yeniden mount sonrasında stilleri tekrar almanız gerekmez. Host unwrap durumdayken `removeStyle(shadowRoot, el)` veya `adopted.remove()` çağırırsanız o stiller kalıcı olarak silinir.

#### `adoptStyles`

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

const cssSandbox = new CssSandbox();
const shadowRoot = cssSandbox.wrap(document.querySelector<HTMLElement>('#cart')!);

const adopted = cssSandbox.adoptStyles(shadowRoot, {
  urls: ['/apps/cart/style.css', '/shared/tokens.css'],
  cssText: ':host { display: block; }',
});

await adopted.ready; // every <link> fired load or error
console.log(adopted.elements.length); // 3

adopted.remove();
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `urls` | `readonly string[]` | `[]` | Her URL sırasıyla bir `<link rel="stylesheet" data-tuvix-style>` olur. |
| `cssText` | `string \| readonly string[]` | yok | Her string, link'lerden sonra yerleştirilen bir `<style data-tuvix-style>` olur. |

Davranış:

- Elemanlar shadow root'un başına, daha önce alınmış stillerin arkasına eklenir; böylece uygulama içeriği ve `addStyle` stilleri cascade'de daha sonra gelir.
- Bu shadow root'a daha önce alınmış bir URL atlanır ve `elements` içinde yer almaz. `unwrap` fonksiyonunun kenara ayırdığı link'ler de buna dahildir. Mevcut link daha önceki bir çağrıyla oluşturulduysa `ready` yine onu bekler.
- `ready`, her link `load` veya `error` olayını tetiklediğinde resolve olur. Hiçbir zaman reject olmaz, bu yüzden 404 veren bir stil dosyası sizi bekletmez. jsdom bu olayların hiçbirini tetiklemez; jsdom testlerinde `ready` değerini await etmeyin.
- `remove()` yalnızca bu çağrının eklediği elemanları (kenara ayrılmış olanlar dahil) kaldırır, böylece sonraki `wrap` onları geri getirmez.

### `JsSandbox`

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const jsSandbox = new JsSandbox(['analyticsQueue'], true);
jsSandbox.activate();

jsSandbox.execScript('window.analyticsQueue = []'); // allowed, stored on the proxy
console.log('analyticsQueue' in window); // false
console.log(Reflect.get(jsSandbox.proxyWindow, 'analyticsQueue')); // []

try {
  jsSandbox.execScript('window.tracker = {}');
} catch (error) {
  console.log(error instanceof TypeError); // true
}

jsSandbox.reset();
```

Constructor: `new JsSandbox(allowedGlobals: string[] = [], strict = false)`.

| Üye | İmza | Davranış |
| --- | --- | --- |
| `proxyWindow` | `readonly WindowProxy` | Gerçek `window` üzerinde bir Proxy. |
| `active` | `readonly boolean` | `activate` ile açılan, `deactivate`/`reset` ile kapanan bayrak. |
| `activate` | `() => void` | `active` değerini `true` yapar. |
| `deactivate` | `() => void` | `active` değerini `false` yapar. Saklanan global'ler kalır. |
| `execScript` | `(code: string) => unknown` | `code` değerini `new Function` ile, `with (scope)` içinde sloppy mode script olarak çalıştırır. `window`, `self`, `globalThis` ve en üst seviyedeki `this` proxy'dir, serbest identifier'lar da onun üzerinden çözülür. `eval("...")` bu scope içinde direct eval olarak kalır. Kodun döndürdüğü değeri döndürür. |
| `reset` | `() => void` | Saklanan tüm global'leri temizler ve `active` değerini `false` yapar. |

Proxy:

- Okumalar önce sandbox'ın kendi deposuna bakar, sonra gerçek `window` nesnesine düşer. Gerçek window'daki `prototype` alanı olmayan fonksiyonlar (`fetch`, `setTimeout`) gerçek `window` nesnesine bağlanmış olarak döner. Bağlama her fonksiyon için bir kez yapılır, bu yüzden `proxyWindow.fetch === proxyWindow.fetch`.
- `proxyWindow.window`, `.self`, `.globalThis` ve sayfa bir iframe içinde değilken `.top`/`.parent`/`.frames` proxy'nin kendisini döndürür. Iframe içinde `top` ve `parent` gerçek değerlerini korur.
- Atamalar ve `Object.defineProperty` değeri proxy üzerinde saklar. Gerçek `window` hiç değişmez. `value` içermeyen bir descriptor (`{ enumerable: false }`) saklanan değeri korur. Accessor descriptor'lar (`get`/`set`) ve `configurable: false`, `Object.defineProperty` çağrısının `TypeError` fırlatmasına yol açar.
- `delete proxyWindow.x` saklanan bir değeri siler. Gerçek window'a ait bir alan için `false` döndürür; bu da strict mode kodda `TypeError` fırlatır.
- `in` hem depoya hem gerçek `window` nesnesine bakar.

Strict mod (`strict: true`): yerleşik izin listesi ve `allowedGlobals` dışındaki bir isim için yapılan atama (`window.x = 1` ya da yalın `x = 1`), en üst seviyedeki `var x = 1` veya `Object.defineProperty` çağrısı `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "tracker". Add it to allowedGlobals to permit it.` fırlatır ve hiçbir şey saklamaz. Kontrol sandbox aktif olsun ya da olmasın çalışır. Symbol anahtarlar her zaman engellenmiş sayılır. Yerleşik izin listesi `console`, timer'lar, `Promise`, `Map`, `JSON`, `fetch`, `URL`, `navigator`, `document`, `location` ve `history` gibi standart global'leri kapsar. İzin verilen yazmalar, bu isimlere yapılanlar dahil, proxy üzerinde kalır.

### Tipler

| Tip | Anlamı |
| --- | --- |
| `SandboxOptions` | `{ css?, js?, allowedGlobals?, strict? }`, `createSandbox` seçenekleri. |
| `ISandbox` | `Sandbox` sınıfının uyguladığı arayüz: `css`, `js`, `activate`, `deactivate`, `destroy`. |
| `ICssSandbox` | `CssSandbox` sınıfının uyguladığı arayüz. |
| `IJsSandbox` | `JsSandbox` sınıfının uyguladığı arayüz. |
| `AdoptStylesOptions` | `adoptStyles` için `{ urls?, cssText? }`. |
| `AdoptedStyles` | `adoptStyles` fonksiyonunun döndürdüğü `{ elements, ready, remove }`. |

## Sınır durumlar

- `execScript` içinde `x = 1`, en üst seviyedeki `var x = 1`, `window.x = 1`, `window.window.x = 1`, `top.x = 1` ve aynı ifadelerin `eval("...")` içindeki halleri `x` değerini her zaman proxy üzerinde saklar, asla gerçek `window` üzerinde değil. `let` ve `const` script'e yerel kalır.
- `execScript` içinde tanımlanmamış bir identifier'ı okumak `ReferenceError` fırlatmak yerine `undefined` döndürür. `code` içindeki bir `"use strict"` direktifinin de etkisi yoktur, çünkü `with` sloppy mode ister.
- `f()` gibi düz bir fonksiyon çağrısının içinde `this`, sloppy mode JavaScript'in tanımladığı gibi gerçek global nesnedir. Böyle bir fonksiyondaki `this.x = 1` gerçek `window` nesnesine yazar. `execScript` ile çalıştırdığınız kodda `window.x = 1` yazın.
- `execScript` `new Function` kullanır, bu yüzden `'unsafe-eval'` içermeyen bir Content Security Policy onu engeller.
- `JsSandbox`, `Sandbox` ya da `createSandbox()` oluşturulurken `window` okunur, bu yüzden sunucuda `ReferenceError` fırlatırlar. `CssSandbox` ise `document` nesnesine yalnızca metotlarını çağırdığınızda ihtiyaç duyar.
- İki `CssSandbox` instance'ı aynı host'u paylaşabilir. İkinci `wrap`, ilk instance'ın shadow root'unu yeniden kullanır.
- Container sarılıyken eklediğiniz light DOM alt elemanları shadow root'un dışında kalır ve hiçbir slot üzerinden render edilmez, bu yüzden görünmezler. Bunun yerine shadow root'un içine ekleyin.
- `Sandbox({ css: false }).activate()` `null` döndürür. Container'ın içine render edin.

## Ne yapmaz

- Timer'lara, event listener'lara, `document` nesnesine ya da `<script>` etiketlerine yama yapmaz. `proxyWindow` üzerinden geçmeyen kod gerçek sayfayı etkiler.
- Bir uygulamanın geride bıraktığı interval'leri veya listener'ları temizlemez. Bunları uygulamanın `unmount` fonksiyonunda temizleyin.
- Koda ayrı bir origin ya da global nesne vermez. Güvenilmeyen kod için `<iframe sandbox>` kullanın.
- Bir shadow root'u ayırmaz. DOM'da bunun için bir API yoktur; `unwrap` bunun yerine bir slot bırakır.
- Kalıtımı durdurmaz. Host ya da üst elemanları üzerinde tanımlanan `color`, `font-family` ve CSS custom property'leri shadow root'a akmaya devam eder.

## 0.4 sürümünden geçiş

- `Sandbox({ css: false }).activate(container)` `null` döndürür ve shadow root eklemez. 0.4'te bir shadow root ekliyor ve container'ın alt elemanlarını gizliyordu. `ISandbox.activate` artık `ShadowRoot | null` döndürür:

  ```ts
  import { createSandbox } from '@tuvix.js/sandbox';

  const container = document.querySelector<HTMLElement>('#app')!;
  const sandbox = createSandbox({ css: false });

  // 0.4: const root: ShadowRoot = sandbox.activate(container);
  const root = sandbox.activate(container) ?? container;
  ```

- `strict: true` engellenen bir yazmada `TypeError` fırlatır. 0.4'te bir uyarı loglayıp değeri saklıyordu. Script'lerinizin atadığı isimleri `allowedGlobals` listesine ekleyin.
- `execScript` kodu bir `with` bloğu içinde çalıştırır. Kod strict mode olamaz, tanımlanmamış bir identifier'ı okumak hata fırlatmak yerine `undefined` döndürür ve yalın bir `x = 1` artık gerçek `window` yerine proxy üzerine düşer.
- `unwrap` shadow root'un stil dosyalarını saklar ve sonraki `wrap` onları geri getirir. 0.4'te `unwrap` onları siliyordu. Yeniden mount sonrasında `cssText` veya `addStyle` stillerini tekrar ekleyen kodu kaldırın, yoksa stiller iki kez eklenir.
- 0.4 dokümantasyonu `js: true` seçeneğinin `addEventListener`, timer'lar ve `document.createElement` çağrılarını yakaladığını söylüyordu. Hiçbir zaman yakalamadı, 0.5 de yakalamıyor.
