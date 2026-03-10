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

Um shell micro-frontend completo construído com **React 18** e **Vite**, demonstrando como o orquestrador Tuvix.js carrega, monta e desmonta micro-apps React independentes.

## Pacotes utilizados

| Pacote | Papel |
|---|---|
| `@tuvix.js/core` | Orquestrador shell |
| `@tuvix.js/react` | Factory `createReactMicroApp` |
| `@tuvix.js/event-bus` | Bus de eventos compartilhado |

## Como começar

### Via npx (recomendado)

```bash
npx create-tuvix-app@latest --example with-react meu-app
cd meu-app
npm install
npm run dev
```

### Clone manual

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react
npm install
npm run dev
```

Abra [http://localhost:5173/home](http://localhost:5173/home).

## Conceitos principais

- **`createReactMicroApp`** — Envolve um componente React em um módulo compatível com Tuvix.js com hooks `bootstrap`, `mount`, `unmount` e `update`.
- **Passagem de props** — O shell passa props `{ theme, user }` para o app `home`.
- **Ciclo de vida** — Cada app só é montada quando sua rota está ativa.
