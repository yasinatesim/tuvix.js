# tuvix.js

> Tuvix.js orchestrator, router, event bus, loader ve sandbox için tek paket.

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır.

Dokümantasyonun tamamı: [tuvix.js.org/tr/packages/tuvix](https://tuvix.js.org/tr/packages/tuvix)

## Kurulum

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

Bu komut `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` ve `@tuvix.js/sandbox` paketlerini kurar. Her paket `"sideEffects": false` tanımlar, bu yüzden bundler'ınız hiç import etmediğiniz export'ları atar.

## Ne zaman kullanılır

Orchestrator'ı router, bus ya da sandbox ile birlikte kullanan bir shell'de `tuvix.js` paketini kullanın. Bir mikro uygulama yalnızca tek bir parçaya ihtiyaç duyuyorsa (örneğin `getGlobalBus()` için `@tuvix.js/event-bus`) ya da şemsiye paketin dışarıda bıraktığı bir export'a ihtiyacınız varsa (aşağıya bakın) bunun yerine scope'lu paketi kurun. İkisi aynı projede birlikte durabilir: `getGlobalBus()` ve lifecycle kaydı state'i `window` üzerinden paylaşır.

## Hızlı başlangıç

```ts
import { createOrchestrator, defineMicroApp, interceptLinks } from 'tuvix.js';

// Normally this lives in the remote app's bundle.
defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});

const orchestrator = createOrchestrator({ router: { routes: [] } });
orchestrator.register({
  name: 'about',
  entry: { scripts: [] },
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

## API

Tüm export'lar yeniden export'tur.

| Kaynak | Runtime export'ları | Tipler |
| --- | --- | --- |
| [`@tuvix.js/core`](https://tuvix.js.org/tr/packages/core) | `Orchestrator`, `createOrchestrator`, `defineMicroApp`, `OrchestratorEvent` | `AppStatus`, `AppErrorEvent`, `AppErrorPhase`, `AppSandboxOption`, `MicroAppConfig`, `RegisteredApp`, `RouterSource`, `OrchestratorConfig`, `MicroAppDefinition` |
| [`@tuvix.js/event-bus`](https://tuvix.js.org/tr/packages/event-bus) | `EventBus`, `createEventBus`, `getGlobalBus`, `resetGlobalBus` | `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` |
| [`@tuvix.js/router`](https://tuvix.js.org/tr/packages/router) | `Router`, `createRouter`, `matchPath`, `matchRoute`, `normalizePath`, `interceptLinks`, `resolveLink` | `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute`, `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` |
| [`@tuvix.js/loader`](https://tuvix.js.org/tr/packages/loader) | `ModuleLoader`, `createLoader`, `whenMounted`, `onLifecycle`, `isMounted` | `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext`, `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` |
| [`@tuvix.js/sandbox`](https://tuvix.js.org/tr/packages/sandbox) | `Sandbox`, `CssSandbox`, `JsSandbox`, `createSandbox` | `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles` |

Dahil olmayanlar: `registerModule`, `emitLifecycle`, `hasServerMarkup`, script helper'ları ve `EntryLoader` / `MicroAppBus` tipleri (`@tuvix.js/loader` paketini kurun); `pathToRegex`, `parseQuery`, `isPathActive` (`@tuvix.js/router` paketini kurun); framework adaptörleri, `@tuvix.js/server`, `@tuvix.js/module-federation`, `@tuvix.js/vite` ve `@tuvix.js/devtools`.

## Sınır durumlar

- Tek bir giriş noktası vardır. `tuvix.js/core` ve diğer alt path'ler çözümlenmez.
- Şemsiye paketin kullandığından farklı sürümde bir scope'lu paket iki kopya oluşturur. `window` üzerindeki paylaşılan state yine çalışır; kopyalar arası `instanceof` kontrolleri başarısız olur.
- `whenMounted`, `onLifecycle` ve `isMounted`, `defineMicroApp` modüllerinin ve framework adaptörlerinin yayınladığı `tuvix:*` DOM olaylarını görür. Uygulamanın herhangi bir container'ı mount edilmiş kaldığı sürece `isMounted(name)` değeri `true` olur.
- `resetGlobalBus()`, çalışan bir orchestrator'ın tuttuğu bus'ı yok eder. `destroy()` çağrısından sonra çağırın.
- `@tuvix.js/core` ve `@tuvix.js/router` 0.5.0 breaking change'leri burada da geçerlidir.

## Ne yapmaz

- Kendine ait kod eklemez.
- Adaptörleri, sunucuda render'ı, Module Federation'ı, Vite'ı ya da DevTools'u içermez.

## Lisans

MIT
