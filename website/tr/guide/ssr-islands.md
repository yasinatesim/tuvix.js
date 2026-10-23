# SSR island'ları

Island, sunucunun bir React sayfası içinde HTML'e render ettiği ve tarayıcının kendi framework'üyle hydrate ettiği bir mikro uygulamadır. `@tuvix.js/react` paketindeki `TuvixIsland` ile tek bir React host Vue, Svelte, Angular ve React island'larını bir arada taşıyabilir. Kullanıcı daha hiç JavaScript çalışmadan stilli içeriği görür, her island da kendi framework'ü yüklenince etkileşimli hale gelir.

## Neler gerekir

| Parça | Paket | Çalıştığı yer |
| --- | --- | --- |
| Sunucuda render edilen React host sayfa | kendi uygulamanız (`react-dom/server`, TanStack Start, ...) | sunucu + istemci |
| `TuvixIsland`, `TuvixReactApp` | `@tuvix.js/react` | sunucu + istemci |
| Island modülleri: `createSsrVueMicroApp`, `createSsrSvelteMicroApp`, `createSsrAngularMicroApp`, `createSsrReactMicroApp` | adaptörler | istemci |
| `renderVueToString`, `renderSvelteToString`, `renderAngularToString` | `@tuvix.js/<adapter>/server` | yalnızca sunucu |
| `getAssets`, `renderAssetTags` | `@tuvix.js/vite` | yalnızca sunucu |

İşin içinde orchestrator yoktur. `TuvixIsland`, island modülünün `mount`, `update` ve `unmount` fonksiyonlarını kendisi çağırır.

## Bir istek nasıl akar

```text
server                                         browser
──────                                         ───────
renderVueToString(Card, props) ─┐
                                ▼
<TuvixIsland ssrHtml={html}> renders           HTML arrives, CSS links in <head>
<div data-tuvix-app="card">…html…</div>   ──►  apply → styled first paint
getAssets([...]) → <link rel=stylesheet>
                                               hydrateRoot(host)
                                               TuvixIsland reads its innerHTML from the DOM
                                               React leaves the island's children alone
                                               useEffect → card.mount({ container, props })
                                               Vue adapter: createSSRApp → hydrates in place
                                               tuvix:mounted { hydrated: true }
```

## 1. Vite'ı yapılandırın

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { tuvix } from '@tuvix.js/vite';

export default defineConfig({
  plugins: [react(), vue(), svelte(), tuvix()],
});
```

TypeScript'in `virtual:tuvix/assets` modülünü tanıması için `compilerOptions.types` listesine `"@tuvix.js/vite/client"` ekleyin.

## 2. Island modüllerini oluşturun

Her island, adaptörünün `Ssr` varyantıyla oluşturulmuş bir modülü export eder. Bu dosyalar tarayıcıda çalışır ve sunucu renderer'larını import etmemelidir.

```ts
// src/islands/vue-card/index.ts
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import VueCard from './VueCard.vue';

export const vueCard = createSsrVueMicroApp({ name: 'vue-card', App: VueCard });
```

```ts
// src/islands/svelte-counter/index.ts
import { SvelteMap } from 'svelte/reactivity';
import { createSsrSvelteMicroApp } from '@tuvix.js/svelte';
import Counter from './Counter.svelte';

// SvelteMap makes TuvixIsland prop changes update in place instead of remounting.
export const svelteCounter = createSsrSvelteMicroApp({ name: 'svelte-counter', App: Counter, SvelteMap });
```

```ts
// src/islands/angular-contact/index.ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { ContactComponent } from './contact.component';

export const angularContact = createSsrAngularMicroApp({ name: 'angular-contact', component: ContactComponent });
```

## 3. Island HTML'ini sunucuda render edin

Sunucu renderer'larını yalnızca sunucu kodunun import ettiği bir modülde tutun:

```ts
// src/server/render-islands.ts (server only)
import { renderVueToString } from '@tuvix.js/vue/server';
import { renderSvelteToString } from '@tuvix.js/svelte/server';
import { renderAngularToString } from '@tuvix.js/angular/server';
import { render } from 'svelte/server';
import VueCard from '../islands/vue-card/VueCard.vue';
import Counter from '../islands/svelte-counter/Counter.svelte';
import { ContactComponent } from '../islands/angular-contact/contact.component';

