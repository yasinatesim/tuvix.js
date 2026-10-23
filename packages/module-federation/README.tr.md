# @tuvix.js/module-federation

> Bir webpack Module Federation remote'unu Tuvix.js entry'sine çevirir: remoteEntry.js dosyasını yükler, share scope'u bir kez başlatır ve dışa açılan mikro uygulamayı döndürür.

[Tuvix.js](https://github.com/yasinatesim/tuvix.js) mikro frontend framework'ünün bir parçasıdır. Dokümantasyonun tamamı: [tuvix.js.org/tr/packages/module-federation](https://tuvix.js.org/tr/packages/module-federation).

## Kurulum

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

## Hızlı başlangıç

Remote bir mikro uygulamayı dışa açar (export'larında ya da `default` export'unda `mount` ve `unmount` bulunur):

```js
// dashboard/webpack.config.js
new ModuleFederationPlugin({
  name: 'dashboard',
  filename: 'remoteEntry.js',
  exposes: { './App': './src/App' },
});
```

Shell onu kaydeder:

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

`register({ entry })` ya da `ModuleLoader.load` için bir loader fonksiyonu döndürür. İlk mount'ta `remoteEntry.js` dosyasını yükler, her container için `init` fonksiyonunu bir kez çağırır, ardından `get(modulePath)` çağırıp mikro uygulamayı döndürür.

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Remote'un `ModuleFederationPlugin` ayarındaki `name`. |
| `url` | `string` | zorunlu | `remoteEntry.js` dosyasının URL'i. |
| `integrity` | `string` | yok | Script etiketi için SRI hash'i. |
| `scope` | `string` | `name` | Remote entry'nin tanımladığı `window` global değişkeni. |

### `createFederatedLoader`

```ts no-check
createFederatedLoader({ remotes: RemoteConfig[], shareScope?: ShareScope });
```

Döndürür:

| Metot | Davranış |
| --- | --- |
| `createFederatedEntry(remoteName, modulePath = './App')` | Orchestrator için `EntryLoader`. Bilinmeyen bir remote için hemen hata fırlatır. |
| `createFederatedApp(remoteName, modulePath = './App', signal?)` | Dışa açılan modülden ya da onun `default` export'undan bir `Promise<MicroAppModule>`. |
| `loadModule(remoteName, modulePath, signal?)` | Dışa açılan herhangi bir modül; `default` export'u varsa o. |
| `loadRemoteContainer(remote, signal?)` | Bir `RemoteConfig` üzerinden container'ı yükler ve başlatır; `FederatedContainer` döndürür. |

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

`shareScope` verilmezse webpack ile bundle edilmiş bir shell `__webpack_init_sharing__('default')` çağırır ve `__webpack_share_scopes__.default` değerini geçirir. Diğer shell'ler, sayfadaki tüm remote'ların paylaştığı tek bir nesne geçirir.

### Tipler

`ShareScope` (`Record<string, unknown>`), `FederatedContainer` (`{ init, get }`), `RemoteConfig`, `FederatedLoaderConfig` (`{ remotes, shareScope? }`), `FederatedEntryOptions` (`{ shareScope? }`).

## Sınır durumlar

- Orchestrator'ın `timeout` süresi `remoteEntry.js` beklemesini iptal eder ve etiketi kaldırır; yeniden deneme yeni bir etiket ekler.
- Başarısız bir `init` sonraki yüklemede tekrar denenir.
- Hatalar: `[Tuvix MF] Remote "<name>" is not configured`, `Failed to load remote entry: <url>`, `Remote container "<scope>" not found on window`, `Module "<path>" not found in remote "<name>"`, `does not export mount/unmount`.
- `remoteEntry.js`, `crossorigin="anonymous"` ile yüklenir; başka bir origin'deki remote'lar `Access-Control-Allow-Origin` göndermelidir.
- `ModuleLoader.prefetch` loader fonksiyonlarını atlar, bu yüzden MF uygulamaları prefetch edilmez.

## Ne yapmaz

- webpack'i sizin yerinize yapılandırmaz.
- Container'ları `window` üzerinden okur; `library: { type: 'module' }` kullanan remote'lar çalışmaz.
- Remote'ları keşfetmez, manifest okumaz.

## 0.4 sürümünden geçiş

- `federatedEntry(remote)` eskiden `{ scripts: [url] }` döndürüyordu ve bu "no exports found" hatasıyla başarısız oluyordu. Artık `modulePath` alır ve bir `EntryLoader` döndürür. `createFederatedEntry` de bir `EntryLoader` döndürür.
- `shared` yerine `shareScope` geldi.
- `loadRemoteContainer`, `any` yerine `FederatedContainer` döndürür.

## Lisans

MIT
