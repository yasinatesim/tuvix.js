---
title: '@tuvix.js/react'
---

<PackageHeader
  name="@tuvix.js/react"
  title="React बाइंडिंग्स"
  description="किसी React कंपोनेंट को Tuvix.js माइक्रो ऐप में बदलें, और किसी भी माइक्रो ऐप (Vue, Svelte, Angular, React, vanilla) को सर्वर रेंडरिंग और hydration के साथ React tree के अंदर होस्ट करें।"
  icon="⚛️"
  npm="true"
/>

## इंस्टॉलेशन

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

इस पैकेज को React 18 या उससे नया वर्शन चाहिए (`react` और `react-dom` के लिए peer range `>=18.0.0`)। यह `@tuvix.js/loader` और `@tuvix.js/event-bus` पर निर्भर है।

## इसे कब इस्तेमाल करें

यह पैकेज दो दिशाएँ कवर करता है:

- **React माइक्रो ऐप के रूप में।** `createReactMicroApp` और `createSsrReactMicroApp` किसी React कंपोनेंट को उस `{ bootstrap, mount, unmount, update }` मॉड्यूल में लपेटते हैं, जिसकी orchestrator और loader अपेक्षा करते हैं। जब Tuvix shell जिन माइक्रो ऐप्स को लोड करता है, उनमें से एक React ऐप हो, तब इनका उपयोग करें।
- **React होस्ट के रूप में।** `TuvixIsland` किसी भी माइक्रो ऐप मॉड्यूल को React पेज के अंदर mount करता है और re-render के दौरान उसका DOM सुरक्षित रखता है। `TuvixReactApp` किसी React माइक्रो ऐप को होस्ट tree में inline रेंडर करता है। जब आपका shell TanStack Start, Next.js या Remix जैसा React SSR फ्रेमवर्क हो, तब इनका उपयोग करें।

अगर आपका shell बिना React वाला plain HTML है, तो आपको सिर्फ़ पहली जोड़ी और [`@tuvix.js/core`](/hi/packages/core) चाहिए। Vue, Svelte या Angular माइक्रो ऐप का मॉड्यूल बनाने के लिए [`@tuvix.js/vue`](/hi/packages/vue), [`@tuvix.js/svelte`](/hi/packages/svelte) या [`@tuvix.js/angular`](/hi/packages/angular) का उपयोग करें; `TuvixIsland` इनमें से किसी को भी होस्ट कर सकता है।

## क्विक स्टार्ट

माइक्रो ऐप मॉड्यूल बनाएँ:

```tsx
// src/dashboard.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

इसे shell में रजिस्टर करें। route मैच होने पर orchestrator `mount` को कॉल करता है, और props बदलने पर `update` को:

```ts
// src/shell.ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: () => import('./dashboard'),
  container: '#app',
  activeWhen: '/dashboard/*',
  props: { userId: 'u_42' },
});

await orchestrator.start();

