# @tuvix.js/angular

> Tuvix.js माइक्रोफ्रंटएंड फ्रेमवर्क के लिए Angular 15+ bindings

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

JIT कंपोनेंट्स के लिए `@angular/compiler` जोड़ें, और `renderAngularToString` (Angular 16+) के लिए सर्वर पर `@angular/platform-server` के साथ `@angular/compiler` जोड़ें।

## क्विक स्टार्ट

```ts
import { Component, Input } from '@angular/core';
import { createAngularMicroApp } from '@tuvix.js/angular';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

Adapter `@tuvix.js/loader` के `registerModule` से module को register करता है। Orchestrator से आए props कंपोनेंट inputs बन जाते हैं:

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'greeting', entry: () => import('./greeting-app'), container: '#greeting', props: { name: 'Ada' } });
await orchestrator.start();
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

## API

### `createAngularMicroApp(config)`

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | required | ऐप का नाम, `registerModule` से register होता है |
| `component` | `Type<C>` | required | Root कंपोनेंट |
| `module` | `Type<unknown>` | none | `component` को declare करने वाला NgModule। इसके providers `importProvidersFrom` से जोड़े जाते हैं |
| `providers` | `AngularProviders` | `[]` | Environment providers, जैसे `provideHttpClient()` |
| `selector` | `string` | कंपोनेंट selector का element हिस्सा, नहीं तो `'div'` | Host element का tag name |
| `zone` | `boolean` | `false` | zone.js इस्तेमाल करें। आपकी entry को पहले `zone.js` import करना होगा |
| `ssr` | `boolean` | `false` | `renderAngularToString` से आया markup अपनाएं |
| `bootstrap` | `() => void \| Promise<void>` | none | एक बार होने वाला setup |

- हर mount `createApplication` कॉल करता है और कंपोनेंट को container के अंदर उसके अपने host element में bootstrap करता है, इसलिए दो Angular ऐप्स (या एक ही ऐप की दो copies) कभी एक `app-root` पर नहीं टकराते।
- Props पहले change detection से पहले `ComponentRef.setInput` से सेट होते हैं, इसलिए `ngOnInit` उन्हें देखता है। जो keys inputs नहीं हैं, उन्हें छोड़ दिया जाता है।
- `update({ props, container? })` नए inputs सेट करता है और एक container या हर mount के लिए `appRef.tick()` चलाता है। नए props में जो inputs नहीं हैं, वे `undefined` पर reset होते हैं।
- JIT कंपोनेंट्स (बिना `ɵcmp`) के लिए `@angular/platform-browser` से पहले `@angular/compiler` load होता है। यह तभी मदद करता है जब `@angular/core` के अलावा किसी Angular पैकेज को load करने वाला पहला code adapter हो। अगर आपकी कंपोनेंट फ़ाइलें `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` या कोई दूसरी Angular library import करती हैं, तो वे पैकेज adapter के चलने से पहले evaluate होते हैं और "JIT compilation failed" के साथ fail होते हैं। `import '@angular/compiler'` को अपनी क्लाइंट entry की पहली line रखें, या AOT build करें।
- `unmount` application को destroy करता है, container खाली करता है और `tuvix:unmounted` dispatch करता है। अगर `mount` अभी load हो रहा हो, तो यह mount को रद्द कर देता है।

### `createSsrAngularMicroApp(config)`

`createAngularMicroApp({ ...config, ssr: true })` जैसा ही। Container में सर्वर markup होने पर Angular सर्वर के host element में रेंडर करता है और adapter सर्वर के inline `<style>` tags हटा देता है। `tuvix:mounted` `hydrated: true` रिपोर्ट करता है।

यह सर्वर DOM के ऊपर फिर से रेंडर करता है। Angular की non-destructive hydration (`provideClientHydration`) को `<body>` के ठीक नीचे एक hydration marker comment चाहिए। किसी दूसरे पेज के अंदर का island यह marker नहीं दे सकता, इसलिए adapter इसे नहीं जोड़ता।

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `@tuvix.js/angular/server` से `renderAngularToString(component, options?)`

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `providers` | `AngularProviders` | `[]` | सर्वर रेंडर के लिए providers |
| `appId` | `string` | `'ng'` | Angular `APP_ID` |
| `document` | `string` | host element वाला खाली document | जिस document में रेंडर करना है |
| `selector` | `string` | कंपोनेंट selector का element हिस्सा, नहीं तो `'app-root'` | Default document के लिए host tag |
| `props` | `Record<string, unknown>` | `{}` | कंपोनेंट inputs की values, पहले change detection से पहले सेट होती हैं |

कंपोनेंट के `<style>` tags और उनके बाद body markup लौटाता है। यह zoneless चलता है, `Promise` को कभी patch नहीं करता, और कंपोनेंट के शुरू किए HTTP requests का इंतज़ार नहीं करता। इसे किसी सर्वर function से कॉल करें। ब्राउज़र में यह `''` लौटाता है।

`props` क्लाइंट props की तरह काम करता है: keys input नाम (या aliases) होती हैं, जो keys inputs नहीं हैं उन्हें छोड़ दिया जाता है, और `ngOnInit` values देखता है। सर्वर रेंडर और `mount` दोनों को एक ही object दें, ताकि दोनों तरफ़ एक जैसा markup रेंडर हो।

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

const props = { name: 'Ada' };
const aboutHtml = await renderAngularToString(AboutComponent, { appId: 'about', props });
// Client: aboutApp.mount({ container, props })
```

### Types

`AngularMicroAppConfig<C>`, `AngularSsrMicroAppConfig<C>`, `AngularSsrOptions`, `AngularProviders` (सभी `@tuvix.js/angular` से)।

## Change Detection

Adapter कभी zone.js import नहीं करता। `zone: true` के बिना यह Angular 20+ पर `provideZonelessChangeDetection()`, 18-19 पर `provideExperimentalZonelessChangeDetection()` जोड़ता है, और 15-17 पर `NgZone` को `ɵNoopNgZone` से बदल देता है।

- Angular 18+: event listeners, signals, `markForCheck()` और `AsyncPipe` change detection schedule करते हैं। Timer या `fetch` callback में बदला गया सामान्य field ऐसा नहीं करता। Signal या `markForCheck()` इस्तेमाल करें।
- Angular 15-17: DOM events change detection trigger नहीं करते। State बदलने के बाद `ChangeDetectorRef.detectChanges()` कॉल करें, या `zone: true` दें।

## Edge Cases

- zone.js load किए बिना `zone: true` mount को reject करता है और `tuvix:error` dispatch करता है।
- जिस container को इस module ने कभी mount नहीं किया, उस पर `unmount` कुछ नहीं करता।
- Angular 16 पर सर्वर रेंडर के दौरान `@angular/platform-server` Domino की DOM classes (`Event`, `Node`, ...) को Node के global object पर copy करता है। यह Angular करता है, adapter नहीं।
- Attribute-selector कंपोनेंट्स को सर्वर पर मेल खाने वाले host element वाला `document` चाहिए।

## यह क्या नहीं करता

- यह zone.js load नहीं करता, `provideClientHydration()` नहीं जोड़ता, और सर्वर DOM nodes और form state को नहीं रखता।
- यह `window.__TUVIX_ANGULAR_PROPS__` नहीं लिखता। Inputs declare करें।

पूरा डॉक्यूमेंटेशन: [tuvix.js.org/hi/packages/angular](https://tuvix.js.org/hi/packages/angular)

## लाइसेंस

MIT