export async function renderIslands(): Promise<Record<string, string>> {
  const [card, counter, contact] = await Promise.all([
    renderVueToString(VueCard, { title: 'Hello' }),
    renderSvelteToString(Counter, { start: 3 }, { render }),
    renderAngularToString(ContactComponent, { appId: 'contact', props: { heading: 'Write to us' } }),
  ]);
  return { 'vue-card': card, 'svelte-counter': counter, 'angular-contact': contact };
}
```

`render*ToString` fonksiyonları yalnızca sunucuda çalışır. Tarayıcıda `''` döndürürler. Onları tarayıcıda hiç çalışmayan koddan çağırın: sunucu entry'niz, bir API route'u ya da TanStack Start'ın `createServerFn` fonksiyonu gibi bir framework server function'ı. İzomorfik bir route loader'dan çağırmayın. O loader istemci tarafı navigasyonda tarayıcıda da çalışır ve orada `''` alır. Üstelik loader sunucu renderer'ını import ettiği için bundler'ınız Vue, Svelte veya Angular sunucu renderer'ını istemciye taşır.

## 4. Island'ları sayfaya yerleştirin

```tsx
// src/pages/Home.tsx
import { createContext, useContext } from 'react';
import { TuvixIsland } from '@tuvix.js/react';
import { vueCard } from '../islands/vue-card';
import { svelteCounter } from '../islands/svelte-counter';

// Filled by the server entry; empty on the client.
export const IslandHtml = createContext<Record<string, string>>({});

export function Home() {
  const html = useContext(IslandHtml);
  return (
    <main>
      <TuvixIsland
        name="vue-card"
        app={vueCard}
        props={{ title: 'Hello' }}
        ssrHtml={html['vue-card']}
        fallback={<p>The card failed to load.</p>}
      />
      <TuvixIsland name="svelte-counter" app={svelteCounter} props={{ start: 3 }} ssrHtml={html['svelte-counter']} />
    </main>
  );
}
```

Sunucuda ve istemcide aynı props'u verin. Sunucu `{ start: 3 }` ile render ettiyse ve istemci `{ start: 4 }` ile mount ederse framework bir hydration uyuşmazlığı görür.

## 5. Island CSS'ini head içinde bağlayın

Vite; CSS Modules, Vue `<style>` blokları ve Svelte stillerini JavaScript'ten enjekte eder. Ek bir önlem almazsanız sunucu HTML'i tarayıcıya bu JavaScript'ten önce ulaşır ve ilk boyama stilsiz olur (FOUC). `getAssets` bir entry'nin ihtiyaç duyduğu stil dosyası URL'lerini döndürür, böylece sunucu bunları `<head>` içinde bağlayabilir:

```tsx
// src/entry-server.tsx
import { renderToString } from 'react-dom/server';
import { getAssets, renderAssetTags } from 'virtual:tuvix/assets';
import { Home, IslandHtml } from './pages/Home';
import { renderIslands } from './server/render-islands';

