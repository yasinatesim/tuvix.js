---
title: '@tuvix.js/sandbox'
---

<PackageHeader
  name="@tuvix.js/sandbox"
  title="Sandbox"
  description="Shadow DOM ile CSS izolasyonu ve Proxy kapsamı ile JS izolasyonu. Mikro uygulamalar arasında stil sızıntısını ve global kapsam kirliliğini önler."
  icon="🔒"
  npm="true"
/>

## Kurulum

```bash
npm install @tuvix.js/sandbox
```

## Orkestratör ile Kullanım

```ts
orchestrator.register('my-app', {
  entry: '/my-app.js',
  sandbox: {
    css: true,
    js: true,
  },
});
```

## Doğrudan Kullanım

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });
const { container, cleanup } = sandbox.mount(document.getElementById('root')!);

myApp.mount(container);
cleanup();
```

## API

### `createSandbox(options)`

```ts
interface SandboxOptions {
  css?: boolean;
  js?: boolean;
}
```

### `sandbox.mount(element) → { container, cleanup }`

Verilen element için izole bir kapsam oluşturur.

### CSS İzolasyon Detayları

`css: true` olduğunda hedef element bir Shadow DOM host'u olur ve tüm stiller shadow root'a kapsamlanır.

### JS İzolasyon Detayları

`js: true` olduğunda `window.*` atamaları, `addEventListener` çağrıları, `setTimeout` / `setInterval` ve stil/script enjeksiyonu yakalanır ve `cleanup()` ile temizlenir.
