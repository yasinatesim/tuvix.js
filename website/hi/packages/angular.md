---
title: '@tuvix.js/angular'
---

<PackageHeader
  name="@tuvix.js/angular"
  title="Angular बाइंडिंग्स"
  description="Angular 15+ कंपोनेंट को Tuvix.js माइक्रो ऐप में बदलता है: default रूप से zoneless, हर container के लिए एक application, कंपोनेंट inputs के रूप में props, और styles के साथ सर्वर रेंडरिंग।"
  icon="🔺"
  npm="true"
/>

## इंस्टॉलेशन

```bash
npm install @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
# or pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser rxjs
```

जब आपके कंपोनेंट AOT-compiled न हों (JIT), तो `@angular/compiler` जोड़ें। जब आप `renderAngularToString` call करते हैं, तो सर्वर पर `@angular/platform-server` और `@angular/compiler` जोड़ें। क्लाइंट adapter को Angular 15 या नया चाहिए; सर्वर renderer को Angular 16 या नया चाहिए।

## इसे कब इस्तेमाल करें

यह पैकेज तब इस्तेमाल करें जब किसी Angular कंपोनेंट को दूसरे ऐप्स के साथ एक माइक्रो ऐप की तरह चलाना हो: orchestrator किसी route पर उसे container में mount करता है, props देता है, उन्हें update करता है, और बाहर निकलते समय उसे unmount करता है। कई Angular ऐप्स, या एक ही ऐप की कई copies, एक पेज साझा कर सकती हैं, क्योंकि हर mount को अपना Angular application और अपना host element मिलता है। adapter कभी zone.js load नहीं करता, इसलिए Angular island अपने बगल वाले React या Vue ऐप्स के लिए `Promise` या `addEventListener` को patch नहीं करता।

अगर पूरा पेज Angular संभालता है, तो उसे सामान्य तरीके से `bootstrapApplication` के साथ bootstrap करें। वहाँ adapter से आपको कुछ नहीं मिलता।

## क्विक स्टार्ट

एक input वाला standalone कंपोनेंट:

```ts
// greeting.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<p>Hello {{ name }}</p>`,
})
export class GreetingComponent {
  @Input() name = '';
}
```

माइक्रो ऐप entry इसे wrap करती है:

```ts
// greeting-app.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { GreetingComponent } from './greeting.component';

export default createAngularMicroApp({ name: 'greeting', component: GreetingComponent });
```

shell ऐप को register करता है और orchestrator शुरू करता है:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'greeting',
  entry: () => import('./greeting-app'),
  container: '#greeting',
  activeWhen: '/hello',
  props: { name: 'Ada' },
});

await orchestrator.start();

// Later: setInput('name', 'Grace') and one change detection pass.
await orchestrator.updateAppProps('greeting', { name: 'Grace' });
```

adapter `#greeting` के अंदर एक `<app-greeting>` host element बनाता है, और update के बाद यह "Hello Grace" दिखाता है।

## API

### `createAngularMicroApp`

```ts no-check
function createAngularMicroApp<C>(config: AngularMicroAppConfig<C>): MicroAppModule;
```

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `name` | `string` | ज़रूरी | ऐप का नाम। adapter इसी नाम से module को `@tuvix.js/loader` के `registerModule` के ज़रिए register करता है। |
| `component` | `Type<C>` | ज़रूरी | Root कंपोनेंट। standalone कंपोनेंट्स अपने आप में काम करते हैं। |
| `module` | `Type<unknown>` | कोई नहीं | वह NgModule जो `component` को declare करता है। adapter उसके providers को `importProvidersFrom` से जोड़ता है। |
| `providers` | `AngularProviders` | `[]` | application के environment providers, जैसे `provideHttpClient()`। |
| `selector` | `string` | कंपोनेंट selector का element हिस्सा, वरना `'div'` | उस host element का tag name जिसे adapter container के अंदर बनाता है। |
| `zone` | `boolean` | `false` | zone.js change detection इस्तेमाल करें। आपकी क्लाइंट entry को पहले `zone.js` import करना होगा। |
| `ssr` | `boolean` | `false` | `renderAngularToString` का markup अपनाएँ। `createSsrAngularMicroApp` देखें। |
| `bootstrap` | `() => void \| Promise<void>` | कोई नहीं | एक बार चलने वाला setup। module का `bootstrap()` इसका await करता है। |

