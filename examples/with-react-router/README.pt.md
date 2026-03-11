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

Demonstra o **roteamento de micro apps baseado em URL** com `@tuvix.js/router`. Três micro apps React independentes - Dashboard, Profile e Settings - são registradas em rotas específicas e montadas/desmontadas automaticamente conforme o usuário navega.

## Pacotes utilizados

| Pacote | Papel |
|---|---|
| `@tuvix.js/core` | Shell Orchestrator (inclui motor de roteamento) |
| `@tuvix.js/router` | Roteamento em modo history/hash |
| `@tuvix.js/react` | Fábrica `createReactMicroApp` |

## Conteúdo

```
with-react-router/
├── index.html          ← barra de navegação com destaque de link ativo
├── vite.config.ts
├── src/
│   ├── shell.ts        ← registra 3 rotas, sincroniza classe nav ativa
│   └── apps/
│       ├── dashboard/  ← ativo em /dashboard
│       ├── profile/    ← ativo em /profile
│       └── settings/   ← ativo em /settings
```

## Como começar

### Via npx (recomendado)

```bash
npx create-tuvix-app@latest --example with-react-router meu-app
cd meu-app
npm install
npm run dev
```

### Clonagem manual

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-router
npm install
npm run dev
```

Abra [http://localhost:5173/dashboard](http://localhost:5173/dashboard) e use os links de navegação.

## Conceitos-chave

- **Correspondência de rotas** - cada padrão `activeWhen` é comparado com `window.location.pathname`. Padrões glob (`/dashboard/*`) permitem que micro apps controlem suas próprias sub-rotas.
- **Modo history** - usa a API History do HTML5 para URLs limpas sem `#`.
- **Zero duplicação de bundle** - a qualquer momento, apenas o código da micro app ativa é executado.
