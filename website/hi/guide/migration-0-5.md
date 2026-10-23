# 0.5 पर माइग्रेट करें

0.5 उन bugs को ठीक करता है जिनसे observable behaviour बदलता था, इसलिए इनमें से कुछ fixes 0.4 का code तोड़ते हैं। यह पेज हर breaking change को पैकेज के हिसाब से, बदलने वाले code के साथ, बताता है। हर `tuvix.js` और `@tuvix.js/*` पैकेज को एक साथ `^0.5.0` पर upgrade करें; एक ही पेज पर 0.4 और 0.5 adapters मिलाना supported नहीं है।

```bash
pnpm up --latest "tuvix.js" "@tuvix.js/*"
```

0.5 से पहले `create-tuvix-app` से बने projects `^0.1.0` पर निर्भर हैं, जो कभी 0.4 या 0.5 पर resolve नहीं होता। उन ranges को हाथ से बदलें।

## Core

### Orchestrator global bus इस्तेमाल करता है

0.4 हर orchestrator को `getGlobalBus()` से अलग एक private bus देता था। 0.5 में orchestrator का bus `getGlobalBus()` ही है, जब तक आप `eventBus` विकल्प न दें, और `destroy()` global bus को चालू छोड़ता है।

```ts no-check
// 0.4: two buses; apps listening on getGlobalBus() missed orchestrator events
const orchestrator = createOrchestrator();
orchestrator.getEventBus() === getGlobalBus(); // false
```

```ts
// 0.5
import { createOrchestrator, getGlobalBus } from 'tuvix.js';

const shared = createOrchestrator();
console.log(shared.getEventBus() === getGlobalBus()); // true

const isolated = createOrchestrator({ eventBus: {} }); // private bus, as in 0.4
console.log(isolated.getEventBus() === getGlobalBus()); // false
```

अगर आपने orchestrator का bus `window` पर रखा था ताकि ऐप्स उसे ढूँढ सकें, तो वह हटा दें और mount context का `bus` या `getGlobalBus()` इस्तेमाल करें।

### Route changes manual ऐप्स को नहीं छूते