हर `mount({ container, props })`:

1. जब `component` या `module` की कोई AOT definition (`ɵcmp` / `ɵmod`) न हो, तो पहले `@angular/compiler` load करता है, फिर `@angular/core` और `@angular/platform-browser`। यह तभी मदद करता है जब `@angular/core` के अलावा किसी Angular पैकेज को load करने वाला पहला code adapter हो। अगर आपकी कंपोनेंट फ़ाइलें `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` या कोई दूसरी Angular library import करती हैं, तो वे पैकेज adapter के चलने से पहले evaluate होते हैं और "JIT compilation failed" के साथ fail होते हैं। `import '@angular/compiler'` को अपनी क्लाइंट entry की पहली line रखें, या AOT build करें।
2. आपके Angular version के change detection providers ([Change detection](#change-detection) देखें), module providers और `providers` के साथ `createApplication({ providers })` call करता है।
3. host element बनाता है (selector `'app-greeting'` के लिए `<app-greeting>`, `'[card]'` जैसे attribute selector के लिए `<div>`), उसे container में रखता है, और कंपोनेंट को उसमें bootstrap करता है।
4. पहले change detection से पहले `ComponentRef.setInput` के साथ props को कंपोनेंट inputs के रूप में सेट करता है, इसलिए `ngOnInit` को वे पहले से दिखते हैं। जिन Angular versions में `ComponentFactoryResolver` नहीं है, उन पर inputs bootstrap के ठीक बाद सेट होते हैं, और उसके बाद एक tick चलता है।
5. container पर `tuvix:mounted` dispatch करता है। विफल होने पर यह `tuvix:error` dispatch करता है और मूल एरर के साथ reject करता है।

`update({ props, container? })` नई values को `setInput` से लिखता है और `appRef.tick()` चलाता है, एक container के लिए, या `container` न देने पर हर mount के लिए। यह हर Angular version पर रेंडर करता है, zoneless हो या नहीं।

`unmount({ container })` application को नष्ट करता है, container खाली करता है और `tuvix:unmounted` dispatch करता है।

NgModule में declare किया गया कंपोनेंट:

```ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin/admin.component';
import { AdminModule } from './admin/admin.module';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  module: AdminModule,
  providers: [provideHttpClient()],
});
```

### `createSsrAngularMicroApp`

```ts no-check
function createSsrAngularMicroApp<C>(config: AngularSsrMicroAppConfig<C>): MicroAppModule;
```

`ssr` को छोड़कर `createAngularMicroApp` वाले ही विकल्प; यह `createAngularMicroApp({ ...config, ssr: true })` की तरह व्यवहार करता है। इसे क्लाइंट पर उन islands के लिए इस्तेमाल करें जिन्हें सर्वर ने `renderAngularToString` से रेंडर किया है।

जब container में सर्वर markup हो, तो adapter host element को दोबारा इस्तेमाल करता है, बशर्ते वह container का सीधा child हो और उसका tag अपेक्षित हो। Angular उसी element में रेंडर करता है और सर्वर के children को बदल देता है। जब Angular कंपोनेंट styles को `<head>` में जोड़ देता है, तो adapter inline सर्वर `<style>` tags और host के बगल की बाकी हर चीज़ हटा देता है। `tuvix:mounted` `hydrated: true` रिपोर्ट करता है। ख़ाली container को सामान्य क्लाइंट render मिलता है।

```ts
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export default createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

### `renderAngularToString`

```ts no-check
// import from '@tuvix.js/angular/server'
function renderAngularToString(component: unknown, options?: AngularSsrOptions): Promise<string>;
```

| विकल्प | Type | Default | मतलब |
| --- | --- | --- | --- |
| `props` | `Record<string, unknown>` | `{}` | input नाम (या alias) के हिसाब से input values। क्लाइंट mount की तरह पहले change detection से पहले सेट होती हैं। जो keys inputs नहीं हैं, उन्हें छोड़ दिया जाता है। |
| `providers` | `AngularProviders` | `[]` | सर्वर render के environment providers। |
| `appId` | `string` | `'ng'` (Angular का default) | Angular `APP_ID`। Angular इसे style tags के `ng-app-id` attribute में लिखता है। |
| `document` | `string` | `<body>` में host element वाला ख़ाली document | वह HTML document जिसमें रेंडर करना है। इसमें host element होना चाहिए। |
| `selector` | `string` | कंपोनेंट selector का element हिस्सा, वरना `'app-root'` | default document के लिए host element tag; Angular उसी element में bootstrap करता है जो इससे match करता है। |

`@angular/platform-server` के `renderApplication` से standalone कंपोनेंट रेंडर करता है और एक fragment लौटाता है: रेंडर हुए `<head>` के कंपोनेंट `<style>` tags, और उनके बाद `<body>` का inner HTML। इस fragment को उस container में रखें जिसमें `createSsrAngularMicroApp` mount करता है; island के styles पहले paint पर ही मौजूद रहते हैं।

`props` पहले change detection से पहले `setInput` के ज़रिए कंपोनेंट तक पहुँचते हैं, उसी तरह जैसे क्लाइंट `mount` उन्हें सेट करता है, इसलिए `ngOnInit` दोनों तरफ़ उन्हें देखता है। सर्वर render और क्लाइंट mount को एक ही object दें, तो दोनों एक जैसा markup बनाते हैं।

render zoneless चलता है और global `Promise` को कभी patch नहीं करता। यह हमेशा पहले `@angular/compiler` load करता है, क्योंकि Node Angular packages को Angular linker के बिना `node_modules` से load करता है। इसे किसी सर्वर function से call करें, ऐसे code से नहीं जो ब्राउज़र में भी चलता है: ब्राउज़र में यह `''` लौटाता है।

```ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAboutIsland(): Promise<string> {
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props: { title: 'About us' } });
  return `<section id="about" data-tuvix-app="about">${html}</section>`;
}
```

### Types

| Type | मतलब |
| --- | --- |
| `AngularMicroAppConfig<C>` | `createAngularMicroApp` के विकल्प। |
| `AngularSsrMicroAppConfig<C>` | `ssr` के बिना `AngularMicroAppConfig<C>`; `createSsrAngularMicroApp` के विकल्प। |
| `AngularSsrOptions` | `renderAngularToString` के विकल्प। type को `@tuvix.js/angular` से import करें। |
| `AngularProviders` | `Array<Provider \| EnvironmentProviders>`, जिसे `createApplication` और `bootstrapApplication` स्वीकार करते हैं। |

## Change detection {#change-detection}

adapter कभी zone.js import नहीं करता। जब तक आप `zone: true` पास न करें, यह वह zoneless setup चुनता है जिसे आपका Angular version सपोर्ट करता है:

| Angular | adapter जो provider जोड़ता है | change detection किससे चलता है |
| --- | --- | --- |
| 20 और नया | `provideZonelessChangeDetection()` | Template event listeners, signal writes, `markForCheck()`, `AsyncPipe`, `setInput` |
| 18 और 19 | `provideExperimentalZonelessChangeDetection()` | 20 जैसा ही |
| 15 से 17 | `NgZone` की जगह `ɵNoopNgZone` | अपने आप कुछ नहीं। होस्ट से आया `update()` फिर भी रेंडर करता है। |

Angular 18 और नए पर, अगर आप किसी `setTimeout` या `fetch` callback में कोई सामान्य field बदलते हैं, तो template दोबारा रेंडर नहीं होता। उस state को signal में रखें, या `ChangeDetectorRef.markForCheck()` call करें:

```ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-clock',
  standalone: true,
  template: `<time>{{ now() }}</time>`,
})
export class ClockComponent {
  readonly now = signal(new Date().toLocaleTimeString());

