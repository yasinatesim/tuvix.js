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
  badge: Microfrontend in TypeScript · MIT
  title: Tante app.
  accent: Un'unica esperienza.
  tagline: Tuvix.js monta micro app React, Vue, Svelte, Angular e vanilla JS in un'unica pagina host. Routing, event bus, sandboxing e rendering lato server sono pacchetti separati che aggiungi quando ti servono.
  image:
    src: /logo.svg
    alt: Logo di Tuvix.js
  actions:
    - theme: brand
      text: Per iniziare
      link: /it/guide/getting-started
    - theme: alt
      text: Prova il Playground
      link: /playground
  install:
    command: npx create-tuvix-app
    copyLabel: Copia il comando
    copiedLabel: Copiato

showcase:
  file: src/orchestrator.ts
  copyLabel: Copia
  copiedLabel: Copiato
  shellTitle: Shell host
  routeLabel: URL
  mountedLabel: montata
  busLabel: Event bus condiviso

featuresSection:
  title: Cosa include Tuvix.js
  lead: Otto blocchi. Installa il pacchetto ombrello tuvix.js per avere i cinque principali, oppure aggiungi singoli pacchetti man mano che la shell cresce.

features:
  - icon: layers
    title: Indipendente dal framework
    details: Esegui micro app React, Vue, Svelte, Angular e vanilla JS fianco a fianco in un'unica shell.
    link: /it/guide/micro-apps
    linkText: Guida alle micro app
  - icon: box
    title: Nessuna dipendenza runtime di terze parti
    details: Ogni pacchetto dipende solo da altri pacchetti @tuvix.js. Installi quelli che importi.
    link: /it/packages/
    linkText: Tutti i pacchetti
  - icon: route
    title: Routing integrato
    details: Il router monta e smonta le app quando cambia l'URL, in modalità history o hash.
    link: /it/guide/routing
    linkText: '@tuvix.js/router'
  - icon: broadcast
    title: Event bus
    details: Le app pubblicano eventi tipizzati e si iscrivono a essi senza condividere variabili globali.
    link: /it/guide/event-bus
    linkText: '@tuvix.js/event-bus'
  - icon: shield
    title: Sandbox CSS e JS
    details: Lo shadow DOM tiene gli stili di ogni app dentro il suo container. JsSandbox esegue uno script su una window Proxy che puoi buttare via.
    link: /it/guide/sandbox
    linkText: '@tuvix.js/sandbox'
  - icon: bolt
    title: Caricamento dinamico
    details: Il loader scarica i bundle delle app su richiesta, li mette in cache e ripete i caricamenti falliti.
    link: /it/packages/loader
    linkText: '@tuvix.js/loader'
  - icon: terminal
    title: DevTools
    details: Un pannello nella pagina elenca le app registrate, la route attiva e il traffico dell'event bus.
    link: /it/packages/devtools
    linkText: '@tuvix.js/devtools'
  - icon: server
    title: Rendering lato server
    details: Esegui il rendering delle micro app sul server e inserisci il loro HTML nel template della shell, come stringa o come stream.
    link: /it/packages/server
    linkText: '@tuvix.js/server'

frameworks:
  eyebrow: Adapter
  title: Scegli il tuo framework
  lead: Ogni adapter trasforma un componente in una micro app che l'orchestratore può montare, aggiornare e smontare.
  copyLabel: Copia il comando di installazione
  copiedLabel: Copiato
  items:
    - name: React
      details: createReactMicroApp avvolge un componente. useTuvixProps e useTuvixBus leggono props ed eventi.
      install: npm i @tuvix.js/react
      link: /it/guide/react
    - name: Vue
      details: createVueMicroApp monta un'app Vue 3, con composable per le props e l'event bus.
      install: npm i @tuvix.js/vue
      link: /it/guide/vue
    - name: Svelte
      details: createSvelteMicroApp monta componenti Svelte 3, 4 e 5.
      install: npm i @tuvix.js/svelte
      link: /it/guide/svelte
    - name: Angular
      details: createAngularMicroApp esegue il bootstrap di un componente Angular 15+ nel suo container.
      install: npm i @tuvix.js/angular
      link: /it/guide/angular
    - name: Vanilla JS
      mark: JS
      color: vanilla
      details: defineMicroApp fornisce hook mount, unmount e update in JavaScript puro.
      install: npm i @tuvix.js/core
      link: /it/guide/micro-apps

