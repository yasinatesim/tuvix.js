# Sandbox ile izolasyon

`@tuvix.js/sandbox` iki araç sunar. `CssSandbox` bir uygulamayı shadow root içine yerleştirir, böylece uygulamanın CSS'i ile sayfanın CSS'i birbirine karışmaz. `JsSandbox` kodu bir proxy `window` üzerinde çalıştırır, böylece kodun global yazmaları proxy'ye düşer. Orchestrator, `sandbox: true` ile kaydettiğiniz uygulamalar için `CssSandbox` kullanır; `JsSandbox` ise hiçbir zaman uygulamaz.

## Uygulama başına CSS izolasyonu

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'widget',
  entry: {
    scripts: ['https://cdn.example.com/widget/main.js'],
    styles: ['https://cdn.example.com/widget/main.css'],
    type: 'module',
  },
  container: '#widget',
  activeWhen: '/',
  sandbox: true, // { css: true } ile aynı
});
```

Bu uygulama için orchestrator:

1. `#widget` elemanına açık (open) bir shadow root ekler (ya da önceki bir mount'tan kalanı yeniden kullanır);
2. bunun içinde bir `<div data-tuvix-sandbox-root>` oluşturur ve bu elemanı `mount` fonksiyonuna `container` olarak verir;
3. entry'deki `styles` dosyalarını `document.head` yerine shadow root içine `<link>` etiketleri olarak ekler ve `mount` çağırmadan önce yüklenmeleri için `loader.timeout` süresine kadar bekler.

Artık sayfanın CSS'i uygulamaya, uygulamanın CSS'i de sayfaya ulaşmaz. `color` ve `font-family` gibi kalıtılan özellikler host elemandan içeri akmaya devam eder; bunu durdurmak için bu özellikleri uygulamanın CSS'inde `:host` üzerinde tanımlayın.

Bir uygulama global seçiciler getiriyorsa (`button { ... }`, bir CSS reset) ya da sayfanın CSS'i uygulamayı bozuyorsa bunu kullanın.

### Sınır durumlar

- Bir framework'ün çalışma zamanında eklediği stiller shadow root'un dışında, `document.head` içine gider. Vite'ın CSS enjeksiyonu, CSS-in-JS kütüphaneleri ve Angular'ın bileşen stilleri bunu yapar. Ayrı bir CSS dosyası üretip `entry.styles` içinde listeleyin ya da CSS'i shadow root'a kendiniz ekleyin.
- `document.body` içine render eden portal'lar, modal'lar ve toast'lar shadow root'tan çıkar ve uygulamanın stillerini kaybeder.
- Uygulamanın içinden çağrılan `document.querySelector`, shadow root içindeki elemanları bulmaz. Sorguyu `container` üzerinden yapın.
- Loader fonksiyonu olan entry'ler `styles` listelemez. Bu yüzden bundler'ınız onların CSS'ini `document.head` içine enjekte eder ve shadow root bu CSS'i dışarıda tutar. Sandbox kullanan uygulamaları `{ scripts, styles, type }` biçiminde bir entry ile kaydedin.

## CssSandbox'ı elle kullanma

```ts
import { CssSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const css = new CssSandbox();
const shadow = css.wrap(container); // mevcut alt elemanları shadow root'a taşır

const adopted = css.adoptStyles(shadow, {
  urls: ['/widget/main.css'],
  cssText: ':host { display: block; font-family: system-ui; }',
});
await adopted.ready; // her <link> load ya da error tetikleyince resolve olur

const button = document.createElement('button');
button.textContent = 'Buy';
shadow.append(button);

// Daha sonra
adopted.remove();
css.unwrap(container);
```

| Metot | Etkisi |
| --- | --- |
| `wrap(container)` | Açık bir shadow root ekler ya da mevcut açık shadow root'u yeniden kullanır ve container'ın alt elemanlarını içine taşır. |
| `adoptStyles(shadow, { urls, cssText })` | Shadow root'un başına `<link>` ve `<style>` elemanları ekler. Orada zaten eklenmiş bir URL'i atlar. `{ elements, ready, remove }` döndürür. |
| `addStyle(shadow, css)` / `removeStyle(shadow, el)` | Tek bir `<style>` ekler ya da kaldırır. |
| `unwrap(container)` | Stil dışındaki düğümleri light DOM'a geri taşır ve render edilmeleri için bir `<slot>` bırakır. `<style>` ve stil dosyası `<link>` düğümlerini (`addStyle` ve `adoptStyles` ile eklenenler dahil) DOM'dan çıkarır; o container için yapılan bir sonraki `wrap` çağrısı onları aynı sırayla geri koyar. |