  constructor() {
    setInterval(() => this.now.set(new Date().toLocaleTimeString()), 1000);
  }
}
```

Angular 15 से 17 पर clicks और दूसरे DOM events भी change detection नहीं चलाते। state बदलने के बाद `ChangeDetectorRef.detectChanges()` call करें:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="increment()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  increment(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

zone-based change detection बनाए रखने के लिए adapter के mount करने से पहले अपनी क्लाइंट entry में zone.js import करें, और `zone: true` पास करें। तब adapter Angular के default `NgZone` को उसकी जगह रहने देता है और उसी के अंदर bootstrap करता है:

```ts
import 'zone.js';
import { createAngularMicroApp } from '@tuvix.js/angular';
import { DashboardComponent } from './dashboard.component';

export default createAngularMicroApp({ name: 'dashboard', component: DashboardComponent, zone: true });
```

zone.js पूरे पेज के लिए `Promise`, timers और DOM listeners को patch करता है, दूसरे फ्रेमवर्क्स के ऐप्स समेत।

## सर्वर रेंडरिंग

1. सर्वर पर `renderAngularToString(Component)` call करें और fragment को container element में रखें।
2. क्लाइंट पर island entry से `createSsrAngularMicroApp({ name, component })` export करें।
3. orchestrator ऐप को उस container में mount करता है। Angular सर्वर के host element में रेंडर करता है और adapter सर्वर styles हटा देता है।

adapter सर्वर DOM के ऊपर दोबारा रेंडर करता है। यह Angular का non-destructive hydration (`provideClientHydration`) इस्तेमाल नहीं करता, क्योंकि वह hydration ऐसे पेज की उम्मीद करता है जिसे Angular ने ऊपर से नीचे तक रेंडर किया हो: वह `<body>` के सीधे child के रूप में Angular का hydration marker comment और कंपोनेंट्स पर `ngh` annotations खोजता है। जिस पेज को React, Vue या किसी सामान्य सर्वर template ने रेंडर किया है, उसके अंदर के island में दोनों में से कुछ नहीं होता। इसकी क़ीमत: दिखने वाला markup और styles HTML के साथ आ जाते हैं, लेकिन Angular के नियंत्रण लेने पर island के अंदर की state (focus, टाइप की गई value, scroll position) reset हो जाती है, और उससे पहले के clicks कुछ नहीं करते।

सर्वर render और क्लाइंट mount को एक जैसे props दें, ताकि क्लाइंट render सर्वर markup से मेल खाए। render उन HTTP requests या timers का इंतज़ार नहीं करता जिन्हें कंपोनेंट शुरू करता है: पहले data load करें और उसे props के रूप में दें।

```ts
// server.ts
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<{ html: string; props: { text: string } }> {
  const response = await fetch('https://api.example.com/about');
  const props = { text: await response.text() };
  const html = await renderAngularToString(AboutComponent, { appId: 'about', props });
  return { html, props };
}
```

`props` को पेज के साथ ब्राउज़र तक भेजें (उदाहरण के लिए `<script type="application/json">` tag में JSON के रूप में) और उन्हीं के साथ ऐप register करें:

```ts
// shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const props = JSON.parse(document.getElementById('about-props')?.textContent ?? '{}') as Record<string, unknown>;
const orchestrator = createOrchestrator();

