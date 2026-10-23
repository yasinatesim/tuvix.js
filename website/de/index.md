---
layout: home

# Every visible string on the home page comes from this frontmatter, so a
# locale only needs a translated copy of this file. Field reference:
# website/.vitepress/theme/components/home/model.ts

# The Orbit sections replace the markdown body on this page, so the body
# stays empty. Keep the flag: without it OrbitHome renders an empty, bordered
# content block above the footer.
markdownContent: false

hero:
  name: Tuvix.js
  title: Viele Apps.
  accent: Ein Erlebnis.
  tagline: Tuvix.js mountet Micro Apps in React, Vue, Svelte, Angular und Vanilla JS in eine Host-Seite. Routing, ein Event Bus, Sandboxing und Server-Rendering kommen als separate Pakete, die du hinzufügst, wenn du sie brauchst.
  image:
    src: /logo.svg
    alt: Tuvix.js-Logo
  actions:
    - theme: brand
      text: Erste Schritte
      link: /de/guide/getting-started
    - theme: alt
      text: Playground ausprobieren
      link: /playground
  install:
    command: npx create-tuvix-app
    copyLabel: Befehl kopieren
    copiedLabel: Kopiert

showcase:
  file: src/orchestrator.ts
  copyLabel: Kopieren
  copiedLabel: Kopiert
  shellTitle: Host-Shell
  routeLabel: URL
  mountedLabel: gemountet
  busLabel: Gemeinsamer Event Bus

featuresSection:
  title: Was Tuvix.js mitbringt
  lead: Acht Bausteine. Installiere das Gesamtpaket tuvix.js, um die fünf Kernpakete zu bekommen, oder füge einzelne Pakete hinzu, wenn deine Shell wächst.

features:
  - icon: layers
    title: Framework-agnostisch
    details: Betreibe Micro Apps in React, Vue, Svelte, Angular und Vanilla JS nebeneinander in einer Shell.
    link: /de/guide/micro-apps
    linkText: Anleitung zu Micro Apps
  - icon: box
    title: Keine Laufzeitabhängigkeiten von Drittanbietern
    details: Jedes Paket hängt nur von anderen @tuvix.js-Paketen ab. Du installierst die, die du importierst.
    link: /de/packages/
    linkText: Alle Pakete
  - icon: route
    title: Eingebautes Routing
    details: Der Router mountet und unmountet Apps, wenn sich die URL ändert, im History- oder Hash-Modus.
    link: /de/guide/routing
    linkText: '@tuvix.js/router'
  - icon: broadcast
    title: Event Bus
    details: Apps veröffentlichen und abonnieren typisierte Events, ohne Globals zu teilen.
    link: /de/guide/event-bus
    linkText: '@tuvix.js/event-bus'
  - icon: shield
    title: CSS- und JS-Sandbox
    details: Shadow DOM hält die Styles jeder App in ihrem Container. JsSandbox führt ein Skript gegen ein Proxy-Window aus, das du danach verwerfen kannst.
    link: /de/guide/sandbox
    linkText: '@tuvix.js/sandbox'
  - icon: bolt
    title: Dynamisches Laden
    details: Der Loader lädt App-Bundles bei Bedarf, speichert sie im Cache und wiederholt fehlgeschlagene Ladevorgänge.
    link: /de/packages/loader
    linkText: '@tuvix.js/loader'
  - icon: terminal
    title: DevTools
    details: Ein Panel direkt in der Seite zeigt registrierte Apps, die aktive Route und den Verkehr auf dem Event Bus.
    link: /de/packages/devtools
    linkText: '@tuvix.js/devtools'
  - icon: server
    title: Server-Rendering
    details: Rendere Micro Apps auf dem Server und füge ihr HTML in das Shell-Template ein, als String oder als Stream.
    link: /de/packages/server
    linkText: '@tuvix.js/server'

