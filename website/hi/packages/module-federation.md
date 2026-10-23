---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="webpack Module Federation remote को Tuvix.js entry में बदलता है: remoteEntry.js load करता है, share scope को एक बार initialise करता है और expose किया गया माइक्रो ऐप लौटाता है।"
  icon="🌐"
  npm="true"
/>

## इंस्टॉलेशन

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

यह पैकेज `@tuvix.js/loader` पर निर्भर है और उसका `loadScript` इस्तेमाल करता है।

## इसे कब इस्तेमाल करें

आपके माइक्रो ऐप्स webpack के `ModuleFederationPlugin` से build होते हैं और हर ऐप एक `remoteEntry.js` publish करता है। आपका shell remote URLs सिर्फ़ runtime पर जानता है, या वह किसी दूसरे bundler (Vite, Rollup) से build होता है, इसलिए वह remotes को अपने webpack config में list नहीं कर सकता।

`federatedEntry` एक ऐसी entry लौटाता है जिसे orchestrator register कर सकता है। पहले mount पर यह `remoteEntry.js` load करता है, share scope के साथ container का `init` call करता है, `get('./App')` call करता है और expose किया गया module orchestrator को सौंप देता है।

अगर आपका shell webpack build है और आप build के समय remotes list कर सकते हैं, तो `entry: () => import('dashboard/App')` के साथ webpack का अपना `remotes` विकल्प इस पैकेज के बिना काम करता है।

## क्विक स्टार्ट

Remote एक module expose करता है जिसके अपने exports या `default` export एक Tuvix.js माइक्रो ऐप हैं:

```js
// dashboard/webpack.config.js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  output: { publicPath: 'auto' },
  devServer: { port: 3001, headers: { 'Access-Control-Allow-Origin': '*' } },
  plugins: [
    new ModuleFederationPlugin({
      name: 'dashboard',
      filename: 'remoteEntry.js',
      exposes: { './App': './src/App' },
    }),
  ],
};
```

```tsx
// dashboard/src/App.tsx
import { createReactMicroApp } from '@tuvix.js/react';

function Dashboard() {
  return <h2>Dashboard</h2>;
}

export default createReactMicroApp({ name: 'dashboard', App: Dashboard });
```

Shell remote को entry के रूप में register करता है:

```ts
// shell/src/main.ts
import { createOrchestrator } from '@tuvix.js/core';
import { federatedEntry } from '@tuvix.js/module-federation';

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'dashboard',
  entry: federatedEntry({ name: 'dashboard', url: 'http://localhost:3001/remoteEntry.js' }, './App'),
  container: '#main',
  activeWhen: '/dashboard/*',
});

await orchestrator.start();
```

orchestrator का loader entry को `signal` के साथ call करता है, इसलिए उसके `timeout` और `retries` विकल्प `remoteEntry.js` पर भी लागू होते हैं।

## API

### `federatedEntry`

```ts no-check
function federatedEntry(remote: RemoteConfig, modulePath?: string, options?: FederatedEntryOptions): EntryLoader;
```

| विकल्प | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `remote` | `RemoteConfig` | ज़रूरी | Remote: `name`, `url`, और वैकल्पिक रूप से `integrity` और `scope` (नीचे की table)। |
| `modulePath` | `string` | `'./App'` | Remote के `exposes` की key। |
| `options.shareScope` | `ShareScope` | webpack का `default` scope, वरना एक पेज-व्यापी object | Container के `init` को दिया जाने वाला share scope। |

`orchestrator.register({ entry })` या `ModuleLoader.load(name, entry)` के लिए एक `EntryLoader` (`({ signal }) => Promise<MicroAppModule>`) लौटाता है। हर call अपना internal loader बनाती है। एक ही remote की दो entries फिर भी एक `remoteEntry.js` tag और एक `init` call साझा करती हैं।

`RemoteConfig`:

| विकल्प | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | ज़रूरी | Remote का नाम, यानी remote के `ModuleFederationPlugin` config का `name`। |
| `url` | `string` | ज़रूरी | `remoteEntry.js` का URL। |
| `integrity` | `string` | कोई नहीं | `remoteEntry.js` script tag के लिए SRI hash। |
| `scope` | `string` | `name` | उस `window` global का नाम जिसे `remoteEntry.js` define करता है, जब वह `name` से अलग हो। |

### `createFederatedLoader`