Eleman shadow root barındıramıyorsa (örneğin `<input>`) ya da zaten kapalı (closed) bir shadow root'u varsa `wrap` hata fırlatır. `ready` hiçbir zaman reject olmaz. jsdom link'lerde hiçbir zaman `load` tetiklemez, bu yüzden jsdom testlerinde `ready` için await kullanmayın. Container unwrap edilmişken `removeStyle` ya da `adopted.remove()` çağırırsanız o stil dosyası bir sonraki `wrap` ile geri gelmez.

## JsSandbox

```ts
import { JsSandbox } from '@tuvix.js/sandbox';

const js = new JsSandbox(['dataLayer'], /* strict */ true);

js.execScript('window.dataLayer = []'); // izin verilir, proxy'de saklanır
console.log('dataLayer' in window); // false, sayfa tanımlamadıysa

try {
  js.execScript('counter = 1'); // izin verilmeyen bir global'e doğrudan atama
} catch (error) {
  console.log(error instanceof TypeError); // true: strict mod yazmayı engelledi
}

const loose = new JsSandbox(); // strict değil
loose.execScript('var version = 2; build = 7;');
console.log(Reflect.get(loose.proxyWindow, 'version'), 'version' in window); // 2 false

js.reset(); // saklanan bütün global'leri unut
```

- Proxy üzerinden yapılan yazmalar ve `Object.defineProperty` çağrıları sandbox'taki bir depoya gider. Okumalar önce bu depoya, sonra gerçek `window` nesnesine bakar.
- `strict: true` ile, yerleşik izin listesi ve `allowedGlobals` dışındaki bir global'e değer atamak, onu üst düzeyde `var` ile tanımlamak ya da ona `Object.defineProperty` uygulamak bir `TypeError` fırlatır ve hiçbir şey saklanmaz.
- `execScript(code)`, `code` içeriğini `with (scope)` içinde çalıştırır; `window`, `self`, `globalThis` ve `this` proxy'ye bağlıdır. Doğrudan atamalar (`x = 1`), üst düzey `var x` ve `window.x = 1` hepsi proxy'ye düşer; `let` ve `const` ise script'e yerel kalır.
- `execScript` içinde tanımlanmamış bir identifier okumak `ReferenceError` fırlatmak yerine `undefined` döndürür ve `"use strict"` direktifinin hiçbir etkisi olmaz, çünkü `with` sloppy mod gerektirir. `new Function` kullandığı için Content Security Policy'nizde `unsafe-eval` gerekir.
- `activate()` ve `deactivate()`, `active` bayrağını ayarlar. Proxy her iki durumda da yazmaları saklar.

`JsSandbox` yalnızca global'lere `proxyWindow` üzerinden erişen kodu kapsar. `<script>` etiketiyle yüklenen bir script, bundle edilmiş bir modül, timer'lar ve event listener'lar gerçek `window` nesnesini kullanır. Bunu bir güvenlik sınırı olarak değil, çalıştırdığınız kod parçalarında yanlışlıkla yapılan global yazmalara karşı bir koruma olarak görün.

## Birleşik sandbox

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });

const shadow = sandbox.activate(container); // ShadowRoot | null
if (shadow) sandbox.css.addStyle(shadow, '.box { padding: 8px; }');

sandbox.deactivate(container); // unwrap
sandbox.destroy(container); // deactivate + JS deposunu sıfırla
```

`css` değeri `false` olduğunda `activate`, `null` döndürür ve hiçbir şey eklemez.

## Bir mikro uygulamanın içinde kullanma

```ts
import { defineMicroApp } from '@tuvix.js/core';
import { CssSandbox } from '@tuvix.js/sandbox';

const css = new CssSandbox();

export default defineMicroApp({
  name: 'widget',
  mount({ container }) {
    const shadow = css.wrap(container);
    css.addStyle(shadow, 'p { color: rebeccapurple; }');
    const text = document.createElement('p');
    text.textContent = 'Isolated';
    shadow.append(text);
  },
  unmount({ container }) {
    container.shadowRoot?.replaceChildren();
    css.unwrap(container);
  },
});
```

Uygulamayı orchestrator mount ediyorsa `register` çağrısında `sandbox: true` kullanmayı tercih edin; aynı işi yapar ve yeniden mount'larda shadow root'u tekrar kullanır.

## Ne zaman sandbox kullanılmaz

- Uygulama `document.body` içine portal kullanıyor ve stillerinin orada da geçerli olması gerekiyor.
- Uygulamayı sayfanın tasarım sistemi stillendirmeli.
- Gerçek JavaScript izolasyonuna ihtiyacınız var. Bunun için bir `<iframe>` kullanın.
