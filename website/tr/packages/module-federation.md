---
title: '@tuvix.js/module-federation'
---

<PackageHeader
  name="@tuvix.js/module-federation"
  title="Module Federation"
  description="Bir webpack Module Federation remote'unu Tuvix.js entry'sine çevirir: remoteEntry.js dosyasını yükler, share scope'u bir kez başlatır ve dışa açılan mikro uygulamayı döndürür."
  icon="🌐"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/module-federation
# or pnpm add @tuvix.js/module-federation
```

Paket `@tuvix.js/loader` paketine bağlıdır ve onun `loadScript` fonksiyonunu kullanır.

## Ne zaman kullanılır

Mikro uygulamalarınız webpack'in `ModuleFederationPlugin` eklentisiyle build ediliyor ve her biri bir `remoteEntry.js` yayınlıyor. Shell'iniz remote URL'lerini ancak çalışma zamanında biliyor ya da başka bir bundler (Vite, Rollup) ile build ediliyor. Bu yüzden remote'ları kendi webpack ayarında listeleyemiyor.

`federatedEntry`, orchestrator'ın kaydedebileceği bir entry döndürür. İlk mount sırasında `remoteEntry.js` dosyasını yükler, container'ın `init` metodunu bir share scope ile çağırır, ardından `get('./App')` çağırır ve dışa açılan modülü orchestrator'a verir.

Shell'iniz bir webpack build'iyse ve remote'ları build zamanında listeleyebiliyorsanız, webpack'in kendi `remotes` seçeneği `entry: () => import('dashboard/App')` ile bu paket olmadan da çalışır.

## Hızlı başlangıç

Remote, kendi export'ları ya da `default` export'u bir Tuvix.js mikro uygulaması olan bir modülü dışa açar:

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

Shell, remote'u bir entry olarak kaydeder:

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

Orchestrator'ın loader'ı entry'yi bir `signal` ile çağırır. Bu sayede loader'ın `timeout` ve `retries` seçenekleri `remoteEntry.js` için de geçerli olur.

## API

### `federatedEntry`

```ts no-check
function federatedEntry(remote: RemoteConfig, modulePath?: string, options?: FederatedEntryOptions): EntryLoader;
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `remote` | `RemoteConfig` | zorunlu | Remote: `name`, `url` ve isteğe bağlı `integrity` ile `scope` (aşağıdaki tablo). |
| `modulePath` | `string` | `'./App'` | Remote'un `exposes` alanındaki anahtar. |
| `options.shareScope` | `ShareScope` | webpack'in `default` scope'u, yoksa sayfa genelinde tek bir nesne | Container'ın `init` metoduna verilen share scope. |

`orchestrator.register({ entry })` ya da `ModuleLoader.load(name, entry)` için bir `EntryLoader` (`({ signal }) => Promise<MicroAppModule>`) döndürür. Her çağrı kendi iç loader'ını oluşturur. Aynı remote için iki entry yine de tek bir `remoteEntry.js` etiketini ve tek bir `init` çağrısını paylaşır.

`RemoteConfig`:

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `name` | `string` | zorunlu | Remote adı, yani remote'un `ModuleFederationPlugin` ayarındaki `name`. |
| `url` | `string` | zorunlu | `remoteEntry.js` dosyasının URL'si. |
| `integrity` | `string` | yok | `remoteEntry.js` script etiketi için SRI hash'i. |
| `scope` | `string` | `name` | `remoteEntry.js` dosyasının tanımladığı `window` global'inin adı, `name` değerinden farklıysa. |

### `createFederatedLoader`

```ts no-check
function createFederatedLoader(config: FederatedLoaderConfig): {
  createFederatedEntry(remoteName: string, modulePath?: string): EntryLoader;
  createFederatedApp(remoteName: string, modulePath?: string, signal?: AbortSignal): Promise<MicroAppModule>;
  loadModule(remoteName: string, modulePath: string, signal?: AbortSignal): Promise<unknown>;
  loadRemoteContainer(remote: RemoteConfig, signal?: AbortSignal): Promise<FederatedContainer>;
};
```

