---
title: 'tuvix.js'
---

<PackageHeader
  name="tuvix.js"
  title="tuvix.js (अम्ब्रेला)"
  description="एक पैकेज, एक import path। यह @tuvix.js/core से orchestrator और @tuvix.js/router, @tuvix.js/event-bus, @tuvix.js/loader व @tuvix.js/sandbox की public APIs को re-export करता है।"
  icon="🎁"
  github="tuvix"
/>

## इंस्टॉलेशन

```bash
npm install tuvix.js
# or pnpm add tuvix.js
```

`tuvix.js` इंस्टॉल करने पर `@tuvix.js/core`, `@tuvix.js/router`, `@tuvix.js/event-bus`, `@tuvix.js/loader` और `@tuvix.js/sandbox` भी इंस्टॉल होते हैं। सभी छह पैकेज ES module और CommonJS builds के साथ आते हैं और `"sideEffects": false` घोषित करते हैं।

## इसे कब इस्तेमाल करें

`tuvix.js` को उस shell ऐप्लिकेशन में इंस्टॉल करें जो orchestrator के साथ राउटर, event bus या sandbox इस्तेमाल करता है। आपको version करने के लिए एक डिपेंडेंसी और एक import path मिलता है, और आपका bundler वे exports हटा देता है जिन्हें आप कभी import नहीं करते।

इन स्थितियों में scoped पैकेज इंस्टॉल करें:

