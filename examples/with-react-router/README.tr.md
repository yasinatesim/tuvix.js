<p align="center">
  <a href="./README.md">🇬🇧 English</a> ·
  <a href="./README.tr.md">🇹🇷 Türkçe</a> ·
  <a href="./README.es.md">🇪🇸 Español</a> ·
  <a href="./README.de.md">🇩🇪 Deutsch</a> ·
  <a href="./README.fr.md">🇫🇷 Français</a> ·
  <a href="./README.ja.md">🇯🇵 日本語</a> ·
  <a href="./README.zh.md">🇨🇳 中文</a> ·
  <a href="./README.it.md">🇮🇹 Italiano</a> ·
  <a href="./README.pt.md">🇧🇷 Português</a> ·
  <a href="./README.hi.md">🇮🇳 हिंदी</a>
</p>

# with-react-router

`@tuvix.js/router` ile desteklenen **URL tabanlı mikro uygulama yönlendirmesini** gösterir. Dashboard, Profile ve Settings olmak üzere üç bağımsız React mikro uygulaması belirli rotalara kaydedilir ve kullanıcı gezindikçe otomatik olarak monte edilir/sökülür.

## Kullanılan paketler

| Paket | Rol |
|---|---|
| `@tuvix.js/core` | Kabuk orkestratörü (router motorunu içerir) |
| `@tuvix.js/router` | History/hash modu yönlendirme |
| `@tuvix.js/react` | `createReactMicroApp` fabrikası |

## İçindekiler

```
with-react-router/
├── index.html          ← aktif-link vurgulu gezinme çubuğu
├── vite.config.ts
├── src/
│   ├── shell.ts        ← 3 rotayı kaydeder, aktif nav sınıfını senkronize eder
│   └── apps/
│       ├── dashboard/  ← /dashboard'da aktif
│       ├── profile/    ← /profile'da aktif
│       └── settings/   ← /settings'de aktif
```

## Başlangıç

### npx ile (önerilen)

```bash
npx create-tuvix-app@latest --example with-react-router benim-uygulamam
cd benim-uygulamam
npm install
npm run dev
```

### Manuel klonlama

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-router
npm install
npm run dev
```

[http://localhost:5173/dashboard](http://localhost:5173/dashboard) adresini açın ve gezinme bağlantılarını kullanın.

## Temel kavramlar

- **Rota eşleştirme** — her `activeWhen` deseni `window.location.pathname` ile karşılaştırılır. Glob desenleri (`/dashboard/*`) mikro uygulamaların kendi alt rotalarını kontrol etmesine olanak tanır.
- **History modu** — `#` olmadan temiz URL'ler için HTML5 History API'sini kullanır.
- **Sıfır paket tekrarı** — herhangi bir anda yalnızca aktif mikro uygulamanın kodu çalışır.
