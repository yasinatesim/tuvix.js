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

Un shell de micro-frontend completo construido con **React 18** y **Vite**, que demuestra cómo el orquestador de Tuvix.js carga, monta y desmonta micro aplicaciones React independientes.

## Paquetes utilizados

| Paquete | Rol |
|---|---|
| `@tuvix.js/core` | Orquestador de shell |
| `@tuvix.js/react` | Fábrica `createReactMicroApp` |
| `@tuvix.js/event-bus` | Bus de eventos compartido |

## Cómo empezar

### Via npx (recomendado)

```bash
npx create-tuvix-app@latest --example with-react mi-app
cd mi-app
npm install
npm run dev
```

### Clonar manualmente

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react
npm install
npm run dev
```

Abre [http://localhost:5173/home](http://localhost:5173/home).

## Conceptos clave

- **`createReactMicroApp`** — Envuelve un componente React en un módulo compatible con Tuvix.js con hooks de `bootstrap`, `mount`, `unmount` y `update`.
- **Paso de props** — El shell pasa props `{ theme, user }` a la app `home`; el componente los recibe como props estándar de React.
- **Ciclo de vida** — Cada app solo se monta cuando su ruta está activa y se desmonta limpiamente al navegar.
