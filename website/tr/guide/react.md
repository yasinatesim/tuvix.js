# React ile

`@tuvix.js/react` üç iş yapar. `createReactMicroApp` bir React bileşenini, herhangi bir shell'in mount edebileceği bir mikro uygulamaya dönüştürür. `TuvixReactApp` bir React mikro uygulamasını React host sayfanın içinde, sunucuda render ederek gösterir. `TuvixIsland` ise React sayfasının içinde Vue, Svelte, Angular, React ya da elle yazılmış bir mikro uygulamayı barındırır.

React 18 veya 19 gerekir.

## Kurulum

```bash
pnpm add @tuvix.js/react react react-dom
```

## Bileşeni mikro uygulamaya dönüştürme

```tsx
// src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

interface ProfileProps {
  userId: string;
  theme: 'light' | 'dark';
}

function Profile({ userId, theme }: ProfileProps) {
  return <div className={`profile ${theme}`}>User {userId}</div>;
}

export default createReactMicroApp({ name: 'profile', App: Profile });
```

Bu modül:

- kendini `name` altında kaydeder, böylece URL entry'si onu bulur;
- her container için ayrı bir React root oluşturur, böylece tek modül birden fazla yerde mount edilebilir;
- React ilk render'ı commit edince `mount` resolve olur, ardından modül container üzerinde `tuvix:mounted` olayını tetikler;
- shell'in props'larını `App` bileşenine props olarak geçirir. `App` zorunlu props tanımlayabilir; adaptör bunları çalışma zamanında denetlemez.

| Seçenek | Tip | Açıklama |
| --- | --- | --- |
| `name` | `string` | Zorunlu. Kayıtlı uygulama adıyla aynı olmalı. |
| `App` | `ComponentType<P>` | Zorunlu. Kök bileşen. |
| `bootstrap` | `() => void \| Promise<void>` | İlk mount'tan önce bir kez çalışır. |
| `ssr` | `boolean` | Container sunucu markup'ı içeriyorsa hydrate eder. `createSsrReactMicroApp` bunu açar. |

## Props ve güncellemeler

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'light' });
```

`update({ props, container })` o container'ın root'unu birleştirilmiş props ile yeniden render eder. Bileşen state'i korunur. `container` verilmezse modülün tüm root'larını yeniden render eder. Bu modülün daha önce render ettiği bir container'da `mount` çağırırsanız ikinci bir root oluşmaz, mevcut root yeniden render edilir.

## Hatalar

Adaptör `App` bileşenini bir error boundary ile sarar:

- İlk render sırasında hata fırlatılırsa `mount` reject olur, adaptör container'ı boşaltır ve `tuvix:error` olayını tetikler. Ardından orchestrator uygulamanın `fallback` HTML'ini gösterir.
- Sonrasında fırlatılan bir hata uygulamayı boşaltır ve `tuvix:error` olayını tetikler. Sayfanın geri kalanı çalışmaya devam eder.

## Sunucuda render edilen React uygulamaları

Host sayfa React ile yazılmışsa ve sunucuda render ediliyorsa (TanStack Start, Next.js, Remix ya da kendi `renderToString` kurulumunuz), mikro uygulamayı `TuvixReactApp` ile satır içinde render edin:

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

- `App` bileşenini `<div data-tuvix-app="legal">` ile sarar, böylece HTML host'un kendi sunucu render'ından gelir.
- `name`, `App` ve `fallback` dışındaki tüm props `App` bileşenine gider.
- `App` kendi `<Suspense fallback>` sınırının içinde durur. Sunucuda hata fırlatırsa React yalnızca bu uygulama için fallback'i gönderir ve uygulamayı istemcide yeniden dener.
- İstemcide bir error boundary `fallback` içeriğini gösterir ve `tuvix:error` olayını tetikler.
- İlk commit'ten sonra, sunucu HTML'ini hydrate ettiyse `hydrated: true` ile `tuvix:mounted` olayını, ağaçtan çıktığında da `tuvix:unmounted` olayını tetikler.

Bu markup'ı ayrı bir bundle hydrate edecekse (örneğin `@tuvix.js/server` ile birleştirilmiş bir sayfa), aynı bileşeni `createSsrReactMicroApp` ile export edin. Aynı Suspense ağacını render ettiği için hydration eşleşir:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export default createSsrReactMicroApp({ name: 'legal', App: LegalPage });
```

