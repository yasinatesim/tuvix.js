---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="React Entegrasyonu"
  description="Bir React bileşenini Tuvix.js mikro uygulamasına dönüştürün; herhangi bir mikro uygulamayı (Vue, Svelte, Angular, React, vanilla) sunucuda render ve hydration desteğiyle bir React ağacının içinde barındırın."
  icon="⚛️"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

Paket React 18 veya daha yeni bir sürüm ister (`react` ve `react-dom` için peer aralığı `>=18.0.0`). `@tuvix.js/loader` ve `@tuvix.js/event-bus` paketlerine bağımlıdır.

## Ne zaman kullanılır

Paket iki yönü kapsar:

- **Mikro uygulama olarak React.** `createReactMicroApp` ve `createSsrReactMicroApp`, bir React bileşenini orchestrator ile loader'ın beklediği `{ bootstrap, mount, unmount, update }` modülüne sarar. Bir Tuvix shell'inin yüklediği mikro uygulamalardan biri React uygulamasıysa bunları kullanın.
- **Host olarak React.** `TuvixIsland` herhangi bir mikro uygulama modülünü React sayfasının içinde mount eder ve yeniden render'larda DOM'unu bozmadan korur. `TuvixReactApp` bir React mikro uygulamasını host ağacının içinde, satır içinde render eder. Shell'iniz TanStack Start, Next.js veya Remix gibi bir React SSR framework'üyse bunları kullanın.

Shell'iniz React içermeyen düz HTML ise yalnızca ilk ikiliye ve [`@tuvix.js/core`](/tr/packages/core) paketine ihtiyacınız var. Vue, Svelte veya Angular mikro uygulaması için modülü [`@tuvix.js/vue`](/tr/packages/vue), [`@tuvix.js/svelte`](/tr/packages/svelte) ya da [`@tuvix.js/angular`](/tr/packages/angular) ile oluşturun; `TuvixIsland` bunların hepsini barındırabilir.

## Hızlı başlangıç

Mikro uygulama modülünü oluşturun:

```tsx
// src/dashboard.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Modülü shell'e kaydedin. Orchestrator, route eşleştiğinde `mount` fonksiyonunu, props'u değiştirdiğinizde `update` fonksiyonunu çağırır:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { userId: 'u_42' },
});

await orchestrator.start();

// Re-renders <Dashboard userId="u_43" />; component state survives.
await orchestrator.updateAppProps('dashboard', { userId: 'u_43' });
```

## API

### `createReactMicroApp`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Modülün `@tuvix.js/loader` paketindeki `registerModule` ile kaydedildiği ad. Lifecycle olayları bu adı taşır. |
| `App` | `ComponentType<P>` | zorunlu | Kök bileşen. Mount props'unu kendi props'u olarak alır; bu yüzden `{ page: 'privacy' \| 'terms' }` gibi zorunlu props'u olan bir bileşen tip denetiminden geçer. |
| `bootstrap` | `() => void \| Promise<void>` | yok | Tek seferlik kurulum. Modülün `bootstrap()` fonksiyonu bunu bekler. |
| `ssr` | `boolean` | `false` | Container eleman ya da boşluk dışı metin içeriyorsa sunucu markup'ını `hydrateRoot` ile hydrate eder. Yalnızca boşluk veya yorum içeren container sıfırdan bir `createRoot` render'ı alır. |

Dönen modülün dört metodu vardır:

- `mount({ container, props })` o container için bir React root oluşturur. React ilk render'ı commit ettikten sonra resolve olur, ardından container üzerinde `hydrated: true` veya `false` ile `tuvix:mounted` olayını tetikler. `App` ilk render'da suspend olursa `mount`, içerik commit edilene kadar bekler.
- `update({ props, container })` `App` bileşenini o container'da `props` ile yeniden render eder. `container` verilmezse modülün mount ettiği her container'ı yeniden render eder. Ağacın yapısı değişmediği için React bileşen state'ini korur.
- `unmount({ container })` root'u unmount eder, container'ı `replaceChildren()` ile boşaltır ve `tuvix:unmounted` olayını tetikler.
- `bootstrap()` `config.bootstrap` fonksiyonunu çalıştırır.

Her container kendi root'unu alır, böylece tek bir modül aynı anda birkaç yere mount edilebilir:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

