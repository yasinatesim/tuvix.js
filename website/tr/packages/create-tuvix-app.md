---
title: 'create-tuvix-app'
---

<PackageHeader
  name="create-tuvix-app"
  title="create-tuvix-app"
  description="CLI iskele aracı. Tercih ettiğiniz framework ve araçlarla anında bir Tuvix.js projesi oluşturun."
  icon="🚀"
  github="create-tuvix-app"
/>

## Kullanım

```bash
npx create-tuvix-app my-app
```

Veya belirli bir paket yöneticisi ile:

```bash
pnpm create tuvix-app my-app
yarn create tuvix-app my-app
```

## Etkileşimli İstemler

CLI, proje kurulumu boyunca size rehberlik eder.

## Şablonlar

| Şablon | Açıklama |
|--------|----------|
| `shell-react` | React host ile shell uygulama |
| `shell-vue` | Vue host ile shell uygulama |
| `micro-react` | React mikro uygulama |
| `micro-vue` | Vue mikro uygulama |
| `micro-svelte` | Svelte mikro uygulama |
| `micro-angular` | Angular mikro uygulama |
| `micro-vanilla` | Vanilla JS/TS mikro uygulama |
| `monorepo` | Shell + 2 mikro uygulama ile tam monorepo |

## Doğrudan Şablon Belirtme

```bash
npx create-tuvix-app my-app --template monorepo
```