// Re-renders <Dashboard userId="u_43" />; component state survives.
await orchestrator.updateAppProps('dashboard', { userId: 'u_43' });
```

## API

### `createReactMicroApp`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| विकल्प | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | आवश्यक | वह नाम जिसके तहत मॉड्यूल `@tuvix.js/loader` के `registerModule` से रजिस्टर होता है। lifecycle events में यही नाम रहता है। |
| `App` | `ComponentType<P>` | आवश्यक | रूट कंपोनेंट। इसे mount props अपने props के रूप में मिलते हैं, इसलिए `{ page: 'privacy' \| 'terms' }` जैसे आवश्यक props वाला कंपोनेंट भी type-check पास करता है। |
| `bootstrap` | `() => void \| Promise<void>` | कोई नहीं | एक बार का setup। मॉड्यूल का `bootstrap()` इसका await करता है। |
| `ssr` | `boolean` | `false` | जब container में elements या non-whitespace text हो, तब `hydrateRoot` से सर्वर markup को hydrate करें। जिस container में सिर्फ़ whitespace या comments हों, उसे नया `createRoot` render मिलता है। |

लौटाए गए मॉड्यूल में चार methods हैं:

- `mount({ container, props })` उस container के लिए एक React root बनाता है। React पहला render commit कर दे, उसके बाद यह resolve होता है, फिर container पर `hydrated: true` या `false` के साथ `tuvix:mounted` dispatch करता है। अगर पहले render पर `App` suspend हो जाए, तो `mount` तब तक इंतज़ार करता है जब तक content commit न हो जाए।
- `update({ props, container })` उस container में `App` को `props` के साथ फिर से रेंडर करता है। `container` के बिना यह उन सभी containers को फिर से रेंडर करता है जिनमें मॉड्यूल mount हुआ है। tree का आकार वही रहता है, इसलिए React कंपोनेंट state बनाए रखता है।
- `unmount({ container })` root को unmount करता है, `replaceChildren()` से container खाली करता है और `tuvix:unmounted` dispatch करता है।
- `bootstrap()` `config.bootstrap` को चलाता है।

हर container को अपना root मिलता है, इसलिए एक मॉड्यूल एक साथ कई जगहों पर mount हो सकता है:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Badge({ label }: { label: string }) {
  return <span className="badge">{label}</span>;
}

const badge = createReactMicroApp({ name: 'badge', App: Badge });

const left = document.createElement('div');
const right = document.createElement('div');
document.body.append(left, right);

await badge.mount({ container: left, props: { label: 'New' } });
await badge.mount({ container: right, props: { label: 'Sale' } });

// Only the right badge changes.
await badge.update?.({ props: { label: 'Sold out' }, container: right });

await badge.unmount({ container: left });
```

मॉड्यूल `mount` के अंदर `react-dom/client` को lazily import करता है। सर्वर bundle इस मॉड्यूल को import कर सकता है (उदाहरण के लिए `App` को `TuvixReactApp` के साथ साझा करने के लिए), और क्लाइंट renderer साथ नहीं आता।

### `createSsrReactMicroApp`

```ts no-check
function createSsrReactMicroApp<P extends object = Record<string, unknown>>(
  config: Omit<ReactMicroAppConfig<P>, 'ssr'>
): MicroAppModule;
```

यह `createReactMicroApp({ ...config, ssr: true })` के समान है। विकल्प: `name`, `App`, `bootstrap`, ऊपर की तालिका की तरह।

