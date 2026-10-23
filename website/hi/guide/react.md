# React के साथ

`@tuvix.js/react` तीन काम करता है। `createReactMicroApp` किसी React कंपोनेंट को ऐसा माइक्रो ऐप बनाता है जिसे कोई भी shell mount कर सकता है। `TuvixReactApp` किसी React होस्ट पेज के अंदर React माइक्रो ऐप को सर्वर रेंडरिंग के साथ रेंडर करता है। `TuvixIsland` किसी React पेज के अंदर Vue, Svelte, Angular, React या हाथ से लिखे माइक्रो ऐप को होस्ट करता है।

React 18 या 19 ज़रूरी है।

## इंस्टॉल करें

```bash
pnpm add @tuvix.js/react react react-dom
```

## कंपोनेंट को माइक्रो ऐप बनाएँ

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

यह मॉड्यूल:

- खुद को `name` के तहत रजिस्टर करता है, ताकि URL entry उसे ढूँढ सके;
- हर container के लिए एक React root बनाता है, ताकि एक मॉड्यूल कई जगहों पर mount हो सके;
- React के पहला render commit करने के बाद `mount` को resolve करता है, फिर container पर `tuvix:mounted` dispatch करता है;
- shell के props को `App` के props के रूप में देता है। `App` ज़रूरी props घोषित कर सकता है; adapter runtime पर उन्हें जाँचता नहीं है।

| विकल्प | Type | विवरण |
| --- | --- | --- |
| `name` | `string` | ज़रूरी। रजिस्टर किए गए ऐप के नाम से मेल खाना चाहिए। |
| `App` | `ComponentType<P>` | ज़रूरी। Root कंपोनेंट। |
| `bootstrap` | `() => void \| Promise<void>` | पहले mount से पहले एक बार चलता है। |
| `ssr` | `boolean` | container में सर्वर markup होने पर hydrate करता है। `createSsrReactMicroApp` इसे सेट करता है। |

## Props और updates

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator();
await orchestrator.updateAppProps('profile', { theme: 'light' });
```

`update({ props, container })` उस container के root को merge किए गए props के साथ फिर से render करता है। कंपोनेंट की state बनी रहती है। `container` के बिना यह मॉड्यूल के हर root को फिर से render करता है। जिस container में यह मॉड्यूल पहले ही render कर चुका है, उस पर `mount` बुलाने से दूसरा root नहीं बनता, बल्कि वही root फिर से render होता है।

## एरर

Adapter `App` को एक error boundary में लपेटता है:

- पहले render के दौरान throw होने पर `mount` reject होता है, container खाली हो जाता है और `tuvix:error` dispatch होता है। इसके बाद orchestrator ऐप का `fallback` HTML दिखाता है।
- उसके बाद throw होने पर ऐप खाली हो जाता है और `tuvix:error` dispatch होता है। पेज का बाकी हिस्सा चलता रहता है।

## सर्वर पर रेंडर होने वाले React ऐप्स

जब होस्ट पेज React में हो और सर्वर पर रेंडर हो (TanStack Start, Next.js, Remix या आपका अपना `renderToString`), तो माइक्रो ऐप को `TuvixReactApp` से inline रेंडर करें:

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

- यह `App` के चारों ओर `<div data-tuvix-app="legal">` रेंडर करता है, इसलिए HTML होस्ट के अपने सर्वर render से आता है।
- `name`, `App` और `fallback` को छोड़कर हर prop `App` को जाता है।
- `App` अपने अलग `<Suspense fallback>` में रहता है। अगर यह सर्वर पर throw करे, तो React सिर्फ़ इसी ऐप के लिए fallback भेजता है और क्लाइंट पर ऐप को फिर से आज़माता है।
- क्लाइंट पर एक error boundary `fallback` दिखाता है और `tuvix:error` dispatch करता है।
- पहले commit के बाद, अगर इसने सर्वर HTML को hydrate किया हो तो यह `hydrated: true` के साथ `tuvix:mounted` dispatch करता है, और tree से हटने पर `tuvix:unmounted` dispatch करता है।

जब किसी अलग bundle को वह markup hydrate करना हो (उदाहरण के लिए ऐसा पेज जिसे `@tuvix.js/server` ने जोड़ा हो), तो उसी कंपोनेंट को `createSsrReactMicroApp` से export करें। यह वही Suspense tree रेंडर करता है, इसलिए hydration मेल खाता है:

```tsx
import { createSsrReactMicroApp } from '@tuvix.js/react';