- माइक्रो ऐप सिर्फ़ shell से बात करता है। अकेला `@tuvix.js/event-bus` उसे `getGlobalBus()` देता है, और orchestrator उसके `node_modules` में नहीं आता।
- आपको ऐसा export चाहिए जिसे अम्ब्रेला छोड़ देता है, जैसे `@tuvix.js/loader` से `registerModule` या `emitLifecycle`, या `@tuvix.js/router` से `pathToRegex`। [शामिल नहीं](#not-included) देखें।
- आप चाहते हैं कि आपका `package.json` बताए कि कोई पैकेज Tuvix.js के किन हिस्सों पर निर्भर है।

दोनों को मिलाकर इस्तेमाल करना सुरक्षित है। अम्ब्रेला वही modules re-export करता है, इसलिए `tuvix.js` और `@tuvix.js/event-bus` दोनों से मिला `getGlobalBus` एक ही bus लौटाता है, और lifecycle helpers `window` पर एक ही registry साझा करते हैं।

## क्विक स्टार्ट

एक shell जो `/about` पर `about` को mount करता है, link clicks को राउटर navigation में बदलता है और ऐप एरर log करता है:

```ts
import { createOrchestrator, getGlobalBus, interceptLinks, OrchestratorEvent, type AppErrorEvent } from 'tuvix.js';

const orchestrator = createOrchestrator({ router: { routes: [] } });

orchestrator.register({
  name: 'about',
  entry: 'https://cdn.example.com/about/main.js',
  container: '#main',
  activeWhen: '/about',
  props: { who: 'us' },
});

getGlobalBus().on<AppErrorEvent>(OrchestratorEvent.APP_ERROR, ({ name, error, phase }) => {
  console.error(`${name} failed during ${phase}`, error);
});

await orchestrator.start();
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });
```

`about` ऐप, जो `https://cdn.example.com/about/main.js` पर build होता है:

```ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'about',
  mount({ container, props }) {
    container.innerHTML = `<h1>About ${String(props?.who)}</h1>`;
  },
  unmount({ container }) {
    container.replaceChildren();
  },
});
```

`<a href="/about?ref=nav">` पर click करने से `/about?ref=nav` push होता है, और orchestrator `about` को `#main` में mount करता है (query string matching पर असर नहीं डालती)।

## API

नीचे का हर export एक re-export है। लिंक किया गया पैकेज पेज उसका signature, विकल्प और edge cases बताता है।

### `@tuvix.js/core` से

Docs: [`@tuvix.js/core`](/hi/packages/core)।

| Export | प्रकार | यह क्या करता है |
| --- | --- | --- |
| `createOrchestrator` | फ़ंक्शन | एक `Orchestrator` बनाता है। |
| `Orchestrator` | क्लास | ऐप्स register करता है, उन्हें URL के साथ reconcile करता है, किसी राउटर को follow करता है (`connectRouter`), props update करता है, destroy करता है। |
| `defineMicroApp` | फ़ंक्शन | `{ name, bootstrap?, mount, unmount, update?, ssr? }` object को validate करता है, उसे loader के लिए register करता है और उससे `tuvix:mounted` / `tuvix:unmounted` / `tuvix:error` emit करवाता है। |
| `OrchestratorEvent` | enum | वे event names जो orchestrator अपने bus पर emit करता है (`tuvix:app:mount`, `tuvix:app:error`, ...)। |
| `OrchestratorConfig`, `MicroAppConfig`, `MicroAppDefinition` | टाइप | `createOrchestrator`, `register` और `defineMicroApp` के arguments। |
| `AppStatus`, `AppSandboxOption`, `RouterSource`, `RegisteredApp` | टाइप | ऐप status union, `sandbox` विकल्प, `connectRouter` argument, ऐप record का shape। |
| `AppErrorEvent`, `AppErrorPhase` | टाइप | `APP_ERROR` payload `{ name, error, phase }` और उसका phase union (`'load'`, `'bootstrap'`, `'mount'`, `'update'`, `'unmount'`)। |

### `@tuvix.js/event-bus` से

Docs: [`@tuvix.js/event-bus`](/hi/packages/event-bus)।

| Export | प्रकार | यह क्या करता है |
| --- | --- | --- |
| `EventBus` | क्लास | `on`, `once`, `emit`, `off`, `onAny` वाला pub/sub bus। |
| `createEventBus` | फ़ंक्शन | एक नया, अलग `EventBus` बनाता है। |
| `getGlobalBus` | फ़ंक्शन | `window.__TUVIX_GLOBAL_BUS__` पर रखा पेज-व्यापी bus लौटाता है। orchestrator डिफ़ॉल्ट रूप से इसी को इस्तेमाल करता है। |
| `resetGlobalBus` | फ़ंक्शन | पेज-व्यापी bus को destroy करता है। अगला `getGlobalBus()` नया bus बनाता है। |
| `IEventBus`, `EventHandler`, `WildcardHandler`, `Unsubscribe`, `EventBusOptions` | टाइप | Bus interface, handler signatures, unsubscribe फ़ंक्शन, constructor विकल्प। |

### `@tuvix.js/router` से

Docs: [`@tuvix.js/router`](/hi/packages/router)।

| Export | प्रकार | यह क्या करता है |
| --- | --- | --- |
| `Router` | क्लास | History या hash राउटर, जो paths को ऐप names से जोड़ता है। |
| `createRouter` | फ़ंक्शन | एक `Router` बनाता है। |
| `matchPath` | फ़ंक्शन | किसी path को pattern से match करता है (`:param`, `/*`, query और hash को अनदेखा करता है)। `activeWhen` strings इसी का इस्तेमाल करती हैं। |
| `matchRoute` | फ़ंक्शन | `RouteConfig[]` में पहला route लौटाता है जो path से पूरी तरह match करता है, `params` और `query` के साथ। |
| `normalizePath` | फ़ंक्शन | शुरू में slash जोड़ता है और आख़िरी slash हटाता है। |
| `interceptLinks` | फ़ंक्शन | same-origin link clicks को `navigate(path)` call में बदलता है, वैकल्पिक intent prefetch के साथ। |
| `resolveLink` | फ़ंक्शन | जिस HTML link पर event हुआ, उसके लिए `{ anchor, url, path }` लौटाता है, या जब link ब्राउज़र को handle करना चाहिए तब `null`। |
| `IRouter`, `RouterConfig`, `RouterMode`, `RouteConfig`, `MatchedRoute` | टाइप | राउटर interface, विकल्प और route shapes। |
| `NavigationEvent`, `NavigationGuard`, `RouteChangeHandler` | टाइप | Navigation payload, guard और listener signatures। |
| `PathMatch`, `MatchPathOptions`, `InterceptLinksOptions`, `ResolvedLink`, `ResolveLinkOptions` | टाइप | `matchPath` का result और विकल्प, `interceptLinks` के विकल्प, `resolveLink` का result और विकल्प। |

### `@tuvix.js/loader` से

Docs: [`@tuvix.js/loader`](/hi/packages/loader)।

| Export | प्रकार | यह क्या करता है |
| --- | --- | --- |
| `ModuleLoader` | क्लास | timeout, retries और caching के साथ एक entry (URL, script/style config या loader फ़ंक्शन) load करता है। |
| `createLoader` | फ़ंक्शन | एक `ModuleLoader` बनाता है। |
| `whenMounted` | फ़ंक्शन | तब resolve होता है जब कोई ऐप अपना `mounted` lifecycle event emit करता है। |
| `onLifecycle` | फ़ंक्शन | `tuvix:mounted`, `tuvix:unmounted` या `tuvix:error` DOM events को सुनता है। |
| `isMounted` | फ़ंक्शन | lifecycle events के अनुसार, जब तक ऐप का कोई भी container mounted है, तब तक `true`। |
| `Entry`, `EntryConfig`, `MicroAppModule`, `MountContext`, `UnmountContext`, `UpdateContext` | टाइप | Entry formats और वह lifecycle contract जिसे माइक्रो ऐप implement करता है। |
| `LoaderOptions`, `LoadResult`, `LoadStatus`, `PrefetchStrategy` | टाइप | Loader के विकल्प और results। |
| `LifecycleType`, `LifecycleDetail`, `LifecycleEvent` | टाइप | Lifecycle event names, payload और DOM event type। |

```ts
import { onLifecycle, whenMounted } from 'tuvix.js';

const off = onLifecycle('error', ({ name, error }) => console.error(name, error));

const { container, hydrated } = await whenMounted('footer', { signal: AbortSignal.timeout(5000) });
console.log(container.id, hydrated);
off();
```

### `@tuvix.js/sandbox` से

Docs: [`@tuvix.js/sandbox`](/hi/packages/sandbox)।

| Export | प्रकार | यह क्या करता है |
| --- | --- | --- |
| `CssSandbox` | क्लास | container को shadow root में ले जाता है और उसके अंदर stylesheets load करता है। `sandbox: true` के लिए orchestrator इसी का इस्तेमाल करता है। |
| `JsSandbox` | क्लास | Proxy `window`, जो script के लिखे globals को असली `window` से दूर रखता है। |
| `Sandbox` | क्लास | एक `activate` / `deactivate` जोड़ी के पीछे `CssSandbox` और `JsSandbox`। |
| `createSandbox` | फ़ंक्शन | एक `Sandbox` बनाता है। |
| `SandboxOptions`, `ISandbox`, `ICssSandbox`, `IJsSandbox` | टाइप | Sandboxes के विकल्प और interfaces। |
| `AdoptStylesOptions`, `AdoptedStyles` | टाइप | `CssSandbox.adoptStyles` का argument और return value। |

### शामिल नहीं {#not-included}

अम्ब्रेला इन्हें छोड़ देता है। जो पैकेज इन्हें देता है, उसे इंस्टॉल करें।

| आपको चाहिए | इंस्टॉल करें |
| --- | --- |
| `registerModule`, `unregisterModule`, `getRegisteredModule`, `emitLifecycle`, `hasServerMarkup`, `normalizeEntry`, `loadScript`, `loadStyle`, `removeScript`, `removeStyle`, `prefetchResource`, और types `EntryLoader`, `EntryLoaderContext`, `MicroAppBus`, `ScriptType`, `CacheEntry`, `ResourceOptions`, `LoadScriptOptions`, `LoadStyleOptions`, `PrefetchOptions` | [`@tuvix.js/loader`](/hi/packages/loader) |
| `pathToRegex`, `parseQuery`, `isPathActive` | [`@tuvix.js/router`](/hi/packages/router) |
| React, Vue, Svelte या Angular माइक्रो ऐप्स | [`@tuvix.js/react`](/hi/packages/react), [`@tuvix.js/vue`](/hi/packages/vue), [`@tuvix.js/svelte`](/hi/packages/svelte), [`@tuvix.js/angular`](/hi/packages/angular) |
| सर्वर-साइड composition | [`@tuvix.js/server`](/hi/packages/server) |
| Module Federation remotes | [`@tuvix.js/module-federation`](/hi/packages/module-federation) |
| Vite builds में island assets | [`@tuvix.js/vite`](/hi/packages/vite) |
| DevTools पैनल | [`@tuvix.js/devtools`](/hi/packages/devtools) |
| प्रोजेक्ट scaffolding | [`create-tuvix-app`](/hi/packages/create-tuvix-app) |

## Edge cases

- `tuvix.js` का एक ही entry point है। `tuvix.js/core` या `tuvix.js/router` जैसे subpath imports resolve नहीं होते। `tuvix.js` से या scoped पैकेज से import करें।
- अम्ब्रेला अपनी डिपेंडेंसी को उसी release पर pin करता है। किसी scoped पैकेज के अलग version के साथ `tuvix.js` इंस्टॉल करने पर उस पैकेज की दो copies बनती हैं। `getGlobalBus()` और lifecycle registry तब भी `window` के ज़रिए state साझा करते हैं, लेकिन `instanceof Orchestrator` या `instanceof EventBus` checks copies के बीच fail होते हैं।
- `whenMounted`, `onLifecycle` और `isMounted` `tuvix:*` DOM events पर प्रतिक्रिया देते हैं। `defineMicroApp` और फ्रेमवर्क adapters से बने modules इन्हें emit करते हैं। हाथ से लिखा module तब तक कोई event emit नहीं करता जब तक वह `@tuvix.js/loader` से `emitLifecycle` call न करे। document के बाहर वाले container के events `document` पर dispatch होते हैं।
- `resetGlobalBus()` उस bus को destroy करता है जिसे चलता हुआ orchestrator रखता है। orchestrator उसी destroyed bus को रखे रहता है, इसलिए उसके events अगले `getGlobalBus()` के subscribers तक नहीं पहुँचते। इसे tests के बीच, `orchestrator.destroy()` के बाद call करें।
- `@tuvix.js/core` और `@tuvix.js/router` के behaviour changes और breaking changes यहाँ बिना बदलाव के लागू होते हैं। [0.4 से माइग्रेशन](/hi/packages/core#migrating-from-0-4) देखें।

## यह क्या नहीं करता

- यह अपना कोई code नहीं जोड़ता। हर export पाँच scoped पैकेज में से किसी एक से आता है।
- इसमें फ्रेमवर्क adapters, server पैकेज, Module Federation, Vite या DevTools शामिल नहीं हैं।
- यह हर पैकेज के लिए subpath entries नहीं देता।