export async function render(): Promise<string> {
  const [islandHtml, assets] = await Promise.all([
    renderIslands(),
    getAssets(['src/entry-client.tsx', 'src/pages/Home.tsx']),
  ]);

  const body = renderToString(
    <IslandHtml.Provider value={islandHtml}>
      <Home />
    </IslandHtml.Provider>,
  );

  return `<!doctype html>
<html lang="en">
  <head>
    <title>Home</title>
    ${renderAssetTags(assets)}
  </head>
  <body>
    <div id="app">${body}</div>
    <script type="module" src="/src/entry-client.tsx"></script>
  </body>
</html>`;
}
```

- Modül path'lerini Vite root'una göre göreli verin. Production build'inde her path bir build girdisi ya da istemci build'inde bir `import()` hedefi olmalıdır; diğer path'lerde fonksiyon reject olur.
- Rollup iki `import()` hedefini tek bir chunk'ta birleştirirse manifest o chunk'ı sizin modül path'iniz yerine hash'li adıyla listeler ve `getAssets` o path için reject olur. Örnek proje `@angular/core` bir sayfa chunk'ına düştüğünde bu duruma takılır ve `@angular/core` paketine kendi chunk'ını veren `manualChunks` ayarıyla sorunu çözer.
- `getAssets` statik import'ları takip eder, `import()` hedeflerini atlar. Lazy import edilen ve sunucuda render edilen bir sayfa ya da island için listeye ayrı bir giriş ekleyin.
- Geliştirme ortamında `?direct` CSS URL'leri döndürür. Vite kendi `<style>` etiketini enjekte edince eşleşen `<link>` etiketini devre dışı bırakır, böylece HMR düzenlemeleri uygulanır.
- Angular island'ları stillerini satır içinde taşır: `renderAngularToString` bileşenin `<style>` etiketlerini markup'ın önüne koyar.
- Svelte: ya `css: 'injected'` ile derleyin (stiller island HTML'inin içinde gelir) ya da `emitCss` ayarını koruyup stilleri `getAssets` ile bağlayın. İkisini birden değil.

## 6. İstemcide hydrate edin

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Home } from './pages/Home';

hydrateRoot(document.getElementById('app')!, <Home />);
```

İstemci island HTML'i olmadan render eder. Her `TuvixIsland` hydration sırasında kendi markup'ını sayfadan okur, React bu düğümleri korur ve island modülü onları hydrate eder.

## HTML neden iki kez gönderilmez

Basit bir island uygulaması sunucu HTML'ini her iki tarafta da prop olarak geçirir. React'in istemcide `dangerouslySetInnerHTML` alanını hydrate etmek için bu string'e ihtiyacı olur, bu yüzden HTML bir kez dokümanda, bir kez de hydration verisinde taşınır. Üstelik üst bileşen her yeni `{ __html }` nesnesiyle yeniden render edildiğinde React `innerHTML` değerini yeniden atar; bu da island'ın framework'ünün eklediği DOM'u ve dinleyicileri siler.

`TuvixIsland` ikisini de önler:

- Sunucuda `ssrHtml` içeriğini `<div data-tuvix-app={name} data-tuvix-island={id}>` içine yazar.
- Hydration sırasında bu elemanı `useId` tabanlı `data-tuvix-island` özniteliğiyle bulur ve `innerHTML` değerini bir kez okur. İstemci `ssrHtml` değerine hiç ihtiyaç duymaz.
- `{ __html }` nesnesini state'te tutar. Sonraki render'lar React'e aynı nesneyi verir ve React island'ın alt düğümlerini hiç yeniden yazmaz.

Framework'ünüzün loader verisiyle ne yaptığı ayrı bir konudur. Island HTML'ini bir TanStack Start veya Remix loader'ından döndürürseniz framework o loader sonucunu da sayfaya serialize eder. HTML'i island'a framework'ün serialize etmediği bir yoldan verin; örneğin 4. adımdaki gibi sunucu entry'nizin doldurduğu bir React context ile.

## İstek başına state {#per-request-state}

Sunucu kodu tek bir süreçte birçok isteği karşılar. Modül kapsamında oluşturduğunuz her şey bu isteklerin hepsi boyunca yaşar.