```ts no-check
function createFederatedLoader(config: FederatedLoaderConfig): {
  createFederatedEntry(remoteName: string, modulePath?: string): EntryLoader;
  createFederatedApp(remoteName: string, modulePath?: string, signal?: AbortSignal): Promise<MicroAppModule>;
  loadModule(remoteName: string, modulePath: string, signal?: AbortSignal): Promise<unknown>;
  loadRemoteContainer(remote: RemoteConfig, signal?: AbortSignal): Promise<FederatedContainer>;
};
```

| विकल्प | टाइप | डिफ़ॉल्ट | अर्थ |
| --- | --- | --- | --- |
| `remotes` | `RemoteConfig[]` | ज़रूरी | हर remote जिसे यह loader load कर सकता है। |
| `shareScope` | `ShareScope` | webpack का `default` scope, वरना एक पेज-व्यापी object | हर container के `init` को दिया जाने वाला share scope। |

इसे तब इस्तेमाल करें जब कई ऐप्स remotes की list से आते हैं, या जब आपको expose किया गया module ख़ुद चाहिए।

```ts
import { createOrchestrator } from '@tuvix.js/core';
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [
    { name: 'remote1', url: 'http://localhost:3001/remoteEntry.js' },
    { name: 'remote2', url: 'http://localhost:3002/remoteEntry.js' },
  ],
});

const orchestrator = createOrchestrator();

orchestrator.register({
  name: 'remote1',
  entry: federation.createFederatedEntry('remote1', './App'),
  container: '#remote1-container',
  activeWhen: '/',
});

orchestrator.register({
  name: 'remote2',
  entry: federation.createFederatedEntry('remote2', './App'),
  container: '#remote2-container',
  activeWhen: '/',
});

await orchestrator.start();
```

#### `createFederatedEntry(remoteName, modulePath = './App')`

एक `EntryLoader` लौटाता है जो `createFederatedApp(remoteName, modulePath, signal)` call करता है। `remoteName` अगर `remotes` में नहीं है तो यह तुरंत throw करता है, इसलिए typo पहले mount पर नहीं, `register` के समय ही fail होता है।

#### `createFederatedApp(remoteName, modulePath = './App', signal?)`

Container load करता है, `get(modulePath)` call करता है, factory चलाता है और माइक्रो ऐप लौटाता है: अगर expose किए गए module में `mount` फ़ंक्शन है तो module ख़ुद, वरना उसका `default` export, अगर उसमें `mount` है। नहीं तो यह `[Tuvix MF] Module "<modulePath>" from remote "<remoteName>" does not export mount/unmount.` throw करता है।

#### `loadModule(remoteName, modulePath, signal?)`

कोई भी expose किया गया module लौटाता है, जैसे shared कंपोनेंट लाइब्रेरी या config object। Module में `default` export हो तो `loadModule` वही export लौटाता है।

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [{ name: 'design', url: 'https://cdn.example.com/design/remoteEntry.js' }],
});

const tokens = (await federation.loadModule('design', './tokens')) as Record<string, string>;
document.documentElement.style.setProperty('--brand', tokens.brand ?? '#f05454');
```

#### `loadRemoteContainer(remote, signal?)`

एक `RemoteConfig` लेता है (नाम नहीं), उसका `remoteEntry.js` classic script के रूप में load करता है, container को `window[remote.scope ?? remote.name]` से पढ़ता है, उसे initialise करता है और लौटाता है। Loader containers को remote name के हिसाब से cache करता है।

### Share scope

`shareScope` के बिना पैकेज इस क्रम में एक scope चुनता है:

1. जिस shell को webpack bundle करता है, उसमें यह `__webpack_init_sharing__('default')` call करता है और `__webpack_share_scopes__.default` पास करता है, ताकि remotes वे डिपेंडेंसी साझा करें जिन्हें होस्ट ने अपने `shared` config में घोषित किया है।
2. किसी भी दूसरे shell में यह एक सादा object पास करता है जो पेज के हर remote को मिलता है। Remotes इसके ज़रिए आपस में डिपेंडेंसी साझा कर सकते हैं। होस्ट की अपनी copies इसमें हिस्सा नहीं लेतीं।

अपने ख़ुद के manage किए गए scope के लिए `shareScope` पास करें।

### Types

```ts
type ShareScope = Record<string, unknown>;

