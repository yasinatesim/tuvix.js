# @tuvix.js/react

> React bileşenlerini Tuvix.js mikro uygulamalarına dönüştürün, herhangi bir mikro uygulamayı da SSR hydration desteğiyle bir React ağacının içinde barındırın.

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır.

## Kurulum

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

React 18 veya üstü gerekir.

## Hızlı başlangıç

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Modül, `@tuvix.js/loader` paketindeki `registerModule` fonksiyonuyla kendini `'dashboard'` adıyla kaydeder. Böylece script yüklendikten sonra orchestrator onu bulur. Orchestrator'a `() => import('./dashboard')` gibi bir `entry`, bir `container` ve `props` verin.

## API

### `createReactMicroApp(config)`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| Seçenek | Tür | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Kayıt adı; lifecycle olayları bu adı taşır. |
| `App` | `ComponentType<P>` | zorunlu | Kök bileşen. Mount props'unu alır; zorunlu props tip denetiminden geçer. |
| `bootstrap` | `() => void \| Promise<void>` | yok | Tek seferlik kurulum. |
| `ssr` | `boolean` | `false` | Container sunucu markup'ı (eleman veya boşluk dışı metin) içeriyorsa `hydrateRoot` ile hydrate eder. |

- Her container kendi React root'unu alır. Bu sayede tek bir modül birden fazla yerde mount edilebilir.
- `mount({ container, props })` ilk commit'ten sonra resolve olur ve `hydrated` alanıyla `tuvix:mounted` olayını tetikler.
- `update({ props, container })` tek bir container'ı, `container` verilmezse hepsini yeniden render eder. Bileşen state'i korunur.
- `unmount({ container })` root'u unmount eder, container'ı boşaltır ve `tuvix:unmounted` olayını tetikler.
- `react-dom/client`, `mount` içinde lazy yüklenir. Bu yüzden sunucu bundle'ları modülü import edebilir.

### `createSsrReactMicroApp(config)`

`createReactMicroApp({ ...config, ssr: true })` ile aynıdır. Seçenekler: `name`, `App`, `bootstrap`. `TuvixReactApp` ile aynı ağacı render eder, bu yüzden `TuvixReactApp` markup'ını uyuşmazlık olmadan hydrate eder.

### `TuvixIsland`

Herhangi bir mikro uygulama modülünü (Vue, Svelte, Angular, React ya da elle yazılmış bir `{ mount, unmount, update? }`) bir React ağacının içinde barındırır.

| Prop | Tür | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | `data-tuvix-app` özniteliğine yazılır, `mount` fonksiyonuna geçirilir. |
| `app` | `MicroAppModule` | zorunlu | Mount edilecek modül. |
| `props` | `Record<string, unknown>` | `{}` | Shallow karşılaştırılır; değişiklik olursa `app.update({ props, container })` çağrılır, modülde `update` yoksa island yeniden mount edilir. |
| `ssrHtml` | `string` | yok | Island'ın sunucuda render edilmiş HTML'i. Yalnızca sunucuda verin. |
| `fallback` | `ReactNode` | `null` | `mount` veya `update` reject olduğunda render edilir. |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Sarmalayıcı etiket. |
| `className` | `string` | yok | Sarmalayıcı sınıfı. |

Elle yazılmış bir `<div dangerouslySetInnerHTML={{ __html }} />` köprüsü, üst bileşen bir sonraki kez yeniden render edildiğinde mikro uygulamanın DOM'unu ve dinleyicilerini kaybeder. Çünkü React her yeni `{ __html }` nesnesi için `innerHTML` değerini yeniden atar. `TuvixIsland` bu nesneyi bir kez oluşturur. Hydration sırasında kendi elemanını bir `data-tuvix-island` özniteliği (`useId` ile üretilir) üzerinden bulur ve HTML'i sayfadan geri okur. Bu yüzden istemcinin `ssrHtml` değerine ihtiyacı yoktur. Yeni bir `name` veya `app` değeri yeniden mount eder; kaldırma `app.unmount` çağırır. Çağrılar sırayla çalışır, dolayısıyla bir unmount bekleyen mount işlemini bekler.

```tsx
// Layout.tsx: sunucuda footerHtml ile, istemcide onsuz render edilir
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <TuvixIsland name="footer" app={footer} props={{ year }} ssrHtml={footerHtml} fallback={<footer>© {year}</footer>} />
  );
}
```

```tsx
// entry-server.tsx
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const footerHtml = await renderVueToString(Footer, { year: 2026 });
  return renderToString(<Layout year={2026} footerHtml={footerHtml} />);
}
```