packages:
  eyebrow: Pacchetti
  title: 15 pacchetti, ognuno con la sua versione
  lead: Parti dal pacchetto ombrello. Passa ai singoli pacchetti quando vuoi un'installazione più leggera.
  items:
    - name: tuvix.js
      details: Pacchetto ombrello con core, router, event bus, loader e sandbox.
      link: /it/packages/tuvix
    - name: '@tuvix.js/core'
      details: L'orchestratore. Registra le micro app ed esegue il loro ciclo di vita.
      link: /it/packages/core
    - name: '@tuvix.js/router'
      details: Attiva le micro app in base all'URL, in modalità history o hash.
      link: /it/packages/router
    - name: '@tuvix.js/event-bus'
      details: Publish/subscribe tipizzato tra micro app.
      link: /it/packages/event-bus
    - name: '@tuvix.js/loader'
      details: Carica i bundle delle app su richiesta, con cache e nuovi tentativi.
      link: /it/packages/loader
    - name: '@tuvix.js/sandbox'
      details: Isolamento CSS tramite Shadow DOM, isolamento JS tramite Proxy.
      link: /it/packages/sandbox
    - name: '@tuvix.js/server'
      details: Composizione lato server e streaming per la pagina host.
      link: /it/packages/server
    - name: '@tuvix.js/module-federation'
      details: Carica micro app dai remote di Webpack Module Federation.
      link: /it/packages/module-federation
    - name: '@tuvix.js/devtools'
      details: Pannello di debug nella pagina per app, route ed eventi.
      link: /it/packages/devtools
    - name: '@tuvix.js/react'
      details: Adapter React, hook e helper per il rendering lato server.
      link: /it/packages/react
    - name: '@tuvix.js/vue'
      details: Adapter Vue 3, composable e helper per il rendering lato server.
      link: /it/packages/vue
    - name: '@tuvix.js/svelte'
      details: Adapter Svelte con supporto al rendering lato server.
      link: /it/packages/svelte
    - name: '@tuvix.js/angular'
      details: Adapter Angular con supporto al rendering lato server.
      link: /it/packages/angular
    - name: '@tuvix.js/vite'
      details: Plugin Vite che inserisce il CSS delle island e i link modulepreload nell'head SSR, così le micro app renderizzate sul server hanno già gli stili al primo paint.
      link: /it/packages/vite
    - name: create-tuvix-app
      details: Genera da riga di comando un nuovo progetto con host e micro app.
      link: /it/packages/create-tuvix-app

footer:
  tagline: Orchestratore di microfrontend per React, Vue, Svelte, Angular e vanilla JS.
  columns:
    - title: Documentazione
      links:
        - text: Per iniziare
          link: /it/guide/getting-started
        - text: Architettura
          link: /it/guide/architecture
        - text: Configurazione
          link: /it/guide/configuration
        - text: Playground
          link: /playground
    - title: Pacchetti
      links:
        - text: Core
          link: /it/packages/core
        - text: Router
          link: /it/packages/router
        - text: Event bus
          link: /it/packages/event-bus
        - text: Tutti i pacchetti
          link: /it/packages/
    - title: Progetto
      links:
        - text: GitHub
          link: https://github.com/yasinatesim/tuvix.js
        - text: npm
          link: https://www.npmjs.com/org/tuvix.js
        - text: Release
          link: https://github.com/yasinatesim/tuvix.js/releases
        - text: Contribuire
          link: /it/contributing
  copyright: Licenza MIT · © 2026 Yasin ATEŞ
---