0.4 अगले route change पर ऐसे ऐप को unmount कर देता था जिसके पास न `activeWhen` था न कोई router route, और `mountWhenVisible` ऐप्स को भी। 0.5 में reconciles सिर्फ़ उन ऐप्स को छूते हैं जिन्हें `activeWhen` या कोई route नियंत्रित करता है। अगर आप हाथ से mount किए ऐप को हटाने के लिए navigation पर निर्भर थे, तो उसे खुद unmount करें:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.unmountApp('cookie-banner');
```

### sandbox: true shadow root में रेंडर करता है

0.4 में `register` पर `sandbox` कुछ नहीं करता था। 0.5 में `sandbox: true` ऐप को shadow root के अंदर mount करता है और उसकी entry `styles` वहीं load करता है। पेज की CSS ऐप तक पहुँचना बंद कर देती है, और ऐप की entry styles पेज तक पहुँचना बंद कर देती हैं। जो ऐप्स पेज के styles पर निर्भर हैं, उनसे `sandbox: true` हटाएँ। [Sandboxing](/hi/guide/sandbox) देखें।

### prefetch: 'hover'

0.4 पेज पर कहीं भी पहली mouse movement पर हर ऐप को prefetch करता था। 0.5 किसी ऐप को तब prefetch करता है जब pointer किसी ऐसे same-origin link में प्रवेश करता है, या focus उस पर आता है, जिसका path उस ऐप को activate करता है। सारे ऐप्स पहले ही fetch करने के लिए `'idle'` या `'immediate'` इस्तेमाल करें।

### OrchestratorConfig.shared हटा दिया गया

Orchestrator ने `shared` कभी पढ़ा ही नहीं। इसे हटा दें, और डिपेंडेंसी `@tuvix.js/module-federation` या import maps से साझा करें।

### activeWhen patterns

`activeWhen` strings अब `matchPath` इस्तेमाल करती हैं। Query string या hash से अब ऐप unmount नहीं होता, `:param` segments काम करते हैं, और `.` और `(` जैसे characters ज्यों के त्यों match होते हैं।

```ts no-check
// 0.4: `.` was a regex wildcard and matched '/v1x0'
activeWhen: '/v1.0/*'
// 0.4: query strings broke matching, so people wrote functions
activeWhen: (path) => path.split('?')[0].startsWith('/dashboard')
```

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'dashboard',
  entry: () => import('./apps/dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*', // also active on /dashboard?tab=1
});
```

## Router

### '/' route और RouteConfig.exact

Route paths हर जगह पूरे path से match होते हैं। `'/'` route अब सिर्फ़ `/` पर activate होता है; 0.4 में `getActiveApps()` इसे हर path मानता था, जबकि `match()` इसे exact मानता था। `RouteConfig.exact` हटा दिया गया, क्योंकि उससे कभी कुछ नहीं बदला।

```ts no-check
// 0.4
routes: [{ path: '/', app: 'shell-nav' }, { path: '/settings', app: 'settings', exact: true }]
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({
  routes: [
    { path: '/*', app: 'shell-nav' }, // every path
    { path: '/settings', app: 'settings' }, // /settings only
  ],
});
void router;
```

`register` पर `activeWhen: '/'` अब भी हर path से match होता है, क्योंकि `activeWhen` strings prefix matching इस्तेमाल करती हैं।

### push और replace base जोड़ते हैं

```ts no-check
// 0.4 with base: '/app'
router.push('/app/settings'); // you had to add the base yourself
```

```ts
// 0.5
import { createRouter } from 'tuvix.js';

const router = createRouter({ base: '/app', routes: [] });
await router.push('/settings'); // URL: /app/settings
```

0.5 में `/app/settings` देने पर `/app/app/settings` लिखा जाता है। Back/forward navigation रद्द करने वाला guard भी URL को base के साथ वापस लगाता है।

### राउटर के दूसरे बदलाव

- `base` सिर्फ़ segment boundary पर हटता है। `base: '/app'` के साथ `/application` `/application` ही रहता है।
- `pathToRegex()` एक cached `RegExp` लौटाता है; इसे mutate न करें। इसका दूसरा `exact` argument हटा दिया गया।
- Patterns में regex characters ज्यों के त्यों match होते हैं। Pattern के बीच में `*` एक segment से match होता है।
- `matchRoute()` और `isPathActive()` path में `#hash` को नज़रअंदाज़ करते हैं।

## Loader

### हटाए गए विकल्प

`LoaderOptions.fetch` और `EntryConfig.html` हटा दिए गए। Loader ने इन्हें कभी पढ़ा ही नहीं; इन्हें अपने config से हटा दें।

```ts no-check
// 0.4
new ModuleLoader({ fetch: myFetch });
orchestrator.register({ name: 'x', entry: { scripts: ['/x.js'], html: '<div></div>' }, container: '#x' });
```

```ts
// 0.5
import { ModuleLoader } from '@tuvix.js/loader';

const loader = new ModuleLoader({ timeout: 10000 });
void loader;
```

### Module scripts हर URL पर एक बार चलती हैं

`unload(name)` के बाद, जिस ऐप की `type: 'module'` script ने खुद को register किया था, वह उसी URL से दोबारा load नहीं होता, क्योंकि ब्राउज़र हर URL के लिए module script एक बार चलाते हैं। जिन ऐप्स को आप unload करके फिर से load करते हैं, उनके लिए loader-function entry इस्तेमाल करें:

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
orchestrator.register({
  name: 'editor',
  entry: () => import('./apps/editor'),
  container: '#editor',
});
```

Cached module के लिए `load()` अब `0` की जगह अपनी असली `duration` बताता है।

## Module Federation

`federatedEntry` और `createFederatedEntry` अब `{ scripts: [remoteEntry.js] }` की जगह एक loader function लौटाते हैं। 0.4 की entry container script load करती थी और फिर "no exports found" के साथ fail हो जाती थी।

```ts no-check
// 0.4
orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }),
  container: '#main',
});
```

```ts
// 0.5
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader, federatedEntry } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry(
    { name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' },
    './App', // exposed module path
  ),
  container: '#main',
  activeWhen: '/dashboard/*',
});

