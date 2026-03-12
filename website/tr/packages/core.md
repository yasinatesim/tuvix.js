---
title: '@tuvix.js/core'
---

<PackageHeader
  name="@tuvix.js/core"
  title="Çekirdek Orkestratör"
  description="Tuvix.js'in kalbi. Mikro uygulamaları kaydeder, yaşam döngülerini yönetir (mount, unmount, update) ve yönlendirme ile sandbox'ı koordine eder."
  icon="⚙️"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/core
```

## Hızlı Başlangıç

```ts
import { createOrchestrator } from '@tuvix.js/core';

const orchestrator = createOrchestrator({ container: '#app' });

orchestrator.register('home', {
  entry: 'https://cdn.example.com/home.js',
});

orchestrator.register('dashboard', {
  entry: 'https://cdn.example.com/dashboard.js',
  props: { apiUrl: 'https://api.example.com' },
  sandbox: { css: true },
});

orchestrator.start();
```

## API

### `createOrchestrator(options)`

Ana orkestratör örneğini oluşturur.

```ts
interface OrchestratorOptions {
  container: string | HTMLElement;
  onBeforeMount?: (app: RegisteredApp) => void | Promise<void>;
  onAfterMount?: (app: RegisteredApp) => void | Promise<void>;
  onError?: (error: Error, app: RegisteredApp) => void;
}
```

### `orchestrator.register(name, options)`

Bir mikro uygulama kaydeder.

```ts
interface AppOptions {
  entry: string | (() => Promise<string>);
  props?: Record<string, unknown>;
  container?: string | HTMLElement;
  sandbox?: { css?: boolean; js?: boolean };
}
```

### `orchestrator.mount(name, props?)`

Bir mikro uygulamayı manuel olarak mount eder.

```ts
await orchestrator.mount('dashboard', { userId: '42' });
```

### `orchestrator.unmount(name)`

Bir mikro uygulamayı manuel olarak unmount eder.

### `orchestrator.update(name, props)`

Mount edilmiş bir mikro uygulamanın prop'larını günceller.

### `orchestrator.start()`

Orkestratörü başlatır. Kayıtlı bir router varsa onunla entegre olur.

### `orchestrator.stop()`

Orkestratörü durdurur. Tüm aktif mikro uygulamaları unmount eder ve temizler.

## MicroApp Arayüzü

Mikro uygulama bundle'ınız bu arayüzü uygulayan bir nesne dışa aktarmalıdır:

```ts
interface MicroApp {
  mount(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
  unmount(container: HTMLElement): Promise<void>;
  update?(container: HTMLElement, props?: Record<string, unknown>): Promise<void>;
}
```

## TypeScript

```ts
import type { MicroApp, RegisteredApp, OrchestratorOptions } from '@tuvix.js/core';
```
