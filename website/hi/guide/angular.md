# Angular के साथ

`@tuvix.js/angular` किसी Angular कंपोनेंट को माइक्रो ऐप के रूप में bootstrap करता है, default रूप से zone.js के बिना। यह standalone कंपोनेंट्स को सर्वर पर HTML में रेंडर भी करता है।

Angular 15 और उसके बाद के versions सपोर्ट होते हैं। `renderAngularToString` को `@angular/platform-server` के साथ Angular 16 या उसके बाद का version चाहिए।

## इंस्टॉल करें

```bash
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
# JIT components (no AOT build step) also need the compiler
pnpm add @angular/compiler
# for renderAngularToString
pnpm add @angular/platform-server
```

## कंपोनेंट को माइक्रो ऐप बनाएँ

```ts
// src/main.ts
import { createAngularMicroApp } from '@tuvix.js/angular';
import { provideHttpClient } from '@angular/common/http';
import { AdminComponent } from './admin.component';

export default createAngularMicroApp({
  name: 'admin',
  component: AdminComponent,
  providers: [provideHttpClient()],
});
```

| विकल्प | Type | विवरण |
| --- | --- | --- |
| `name` | `string` | ज़रूरी। रजिस्टर किए गए ऐप के नाम से मेल खाना चाहिए। |
| `component` | `Type<C>` | ज़रूरी। Root कंपोनेंट, standalone या `module` में declared। |
| `module` | `Type<unknown>` | वह NgModule जो `component` को declare करता है। उसके providers `importProvidersFrom` से import होते हैं। |
| `providers` | `Array<Provider \| EnvironmentProviders>` | Environment providers। |
| `selector` | `string` | Host element का tag। Default: कंपोनेंट selector का element वाला हिस्सा, या `div`। |
| `zone` | `boolean` | zone.js change detection इस्तेमाल करें। Default `false`। |
| `ssr` | `boolean` | `renderAngularToString` का markup अपनाता है। `createSsrAngularMicroApp` इसे सेट करता है। |
| `bootstrap` | `() => void \| Promise<void>` | पहले mount से पहले एक बार चलता है। |

हर mount `createApplication` बुलाता है और कंपोनेंट को container के अंदर उसके अपने host element में bootstrap करता है। एक पेज पर दो Angular ऐप्स, या दो containers में एक मॉड्यूल, किसी साझा `app-root` पर नहीं टकराते।

जब कंपोनेंट के पास compiled `ɵcmp` नहीं होता (JIT), तो adapter `@angular/platform-browser` से पहले `@angular/compiler` load करता है। यह तभी मदद करता है जब `@angular/core` के अलावा किसी Angular पैकेज को load करने वाला पहला code adapter हो। अगर आपकी कंपोनेंट फ़ाइलें `@angular/common` (`NgIf`, `AsyncPipe`, `CommonModule`), `@angular/forms`, `@angular/router` या कोई दूसरी Angular library import करती हैं, तो वे पैकेज adapter के चलने से पहले evaluate होते हैं और "JIT compilation failed" के साथ fail होते हैं। `import '@angular/compiler'` को अपनी क्लाइंट entry की पहली line रखें, या AOT build करें।

## Props से inputs

Props को कंपोनेंट inputs के रूप में declare करें:

```ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin',
  standalone: true,
  template: `<h1>Admin for {{ userId }}</h1>`,
})
export class AdminComponent {
  @Input() userId = '';
}
```

- Mount पहले change detection से पहले `ComponentRef.setInput` से inputs सेट करता है, इसलिए `ngOnInit` उन्हें देखता है।
- `update({ props })` नई values सेट करता है और change detection चलाता है। `container` देने पर यह सिर्फ़ उसी mount को update करता है।
- जो keys inputs नहीं हैं, उन्हें छोड़ दिया जाता है। नए props में जो inputs नहीं हैं, वे `undefined` पर reset हो जाते हैं।

## zone.js के बिना change detection

Adapter कभी zone.js import नहीं करता, इसलिए यह पेज में या सर्वर पर `Promise`, timers या DOM events को patch नहीं करता। यह Angular version के हिसाब से provider चुनता है:

