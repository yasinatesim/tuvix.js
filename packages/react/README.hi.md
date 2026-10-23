# @tuvix.js/react

> React कंपोनेंट्स को Tuvix.js माइक्रो ऐप्स में बदलें, और किसी भी माइक्रो ऐप को SSR hydration के साथ React tree के अंदर host करें।

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/react react react-dom
# or pnpm add @tuvix.js/react react react-dom
```

React 18 या नया वर्ज़न चाहिए।

## क्विक स्टार्ट

```tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard({ userId }: { userId: string }) {
  return <h1>Dashboard for {userId}</h1>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Module `@tuvix.js/loader` के `registerModule` के ज़रिए खुद को `'dashboard'` नाम से register करता है, इसलिए script load होने के बाद orchestrator उसे ढूंढ लेता है। Orchestrator को `() => import('./dashboard')` जैसी `entry`, एक `container` और `props` दें।

## API

### `createReactMicroApp(config)`

```ts no-check
function createReactMicroApp<P extends object = Record<string, unknown>>(
  config: ReactMicroAppConfig<P>
): MicroAppModule;
```

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | required | Registry नाम। Lifecycle events में यही नाम होता है। |
| `App` | `ComponentType<P>` | required | Root कंपोनेंट। Mount props पाता है, ज़रूरी props का type-check होता है। |
| `bootstrap` | `() => void \| Promise<void>` | none | एक बार होने वाला setup। |
| `ssr` | `boolean` | `false` | Container में सर्वर markup (elements या non-whitespace text) हो तो `hydrateRoot` से hydrate करें। |

- हर container को अपना React root मिलता है, इसलिए एक module कई जगह mount हो सकता है।
- `mount({ container, props })` पहले commit के बाद resolve होता है और `hydrated` के साथ `tuvix:mounted` dispatch करता है।
- `update({ props, container })` एक container को re-render करता है, या `container` न हो तो सभी को। कंपोनेंट state बनी रहती है।
- `unmount({ container })` root को unmount करता है, container खाली करता है और `tuvix:unmounted` dispatch करता है।
- `react-dom/client` `mount` के अंदर lazily load होता है, इसलिए सर्वर bundles इस module को import कर सकते हैं।

### `createSsrReactMicroApp(config)`

`createReactMicroApp({ ...config, ssr: true })`। विकल्प: `name`, `App`, `bootstrap`। यह `TuvixReactApp` जैसा ही tree रेंडर करता है, इसलिए `TuvixReactApp` के markup को बिना mismatch के hydrate करता है।

### `TuvixIsland`

किसी भी माइक्रो ऐप module (Vue, Svelte, Angular, React या हाथ से लिखा `{ mount, unmount, update? }`) को React tree के अंदर host करता है।

| Prop | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | required | `data-tuvix-app` में लिखा जाता है, `mount` को दिया जाता है। |
| `app` | `MicroAppModule` | required | Mount होने वाला module। |
| `props` | `Record<string, unknown>` | `{}` | Shallow तुलना होती है। बदलाव पर `app.update({ props, container })` कॉल होता है, या module में `update` न हो तो remount होता है। |
| `ssrHtml` | `string` | none | Island का सर्वर पर रेंडर हुआ HTML। इसे सिर्फ़ सर्वर पर दें। |
| `fallback` | `ReactNode` | `null` | `mount` या `update` के reject होने पर रेंडर होता है। |
| `as` | `keyof JSX.IntrinsicElements` | `'div'` | Wrapper tag। |
| `className` | `string` | none | Wrapper class। |

हाथ से लिखा `<div dangerouslySetInnerHTML={{ __html }} />` bridge, parent के अगले re-render पर माइक्रो ऐप का DOM और listeners खो देता है, क्योंकि React हर नए `{ __html }` object के लिए `innerHTML` फिर से assign करता है। `TuvixIsland` वह object एक ही बार बनाता है। Hydration के दौरान यह `data-tuvix-island` attribute (`useId` से) के ज़रिए अपना element ढूंढता है और HTML पेज से वापस पढ़ता है, इसलिए क्लाइंट को `ssrHtml` की ज़रूरत नहीं होती। नया `name` या `app` remount करता है। हटाने पर `app.unmount` कॉल होता है। Calls क्रम से चलते हैं, इसलिए unmount लंबित mount का इंतज़ार करता है।

```tsx
// Layout.tsx, rendered on the server with footerHtml and on the client without it
import { TuvixIsland } from '@tuvix.js/react';
import { createSsrVueMicroApp } from '@tuvix.js/vue';
import Footer from './Footer.vue';

const footer = createSsrVueMicroApp({ name: 'footer', App: Footer });

export function Layout({ year, footerHtml }: { year: number; footerHtml?: string }) {
  return (
    <TuvixIsland name="footer" app={footer} props={{ year }} ssrHtml={footerHtml} fallback={<footer>© {year}</footer>} />
  );
}
```

```tsx
// entry-server.tsx
import { renderToString } from 'react-dom/server';
import { renderVueToString } from '@tuvix.js/vue/server';
import { Layout } from './Layout';
import Footer from './Footer.vue';

export async function renderPage(): Promise<string> {
  const footerHtml = await renderVueToString(Footer, { year: 2026 });
  return renderToString(<Layout year={2026} footerHtml={footerHtml} />);
}
```

```tsx
// entry-client.tsx
import { hydrateRoot } from 'react-dom/client';
import { Layout } from './Layout';

hydrateRoot(document.getElementById('root')!, <Layout year={2026} />);
```

### `TuvixReactApp`

React माइक्रो ऐप को host tree में inline, `<div data-tuvix-app={name}>` के अंदर रेंडर करता है।

| Prop | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | required | Module के `name` से मेल खाना चाहिए। |
| `App` | `ComponentType<P>` | required | रेंडर होने वाला कंपोनेंट। |
| `fallback` | `ReactNode` | `null` | `App` के suspend होने पर या throw करने के बाद दिखता है। |
| बाकी props | `P` | `P` के अनुसार ज़रूरी | `App` को दिए जाते हैं। |

`App` एक error boundary और एक `<Suspense fallback>` के अंदर रहता है। सर्वर रेंडर एरर सिर्फ़ इस ऐप को `fallback` से बदलता है, और React क्लाइंट पर उसे फिर से आज़माता है। क्लाइंट रेंडर एरर `fallback` दिखाता है और `tuvix:error` dispatch करता है। यह `tuvix:mounted` (`hydrated` के साथ) और `tuvix:unmounted` dispatch करता है।

### `useTuvixBus(bus, event, handler)`

एक effect में subscribe करता है और unmount पर unsubscribe करता है। सबसे नया `handler` एक ref में रहता है, इसलिए हर render पर दोबारा subscribe नहीं होता। `@tuvix.js/event-bus` से `getGlobalBus()` दें। Adapter orchestrator का bus `App` को नहीं देता।

### `useTuvixProps(initialProps, bus?, updateEvent?)`

ऐसे props लौटाता है जिनमें `bus` पर आए `updateEvent` (default `'tuvix:props:update'`) का हर payload merge होता है। Tuvix में कुछ भी यह event emit नहीं करता, इसे आप emit करते हैं। `createReactMicroApp` से बने modules इस hook के बिना `update` के ज़रिए नए props पाते हैं।

### Types

`ReactMicroAppConfig<P>`, `TuvixIslandProps`, `TuvixReactAppProps<P>`।

## Edge cases

- पहले render में throw होने पर `mount` reject होता है, container खाली होता है और `tuvix:error` dispatch होता है। बाद का throw ऐप को तब तक खाली कर देता है जब तक आप उसे remount न करें।
- लंबित `mount` के दौरान `unmount` उसका इंतज़ार करता है और container खाली छोड़ता है।
- जिस container को module पहले से रखता है, उस पर `mount` पुराने root को unmount करता है (`tuvix:unmounted` dispatch करते हुए) और नए props के साथ नए सिरे से रेंडर करता है, ठीक Vue, Svelte और Angular adapters की तरह।
- अनजान container पर `unmount` और `update` कुछ नहीं करते।
- जब React किसी `TuvixIsland` को हटाता है, तो element detach होने के बाद module `tuvix:unmounted` रिपोर्ट करता है। Event `document` पर जाता है (`detail.container` सेट रहता है), इसलिए `document` listeners और `onLifecycle` उसे पाते हैं, container या उसके ancestors पर लगे listeners नहीं। ऐप का कोई container mounted न रहने पर `isMounted(name)` `false` हो जाता है।
- Development में `<StrictMode>` के तहत React island का mount effect दो बार चलाता है, लेकिन island छोड़ी गई पहली run को skip करता है: module एक बार mount होता है और सर्वर markup को अपना लेता है।
- विफल mount के बाद, नया `app` या `name` एक खाली element में mount होता है। उसे विफल ऐप का सर्वर HTML कभी नहीं मिलता।

## यह क्या नहीं करता

- URL से modules load करना। `@tuvix.js/core` या `@tuvix.js/loader` इस्तेमाल करें।
- String में रेंडर करना। `react-dom/server` इस्तेमाल करें, या `ssrHtml` के लिए `renderVueToString` और उसके जैसे functions।
- Island CSS load करना। `@tuvix.js/vite` इस्तेमाल करें।

## 0.5 में breaking changes

- `TuvixReactApp` के सर्वर HTML में अब Suspense comment markers हैं। सर्वर और क्लाइंट को साथ में upgrade करें।
- पहला render throw करे तो `mount` reject होता है।
- जिस container को module ने कभी mount नहीं किया, उस पर `unmount` कुछ नहीं करता।

पूरा डॉक्यूमेंटेशन: [tuvix.js.org/hi/packages/react](https://tuvix.js.org/hi/packages/react)

## लाइसेंस

MIT