| Seçenek | Tip | Varsayılan | Anlamı |
| --- | --- | --- | --- |
| `remotes` | `RemoteConfig[]` | zorunlu | Bu loader'ın yükleyebileceği tüm remote'lar. |
| `shareScope` | `ShareScope` | webpack'in `default` scope'u, yoksa sayfa genelinde tek bir nesne | Her container'ın `init` metoduna verilen share scope. |

Birden fazla uygulama bir remote listesinden geliyorsa ya da dışa açılan modülün kendisine ihtiyacınız varsa bunu kullanın.

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

`createFederatedApp(remoteName, modulePath, signal)` çağıran bir `EntryLoader` döndürür. `remoteName` değeri `remotes` içinde yoksa hemen hata fırlatır. Böylece bir yazım hatası ilk mount sırasında değil, `register` anında ortaya çıkar.

#### `createFederatedApp(remoteName, modulePath = './App', signal?)`

Container'ı yükler, `get(modulePath)` çağırır, factory'yi çalıştırır ve mikro uygulamayı döndürür. Dışa açılan modülde bir `mount` fonksiyonu varsa modülün kendisini, yoksa bu fonksiyona sahip `default` export'unu döndürür. İkisi de yoksa `[Tuvix MF] Module "<modulePath>" from remote "<remoteName>" does not export mount/unmount.` hatasını fırlatır.

#### `loadModule(remoteName, modulePath, signal?)`

Dışa açılan herhangi bir modülü döndürür, örneğin ortak bir bileşen kütüphanesini ya da bir ayar nesnesini. Modülün `default` export'u varsa `loadModule` o export'u döndürür.

```ts
import { createFederatedLoader } from '@tuvix.js/module-federation';

const federation = createFederatedLoader({
  remotes: [{ name: 'design', url: 'https://cdn.example.com/design/remoteEntry.js' }],
});

const tokens = (await federation.loadModule('design', './tokens')) as Record<string, string>;
document.documentElement.style.setProperty('--brand', tokens.brand ?? '#f05454');
```

#### `loadRemoteContainer(remote, signal?)`

Bir ad değil, bir `RemoteConfig` alır. Remote'un `remoteEntry.js` dosyasını klasik script olarak yükler, container'ı `window[remote.scope ?? remote.name]` üzerinden okur, başlatır ve döndürür. Loader, container'ları remote adına göre önbelleğe alır.

### Share scope

`shareScope` verilmezse paket şu sırayla bir scope seçer:

1. Webpack'in bundle ettiği bir shell'de `__webpack_init_sharing__('default')` çağırır ve `__webpack_share_scopes__.default` değerini verir. Böylece remote'lar, host'un kendi `shared` ayarında bildirdiği bağımlılıkları paylaşır.
2. Diğer tüm shell'lerde sayfadaki her remote'a aynı düz nesneyi verir. Remote'lar bu nesne üzerinden bağımlılıkları birbirleriyle paylaşabilir. Host'un kendi kopyaları buna dahil olmaz.

Kendi yönettiğiniz bir scope'u kullanmak için `shareScope` verin.

### Tipler

```ts
type ShareScope = Record<string, unknown>;

interface FederatedContainer {
  init(shareScope: ShareScope): void | Promise<void>;
  get(module: string): (() => unknown) | Promise<() => unknown>;
}
```

| Tip | Anlamı |
| --- | --- |
| `ShareScope` | Container'ın `init` metoduna verilen nesne. |
| `FederatedContainer` | `remoteEntry.js` dosyasının tanımladığı `{ init, get }` global'i. |
| `RemoteConfig` | `{ name, url, integrity?, scope? }`. |
| `FederatedLoaderConfig` | `createFederatedLoader` için `{ remotes, shareScope? }`. |
| `FederatedEntryOptions` | `federatedEntry` için `{ shareScope? }`. |

## Sınır durumlar

