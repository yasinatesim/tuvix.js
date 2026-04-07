# Sandbox

`@tuvix.js/sandbox` mikro uygulamalar arasındaki çatışmaları önlemek için CSS ve JavaScript izolasyonu sağlar.

## CSS İzolasyonu (Shadow DOM)

CSS sandboxing etkinleştirildiğinde, mikro uygulamanın konteyneri Shadow DOM ana bilgisayarına yükseltilir.

```ts
orchestrator.register('uygulamam', {
  entry: '/uygulamam.js',
  sandbox: { css: true },
});
```

## JS İzolasyonu (Proxy Kapsamı)

JS sandboxing etkinleştirildiğinde, mikro uygulamanın global kapsamı bir `Proxy` ile sarılır. `window.*` erişimi, olay dinleyicileri, aralıklar ve zaman aşımları `unmount` sırasında otomatik olarak temizlenir.

```ts
orchestrator.register('uygulamam', {
  entry: '/uygulamam.js',
  sandbox: { js: true },
});
```

## İkisini Birlikte Kullanma

```ts
orchestrator.register('uygulamam', {
  entry: '/uygulamam.js',
  sandbox: {
    css: true,   // Shadow DOM izolasyonu
    js: true,    // Proxy kapsam izolasyonu
  },
});
```

## Özel Sandbox

`@tuvix.js/sandbox` doğrudan da kullanabilirsiniz:

```ts
import { createSandbox } from '@tuvix.js/sandbox';

const sandbox = createSandbox({ css: true, js: true });

// Activate isolation
const shadowRoot = sandbox.activate(rootElement);

// ... app runs in isolation ...

// Deactivate when done
sandbox.deactivate(rootElement);
```