जब container में पहले से वह HTML हो जो सर्वर ने उसी कंपोनेंट के लिए रेंडर किया था, तब क्लाइंट पर इसका उपयोग करें। यह जो tree रेंडर करता है, वह `TuvixReactApp` के tree (error boundary और `<Suspense>`) से मेल खाता है, इसलिए यह `TuvixReactApp` markup को बिना mismatch के hydrate करता है:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export default createSsrReactMicroApp({ name: 'legal-app', App: LegalPage });
```

### `TuvixIsland`

```ts no-check
function TuvixIsland(props: TuvixIslandProps): ReactElement;
```

| Prop | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | आवश्यक | माइक्रो ऐप का नाम। island इसे `data-tuvix-app` में लिखता है और `app.mount` को पास करता है। |
| `app` | `MicroAppModule` | आवश्यक | mount करने वाला मॉड्यूल: `createVueMicroApp`, `createSvelteMicroApp`, `createAngularMicroApp`, `createReactMicroApp` या उनके `createSsr*` variants का परिणाम, या हाथ से लिखा `{ mount, unmount, update? }` object। |
| `props` | `Record<string, unknown>` | `{}` | मॉड्यूल के लिए props। island हर render पर इनकी shallow तुलना करता है। |
| `ssrHtml` | `string` | कोई नहीं | island का सर्वर पर रेंडर हुआ HTML, उदाहरण के लिए `renderVueToString` से। इसे सिर्फ़ सर्वर पर पास करें। |
| `fallback` | `ReactNode` | `null` | जब `mount` या `update` reject हो, तब island की जगह यह रेंडर होता है। |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | wrapper element का tag। |
| `className` | `string` | कोई नहीं | wrapper element का class name। |

`TuvixIsland` किसी non-React माइक्रो ऐप (या अलग से bundle किए गए React ऐप) को React पेज के अंदर होस्ट करता है। <span v-pre>`<div dangerouslySetInnerHTML={{ __html: html }} />`</span> रेंडर करने वाला हाथ से लिखा bridge parent के पहले re-render पर टूट जाता है: React को नया `{ __html }` object दिखता है, वह फिर से `innerHTML` assign करता है, और माइक्रो ऐप ने जो DOM और listeners जोड़े थे उन्हें नष्ट कर देता है। `TuvixIsland` इससे बचता है:

- **सर्वर render।** यह `ssrHtml` को inner HTML बनाकर `<div data-tuvix-app={name} data-tuvix-island={id}>` रेंडर करता है। `id` React के `useId` से आता है, इसलिए सर्वर और क्लाइंट एक ही मान निकालते हैं।
- **Hydration।** पहले क्लाइंट render पर यह `data-tuvix-island` के ज़रिए पेज में अपना element ढूँढता है और inner HTML को DOM से वापस पढ़ता है। आप `ssrHtml` को क्लाइंट पर दूसरी बार नहीं भेजते, और क्लाइंट render सर्वर render से मेल खाता है।
- **स्थिर DOM।** island अपना `{ __html }` object एक बार, `useState` में बनाता है। बाद के renders उसी object का दोबारा उपयोग करते हैं, इसलिए React island के children को कभी दोबारा नहीं लिखता। parent के re-render माइक्रो ऐप के nodes और listeners को बनाए रखते हैं।
- **Mount।** पहले commit के बाद island `app.mount({ container, props, name })` को कॉल करता है। `ssr: true` से बना मॉड्यूल (`createSsrVueMicroApp` और उसके साथी) वहाँ सर्वर DOM को अपना लेता है। बिना SSR वाला मॉड्यूल container में नए सिरे से रेंडर करता है।
- **Props।** जब `props` shallow रूप से बदलते हैं (अलग keys, या कोई मान जो `Object.is` में fail हो), island `app.update({ props, container })` को कॉल करता है। जिस मॉड्यूल में `update` नहीं है, उसे `unmount`, खाली container और नया `mount` मिलता है। समान मानों वाला inline object literal update ट्रिगर नहीं करता।
- **पहचान।** नया `name` या `app` पुराने मॉड्यूल को unmount करता है और नए को mount करता है।
- **हटाना।** जब island tree से बाहर जाता है, वह `app.unmount({ container })` को कॉल करता है और container खाली करता है।
- **क्रम।** Mount, update और unmount कॉल एक के बाद एक चलते हैं। `mount` pending रहते हुए आने वाला unmount उसके पूरा होने का इंतज़ार करता है।
- **एरर।** अगर `mount` या `update` reject हो, तो island wrapper की जगह `fallback` रेंडर करता है। adapters `tuvix:error` खुद dispatch करते हैं; island कोई event नहीं जोड़ता। बाद में `name` या `app` बदलने पर यह फिर से कोशिश करता है।

React layout के अंदर Vue footer के साथ पूरा सर्वर और क्लाइंट setup:

```tsx
// src/Layout.tsx (shared by server and client)
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <main>
      <h1>Home</h1>
      <TuvixIsland
        name="footer"
        app={footer}
        props={{ year }}
        ssrHtml={footerHtml}
        fallback={<footer>© {year}</footer>}
        as="section"
        className="site-footer"
      />
    </main>
  );
}
```

```tsx
// src/entry-server.tsx (runs on the server only)
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const year = 2026;
  const footerHtml = await renderVueToString(Footer, { year });
  const body = renderToString(<Layout year={year} footerHtml={footerHtml} />);
  return `<!doctype html><html><body><div id="root">${body}</div><script type="module" src="/src/entry-client.tsx"></script></body></html>`;
}
```

```tsx
// src/entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

// No footerHtml here: the island reads the footer HTML from the page.
hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

सर्वर HTML किसी भी JavaScript से पहले ब्राउज़र तक पहुँचता है, इसलिए जब आप footer के stylesheets `<head>` में प्रिंट करते हैं, तो footer पहले paint पर दिखता है और styled रहता है। [`@tuvix.js/vite`](/hi/packages/vite) आपको वे `<link>` tags देता है।