function LegalPage({ page }: { page: 'privacy' | 'terms' }) {
  return <article>{page}</article>;
}

export default createSsrReactMicroApp({ name: 'legal', App: LegalPage });
```

`ssr: true` होने पर, जिस container में सिर्फ़ whitespace या comments हों, उसे hydration की जगह नया render मिलता है।

## TuvixIsland से दूसरे माइक्रो ऐप्स होस्ट करें

`TuvixIsland` किसी भी माइक्रो ऐप मॉड्यूल को React tree के अंदर mount करता है:

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

| Prop | विवरण |
| --- | --- |
| `name` | `data-tuvix-app` में लिखा जाता है और `mount` को दिया जाता है। |
| `app` | mount होने वाला मॉड्यूल। |
| `props` | हर render पर shallow तुलना होती है। बदलाव होने पर `app.update` बुलाया जाता है, या मॉड्यूल में `update` न हो तो unmount + mount होता है। |
| `ssrHtml` | island का सर्वर HTML। सिर्फ़ सर्वर पर चाहिए। |
| `fallback` | `mount` या `update` reject होने पर island की जगह रेंडर होता है। |
| `as`, `className` | Wrapper tag (default `div`) और class। |

पहले render के बाद React island का inner HTML दोबारा नहीं लिखता, इसलिए parent के re-render होने पर भी मॉड्यूल का जोड़ा गया DOM और listeners बने रहते हैं। नया `name` या `app` देने पर remount होता है; island हटाने पर `app.unmount` बुलाया जाता है। Mount, update और unmount एक के बाद एक चलते हैं, इसलिए `mount` के दौरान आया unmount उसके पूरा होने का इंतज़ार करता है।

`TuvixIsland` मॉड्यूल को URL से load नहीं करता। मॉड्यूल को import करें, या URL entries orchestrator को संभालने दें। पूरा सर्वर setup [SSR Islands](/hi/guide/ssr-islands) में है।

## Hooks

### useTuvixBus

यह mount पर subscribe करता है और unmount पर unsubscribe करता है। यह नवीनतम `handler` को एक ref से पढ़ता है, इसलिए inline handler हर render पर दोबारा subscribe नहीं करता:

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

`useTuvixProps(initialProps, bus?, updateEvent = 'tuvix:props:update')` ऐसी state लौटाता है जिसमें `updateEvent` पर emit हुआ हर payload merge होता है। Tuvix.js में कोई भी इस event को emit नहीं करता; जब आप props को `updateAppProps` की जगह bus से भेजना चाहें, तो इसे खुद emit करें।

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

## Adapter क्या नहीं करता

- यह माइक्रो ऐप्स के बीच एक React root साझा नहीं करता। हर ऐप और हर container को अपना root मिलता है।
- यह React को dedupe नहीं करता। अलग-अलग bundle किए गए दो React माइक्रो ऐप्स React की दो copies ship करते हैं।
- यह होस्ट पेज का `<head>` रेंडर नहीं करता। Titles और meta tags होस्ट की ज़िम्मेदारी हैं।

## API

| Export | उद्देश्य |
| --- | --- |
| `createReactMicroApp({ name, App, bootstrap?, ssr? })` | React माइक्रो ऐप मॉड्यूल |
| `createSsrReactMicroApp({ name, App, bootstrap? })` | वही, `ssr: true` के साथ |
| `TuvixReactApp` | React होस्ट में inline React माइक्रो ऐप, SSR के साथ |
| `TuvixIsland` | React tree में कोई भी माइक्रो ऐप मॉड्यूल होस्ट करें, SSR के साथ |
| `useTuvixBus(bus, event, handler)` | कंपोनेंट से जुड़ा event bus subscription |
| `useTuvixProps(initial, bus?, event?)` | bus events से merge किए गए props |