orchestrator.register({ name: 'about', entry: () => import('./about-app'), container: '#about', props });
await orchestrator.start();
```

जो values inputs नहीं हैं, जैसे API base URL, उनके लिए दोनों तरफ़ `providers` पास करें।

## Edge cases

- पेज पर zone.js के बिना `zone: true` देने पर mount `[tuvix.js/angular] "<name>" sets zone: true, but zone.js is not loaded. Import 'zone.js' in your client entry before mounting, or drop zone: true.` के साथ reject होता है और `tuvix:error` dispatch होता है।
- जिन props की keys कंपोनेंट inputs नहीं हैं, उन्हें छोड़ दिया जाता है, ताकि Angular NG0303 log न करे। inputs उनके public नाम से match होते हैं (अगर आपने alias सेट किया है, तो alias से)।
- जो input पुराने props में था और नए props में नहीं है, वह `undefined` पर सेट होता है। field initializer (`name = ''`) दोबारा नहीं चलता।
- mount पूरा होने से पहले `update` props को सहेज लेता है; pending bootstrap सबसे नए props इस्तेमाल करता है। जिस container को इस module ने mount नहीं किया, उसके लिए `update({ container })` कुछ नहीं करता।
- जब `mount` अभी Angular load कर रहा हो, तब `unmount` उसे रद्द कर देता है: application नष्ट होता है, container ख़ाली रहता है, और कोई `tuvix:mounted` नहीं चलता। अगर रद्द करना bootstrap के बाद पहुँचता है, तो आपको `tuvix:mounted` के बाद `tuvix:unmounted` मिलता है।
- उसी container पर दूसरा `mount` नया application bootstrap करने से पहले पहले वाले को नष्ट करता है।
- जिस container को इस module ने कभी mount नहीं किया, उस पर `unmount` कुछ नहीं करता।
- अगर application नष्ट करते समय throw होता है, तो adapter container खाली करता है, `tuvix:error` dispatch करता है और एरर को दोबारा throw करता है।
- SSR में, जिस container के markup में host tag से match करने वाला कोई सीधा child नहीं है, उसे नया host element मिलता है। `hydrated` फिर भी `true` रहता है, क्योंकि container में markup था।
- सर्वर पर attribute-selector कंपोनेंट (`'[card]'`) `<app-root>` host पर fallback करता है, जिससे selector match नहीं करता। ऐसा `document` पास करें जिसके `<body>` में match करने वाला element हो।
- Angular 16 पर `@angular/platform-server` सर्वर render के दौरान Domino की DOM classes (`Event`, `Node` और दूसरी) को Node के global object पर copy करता है। यह Angular करता है, adapter नहीं।
- Angular compiler plugin के बिना JIT कंपोनेंट्स को अब भी TypeScript `experimentalDecorators` चाहिए; Angular standard decorator proposal को सपोर्ट नहीं करता।

## यह क्या नहीं करता

- यह zone.js या कोई दूसरा polyfill load नहीं करता।
- यह `provideClientHydration()` नहीं जोड़ता और non-destructive hydration नहीं करता।
- यह सर्वर props को ब्राउज़र तक नहीं भेजता। उन्हें ख़ुद पेज में serialize करें और वही object क्लाइंट mount को दें।
- सर्वर render के दौरान कंपोनेंट जो HTTP calls, timers या `PendingTasks` शुरू करता है, यह उनका इंतज़ार नहीं करता।
- क्लाइंट के नियंत्रण लेने पर यह सर्वर के DOM nodes, focus या form state को नहीं बचाता।
- यह कंपोनेंट को कोई Tuvix props service या bus नहीं देता। props के लिए inputs declare करें, और दूसरे ऐप्स से बात करने के लिए [`@tuvix.js/event-bus`](/hi/packages/event-bus) इस्तेमाल करें।

## 0.4 से माइग्रेशन

**`createAngularMicroApp` एक कंपोनेंट लेता है।** `platform` और `compilerOptions` हटा दिए गए हैं। root कंपोनेंट को `component` के रूप में पास करें, और अगर वह किसी NgModule में declare है, तो module को `module` के रूप में।

```ts no-check
// 0.4
createAngularMicroApp({
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

export default createAngularMicroApp({ name: 'admin', component: AppComponent, module: AppModule });
```

**props अब inputs हैं।** `update()` अब `window.__TUVIX_ANGULAR_PROPS__` नहीं लिखता। उस global को पढ़ने वाली services हटाएँ और उनकी जगह prop नामों वाले `@Input()` fields declare करें।

**default रूप से zoneless।** जब तक आप `zone: true` पास न करें, ऐप्स zone.js के बिना चलते हैं। Angular 15 से 17 पर DOM events अब change detection नहीं चलाते; handlers में `ChangeDetectorRef.detectChanges()` call करें या zone.js चुनें। आप अपनी entry से `provideZonelessChangeDetection()` हटा सकते हैं। `import '@angular/compiler'` सिर्फ़ तभी हटाएँ जब आपकी कंपोनेंट फ़ाइलें `@angular/core` के अलावा Angular से कुछ भी import न करती हों; वरना उसे क्लाइंट entry की पहली line रखें, या AOT build करें।

**कोई अपने आप `provideClientHydration()` नहीं।** `createSsrAngularMicroApp` सर्वर markup के ऊपर दोबारा रेंडर करता है। उसके `providers` में `provideClientHydration()` न रखें।

**`appId` अब असर करता है।** 0.4 में `renderAngularToString` `appId` स्वीकार करता था और उसे अनदेखा करता था। अब यह Angular का `APP_ID` सेट करता है, इसलिए style tags का `ng-app-id` attribute `ng` से बदलकर आपकी value हो जाता है।

**Host element।** क्लाइंट और सर्वर दोनों पर host tag किसी तय `'app-root'` के बजाय कंपोनेंट selector से आता है, और क्लाइंट adapter उसे container के अंदर बनाता है। जिस container को module ने कभी mount नहीं किया, उस पर `unmount` अब उसे खाली नहीं करता।

पूरे ऐप के लिए [Angular गाइड](/hi/guide/angular) देखें।