frameworks:
  title: Wähle dein Framework
  lead: Jeder Adapter macht aus einer Komponente eine Micro App, die der Orchestrator mounten, aktualisieren und unmounten kann.
  copyLabel: Installationsbefehl kopieren
  copiedLabel: Kopiert
  items:
    - name: React
      icon: react
      details: createReactMicroApp kapselt eine Komponente. useTuvixProps und useTuvixBus lesen Props und Events.
      install: npm i @tuvix.js/react
      link: /de/guide/react
    - name: Vue
      icon: vue
      details: createVueMicroApp mountet eine Vue-3-App, mit Composables für Props und den Event Bus.
      install: npm i @tuvix.js/vue
      link: /de/guide/vue
    - name: Svelte
      icon: svelte
      details: createSvelteMicroApp mountet Komponenten aus Svelte 3, 4 und 5.
      install: npm i @tuvix.js/svelte
      link: /de/guide/svelte
    - name: Angular
      icon: angular
      details: createAngularMicroApp bootstrappt eine Komponente ab Angular 15 in ihren Container.
      install: npm i @tuvix.js/angular
      link: /de/guide/angular
    - name: Vanilla JS
      icon: javascript
      details: defineMicroApp gibt reinem JavaScript die Hooks mount, unmount und update.
      install: npm i @tuvix.js/core
      link: /de/guide/micro-apps

packages:
  title: 15 Pakete, jedes mit eigener Version
  lead: Starte mit dem Gesamtpaket. Wechsle zu einzelnen Paketen, wenn du eine kleinere Installation willst.
  items:
    - name: tuvix.js
      details: Gesamtpaket mit Core, Router, Event Bus, Loader und Sandbox.
      link: /de/packages/tuvix
    - name: '@tuvix.js/core'
      details: Der Orchestrator. Registriert Micro Apps und führt ihre Lifecycles aus.
      link: /de/packages/core
    - name: '@tuvix.js/router'
      details: Aktiviert Micro Apps anhand der URL, im History- oder Hash-Modus.
      link: /de/packages/router
    - name: '@tuvix.js/event-bus'
      details: Typisiertes Publish/Subscribe zwischen Micro Apps.
      link: /de/packages/event-bus
    - name: '@tuvix.js/loader'
      details: Lädt App-Bundles bei Bedarf, mit Caching und Wiederholungsversuchen.
      link: /de/packages/loader
    - name: '@tuvix.js/sandbox'
      details: CSS-Isolation über Shadow DOM, JS-Isolation über Proxy.
      link: /de/packages/sandbox
    - name: '@tuvix.js/server'
      details: Serverseitige Komposition und Streaming für die Host-Seite.
      link: /de/packages/server
    - name: '@tuvix.js/module-federation'
      details: Lädt Micro Apps aus Remotes von Webpack Module Federation.
      link: /de/packages/module-federation
    - name: '@tuvix.js/devtools'
      details: Debug-Panel direkt in der Seite für Apps, Routen und Events.
      link: /de/packages/devtools
    - name: '@tuvix.js/react'
      details: React-Adapter, Hooks und Helfer für Server-Rendering.
      link: /de/packages/react
    - name: '@tuvix.js/vue'
      details: Vue-3-Adapter, Composables und Helfer für Server-Rendering.
      link: /de/packages/vue
    - name: '@tuvix.js/svelte'
      details: Svelte-Adapter mit Unterstützung für Server-Rendering.
      link: /de/packages/svelte
    - name: '@tuvix.js/angular'
      details: Angular-Adapter mit Unterstützung für Server-Rendering.
      link: /de/packages/angular
    - name: '@tuvix.js/vite'
      details: Vite-Plugin, das Island-CSS und modulepreload-Links in den SSR-Head schreibt, damit serverseitig gerenderte Micro Apps schon beim ersten Paint gestylt sind.
      link: /de/packages/vite
    - name: create-tuvix-app
      details: Erstellt über die Kommandozeile ein neues Projekt mit Host und Micro App.
      link: /de/packages/create-tuvix-app

footer:
  tagline: Microfrontend-Orchestrator für React, Vue, Svelte, Angular und Vanilla JS.
  columns:
    - title: Doku
      links:
        - text: Erste Schritte
          link: /de/guide/getting-started
        - text: Architektur
          link: /de/guide/architecture
        - text: Konfiguration
          link: /de/guide/configuration
        - text: Playground
          link: /playground
    - title: Pakete
      links:
        - text: Core
          link: /de/packages/core
        - text: Router
          link: /de/packages/router
        - text: Event Bus
          link: /de/packages/event-bus
        - text: Alle Pakete
          link: /de/packages/
    - title: Projekt
      links:
        - text: GitHub
          link: https://github.com/yasinatesim/tuvix.js
        - text: npm
          link: https://www.npmjs.com/org/tuvix.js
        - text: Releases
          link: https://github.com/yasinatesim/tuvix.js/releases
        - text: Mitwirken
          link: /de/contributing
  copyright: MIT-Lizenz · © 2026 Yasin ATEŞ
---