interface FederatedContainer {
  init(shareScope: ShareScope): void | Promise<void>;
  get(module: string): (() => unknown) | Promise<() => unknown>;
}
```

| टाइप | अर्थ |
| --- | --- |
| `ShareScope` | Container के `init` को दिया जाने वाला object। |
| `FederatedContainer` | `{ init, get }` global जिसे `remoteEntry.js` define करता है। |
| `RemoteConfig` | `{ name, url, integrity?, scope? }`। |
| `FederatedLoaderConfig` | `createFederatedLoader` के लिए `{ remotes, shareScope? }`। |
| `FederatedEntryOptions` | `federatedEntry` के लिए `{ shareScope? }`। |

## Edge cases

- **एक बार init।** पैकेज हर container object को प्रति पेज एक बार initialise करता है, भले ही कई loaders या entries उसका इस्तेमाल करें। Fail हुए `init` को पैकेज भूल जाता है, इसलिए अगला load फिर से कोशिश करता है।
- **Timeouts और retries।** orchestrator का `timeout` fire होने पर aborted `signal` `remoteEntry.js` का इंतज़ार रोक देता है और उसका tag हटा देता है, जब तक कोई दूसरा load अभी भी उसका इंतज़ार न कर रहा हो। Retry एक नया tag जोड़ता है। Aborted load abort reason के साथ reject होता है। बाकी load failures का संदेश `[Tuvix MF] Failed to load remote entry: <url> (<error>)` होता है।
- **Global नहीं मिला।** अगर `remoteEntry.js` load हो जाता है लेकिन `window[scope]` में `init` और `get` नहीं हैं, तो load `[Tuvix MF] Remote container "<scope>" not found on window after loading <url>` के साथ fail होता है। जाँचें कि `scope` remote के `name` से मेल खाता है, या उसके `library.name` से, अगर आपने वह set किया है।
- **अनजान module।** `get` के throw करने या factory के अलावा कुछ और लौटाने पर `[Tuvix MF] Module "<modulePath>" not found in remote "<remoteName>"` मिलता है।
- **अनजान remote।** `createFederatedEntry`, `createFederatedApp` और `loadModule` `[Tuvix MF] Remote "<name>" is not configured. Available: <names>` throw करते हैं।
- **CORS।** `remoteEntry.js` `crossorigin="anonymous"` के साथ load होता है। दूसरे origin वाले remote को `Access-Control-Allow-Origin` भेजना होगा।
- **Unload और remount।** loader-फ़ंक्शन entry के लिए orchestrator का loader कुछ नहीं हटाता। अगला mount फिर से `get(modulePath)` call करता है और webpack अपना cached module लौटाता है।
- **Prefetch।** `ModuleLoader.prefetch` loader-फ़ंक्शन entries को छोड़ देता है, इसलिए orchestrator की `prefetch` setting `remoteEntry.js` को पहले से download नहीं करती।

## यह क्या नहीं करता

- यह webpack को configure नहीं करता। हर remote `ModuleFederationPlugin` ख़ुद जोड़ता है।
- यह containers को `window` से पढ़ता है। `library: { type: 'module' }` या किसी दूसरे non-global library type से build हुए remotes काम नहीं करते।
- यह कोई remote manifest नहीं पढ़ता और remotes खोजता नहीं। आप हर `remoteEntry.js` URL ख़ुद list करते हैं।
- यह versions पर negotiate नहीं करता। हर container के अंदर का webpack runtime share scope के ज़रिए यह काम करता है।

## 0.4 से माइग्रेशन {#migrating-from-0-4}

- `federatedEntry(remote)` `{ scripts: [remote.url] }` लौटाता था, और फिर loader "no exports found" के साथ fail होता था, क्योंकि container में सिर्फ़ `init` और `get` होते हैं। अब यह expose किए गए module का path लेता है और एक loader फ़ंक्शन लौटाता है:

  ```ts
  import { federatedEntry } from '@tuvix.js/module-federation';

  // 0.4: federatedEntry({ name: 'dashboard', url }) returned an EntryConfig
  const entry = federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }, './App');
  ```

- `createFederatedEntry(remoteName, modulePath)` अब `EntryConfig` की जगह `EntryLoader` लौटाता है। जो shells `createFederatedApp` से remotes पहले से load करके `entry: { scripts: [] }` register करते थे, वे entry के रूप में `federation.createFederatedEntry('remote1', './App')` पास कर सकते हैं।
- `FederatedLoaderConfig.shared` की जगह अब `shareScope` है। पैकेज ने `shared` को कभी पढ़ा ही नहीं।
- `loadRemoteContainer` अब `any` की जगह `FederatedContainer` लौटाता है।
- 0.4 में पैकेज `window.__webpack_share_scopes__` पढ़ता था, जिसे webpack कभी define नहीं करता, इसलिए हर remote को अपना खाली scope मिलता था। अब webpack होस्ट अपना असली `default` scope पास करता है।
- इस पेज के 0.4 version में `createFederatedLoader()` बिना arguments के और `loader.remote({ url, scope, module })` दिखाए गए थे। दोनों में से कोई मौजूद नहीं था।