### `TuvixReactApp`

```ts no-check
function TuvixReactApp<P extends object>(props: TuvixReactAppProps<P>): ReactElement;
```

| Prop | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | आवश्यक | माइक्रो ऐप का नाम, जो `data-tuvix-app` में लिखा जाता है। यह वही `name` रखें जो आप `createSsrReactMicroApp` को पास करते हैं। |
| `App` | `ComponentType<P>` | आवश्यक | रेंडर करने वाला कंपोनेंट। |
| `fallback` | `ReactNode` | `null` | जब `App` suspend हो और जब वह throw करे, तब दिखता है। |
| अन्य props | `P` | `P` के अनुसार आवश्यक | `App` को पास होते हैं। |

`TuvixReactApp` किसी React माइक्रो ऐप को होस्ट के React tree के हिस्से के रूप में inline रेंडर करता है, इसलिए आपका SSR फ्रेमवर्क उसका HTML रेंडर करता है। यह `<div data-tuvix-app={name}>` आउटपुट करता है और `App` को एक error boundary और `<Suspense fallback>` में लपेटता है:

- **सर्वर एरर स्थानीय रहते हैं।** सर्वर रेंडरिंग के दौरान `App` के अंदर throw होने पर React सिर्फ़ इसी ऐप के लिए `fallback` रेंडर करता है। बाकी पेज रेंडर होता है, और React क्लाइंट पर `App` को फिर से आज़माता है।
- **क्लाइंट एरर स्थानीय रहते हैं।** error boundary क्लाइंट पर render errors पकड़ता है, `fallback` दिखाता है और wrapper पर `tuvix:error` dispatch करता है।
- **Lifecycle events।** पहले commit के बाद यह `tuvix:mounted` dispatch करता है। जब wrapper सर्वर HTML से आया हो, तब `hydrated` `true` होता है। जब कंपोनेंट tree से बाहर जाता है, तो React के wrapper को detach करने से पहले यह `tuvix:unmounted` dispatch करता है, इसलिए `document` पर लगा listener इसे पाता है। अगर दिख रहा `<Suspense>` boundary फिर से suspend हो, तो ऐप `unmounted` रिपोर्ट करता है, और content वापस आने पर `mounted`।

```tsx
import { TuvixReactApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page === 'privacy' ? 'Privacy policy' : 'Terms of use'}</article>;
}

export function PrivacyRoute() {
  return (
    <TuvixReactApp
      name="legal-app"
      App={LegalPage}
      page="privacy"
      fallback={<p>This section failed to load.</p>}
    />
  );
}
```

Vue, Svelte, Angular या vanilla माइक्रो ऐप होस्ट करने के लिए `TuvixIsland` का उपयोग करें।

### `useTuvixBus`

```ts no-check
function useTuvixBus<T = unknown>(
  bus: IEventBus,
  event: string,
  handler: EventHandler<T>
): void;
```

एक effect में `handler` को `bus` पर `event` के लिए subscribe करता है और unmount पर unsubscribe करता है। hook नवीनतम `handler` को एक ref में रखता है, इसलिए ताज़ा state पढ़ने वाला handler हर render पर दोबारा subscribe नहीं करता। नया `bus` या `event` दोबारा subscribe करता है। subscription सिर्फ़ क्लाइंट पर मौजूद रहता है; सर्वर रेंडरिंग के दौरान effects नहीं चलते।

adapters orchestrator की bus को `App` में पास नहीं करते। जब तक आपने orchestrator को `eventBus` विकल्प नहीं दिए, वह `getGlobalBus()` का उपयोग करता है, इसलिए bus वहीं से पढ़ें:

```tsx
import { useState } from 'react';
import { useTuvixBus } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function CartIcon() {
  const [count, setCount] = useState(0);

  useTuvixBus<{ items: unknown[] }>(getGlobalBus(), 'cart:updated', ({ items }) => {
    setCount(items.length);
  });

  return <span>{count}</span>;
}
```

### `useTuvixProps`

```ts no-check
function useTuvixProps<T extends Record<string, unknown>>(
  initialProps: T,
  bus?: IEventBus,
  updateEvent?: string
): T;
```

