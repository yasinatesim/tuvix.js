# tuvix.js

> Tuvix.js के orchestrator, राउटर, event bus, loader और sandbox के लिए एक पैकेज।

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा।

पूरा documentation: [tuvix.js.org/hi/packages/tuvix](https://tuvix.js.org/hi/packages/tuvix)

## इंस्टॉलेशन

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

यह `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` और `@tuvix.js/sandbox` install करता है। हर पैकेज `"sideEffects": false` declare करता है, इसलिए आपका bundler उन exports को हटा देता है जिन्हें आप कभी import नहीं करते।

## इसे कब इस्तेमाल करें

`tuvix.js` का इस्तेमाल उस shell में करें जो orchestrator को राउटर, bus या sandbox के साथ जोड़ता है। जब किसी माइक्रो ऐप को सिर्फ़ एक हिस्सा चाहिए (उदाहरण के लिए `getGlobalBus()` के लिए `@tuvix.js/event-bus`), या जब आपको ऐसा export चाहिए जो umbrella में शामिल नहीं है (नीचे देखें), तो उसकी जगह scoped पैकेज install करें। दोनों एक ही project में रह सकते हैं: `getGlobalBus()` और lifecycle registry `window` के ज़रिए state साझा करते हैं।

## क्विक स्टार्ट

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

हर export एक re-export है।

| Source | Runtime exports | Types |
| --- | --- | --- |
| [`@tuvix.js/core`](https://tuvix.js.org/hi/packages/core) | `Orchestrator`, `createOrchestrator`, `defineMicroApp`, `OrchestratorEvent` | `AppStatus`, `AppErrorEvent`, `AppErrorPhase`, `AppSandboxOption`, `MicroAppConfig`, `RegisteredApp`, `RouterSource`, `OrchestratorConfig`, `MicroAppDefinition` |
| [`@tuvix.js/event-bus`](https://tuvix.js.org/hi/packages/event-bus) | `EventBus`, `createEventBus`, `getGlobalBus`, `resetGlobalBus` | `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` |
| [`@tuvix.js/router`](https://tuvix.js.org/hi/packages/router) | `Router`, `createRouter`, `matchPath`, `matchRoute`, `normalizePath`, `interceptLinks`, `resolveLink` | `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute`, `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler`, `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` |
| [`@tuvix.js/loader`](https://tuvix.js.org/hi/packages/loader) | `ModuleLoader`, `createLoader`, `whenMounted`, `onLifecycle`, `isMounted` | `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext`, `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy`, `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` |
| [`@tuvix.js/sandbox`](https://tuvix.js.org/hi/packages/sandbox) | `Sandbox`, `CssSandbox`, `JsSandbox`, `createSandbox` | `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox`, `AdoptStylesOptions`, `AdoptedStyles` |

शामिल नहीं: `registerModule`, `emitLifecycle`, `hasServerMarkup`, script helpers और `EntryLoader` / `MicroAppBus` types (`@tuvix.js/loader` install करें); `pathToRegex`, `parseQuery`, `isPathActive` (`@tuvix.js/router` install करें); फ्रेमवर्क adapters, `@tuvix.js/server`, `@tuvix.js/module-federation`, `@tuvix.js/vite` और `@tuvix.js/devtools`।

## Edge cases

- एक ही entry point है। `tuvix.js/core` और दूसरे subpaths resolve नहीं होते।
- अगर कोई scoped पैकेज umbrella वाले version से अलग version पर है, तो आपको दो copies मिलती हैं। `window` पर साझा state फिर भी काम करती है; copies के बीच `instanceof` checks fail होते हैं।
- `whenMounted`, `onLifecycle` और `isMounted` `tuvix:*` DOM events देखते हैं, जिन्हें `defineMicroApp` modules और फ्रेमवर्क adapters emit करते हैं। जब तक ऐप का कोई भी container mounted है, `isMounted(name)` `true` रहता है।
- `resetGlobalBus()` उस bus को destroy कर देता है जिसे चल रहा orchestrator रखता है। इसे `destroy()` के बाद call करें।
- `@tuvix.js/core` और `@tuvix.js/router` 0.5.0 के breaking changes यहाँ भी लागू होते हैं।

## यह क्या नहीं करता

- यह अपना कोई code नहीं जोड़ता।
- इसमें adapters, सर्वर रेंडरिंग, Module Federation, Vite या DevTools शामिल नहीं हैं।

## License

MIT
