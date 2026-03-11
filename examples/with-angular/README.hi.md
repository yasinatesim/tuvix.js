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

# with-angular

Demonstrates basic **Angular 15+ integration** using `@tuvix.js/angular`.

A single Angular CLI build outputs two distinct micro apps. They are exported to the global scope as Tuvix.js modules and registered with the shell orchestrator.

## Packages used

| Package | Role |
|---|---|
| `@tuvix.js/core` | Shell orchestrator |
| `@tuvix.js/angular` | `createAngularMicroApp` wrapper |

## Get started

### Via npx (recommended)

```bash
npx create-tuvix-app@latest --example with-angular my-app
cd my-app
npm install
npm run dev
```

### Manual clone

```bash
git clone https://github.com/yasinatesim/tuvix.js.git
cd tuvix.js/examples/with-angular
npm install
npm run dev
```

Open [http://localhost:4200](http://localhost:4200).

## Key concepts

- **`createAngularMicroApp(config)`** - Bootstraps an Angular standalone component or NgModules dynamically into a container.
- **Props mapping** - `@tuvix.js/angular` automatically maps `props` passed from the shell into the Angular component's `@Input()` decorators. Whenever the shell updates a prop, the Angular component receives those changes via the standard lifecycle hooks (e.g., `ngOnChanges`).