| Angular | Provider | DOM events change detection चलाते हैं |
| --- | --- | --- |
| 20+ | `provideZonelessChangeDetection()` | हाँ |
| 18-19 | `provideExperimentalZonelessChangeDetection()` | हाँ |
| 15-17 | `NgZone` की जगह no-op zone | नहीं |

Angular 15-17 पर click के बाद कुछ भी change detection नहीं चलाता। अपने handlers में `detectChanges()` बुलाएँ:

```ts
import { ChangeDetectorRef, Component, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `<button (click)="add()">{{ count }}</button>`,
})
export class CounterComponent {
  private readonly cdr = inject(ChangeDetectorRef);
  count = 0;

  add(): void {
    this.count += 1;
    this.cdr.detectChanges();
  }
}
```

zone पर आधारित change detection रखने के लिए अपनी client entry में सबसे ऊपर `zone.js` import करें और `zone: true` दें। zone.js load किए बिना `mount` reject होता है।

## सर्वर रेंडरिंग

```ts
// server-only module
import { renderAngularToString } from '@tuvix.js/angular/server';
import { AboutComponent } from './about.component';

export async function renderAbout(): Promise<string> {
  return renderAngularToString(AboutComponent, { appId: 'about', props: { userId: '42' } });
}
```

```ts
// client
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AboutComponent } from './about.component';

export const about = createSsrAngularMicroApp({ name: 'about', component: AboutComponent });
```

- `renderAngularToString(component, { props?, providers?, appId?, document?, selector? })` कंपोनेंट के `<style>` tags और उनके बाद host element लौटाता है, इसलिए पहले paint पर ही island पर styles लगी होती हैं। यह zoneless चलता है।
- `props` पहले change detection से पहले कंपोनेंट inputs सेट करता है, जैसे क्लाइंट पर `mount` करता है। जो keys inputs नहीं हैं, उन्हें छोड़ दिया जाता है। क्लाइंट पर island को वही props दें, वरना hydration अलग content दिखाता है।
- कंपोनेंट जो HTTP requests या timers शुरू करता है, यह उनका इंतज़ार नहीं करता। पहले data load करें और उसे provide करें।
- इसे सर्वर कोड से बुलाएँ। ब्राउज़र में यह `''` लौटाता है।

क्लाइंट पर `createSsrAngularMicroApp` सर्वर के host element में render करता है, फिर Angular के अपने styles जोड़ने के बाद सर्वर के inline `<style>` tags हटा देता है। `tuvix:mounted` event `hydrated: true` बताता है। यह सर्वर DOM को बदल देता है। Angular के non-destructive hydration को सीधे `<body>` के नीचे एक marker चाहिए, जो किसी दूसरे पेज के अंदर का island नहीं दे सकता, इसलिए adapter `provideClientHydration()` नहीं जोड़ता।

## Event bus

```ts
import { Component, OnDestroy, signal } from '@angular/core';
import { getGlobalBus } from '@tuvix.js/event-bus';

@Component({
  selector: 'app-cart-badge',
  standalone: true,
  template: `<span>{{ count() }}</span>`,
})
export class CartBadgeComponent implements OnDestroy {
  readonly count = signal(0);
  private readonly off = getGlobalBus().on<{ itemCount: number }>('cart:updated', ({ itemCount }) =>
    this.count.set(itemCount),
  );

  ngOnDestroy(): void {
    this.off();
  }
}
```

Angular 18+ zoneless पर signals change detection schedule करते हैं। 15-17 पर `set` के बाद `ChangeDetectorRef.detectChanges()` बुलाएँ।

## Adapter क्या नहीं करता

- यह zone.js या `@angular/localize` load नहीं करता। ज़रूरत हो तो उन्हें अपनी entry में import करें।
- यह non-destructive hydration नहीं करता; ऊपर देखें।
- यह mounts के बीच state साझा नहीं करता। हर mount अपने root injector वाला अलग Angular application है, इसलिए `providedIn: 'root'` वाली service हर mount के लिए एक बार बनती है।

## API

| Export | उद्देश्य |
| --- | --- |
| `createAngularMicroApp({ name, component, module?, providers?, selector?, zone?, ssr?, bootstrap? })` | Angular माइक्रो ऐप मॉड्यूल |
| `createSsrAngularMicroApp(config)` | वही, `ssr: true` के साथ |
| `@tuvix.js/angular/server` से `renderAngularToString(component, options?)` | Styles + host element HTML |