| आर्गुमेंट | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `initialProps` | `T` | आवश्यक | शुरुआती मान। hook इसे पहले render पर पढ़ता है और बाद के बदलावों को अनदेखा करता है। |
| `bus` | `IEventBus` | कोई नहीं | जिस bus को सुनना है। इसके बिना hook `initialProps` को बिना बदले लौटाता है। |
| `updateEvent` | `string` | `'tuvix:props:update'` | वह event जिसका payload hook मौजूदा props में merge करता है (`{ ...prev, ...payload }`)। |

न orchestrator और न adapters `tuvix:props:update` emit करते हैं। इसे आप खुद emit करते हैं। `createReactMicroApp` से बने मॉड्यूल को orchestrator props के लिए इस hook की ज़रूरत नहीं है: `update({ props })` नए props के साथ `App` को फिर से रेंडर करता है।

```tsx
import { useTuvixProps } from '@tuvix.js/react';
import { getGlobalBus } from '@tuvix.js/event-bus';

export function ThemeLabel() {
  const props = useTuvixProps({ theme: 'light' }, getGlobalBus());
  return <p>Theme: {props.theme}</p>;
}

// Elsewhere: getGlobalBus().emit('tuvix:props:update', { theme: 'dark' });
```

### Types

| टाइप | अर्थ |
| --- | --- |
| `ReactMicroAppConfig<P>` | `createReactMicroApp` का config: `name`, `App`, `bootstrap?`, `ssr?`। |
| `TuvixIslandProps` | `TuvixIsland` के props: `name`, `app`, `props?`, `ssrHtml?`, `fallback?`, `as?`, `className?`। |
| `TuvixReactAppProps<P>` | `TuvixReactApp` के props: `name`, `App`, `fallback?`, और `App` के props। |

## Edge cases

- **पहला render throw करता है।** `mount` उस एरर के साथ reject होता है, root को unmount करता है, container खाली करता है और `tuvix:error` dispatch करता है। 0.4 में `mount` resolve हो जाता था और एरर React के root error handler तक पहुँचता था।
- **बाद का render throw करता है।** error boundary ऐप को खाली कर देता है और `tuvix:error` dispatch करता है। होस्ट पेज चलता रहता है। जब तक आप ऐप को unmount करके फिर से mount नहीं करते, वह खाली रहता है; `update` उसे वापस नहीं लाता।
- **Mount के दौरान unmount।** जब `mount` अभी `react-dom/client` लोड कर रहा हो या पहले commit का इंतज़ार कर रहा हो, तब आने वाला `unmount` उसका इंतज़ार करता है, container को खाली छोड़ता है और कोई `mounted` event dispatch नहीं करता।
- **एक container में दो बार mount।** जिस container को मॉड्यूल पहले से रखता है, उस पर दूसरा `mount` पुराने root को unmount करता है, `tuvix:unmounted` dispatch करता है, फिर नए props के साथ नए सिरे से रेंडर करता है और `tuvix:mounted` dispatch करता है। कंपोनेंट state reset हो जाती है। Vue, Svelte और Angular adapters भी यही करते हैं। state बनाए रखने के लिए `update` को कॉल करें।
- **अज्ञात container।** जिस container में मॉड्यूल कभी mount नहीं हुआ, उस पर `unmount` और `update` कुछ नहीं करते।
- **Props बदल दिए जाते हैं।** मॉड्यूल का `update` `App` को सिर्फ़ उन्हीं props के साथ रेंडर करता है जो आप पास करते हैं। `orchestrator.updateAppProps` `update` को कॉल करने से पहले नए props को रजिस्टर किए गए props के ऊपर merge करता है।
- **`ssr: true` के साथ सिर्फ़ whitespace वाला container।** मॉड्यूल नए सिरे से रेंडर करता है, क्योंकि `hasServerMarkup` whitespace text और comments को अनदेखा करता है।
- **React द्वारा हटाया गया island।** मॉड्यूल के `tuvix:unmounted` रिपोर्ट करने से पहले React island के element को detach कर देता है। तब `emitLifecycle` यह event detached element के बजाय `document` पर dispatch करता है, इसलिए `document` listener (या `@tuvix.js/loader` का `onLifecycle`) इसे फिर भी पाता है, और `detail.container` हटाए गए element को बताता है। container पर या किसी ancestor पर लगा listener इसे नहीं पाता। जब तक ऐप किसी दूसरे container में mount है, `isMounted(name)` `true` रहता है, और आख़िरी container के unmount होने के बाद `false` हो जाता है।
- **Development में `<StrictMode>` के अंदर island।** React mount effect चलाता है, फिर उसका cleanup, और फिर effect दोबारा। island मॉड्यूल कॉल्स को queue करता है और पहली run को छोड़ देता है क्योंकि उसका cleanup पहले ही चल चुका होता है, इसलिए मॉड्यूल एक बार mount होता है और सर्वर DOM को अपना लेता है।
- **विफल mount के बाद नया ऐप।** जब `mount` reject होता है, island अपना सर्वर HTML छोड़ देता है। अगर आप इसके बाद कोई दूसरा `app` या `name` पास करते हैं, तो नया मॉड्यूल विफल ऐप के markup को अपनाने के बजाय एक खाली element में mount होता है।
- **island पर `ssrHtml` बदलना।** island `ssrHtml` को सिर्फ़ पहले render पर पढ़ता है। नया content `props` के ज़रिए पास करें।
- **एक ही नाम दो बार।** `registerModule` किसी नाम के तहत बने आख़िरी मॉड्यूल को रखता है।

