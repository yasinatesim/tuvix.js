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

# with-react

React 18 ve Vite ile oluşturulmuş, Tuvix.js orkestratörünün bağımsız React mikro uygulamalarını nasıl yüklediğini, monte ettiğini ve söktüğünü gösteren eksiksiz bir mikro-frontend kabuğu.

## Kullanılan paketler

| Paket | Rol |
|---|---|
| `@tuvix.js/core` | Kabuk orkestratörü |
| `@tuvix.js/react` | `createReactMicroApp` fabrikası |
| `@tuvix.js/event-bus` | Paylaşılan olay veri yolu |

## Başlangıç

### npx ile (önerilen)

```bash
npx create-tuvix-app@latest --example with-react benim-uygulamam
cd benim-uygulamam
npm install
npm run dev
```

### Manuel klonlama

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react
npm install
npm run dev
```

[http://localhost:5173/home](http://localhost:5173/home) adresini açın.

## Temel kavramlar

- **`createReactMicroApp`** — Bir React bileşenini `bootstrap`, `mount`, `unmount` ve `update` kancalarına sahip Tuvix.js uyumlu bir modüle sarar.
- **Prop aktarımı** — Kabuk, `home` uygulamasına `{ theme, user }` proplarını iletir; bileşen bunları standart React propları olarak alır.
- **Yaşam döngüsü** — Her uygulama yalnızca rotası aktif olduğunda monte edilir ve navigasyondan ayrılırken temiz şekilde sökülür.