- TanStack Query'nin `QueryClient` nesnesi gibi bir veri önbelleğini modül kapsamında değil, her istek için ayrı oluşturun. Sunucuda modül düzeyindeki bir client istekler ve kullanıcılar arasında veriyi karıştırır, eskimiş kayıtları da hydration uyuşmazlıklarına yol açar.
- Bir island'ın ihtiyaç duyduğu veriyi isteğin kendi önbelleğinden props ile geçirin. Island modülü kendi istemci tarafı state'ini mount sırasında oluşturur.
- Tarihleri ve sayıları açık bir `timeZone` ve locale ile biçimlendirin. Sunucu genellikle UTC'de, tarayıcı ise kullanıcının saat diliminde çalışır; `timeZone` verilmemiş bir `Intl.DateTimeFormat` gece yarısına yakın saatlerde farklı bir gün render eder ve hydration'ı bozar.

```tsx
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';

declare function createRequestCache(): { dehydrate(): unknown };
declare function Page(props: { data: unknown }): ReactElement;

export function renderRequest(): string {
  const cache = createRequestCache(); // one per request
  return renderToString(<Page data={cache.dehydrate()} />);
}
```

## Head ve meta etiketleri host'un işidir

Island'lar body içindeki bir `<div>` öğesine render edilir. `<title>`, `<meta>` veya `<link rel=canonical>` üretmemelidirler. Bunları host'ta ayarlayın (framework'ünüzün head API'si ya da HTML şablonu). `<svelte:head>` kullanan Svelte bileşenleri için `renderSvelteToString` yerine `renderSvelte` çağırın ve onun `head` çıktısını doküman head'ine kendiniz yerleştirin.

## Hatalar

- Island'ın `mount` veya `update` çağrısı reject olursa `TuvixIsland` onun yerine `fallback` içeriğini render eder. Adaptör `tuvix:error` olayını zaten tetiklemiştir.
- Bir sunucu renderer'ı hata fırlatırsa kararı sunucu kodunuz verir: hatayı yakalayıp `ssrHtml` geçirmezseniz island boş başlar ve istemcide render edilir.
- `TuvixReactApp` bileşenini `<Suspense>` ile sarar. Böylece sunucu render hatası yalnızca o uygulamayı kendi `fallback` içeriğiyle değiştirir ve React uygulamayı istemcide yeniden dener.

Island'ları sayfa kodundan `onLifecycle('mounted', ...)` ve `onLifecycle('error', ...)` ile izleyin; bkz. [Lifecycle olayları](/tr/guide/lifecycle-events).

## Örnek proje

Repodaki `examples/with-ssr-islands` bunların hepsini bir araya getirir: React 19 host'u olan bir Express + Vite sunucusu, bir Vue 3 kartı, bir Svelte 5 sayacı, zoneless bir Angular 20 iletişim formu (JIT; derleyici lazy bir chunk halinde yüklenir), bir `TuvixReactApp` bülteni ve fallback'ini göstermek için bilerek hata veren bir island. `src/server/render-islands.ts` sunucu renderer'larını barındırır, `src/entry-server.tsx` asset'leri `getAssets` ile bağlar, `src/runtime/islands.ts` ise lifecycle olaylarına tepki verir. Angular island'ı `heading` input'unu sunucuda `props` seçeneğinden, istemcide de aynı nesneden alır. Repo kökünden `pnpm --filter with-ssr-islands dev` çalıştırın (port 5186) ya da önce `build`, sonra `start` çalıştırın (port 5185; `PORT` ile değiştirilebilir). Örneğin README dosyası her parçayı ve Playwright spec'inin yaptığı kontrolleri açıklar.

## Island'ların yapmadıkları

- `TuvixIsland` modülleri URL üzerinden yüklemez. Island modülünü host bundle'ına import edin.
- Island'lar arasında state paylaştırmaz. Props, event bus ya da kendi store'unuzu kullanın.
- Angular island'ları sunucu DOM'unu yıkıcı olmayan şekilde hydrate etmez, üzerine yeniden render eder; bkz. [Angular](/tr/guide/angular).
- Buradaki hiçbir şey sunucu render adımı olmadan çalışmaz. Yalnızca istemcide çalışan island'lar için `ssrHtml` vermeyin ve `Ssr` olmayan adaptörleri kullanın.