- **Tek seferlik init.** Paket her container nesnesini sayfa başına bir kez başlatır, birden fazla loader ya da entry aynı container'ı kullansa bile. Başarısız bir `init` unutulur, bir sonraki yükleme yeniden dener.
- **Zaman aşımı ve yeniden deneme.** Orchestrator'ın `timeout` süresi dolduğunda iptal edilen `signal`, `remoteEntry.js` beklemesini durdurur ve başka bir yükleme hâlâ beklemiyorsa etiketini kaldırır. Yeniden deneme yeni bir etiket ekler. İptal edilen bir yükleme, iptal sebebiyle reject olur. Diğer yükleme hataları `[Tuvix MF] Failed to load remote entry: <url> (<error>)` şeklindedir.
- **Global bulunamadı.** `remoteEntry.js` yüklendiği halde `window[scope]` üzerinde `init` ve `get` yoksa yükleme `[Tuvix MF] Remote container "<scope>" not found on window after loading <url>` hatasıyla başarısız olur. `scope` değerinin remote'un `name` değeriyle, ya da ayarladıysanız `library.name` değeriyle eşleştiğini kontrol edin.
- **Bilinmeyen modül.** `get` hata fırlatırsa ya da factory dışında bir şey döndürürse `[Tuvix MF] Module "<modulePath>" not found in remote "<remoteName>"` hatası oluşur.
- **Bilinmeyen remote.** `createFederatedEntry`, `createFederatedApp` ve `loadModule`, `[Tuvix MF] Remote "<name>" is not configured. Available: <names>` hatasını fırlatır.
- **CORS.** `remoteEntry.js`, `crossorigin="anonymous"` ile yüklenir. Başka bir origin'deki remote `Access-Control-Allow-Origin` header'ını göndermelidir.
- **Unload ve yeniden mount.** Orchestrator'ın loader'ı, loader fonksiyonu olan entry'ler için hiçbir şey kaldırmaz. Sonraki mount `get(modulePath)` metodunu yeniden çağırır ve webpack önbellekteki modülü döndürür.
- **Prefetch.** `ModuleLoader.prefetch` loader fonksiyonu olan entry'leri atlar. Bu yüzden orchestrator'ın `prefetch` ayarı `remoteEntry.js` dosyasını önceden indirmez.

## Ne yapmaz

- Webpack'i yapılandırmaz. Her remote `ModuleFederationPlugin` eklentisini kendisi ekler.
- Container'ları `window` üzerinden okur. `library: { type: 'module' }` ya da global olmayan başka bir library tipiyle build edilen remote'lar çalışmaz.
- Remote manifest'i okumaz, remote'ları keşfetmez. Her `remoteEntry.js` URL'sini siz listelersiniz.
- Sürüm pazarlığı yapmaz. Bunu her container'ın içindeki webpack runtime'ı share scope üzerinden yapar.

## 0.4 sürümünden geçiş

- `federatedEntry(remote)` önceden `{ scripts: [remote.url] }` döndürüyordu ve loader ardından "no exports found" hatasıyla başarısız oluyordu, çünkü bir container'da yalnızca `init` ve `get` bulunur. Artık dışa açılan modülün path'ini alır ve bir loader fonksiyonu döndürür:

  ```ts
  import { federatedEntry } from '@tuvix.js/module-federation';

  // 0.4: federatedEntry({ name: 'dashboard', url }) returned an EntryConfig
  const entry = federatedEntry({ name: 'dashboard', url: 'https://cdn.example.com/dashboard/remoteEntry.js' }, './App');
  ```

- `createFederatedEntry(remoteName, modulePath)` artık `EntryConfig` yerine `EntryLoader` döndürür. Remote'ları `createFederatedApp` ile önceden yükleyip `entry: { scripts: [] }` kaydeden shell'ler entry olarak `federation.createFederatedEntry('remote1', './App')` verebilir.
- `FederatedLoaderConfig.shared` yerini `shareScope` alanına bıraktı. Paket `shared` alanını hiçbir zaman okumuyordu.
- `loadRemoteContainer` artık `any` yerine `FederatedContainer` döndürür.
- 0.4 sürümünde paket, webpack'in hiçbir zaman tanımlamadığı `window.__webpack_share_scopes__` değerini okuyordu. Bu yüzden her remote kendi boş scope'unu alıyordu. Webpack host artık gerçek `default` scope'unu verir.
- Bu sayfanın 0.4 sürümü `createFederatedLoader()` fonksiyonunu argümansız ve `loader.remote({ url, scope, module })` çağrısını gösteriyordu. İkisi de hiç var olmadı.