`ssr: true` açıkken yalnızca boşluk veya yorum içeren bir container hydrate edilmez, sıfırdan render edilir.

## TuvixIsland ile başka mikro uygulamaları barındırma

`TuvixIsland` herhangi bir mikro uygulama modülünü React ağacının içinde mount eder:

```tsx
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Newsletter from './Newsletter.vue';

const newsletter = createSsrVueMicroApp({ name: 'newsletter', App: Newsletter });

export function Footer({ newsletterHtml }: { newsletterHtml?: string }) {
  return (
    <TuvixIsland
      name="newsletter"
      app={newsletter}
      props={{ list: 'weekly' }}
      ssrHtml={newsletterHtml}
      fallback={<p>Subscribe at example.com/newsletter</p>}
    />
  );
}
```

| Prop | Açıklama |
| --- | --- |
| `name` | `data-tuvix-app` özniteliğine yazılır ve `mount` fonksiyonuna geçirilir. |
| `app` | Mount edilecek modül. |
| `props` | Her render'da yüzeysel karşılaştırılır. Değişiklik olursa `app.update` çağrılır; modülde `update` yoksa unmount + mount yapılır. |
| `ssrHtml` | Island'ın sunucu HTML'i. Yalnızca sunucuda gerekir. |
| `fallback` | `mount` veya `update` reject olursa island yerine render edilir. |
| `as`, `className` | Sarmalayıcı etiket (varsayılan `div`) ve sınıf. |

React ilk render'dan sonra island'ın iç HTML'ini bir daha yazmaz. Bu yüzden üst bileşen yeniden render edildiğinde modülün eklediği DOM ve dinleyiciler yerinde kalır. Yeni bir `name` veya `app` değeri island'ı yeniden mount eder; island kaldırıldığında `app.unmount` çağrılır. Mount, update ve unmount sırayla çalışır, yani `mount` sürerken gelen bir unmount onun bitmesini bekler.

`TuvixIsland` modülleri URL üzerinden yüklemez. Modülü import edin ya da URL entry'lerini orchestrator'a bırakın. Sunucu kurulumunun tamamı [SSR island'ları](/tr/guide/ssr-islands) sayfasında.

## Hook'lar

### useTuvixBus

Mount olunca abone olur, unmount olunca aboneliği bırakır. En güncel `handler` fonksiyonunu bir ref üzerinden okur, bu yüzden satır içi bir handler her render'da yeniden abone olmaz:

```tsx
import { useState } from 'react';
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixBus } from '@tuvix.js/react';

const bus = getGlobalBus();

export function CartBadge() {
  const [count, setCount] = useState(0);
  useTuvixBus<{ itemCount: number }>(bus, 'cart:updated', ({ itemCount }) => setCount(itemCount));
  return <span className="badge">{count}</span>;
}
```

### useTuvixProps

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` bir state döndürür ve `updateEvent` üzerinde yayınlanan her payload'u bu state'e birleştirir. Tuvix.js bu olayı hiçbir yerde yayınlamaz. Props'ları `updateAppProps` yerine bus üzerinden göndermek istediğinizde olayı kendiniz yayınlayın.

```tsx
import { getGlobalBus } from '@tuvix.js/event-bus';
import { useTuvixProps } from '@tuvix.js/react';

const bus = getGlobalBus();

export function Theme() {
  const props = useTuvixProps({ theme: 'light' }, bus);
  return <p>Theme: {props.theme}</p>;
}

bus.emit('tuvix:props:update', { theme: 'dark' });
```

## Adaptörün yapmadıkları

- Mikro uygulamalar arasında tek bir React root paylaştırmaz. Her uygulama ve her container kendi root'unu alır.
- React'i tekilleştirmez. Ayrı ayrı bundle edilmiş iki React mikro uygulaması, React'in iki kopyasını getirir.
- Host sayfanın `<head>` bölümünü render etmez. Başlık ve meta etiketleri host'un işidir.

## API

| Export | Amaç |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | React mikro uygulama modülü |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | `ssr: true` ile aynısı |
| `TuvixReactApp` | React host içinde, SSR destekli satır içi React mikro uygulaması |
| `TuvixIsland` | Herhangi bir mikro uygulama modülünü React ağacında SSR destekli barındırır |
| `useTuvixBus(bus, event, handler)` | Bileşene bağlı event bus aboneliği |
| `useTuvixProps(initial, bus?, event?)` | Bus olaylarından birleştirilen props |