const badge = createReactMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

Modül `react-dom/client` paketini `mount` içinde lazy olarak import eder. Bir sunucu bundle'ı modülü import edebilir (örneğin `App` bileşenini `TuvixReactApp` ile paylaşmak için) ve istemci renderer'ını içeri çekmez.

### `createSsrReactMicroApp`

```ts no-check
function createSsrReactMicroApp<P extends object = Record<string, unknown>>(
  config: Omit<ReactMicroAppConfig<P>, 'ssr'>
): MicroAppModule;
```

`createReactMicroApp({ ...config, ssr: true })` ile aynıdır. Seçenekler: yukarıdaki tablodaki `name`, `App`, `bootstrap`.

Container, sunucunun aynı bileşen için render ettiği HTML'i zaten içeriyorsa bunu istemcide kullanın. Render ettiği ağaç `TuvixReactApp` ağacıyla aynıdır (error boundary artı `<Suspense>`), bu yüzden `TuvixReactApp` markup'ını uyumsuzluk olmadan hydrate eder:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export default createSsrReactMicroApp({ name: 'legal-app', App: LegalPage });
```

### `TuvixIsland` {#tuvixisland}

```ts no-check
function TuvixIsland(props: TuvixIslandProps): ReactElement;
```

| Prop | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Mikro uygulama adı. Island bunu `data-tuvix-app` özniteliğine yazar ve `app.mount` fonksiyonuna geçirir. |
| `app` | `MicroAppModule` | zorunlu | Mount edilecek modül: `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp`, `createReactMicroApp` sonuçları, bunların `createSsr*` varyantları ya da elle yazılmış bir `{ mount, unmount, update? }` nesnesi. |
| `props` | `Record<string, unknown>` | `{}` | Modülün props'u. Island her render'da bunları sığ (shallow) karşılaştırır. |
| `ssrHtml` | `string` | yok | Island'ın sunucuda render edilmiş HTML'i, örneğin `renderVueToString` çıktısı. Yalnızca sunucuda verin. |
| `fallback` | `ReactNode` | `null` | `mount` veya `update` reject olduğunda island'ın yerine render edilir. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Sarmalayıcı elemanın etiketi. |
| `className` | `string` | yok | Sarmalayıcı elemanın class adı. |

`TuvixIsland`, React olmayan bir mikro uygulamayı (veya ayrı bundle edilmiş bir React uygulamasını) bir React sayfasının içinde barındırır. <span v-pre>`<div dangerouslySetInnerHTML={{ __html: html }} />`</span> render eden elle yazılmış bir köprü, parent ilk kez yeniden render olduğunda bozulur: React yeni bir `{ __html }` nesnesi görür, `innerHTML` değerini yeniden atar ve mikro uygulamanın eklediği DOM'u ve listener'ları yok eder. `TuvixIsland` bunu önler:

- **Sunucu render'ı.** `ssrHtml` içeriğini inner HTML olarak kullanıp `<div data-tuvix-app={name} data-tuvix-island={id}>` render eder. `id` React'in `useId` hook'undan gelir, böylece sunucu ve istemci aynı değeri hesaplar.
- **Hydration.** İstemcideki ilk render'da kendi elemanını sayfada `data-tuvix-island` üzerinden bulur ve inner HTML'i DOM'dan geri okur. `ssrHtml` içeriğini istemciye ikinci kez göndermezsiniz ve istemci render'ı sunucu render'ıyla eşleşir.
- **Kararlı DOM.** Island, `{ __html }` nesnesini `useState` içinde bir kez oluşturur. Sonraki render'lar aynı nesneyi kullanır, bu yüzden React island'ın çocuklarını hiçbir zaman yeniden yazmaz. Parent yeniden render olduğunda mikro uygulamanın node'ları ve listener'ları yerinde kalır.
- **Mount.** İlk commit'ten sonra island `app.mount({ container, props, name })` çağrısını yapar. `ssr: true` ile oluşturulmuş bir modül (`createSsrVueMicroApp` ve benzerleri) bu noktada sunucu DOM'unu sahiplenir. SSR'sız bir modül container'a sıfırdan render eder.
- **Props.** `props` sığ karşılaştırmada değişirse (farklı anahtarlar ya da `Object.is` kontrolünden geçmeyen bir değer) island `app.update({ props, container })` çağrısını yapar. `update` fonksiyonu olmayan bir modül önce `unmount` edilir, container boşaltılır ve yeniden `mount` edilir. Aynı değerlere sahip satır içi bir nesne literal'i update tetiklemez.
- **Kimlik.** Yeni bir `name` veya `app` eski modülü unmount eder ve yenisini mount eder.
- **Kaldırma.** Island ağaçtan çıktığında `app.unmount({ container })` çağrısını yapar ve container'ı boşaltır.
- **Sıralama.** Mount, update ve unmount çağrıları art arda çalışır. `mount` beklemedeyken gelen bir unmount, onun bitmesini bekler.
- **Hatalar.** `mount` veya `update` reject olursa island, sarmalayıcının yerine `fallback` render eder. Adaptörler `tuvix:error` olayını kendileri tetikler; island ek bir olay eklemez. Daha sonra `name` veya `app` değişirse island yeniden dener.

React layout'u içinde Vue footer'ı olan eksiksiz bir sunucu ve istemci kurulumu:

```tsx
// src/Layout.tsx (shared by server and client)
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <main>
      <h1>Home</h1>
      <TuvixIsland
        name="footer"
        app={footer}
        props={{ year }}
        ssrHtml={footerHtml}
        fallback={<footer>© {year}</footer>}
        as="section"
        className="site-footer"
      />
    </main>
  );
}
```

```tsx
// src/entry-server.tsx (runs on the server only)
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const year = 2026;
  const footerHtml = await renderVueToString(Footer, { year });
  const body = renderToString(<Layout year={year} footerHtml={footerHtml} />);
  return `<!doctype html><html><body><div id="root">${body}</div><script type="module" src="/src/entry-client.tsx"></script></body></html>`;
}
```

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

// No footerHtml here: the island reads the footer HTML from the page.
hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

Sunucu HTML'i tarayıcıya herhangi bir JavaScript'ten önce ulaşır. Footer'ın stil dosyalarını `<head>` içine yazdığınızda footer ilk boyamada görünür ve stilli olur. Bu `<link>` etiketlerini [`@tuvix.js/vite`](/tr/packages/vite) üretir.

### `TuvixReactApp`

```ts no-check
function TuvixReactApp<P extends object>(props: TuvixReactAppProps<P>): ReactElement;
```

| Prop | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Mikro uygulama adı, `data-tuvix-app` özniteliğine yazılır. `createSsrReactMicroApp` fonksiyonuna verdiğiniz `name` ile aynı olmalı. |
| `App` | `ComponentType<P>` | zorunlu | Render edilecek bileşen. |
| `fallback` | `ReactNode` | `null` | `App` suspend olduğunda ve hata fırlattıktan sonra gösterilir. |
| diğer props | `P` | `P` gerektiriyorsa zorunlu | `App` bileşenine geçirilir. |

`TuvixReactApp` bir React mikro uygulamasını host'un React ağacının parçası olarak satır içinde render eder; böylece HTML'ini SSR framework'ünüz üretir. `<div data-tuvix-app={name}>` çıktısı verir ve `App` bileşenini bir error boundary ile bir `<Suspense fallback>` içine sarar:

- **Sunucu hataları yerel kalır.** Sunucu render'ı sırasında `App` içinde fırlatılan bir hata, React'in yalnızca bu uygulama için `fallback` render etmesine yol açar. Sayfanın geri kalanı render edilir ve React `App` bileşenini istemcide yeniden dener.
- **İstemci hataları yerel kalır.** Error boundary istemcideki render hatalarını yakalar, `fallback` gösterir ve sarmalayıcı üzerinde `tuvix:error` olayını tetikler.
- **Lifecycle olayları.** İlk commit'ten sonra `tuvix:mounted` olayını tetikler. Sarmalayıcı sunucu HTML'inden geldiyse `hydrated` değeri `true` olur. Bileşen ağaçtan çıktığında, React sarmalayıcıyı ayırmadan önce `tuvix:unmounted` olayını tetikler; böylece `document` üzerindeki bir listener olayı alır. Gösterilmekte olan bir `<Suspense>` sınırı yeniden suspend olursa uygulama önce `unmounted`, içerik geri geldiğinde de `mounted` bildirir.

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal-app"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

Vue, Svelte, Angular veya vanilla bir mikro uygulamayı barındırmak için `TuvixIsland` kullanın.

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): void;
```