const remotes = createFederatedLoader({
  remotes: [{ name: 'settings', url: 'https://cdn.example.com/settings/remoteEntry.js' }],
  shareScope: {}, // replaces 0.4 `shared`
});

orchestrator.register({
  name: 'settings',
  entry: remotes.createFederatedEntry('settings', './App'),
  container: '#main',
  activeWhen: '/settings/*',
});
```

- `FederatedLoaderConfig.shared` की जगह अब `shareScope` है। 0.4 ने `shared` कभी नहीं पढ़ा।
- `loadRemoteContainer` अब `any` की जगह `FederatedContainer` लौटाता है।

## React

- `TuvixReactApp` के server HTML में अब Suspense comment markers (`<!--$-->...<!--/$-->`) होते हैं। दोनों तरफ़ `@tuvix.js/react` 0.5 से रेंडर और hydrate करें।
- पहला render throw करने पर `mount` reject होता है। 0.4 में एरर React के root error handler तक पहुँचता था और `mount` resolve हो जाता था। अब orchestrator ऐप का `fallback` दिखाता है और `onError` call करता है।
- जिस container को module ने कभी mount नहीं किया, उस पर `unmount` कुछ नहीं करता। 0.4 उसे खाली कर देता था।

## Vue

`update()` अब `app.config.globalProperties.$tuvixProps` नहीं लिखता। Props अब reactive हैं:

```vue
<!-- 0.4 -->
<template>{{ $tuvixProps.theme }}</template>
```

```vue
<!-- 0.5 -->
<script setup lang="ts">
defineProps<{ theme?: string }>();
</script>

<template>{{ theme }}</template>
```

Descendants `inject('tuvixProps')` कर सकते हैं, जो वही reactive object लौटाता है।

- `VueSsrMicroAppConfig` अब `ssr` स्वीकार नहीं करता। `createSsrVueMicroApp` इसे set करता है।
- जिस container को module ने कभी mount नहीं किया, उस पर `unmount` कुछ नहीं करता।

## Svelte

- `ssr` के बिना `createSvelteMicroApp` रेंडर करने से पहले container खाली करता है। 0.4 Svelte 3/4 components को मौजूदा markup के बाद जोड़ता था। Server markup रखने और उसे hydrate करने के लिए `createSsrSvelteMicroApp` इस्तेमाल करें।
- जिस container को module ने कभी mount नहीं किया, या जिसका mount fail हुआ, उस पर `unmount` कुछ नहीं करता। 0.4 उसे खाली कर देता था। अब चारों adapters ऐसा ही व्यवहार करते हैं।
- `svelte/server` load न होने पर `renderSvelteToString` अब `App.render` पर fallback नहीं करता। `render` देने पर यह Svelte 5 इस्तेमाल करता है; वरना जब `svelte` `mount` export करता है तो यह Svelte 5 वाला रास्ता लेता है, और `App.render` सिर्फ़ Svelte 3/4 के लिए call करता है। Svelte 5 का import या render एरर आप तक पहुँचता है।

Svelte 5 components 0.5 में काम करते हैं; 0.4 में `createSvelteMicroApp` उन पर fail होता था। Svelte 5 का `update()` component को remount करता है, जब तक आप config में `svelte/reactivity` से `SvelteMap` न दें; उसके साथ props अपनी जगह update होते हैं:

```ts
import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import Profile from './Profile.svelte';

export default createSvelteMicroApp({ name: 'profile', App: Profile, SvelteMap });
```

## Angular

### नया config shape

```ts no-check
// 0.4
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

