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

Two Angular 16 standalone components mounted side by side by one Tuvix.js shell, with no zone.js on the page.

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
pnpm install
pnpm dev
```

Open [http://localhost:4200](http://localhost:4200).

## What's inside

```text
with-angular/
├── angular.json          ← "polyfills": [] (no zone.js)
└── src/
    ├── main.ts           ← shell: registers both apps with loader-function entries
    ├── apps/
    │   ├── home.ts       ← createAngularMicroApp({ name: 'home', component: HomeApp })
    │   └── profile.ts
    └── app/
        ├── home.component.ts     ← standalone, @Input() name, click counter
        └── profile.component.ts  ← standalone, @Input() theme
```

## Key concepts

- **`createAngularMicroApp({ name, component })`** bootstraps the component into its own host element inside the container. Pass `module` as well when the component is declared in an NgModule.
- **Inputs:** the shell's `props` are set with `setInput` before the first change detection, so `ngOnInit` already sees `name` and `theme`.
- **Zoneless:** the adapter never loads zone.js. Angular 16 has no zoneless scheduler, so `HomeApp` calls `ChangeDetectorRef.detectChanges()` after its click. Angular 18 and later schedule change detection for you.
- **Code splitting:** each `entry` is `() => import('./apps/home')`, so the Angular CLI emits one lazy chunk per app.
- **Monorepo note:** `tsconfig.json` maps `@angular/*` and `rxjs` to this example's `node_modules`. Inside the pnpm workspace, `@tuvix.js/angular` is a symlink and would otherwise resolve its own copy of `@angular/core`, which fails with `NG0203`. A project that installs `@tuvix.js/angular` from npm does not need the mapping.