Bir effect içinde `handler` fonksiyonunu `bus` üzerindeki `event` olayına abone eder ve unmount sırasında aboneliği kaldırır. Hook en güncel `handler` fonksiyonunu bir ref'te tutar, bu yüzden güncel state okuyan bir handler her render'da yeniden abone olmaz. Yeni bir `bus` veya `event` aboneliği yeniler. Abonelik yalnızca istemcide vardır; effect'ler sunucu render'ı sırasında çalışmaz.

Adaptörler orchestrator'ın bus'ını `App` bileşenine geçirmez. Orchestrator, siz `eventBus` seçeneklerini vermediyseniz `getGlobalBus()` kullanır; bus'ı oradan okuyun:

```tsx
import { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function CartIcon() {
  const [count, setCount] = useState(0);

  useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
    setCount(items.length);
  });

  return <span>{count}</span>;
}
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): T;
```

| Argüman | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `initialProps` | `T` | zorunlu | Başlangıç değeri. Hook bunu ilk render'da okur, sonraki değişiklikleri yok sayar. |
| `bus` | `IEventBus` | yok | Dinlenecek bus. Verilmezse hook `initialProps` değerini değiştirmeden döndürür. |
| `updateEvent` | `string` | `'tuvix:props:update'` | Hook'un payload'unu mevcut props ile birleştirdiği olay (`{ ...prev, ...payload }`). |