```tsx
// entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

### `TuvixReactApp`

Bir React mikro uygulamasını host ağacının içinde, `<div data-tuvix-app={name}>` elemanına satır içi render eder.

| Prop | Tür | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Modülün `name` değeriyle eşleşmelidir. |
| `App` | `ComponentType<P>` | zorunlu | Render edilecek bileşen. |
| `fallback` | `ReactNode` | `null` | `App` suspend olduğunda veya hata fırlattığında gösterilir. |
| diğer props | `P` | `P` neyi zorunlu tutuyorsa | `App` bileşenine geçirilir. |

`App`, bir error boundary ve bir `<Suspense fallback>` içinde durur. Sunucudaki bir render hatası yalnızca bu uygulamayı `fallback` ile değiştirir ve React istemcide yeniden dener. İstemcideki bir render hatası `fallback` gösterir ve `tuvix:error` olayını tetikler. Bileşen `tuvix:mounted` (`hydrated` ile birlikte) ve `tuvix:unmounted` olaylarını tetikler.

### `useTuvixBus(bus, event, handler)`

Bir effect içinde abone olur, unmount sırasında aboneliği bırakır. En son `handler` bir ref içinde tutulur, böylece her render'da yeniden abone olmaz. `@tuvix.js/event-bus` paketindeki `getGlobalBus()` değerini verin; adaptör orchestrator bus'ını `App` bileşenine iletmez.

### `useTuvixProps(initialProps, bus?, updateEvent?)`

`bus` üzerindeki her `updateEvent` (varsayılan `'tuvix:props:update'`) payload'ını birleştiren props döndürür. Tuvix'te bu olayı yayınlayan hiçbir şey yoktur; olayı siz yayınlarsınız. `createReactMicroApp` ile oluşturulan modüller yeni props'u bu hook olmadan `update` üzerinden alır.

### Tipler

`ReactMicroAppConfig<P>`, `TuvixIslandProps`, `TuvixReactAppProps<P>`.

## Sınır durumlar

- İlk render hata fırlatırsa `mount` reject olur, modül container'ı boşaltır ve `tuvix:error` olayını tetikler. Sonraki bir render hatası, siz yeniden mount edene kadar uygulamayı boş bırakır.
- Bekleyen bir `mount` sırasında çağrılan `unmount` onu bekler ve container'ı boş bırakır.
- Modülün zaten tuttuğu bir container üzerinde `mount`, eski root'u unmount eder (`tuvix:unmounted` olayını tetikler) ve yeni props ile sıfırdan render eder. Vue, Svelte ve Angular adaptörleri de böyle davranır.
- Bilinmeyen bir container üzerinde `unmount` ve `update` hiçbir şey yapmaz.
- React bir `TuvixIsland` bileşenini kaldırdığında modül, eleman ayrıldıktan sonra `tuvix:unmounted` bildirir. Olay `document` üzerine gider (`detail.container` dolu olarak). Bu yüzden `document` dinleyicileri ve `onLifecycle` onu alır; container'daki veya üst elemanlarındaki dinleyiciler almaz. Uygulamanın hiçbir container'ı mount edilmiş durumda kalmadığında `isMounted(name)` değeri `false` olur.
- Geliştirme ortamında `<StrictMode>` altında React island'ın mount effect'ini iki kez çalıştırır, ancak island atılan ilk çalıştırmayı atlar: modül bir kez mount edilir ve sunucu markup'ını sahiplenir.
- Başarısız bir mount'tan sonra yeni bir `app` veya `name` ile gelen modül boş bir elemana mount edilir. Bu modül başarısız uygulamanın sunucu HTML'ini hiçbir zaman almaz.

## Ne yapmaz

- Modülleri URL ile yüklemez. Bunun için `@tuvix.js/core` veya `@tuvix.js/loader` kullanın.
- String'e render etmez. `react-dom/server` kullanın, `ssrHtml` için de `renderVueToString` ve benzerlerini kullanın.
- Island CSS'ini yüklemez. Bunun için `@tuvix.js/vite` kullanın.

## 0.5 sürümündeki breaking change'ler

- `TuvixReactApp` sunucu HTML'i artık Suspense yorum işaretleri içerir; sunucuyu ve istemciyi birlikte güncelleyin.
- İlk render hata fırlattığında `mount` reject olur.
- Modülün hiç mount etmediği bir container üzerinde `unmount` hiçbir şey yapmaz.

Dokümantasyonun tamamı: [tuvix.js.org/tr/packages/react](https://tuvix.js.org/tr/packages/react)

## Lisans

MIT
