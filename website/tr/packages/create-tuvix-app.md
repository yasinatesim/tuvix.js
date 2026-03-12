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
| `shell` | Mikrofrontend'ler için shell orkestratörü |
| `react-app` | React mikro uygulama |
| `vue-app` | Vue mikro uygulama |
| `vanilla-app` | Vanilla JS/TS mikro uygulama |

## Şablonu Doğrudan Belirtme

```bash
npx create-tuvix-app my-shell --template shell
npx create-tuvix-app my-react --template react-app
npx create-tuvix-app my-vue --template vue-app
npx create-tuvix-app my-vanilla --template vanilla-app
```

## Örnekler

Önceden oluşturulmuş örnek uygulamalar `--example` bayrağı kullanılarak oluşturulabilir:

| Örnek | Açıklama |
|-------|----------|
| `with-react` | React mikrofrontend örneği |
| `with-vue` | Vue mikrofrontend örneği |
| `with-svelte` | Svelte mikrofrontend örneği |
| `with-angular` | Angular mikrofrontend örneği |
| `with-ssr-react` | React ile sunucu tarafı oluşturma |
| `with-react-devtools` | DevTools ile React entegrasyonu |
| `with-react-event-bus` | Event-Bus entegrasyonu örneği |
| `with-react-router` | Router entegrasyonu örneği |
| `with-react-sandbox` | Sandbox/CSS izolasyonu örneği |
| `with-module-federation-react` | React ile Module Federation |
| `with-multiple-frameworks` | Çoklu framework entegrasyonu |

## Örnek Oluşturma

```bash
npx create-tuvix-app my-app --example with-react
npx create-tuvix-app my-app --example with-vue
npx create-tuvix-app my-app --example with-multiple-frameworks
```