export default createAngularMicroApp({
  name: 'admin',
  module: AppModule,
  platform: platformBrowserDynamic,
  selector: 'app-root',
});
```

```ts
// 0.5
import { createAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app.component';
import { AppModule } from './app.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AppComponent, // required
  module: AppModule, // only when AppComponent is declared in an NgModule
});
```

`platform` और `compilerOptions` हटा दिए गए। अपनी entry से `import '@angular/compiler'` हटाएँ; JIT components के लिए adapter compiler खुद load करता है।

### Default रूप से zoneless

जब तक आप `zone: true` न दें, ऐप्स zone.js के बिना चलते हैं। Angular 15-17 पर DOM events अब change detection trigger नहीं करते; handlers में `ChangeDetectorRef.detectChanges()` call करें, या अपनी entry में `zone.js` import करें और `zone: true` दें। Angular 18+ zone.js के बिना change detection schedule करता है। [Angular](/hi/guide/angular) देखें।

### Props inputs हैं

`update()` अब `window.__TUVIX_ANGULAR_PROPS__` नहीं लिखता। इसकी जगह `@Input()` properties declare करें; adapter उन्हें `setInput` से set करता है।

```ts no-check
// 0.4
ngOnInit() {
  this.userId = (window as any).__TUVIX_ANGULAR_PROPS__?.admin?.userId;
}
```

```ts
// 0.5
import { Component, Input } from '@angular/core';

@Component({ selector: 'app-admin', standalone: true, template: '{{ userId }}' })
export class AdminComponent {
  @Input() userId = '';
}
```

### Angular के दूसरे बदलाव

- `createSsrAngularMicroApp` अब `provideClientHydration()` नहीं जोड़ता। यह server host element में दोबारा रेंडर करता है।
- जिस container को module ने कभी mount नहीं किया, उस पर `unmount` कुछ नहीं करता।

## Sandbox

- `Sandbox({ css: false }).activate(container)` `null` लौटाता है और कोई shadow root attach नहीं करता। `ISandbox.activate` `ShadowRoot | null` लौटाता है; `addStyle` call करने से पहले `null` की जाँच करें।
- `JsSandbox` strict mode blocked write पर `TypeError` throw करता है। 0.4 एक warning log करता था और value फिर भी store कर लेता था। आपका code जिन globals को लिखता है, उन्हें `allowedGlobals` में जोड़ें।

```ts
import { createSandbox } from '@tuvix.js/sandbox';

declare const container: HTMLElement;

const sandbox = createSandbox({ css: true, js: false });
const shadow = sandbox.activate(container);
if (shadow) sandbox.css.addStyle(shadow, ':host { display: block; }');
```

## Server

- जब कम से कम एक ऐप path से match हुआ हो और हर fragment fetch fail हुआ हो, तब `createServerRenderer().render()` `statusCode: 502` लौटाता है। जब कोई ऐप match नहीं हुआ या एक fragment सफल रहा, तब यह अब भी 200 लौटाता है। `createMiddleware` वही status भेजता है। Streaming renderer हमेशा 200 भेजता है।
- Rendering throw करने पर `createMiddleware` और `createStreamingMiddleware` `next()` की जगह `next(error)` call करते हैं, ताकि Express request को आपके error handler तक भेजे।

## जानने लायक non-breaking fixes

- `require('@tuvix.js/core')` और बाकी CommonJS entry points काम करते हैं। 0.4 में पाँच पैकेज `require` को उन files की ओर point करते थे जिन्हें build कभी लिखता ही नहीं था।
- `getGlobalBus()` अपना instance `window` पर रखता है, इसलिए अलग-अलग bundle हुए माइक्रो ऐप्स एक ही bus साझा करते हैं।
- Adapters और `defineMicroApp` `tuvix:mounted`, `tuvix:unmounted` और `tuvix:error` dispatch करते हैं। [Lifecycle Events](/hi/guide/lifecycle-events) देखें।
- Throw करने वाला `bootstrap()` अगले mount पर फिर से चलता है। 0.4 उसके बाद उसे छोड़ देता था।
- `start()` के बाद `register()` ऐप को तुरंत mount करता है, अगर मौजूदा path उसे activate करता हो, और `mountWhenVisible` ऐप को observe करना शुरू करता है।
- हर lifecycle failure bus पर `{ name, error, phase }` के साथ `tuvix:app:error` emit करता है। 0.4 इसे सिर्फ़ load और mount failures के लिए emit करता था।
- `maxListeners` हर event के लिए एक बार `console.warn` से चेतावनी देता है, `debug` हो या न हो।
- `orchestrator.connectRouter()` `setTimeout` + `reconcile()` bridges की जगह लेता है। [बाहरी राउटर](/hi/guide/external-router) देखें।
