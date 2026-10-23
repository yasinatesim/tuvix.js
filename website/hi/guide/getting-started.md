# शुरुआत करें

इस पेज पर आप दो माइक्रो ऐप्स वाला एक shell बनाते हैं: एक home पेज और एक dashboard। आप ऐप्स register करेंगे, राउटर से उन्हें mount करवाएँगे, और mount हुए ऐप में नए props भेजेंगे।

## इंस्टॉल करें

umbrella पैकेज इंस्टॉल करें। इसमें orchestrator, router, loader, event bus और sandbox शामिल हैं:

```bash
pnpm add tuvix.js
```

आपके माइक्रो ऐप्स जिस भी फ्रेमवर्क का इस्तेमाल करते हैं, हर एक के लिए adapter जोड़ें:

```bash
pnpm add @tuvix.js/react react react-dom
pnpm add @tuvix.js/vue vue
pnpm add @tuvix.js/svelte svelte
pnpm add @tuvix.js/angular @angular/core @angular/common @angular/platform-browser
```

## प्रोजेक्ट scaffold करें

`create-tuvix-app` एक shell या माइक्रो ऐप प्रोजेक्ट लिखता है जो 0.5 पैकेजों पर निर्भर होता है:

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-dashboard --template react-app
```

Templates: `shell`, `react-app`, `vue-app`, `svelte-app`, `angular-app`, `vanilla-app`। इसके बजाय repository के किसी उदाहरण को कॉपी करने के लिए `--example <name>` दें।

## shell बनाएँ

shell पेज के layout का मालिक है और तय करता है कि कौन सा ऐप कहाँ जाएगा। इसे एक container element दें:

```html
<nav>
  <a href="/">Home</a>
  <a href="/dashboard">Dashboard</a>
</nav>
<main id="app"></main>
<script type="module" src="/src/main.ts"></script>
```

फिर orchestrator बनाएँ, ऐप्स register करें और उसे start करें:

```ts
// src/main.ts
import { createOrchestrator, interceptLinks, matchPath } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: { mode: 'history', routes: [] },
});

orchestrator.register({
  name: 'home',
  entry: () => import('./apps/home'),
  container: '#app',
  // '/' alone would match every path; `end: true` makes it exact.
  activeWhen: (path) => matchPath('/', path, { end: true }).matched,
});

orchestrator.register({
  name: 'dashboard',
  entry: {
    scripts: ['https://cdn.example.com/dashboard/main.js'],
    styles: ['https://cdn.example.com/dashboard/main.css'],
    type: 'module',
  },
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { user: 'Guest' },
});

// Turn <a href> clicks into router navigations instead of page loads.
interceptLinks({ navigate: (path) => orchestrator.navigateTo(path) });

await orchestrator.start();
```

क्या होता है:

1. `start()` मौजूदा path पढ़ता है और हर उस ऐप को mount करता है जिसका `activeWhen` match करता है।
2. `<a href="/dashboard">` पर click `navigateTo('/dashboard')` को call करता है। राउटर URL push करता है, orchestrator `home` को unmount करता है और फिर `dashboard` को mount करता है।
3. `dashboard` का पहला mount उसकी script और stylesheet लोड करता है। बाद के mounts पहले से लोड हुए module का फिर से इस्तेमाल करते हैं।

राउटर अपने आप कभी clicks intercept नहीं करता। `interceptLinks` के बिना link पर click पेज को reload करता है, और नए पेज लोड पर orchestrator सही ऐप mount करता है।

## माइक्रो ऐप लिखें

माइक्रो ऐप `mount` और `unmount` वाला एक object है। `defineMicroApp` उसका shape जाँचता है और module को उसके नाम से register करता है, ताकि script चलने के बाद loader उसे ढूँढ सके:

```ts
// apps/home.ts
import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'home',

  mount({ container, props }) {
    const title = document.createElement('h1');
    title.textContent = `Welcome, ${String(props?.user ?? 'Guest')}`;
    container.replaceChildren(title);
  },

  update({ props, container }) {
    const title = container?.querySelector('h1');
    if (title) title.textContent = `Welcome, ${String(props.user ?? 'Guest')}`;
  },

  unmount({ container }) {
    container.replaceChildren();
  },
});
```

आप `defineMicroApp` को जो `name` देते हैं, वह shell में register किए गए नाम के बराबर होना चाहिए। loader उसी नाम से module ढूँढता है।

## फ्रेमवर्क adapter इस्तेमाल करें

adapters एक root कंपोनेंट से वही module बनाते हैं। वे उसे register करते हैं, हर container के लिए एक फ्रेमवर्क instance रखते हैं और lifecycle events dispatch करते हैं।

```tsx
// dashboard/src/main.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ user }: { user: string }) {
  return <h1>Dashboard for {user}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

```ts
// settings/src/main.ts
import { createVueMicroApp } from '@tuvix.js/vue';
import Settings from './Settings.vue';

export default createVueMicroApp({ name: 'settings', App: Settings });
```

फ्रेमवर्क पेज: [React](/hi/guide/react), [Vue](/hi/guide/vue), [Svelte](/hi/guide/svelte), [Angular](/hi/guide/angular)।

हर माइक्रो ऐप को ES module bundle के रूप में build करें और upload करें। Vite library build काम करता है:

```ts
// dashboard/vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: { entry: 'src/main.tsx', formats: ['es'], fileName: 'main' },
  },
});
```

Vite का ES output `.js` पर खत्म होता है, और loader उसे classic script मानता है, जब तक entry में `type: 'module'` न हो। ऊपर की तरह shell की entry में `type: 'module'` रखें।

## runtime पर props update करें

```ts
import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('dashboard', { user: 'Yasin' });
```

`updateAppProps` नए props को register किए गए props में merge करता है। अगर ऐप mount है और उसमें `update` है, तो orchestrator merge हुए props के साथ उसे call करता है और ऐप उसी जगह फिर से रेंडर होता है। अगर ऐप mount नहीं है, तो orchestrator props को अगले mount के लिए रख लेता है।

## shell क्या नहीं करता

- यह आपका layout रेंडर नहीं करता। containers shell के अपने HTML में रहते हैं।
- यह ऐप्स के बीच फ्रेमवर्क instances साझा नहीं करता। दो React ऐप्स को दो React roots मिलते हैं।
- यह JavaScript को sandbox नहीं करता। हर ऐप पेज के `window` में चलता है।

## अगले कदम

- [आर्किटेक्चर](/hi/guide/architecture): navigation से `mount` तक का रास्ता।
- [रूटिंग](/hi/guide/routing): `activeWhen` patterns, बिल्ट-इन राउटर, guards।
- [External Router](/hi/guide/external-router): TanStack Router या React Router को follow करें।
- [SSR Islands](/hi/guide/ssr-islands): React पेज के अंदर माइक्रो ऐप्स को सर्वर पर रेंडर करें।