Ne orchestrator ne de adaptörler `tuvix:props:update` olayını yayınlar. Bu olayı kendiniz yayınlarsınız. `createReactMicroApp` ile oluşturulmuş bir modülün orchestrator props'u için bu hook'a ihtiyacı yoktur: `update({ props })`, `App` bileşenini yeni props ile yeniden render eder.

```tsx
import { useTuvixProps } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function ThemeLabel() {
  const props = useTuvixProps({ theme: 'light' }, getGlobalBus());
  return <p>Theme: {props.theme}</p>;
}

// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
```

### Tipler

| Tip | Anlamı |
| --- | --- |
| `ReactMicroAppConfig<P>` | `createReactMicroApp` config'i: `name`, `App`, `bootstrap?`, `ssr?`. |
| `TuvixIslandProps` | `TuvixIsland` props'u: `name`, `app`, `props?`, `ssrHtml?`, `fallback?`, `as?`, `className?`. |
| `TuvixReactAppProps<P>` | `TuvixReactApp` props'u: `name`, `App`, `fallback?` ve `App` bileşeninin props'u. |

## Sınır durumlar

- **İlk render hata fırlatır.** `mount` hatayla reject olur, root'u unmount eder, container'ı boşaltır ve `tuvix:error` olayını tetikler. 0.4'te `mount` resolve oluyordu ve hata React'in root hata işleyicisine ulaşıyordu.
- **Sonraki bir render hata fırlatır.** Error boundary uygulamayı boşaltır ve `tuvix:error` olayını tetikler. Host sayfa çalışmaya devam eder. Uygulama, siz unmount edip yeniden mount edene kadar boş kalır; `update` onu geri getirmez.
- **Mount sırasında unmount.** `mount` hâlâ `react-dom/client` paketini yüklerken ya da ilk commit'i beklerken gelen bir `unmount`, onun bitmesini bekler, container'ı boş bırakır ve `mounted` olayını tetiklemez.
- **Aynı container'a iki kez mount.** Modülün zaten tuttuğu bir container üzerindeki ikinci `mount`, eski root'u unmount eder ve `tuvix:unmounted` olayını tetikler; ardından yeni props ile sıfırdan render eder ve `tuvix:mounted` olayını tetikler. Bileşen state'i sıfırlanır. Vue, Svelte ve Angular adaptörleri de aynısını yapar. State'i korumak için `update` çağırın.
- **Bilinmeyen container.** Modülün hiç mount etmediği bir container üzerinde `unmount` ve `update` hiçbir şey yapmaz.
- **Props'un tamamı değişir.** Modülün `update` fonksiyonu `App` bileşenini yalnızca verdiğiniz props ile render eder. `orchestrator.updateAppProps` ise `update` çağrısından önce yeni props'u kayıtlı olanların üzerine birleştirir.
- **`ssr: true` ile yalnızca boşluk içeren container.** `hasServerMarkup` boşluk metnini ve yorumları yok saydığı için modül sıfırdan render eder.
- **React island'ı kaldırır.** React, modül `tuvix:unmounted` bildirmeden önce island'ın elemanını ayırır. `emitLifecycle` de olayı ayrılmış eleman yerine `document` üzerinde tetikler; böylece `document` üzerindeki bir listener (veya `@tuvix.js/loader` paketinden `onLifecycle`) olayı yine alır ve `detail.container` kaldırılan elemanı gösterir. Container'ın kendisindeki ya da bir atasındaki listener olayı almaz. `isMounted(name)`, uygulama başka bir container'da mount edili olduğu sürece `true` kalır, sonuncusu unmount edildiğinde `false` olur.
- **Geliştirme ortamında `<StrictMode>` altındaki island.** React mount effect'ini, ardından onun cleanup'ını, sonra effect'i yeniden çalıştırır. Island modül çağrılarını kuyruğa alır ve cleanup'ı zaten çalışmış olan ilk çalıştırmayı atlar; böylece modül bir kez mount edilir ve sunucu DOM'unu sahiplenir.
- **Başarısız mount sonrası yeni uygulama.** `mount` reject olduğunda island sunucu HTML'ini atar. Ardından farklı bir `app` veya `name` verirseniz yeni modül, başarısız uygulamanın markup'ını sahiplenmek yerine boş bir elemana mount edilir.
- **Island'da `ssrHtml` değerini değiştirmek.** Island `ssrHtml` değerini yalnızca ilk render'da okur. Yeni içeriği `props` üzerinden geçirin.
- **Aynı ad iki kez.** `registerModule` bir ad altında en son oluşturulan modülü tutar.

