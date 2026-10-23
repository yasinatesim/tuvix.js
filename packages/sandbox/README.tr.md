# @tuvix.js/sandbox

> Yeniden mount sonrasında da korunan Shadow DOM CSS izolasyonu, stil dosyalarının root'a alınması ve script global'leri için bir Proxy window

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır. Dokümantasyonun tamamı: [tuvix.js.org/tr/packages/sandbox](https://tuvix.js.org/tr/packages/sandbox).

`CssSandbox`, bir mikro uygulamanın DOM'unu açık bir shadow root içine taşır; böylece uygulamanın CSS'i ile sayfanın CSS'i birbirinden ayrı kalır. `@tuvix.js/core` içindeki orchestrator, bir uygulamayı `sandbox: true` ile kaydettiğinizde onu kullanır. `JsSandbox`, üzerinden çalıştırdığınız kodun `window.x = ...` yazmalarını gerçek `window` nesnesinden uzak tutar. Bir Proxy'dir, güvenlik sınırı değildir; güvenilmeyen kod için `<iframe sandbox>` kullanın.

## Kurulum

```bash
npm install @tuvix.js/sandbox
# or pnpm add @tuvix.js/sandbox
```

## Hızlı başlangıç

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const container = document.getElementById('cart')!;
const sandbox = createSandbox({ css: true, js: true, strict: true, allowedGlobals: ['cartState'] });

const shadowRoot = sandbox.activate(container); // ShadowRoot, css: false ise null
sandbox.css.adoptStyles(shadowRoot!, { urls: ['/apps/cart/style.css'] });

sandbox.js.execScript('window.cartState = { items: 0 }');
console.log('cartState' in window); // false

sandbox.deactivate(container); // alt elemanlar light DOM'a döner, stiller kenara ayrılır
sandbox.activate(container); // aynı shadow root, stiller geri gelir
sandbox.destroy(container);
```

## API

### `createSandbox(options?)` ve `Sandbox`

`createSandbox(options)`, `ISandbox` tipinde bir `new Sandbox(options)` döndürür.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `css` | `boolean` | `true` | `activate` container'ı bir shadow root ile sarar. `false`: `activate` `null` döndürür, hiçbir şey eklemez. |
| `js` | `boolean` | `true` | `activate`/`deactivate`, `js.active` değerini açıp kapatır. Proxy her iki durumda da yazmaları `window` nesnesinden uzak tutar. |
| `allowedGlobals` | `string[]` | `[]` | Strict modun sandbox içindeki koda atama izni verdiği adlar (yine proxy üzerinde saklanır). |
| `strict` | `boolean` | `false` | İzin listesi ve `allowedGlobals` dışındaki global'lere yazma ya da `defineProperty` yapılınca `TypeError` fırlatır. |

Üyeler: `css` (`CssSandbox`), `js` (`JsSandbox`), `activate(container): ShadowRoot | null`, `deactivate(container)`, `destroy(container)` (önce deactivate eder, sonra saklanan global'leri temizler).

### `CssSandbox`

| Metot | Davranış |
| --- | --- |
| `wrap(container)` | Alt elemanları açık bir shadow root'a taşır. Varsa `container.shadowRoot` değerini yeniden kullanır (önceki `wrap`, `unwrap` ya da başka bir instance), `unwrap` fonksiyonunun bıraktığı slot'u kaldırır ve kenara ayrılan stil dosyalarını sırasıyla geri koyar. Yalnızca `attachShadow` başarısız olursa hata fırlatır. |
| `unwrap(container)` | Alt elemanları light DOM'a geri taşır, `<style>` ve `<link rel="stylesheet">` elemanlarını (`addStyle`, `adoptStyles` ya da uygulamadan gelen) DOM'dan çıkarıp sonraki `wrap` için saklar ve alt elemanların render edilmesi için bir `<slot>` bırakır. Bu instance'ın sarmadığı container'larda hiçbir şey yapmaz. |
| `addStyle(shadowRoot, css)` | Bir `<style>` ekler ve onu döndürür. |
| `removeStyle(shadowRoot, styleEl)` | `styleEl` elemanını kaldırır. Container unwrap durumdayken çağrılırsa sonraki `wrap` onu geri getirmez. |
| `adoptStyles(shadowRoot, { urls?, cssText? })` | Shadow root'un başına, daha önce alınmış stillerin arkasına önce `<link>`, sonra `<style>` elemanlarını ekler. Kenara ayrılmış link'ler dahil, zaten alınmış URL'leri atlar. `{ elements, ready, remove }` döndürür. |

`ready`, her link `load` veya `error` olayını tetiklediğinde resolve olur ve hiçbir zaman reject olmaz. jsdom bu olayların ikisini de tetiklemez, bu yüzden jsdom testlerinde onu await etmeyin. `remove()` yalnızca o çağrının elemanlarını kaldırır; container unwrap durumdayken çağrılırsa elemanlar sonraki `wrap` ile geri gelmez.

### `JsSandbox`

`new JsSandbox(allowedGlobals = [], strict = false)`.

| Üye | Davranış |
| --- | --- |
| `proxyWindow` | `window` üzerinde bir Proxy. Okumalar önce sandbox deposuna, sonra gerçek `window` nesnesine bakar (fonksiyonlar bir kez bind edilir). `window`, `self`, `globalThis` ve iframe dışındayken `top`/`parent`/`frames` proxy'yi döndürür. Yazmalar ve `Object.defineProperty` depoya gider; `value` içermeyen bir descriptor saklanan değeri korur. Accessor ve configurable olmayan descriptor'lar `TypeError` fırlatır. |
| `execScript(code)` | `code` değerini `with (scope)` içinde sloppy mode bir script olarak çalıştırır. `window`, `self`, `globalThis` ve en üst seviyedeki `this` proxy'dir, serbest identifier'lar da onun üzerinden çözülür. `eval("...")` bu scope içinde direct eval olarak kalır. |
| `activate()`, `deactivate()`, `active` | Bir bayrak. Proxy'nin davranışını değiştirmez. |
| `reset()` | Saklanan global'leri temizler, `active` değerini `false` yapar. |

Strict mod, izin listesi dışındaki bir isme yapılan atamada, en üst seviyedeki `var x = 1` tanımında ya da `defineProperty` çağrısında `TypeError: [Tuvix Sandbox] Strict mode blocked write to global "x". Add it to allowedGlobals to permit it.` fırlatır ve sandbox aktif olsun ya da olmasın hiçbir şey saklamaz.

### Tipler

`SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles`.

## Sınır durumlar

- `execScript` içinde `x = 1`, `var x = 1`, `window.x = 1`, `window.window.x = 1`, `top.x = 1` ve aynı ifadelerin `eval("...")` içindeki halleri `x` değerini gerçek `window` üzerinde değil, proxy üzerinde saklar. `let`/`const` yerel kalır.
- `execScript` içinde tanımlanmamış bir identifier'ı okumak hata fırlatmak yerine `undefined` döndürür; `code` içindeki `"use strict"` etkisizdir.
- `f()` gibi düz bir fonksiyon çağrısının içinde `this`, sloppy mode JavaScript'in tanımladığı gibi gerçek global nesnedir. Orada `this.x = 1` gerçek `window` nesnesine yazar; bunun yerine `window.x = 1` yazın.
- `execScript` `new Function` kullanır; CSP'nizde `'unsafe-eval'` bulunmalıdır.
- `JsSandbox`, `Sandbox` ve `createSandbox()` constructor içinde `window` okur ve sunucuda hata fırlatır.
- Container sarılıyken eklenen light DOM alt elemanları render edilmez. Shadow root'un içine ekleyin.

## Ne yapmaz

- Timer'lara, event listener'lara, `document` nesnesine ya da `<script>` etiketlerine yama yapmaz ve bir uygulamanın geride bıraktıklarını temizlemez.
- Koda kendi origin'ini ya da global nesnesini vermez.
- Kalıtımla gelen stillerin (`color`, fontlar, custom property'ler) shadow root'a ulaşmasını engellemez.

## 0.4 sürümünden geçiş

- `Sandbox({ css: false }).activate()` `null` döndürür ve shadow root eklemez. `ISandbox.activate`, `ShadowRoot | null` döndürür.
- `strict: true`, engellenen yazmalarda uyarı vermek yerine hata fırlatır.
- `execScript` kodu bir `with` bloğu içinde çalıştırır: strict mode kod çalışmaz, tanımlanmamış okumalar `undefined` döndürür, yalın `x = 1` proxy üzerinde kalır.
- `unwrap` stil dosyalarını silmek yerine sonraki `wrap` için saklar.

## Lisans

MIT