## यह क्या नहीं करता

- यह URL से मॉड्यूल लोड नहीं करता। मॉड्यूल को import करें, या [`@tuvix.js/core`](/hi/packages/core) को `entry` के ज़रिए उसे लोड करने दें।
- यह माइक्रो ऐप को string में रेंडर नहीं करता। सर्वर पर `TuvixReactApp` के साथ `react-dom/server` के `renderToString` का उपयोग करें, या फ्रेमवर्क के अपने renderer ([`@tuvix.js/vue/server`](/hi/packages/vue) का `renderVueToString`, Svelte और Angular के समकक्ष) का उपयोग करें और परिणाम को `ssrHtml` के रूप में `TuvixIsland` को पास करें।
- यह `MountContext.bus` या `MountContext.name` को `App` में पास नहीं करता। `@tuvix.js/event-bus` से `getGlobalBus()` का उपयोग करें।
- यह island का CSS लोड नहीं करता। सर्वर पर रेंडर हुए islands के stylesheet links प्रिंट करने के लिए [`@tuvix.js/vite`](/hi/packages/vite) का उपयोग करें।
- यह React 17 या उससे पुराने वर्शन को सपोर्ट नहीं करता।

## 0.4 से माइग्रेशन

**`TuvixReactApp` के सर्वर HTML में Suspense markers हैं।** wrapper में अब ऐप के चारों ओर `<!--$-->…<!--/$-->` रहता है। सर्वर और क्लाइंट पर `@tuvix.js/react` को एक साथ अपग्रेड करें, वरना hydration mismatch के साथ fail होता है।

**पहला render throw करने पर `mount` reject होता है।** अगर आप `mount` का await करते थे और उसके resolve होने की उम्मीद रखते थे, तो एरर पकड़ें:

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Broken(): never {
  throw new Error('boom');
}

const app = createReactMicroApp({ name: 'broken', App: Broken });
const container = document.createElement('div');

try {
  await app.mount({ container });
} catch (error) {
  // 0.4: never reached. 0.5: the render error; the container is empty.
  container.textContent = 'This section failed to load.';
}
```

**अज्ञात container पर `unmount` कुछ नहीं करता।** 0.4 में यह container को साफ़ कर देता था। अगर आप उस पर निर्भर थे, तो `container.replaceChildren()` खुद कॉल करें।

**Config object।** इस पेज के पुराने वर्शन में `createReactMicroApp(App)` दिखाया गया था। यह function एक config object लेता है: `createReactMicroApp({ name: 'dashboard', App })`।

और walkthroughs के लिए [React गाइड](/hi/guide/react) देखें।
