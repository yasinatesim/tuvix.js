# Sandbox

`@tuvix.js/sandbox` mikro uygulamalar arasındaki çatışmaları önlemek için CSS ve JavaScript izolasyonu sağlar.

```ts
orchestrator.register('uygulamam', {
  entry: '/uygulamam.js',
  sandbox: {
    css: true,  // Shadow DOM izolasyonu
    js: true,   // Proxy kapsam izolasyonu
  },
});
```

İngilizce belgeler için → [Sandboxing](/tr/guide/sandbox)