## Ne yapmaz

- Modülleri URL ile yüklemez. Modülü import edin ya da [`@tuvix.js/core`](/tr/packages/core) paketinin bir `entry` üzerinden yüklemesine izin verin.
- Bir mikro uygulamayı string'e render etmez. Sunucuda `TuvixReactApp` ile birlikte `react-dom/server` paketinden `renderToString` kullanın ya da framework'ün kendi renderer'ını ([`@tuvix.js/vue/server`](/tr/packages/vue) paketinden `renderVueToString`, Svelte ve Angular karşılıkları) kullanıp sonucu `TuvixIsland` bileşenine `ssrHtml` olarak verin.
- `MountContext.bus` veya `MountContext.name` değerini `App` bileşenine geçirmez. `@tuvix.js/event-bus` paketinden `getGlobalBus()` kullanın.
- Island'ın CSS'ini yüklemez. Sunucuda render edilmiş island'ların stil dosyası linklerini yazmak için [`@tuvix.js/vite`](/tr/packages/vite) kullanın.
- React 17 ve öncesini desteklemez.

## 0.4 sürümünden geçiş

**`TuvixReactApp` sunucu HTML'inde Suspense işaretleri var.** Sarmalayıcı artık uygulamanın çevresinde `<!--$-->…<!--/$-->` içerir. `@tuvix.js/react` paketini sunucuda ve istemcide birlikte yükseltin, aksi halde hydration uyumsuzluk hatasıyla başarısız olur.

**İlk render hata fırlatınca `mount` reject olur.** `mount` çağrısını await edip resolve olmasını bekliyorsanız hatayı yakalayın:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Broken(): never {
  throw new Error('boom');
}

const app = createReactMicroApp({ name: 'broken', App: Broken });
const container = document.createElement('div');

try {
  await app.mount({ container });
} catch (error) {
  // 0.4: never reached. 0.5: the render error; the container is empty.
  container.textContent = 'This section failed to load.';
}
```

**Bilinmeyen bir container üzerinde `unmount` hiçbir şey yapmaz.** 0.4'te container'ı temizliyordu. Buna güveniyorsanız `container.replaceChildren()` çağrısını kendiniz yapın.

**Config nesnesi.** Bu sayfanın önceki sürümleri `createReactMicroApp(App)` kullanımını gösteriyordu. Fonksiyon bir config nesnesi alır: `createReactMicroApp({ name: 'dashboard', App })`.

Daha fazla adım adım anlatım için [React rehberine](/tr/guide/react) bakın.
