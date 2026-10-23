# @tuvix.js/module-federation

> webpack Module Federation remote को Tuvix.js entry में बदलता है: remoteEntry.js लोड करता है, share scope को एक बार initialise करता है और exposed माइक्रो ऐप लौटाता है।

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) माइक्रोफ्रंटएंड फ्रेमवर्क का हिस्सा। पूरा documentation: [tuvix.js.org/hi/packages/module-federation](https://tuvix.js.org/hi/packages/module-federation)।

## इंस्टॉलेशन

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

## क्विक स्टार्ट

remote एक माइक्रो ऐप expose करता है (उसके exports या उसके `default` export में `mount` और `unmount` होते हैं):

```js
// dashboard/webpack.config.js
new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App' },
});
```

shell उसे register करता है:

```ts
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

## API

### `federatedEntry`

```ts no-check
federatedEntry(remote: RemoteConfig, modulePath = './App', options?: { shareScope?: ShareScope }): EntryLoader;
```

`register({ entry })` या `ModuleLoader.load` के लिए एक loader function लौटाता है। पहले mount पर यह `remoteEntry.js` लोड करता है, हर container के लिए एक बार `init` call करता है, `get(modulePath)` call करता है और माइक्रो ऐप लौटाता है।

| विकल्प | Type | Default | अर्थ |
| --- | --- | --- | --- |
| `name` | `string` | ज़रूरी | remote के `ModuleFederationPlugin` का `name`। |
| `url` | `string` | ज़रूरी | `remoteEntry.js` का URL। |
| `integrity` | `string` | कोई नहीं | script tag के लिए SRI hash। |
| `scope` | `string` | `name` | वह `window` global जिसे remote entry define करती है। |

### `createFederatedLoader`

```ts no-check
createFederatedLoader({ remotes: RemoteConfig[], shareScope?: ShareScope });
```

लौटाता है:

| Method | व्यवहार |
| --- | --- |
| `createFederatedEntry(remoteName, modulePath = './App')` | orchestrator के लिए `EntryLoader`। अनजान remote पर तुरंत throw करता है। |
| `createFederatedApp(remoteName, modulePath = './App', signal?)` | exposed module या उसके `default` export से `Promise<MicroAppModule>`। |
| `loadModule(remoteName, modulePath, signal?)` | कोई भी exposed module; `default` export होने पर वही। |
| `loadRemoteContainer(remote, signal?)` | `RemoteConfig` से एक container लोड और initialise करता है; `FederatedContainer` लौटाता है। |

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';
import { createOrchestrator } from '@tuvix.js/core';

const federation = createFederatedLoader({
  remotes: [
    { name: 'remote1', url: 'http://localhost:3001/remoteEntry.js' },
    { name: 'remote2', url: 'http://localhost:3002/remoteEntry.js' },
  ],
});

const orchestrator = createOrchestrator();
orchestrator.register({ name: 'remote1', entry: federation.createFederatedEntry('remote1'), container: '#remote1', activeWhen: '/' });
orchestrator.register({ name: 'remote2', entry: federation.createFederatedEntry('remote2'), container: '#remote2', activeWhen: '/' });
await orchestrator.start();
```

### Share scope

`shareScope` के बिना, webpack से bundle किया गया shell `__webpack_init_sharing__('default')` call करता है और `__webpack_share_scopes__.default` पास करता है। कोई भी दूसरा shell एक ऐसा object पास करता है जिसे पेज के सभी remotes साझा करते हैं।

### Types

`ShareScope` (`Record<string, unknown>`), `FederatedContainer` (`{ init, get }`), `RemoteConfig`, `FederatedLoaderConfig` (`{ remotes, shareScope? }`), `FederatedEntryOptions` (`{ shareScope? }`)।

## Edge cases

- orchestrator का `timeout` `remoteEntry.js` का इंतज़ार रद्द करता है और tag हटा देता है; retry एक नया tag जोड़ता है।
- fail हुआ `init` अगले load पर दोबारा चलता है।
- एरर: `[Tuvix MF] Remote "<name>" is not configured`, `Failed to load remote entry: <url>`, `Remote container "<scope>" not found on window`, `Module "<path>" not found in remote "<name>"`, `does not export mount/unmount`।
- `remoteEntry.js` `crossorigin="anonymous"` के साथ लोड होता है; दूसरे origin पर मौजूद remotes को `Access-Control-Allow-Origin` भेजना होगा।
- `ModuleLoader.prefetch` loader functions को छोड़ देता है, इसलिए MF ऐप्स prefetch नहीं होते।

## यह क्या नहीं करता

- यह आपके लिए webpack कॉन्फ़िगर नहीं करता।
- यह containers को `window` से पढ़ता है; `library: { type: 'module' }` वाले remotes काम नहीं करते।
- यह remotes को discover नहीं करता और manifests नहीं पढ़ता।

## 0.4 से माइग्रेशन

- `federatedEntry(remote)` `{ scripts: [url] }` लौटाता था, जो "no exports found" के साथ fail होता था। अब यह `modulePath` लेता है और `EntryLoader` लौटाता है। `createFederatedEntry` भी `EntryLoader` लौटाता है।
- `shared` की जगह अब `shareScope` है।
- `loadRemoteContainer` `any` के बजाय `FederatedContainer` लौटाता है।

## License

MIT
