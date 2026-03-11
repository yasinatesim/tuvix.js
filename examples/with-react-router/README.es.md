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

Demuestra el **enrutamiento de micro apps basado en URL** impulsado por `@tuvix.js/router`. Tres micro apps React independientes - Dashboard, Profile y Settings - se registran en rutas específicas y se montan/desmontan automáticamente mientras el usuario navega.

## Paquetes utilizados

| Paquete | Rol |
|---|---|
| `@tuvix.js/core` | Orquestador shell (incluye motor de enrutamiento) |
| `@tuvix.js/router` | Enrutamiento en modo history/hash |
| `@tuvix.js/react` | Fábrica `createReactMicroApp` |

## Contenido

```
with-react-router/
├── index.html          ← barra de navegación con resaltado de enlace activo
├── vite.config.ts
├── src/
│   ├── shell.ts        ← registra 3 rutas, sincroniza clase de nav activa
│   └── apps/
│       ├── dashboard/  ← activo en /dashboard
│       ├── profile/    ← activo en /profile
│       └── settings/   ← activo en /settings
```

## Primeros pasos

### Mediante npx (recomendado)

```bash
npx create-tuvix-app@latest --example with-react-router mi-app
cd mi-app
npm install
npm run dev
```

### Clonación manual

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-react-router
npm install
npm run dev
```

Abre [http://localhost:5173/dashboard](http://localhost:5173/dashboard) y usa los enlaces de navegación.

## Conceptos clave

- **Coincidencia de rutas** - cada patrón `activeWhen` se compara con `window.location.pathname`. Los patrones glob (`/dashboard/*`) permiten que las micro apps controlen sus propias sub-rutas.
- **Modo history** - utiliza la API History de HTML5 para URLs limpias sin `#`.
- **Cero duplicación de bundles** - en cualquier momento solo se ejecuta el código de la micro app activa.
