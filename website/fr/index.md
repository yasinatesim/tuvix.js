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
  title: Plusieurs apps.
  accent: Une seule expérience.
  tagline: Tuvix.js monte des micro apps React, Vue, Svelte, Angular et JavaScript vanilla dans une seule page hôte. Le routage, un event bus, l'isolation et le rendu côté serveur sont des paquets séparés, que vous ajoutez quand vous en avez besoin.
  image:
    src: /logo.svg
    alt: Logo de Tuvix.js
  actions:
    - theme: brand
      text: Démarrage rapide
      link: /fr/guide/getting-started
    - theme: alt
      text: Essayer le Playground
      link: /playground
  install:
    command: npx create-tuvix-app
    copyLabel: Copier la commande
    copiedLabel: Copié

showcase:
  file: src/orchestrator.ts
  copyLabel: Copier
  copiedLabel: Copié
  shellTitle: Shell hôte
  routeLabel: URL
  mountedLabel: montée
  busLabel: Event bus partagé

featuresSection:
  title: Ce que contient Tuvix.js
  lead: Huit briques de base. Installez le paquet tout-en-un tuvix.js pour obtenir les cinq paquets principaux, ou ajoutez des paquets individuels à mesure que votre shell grandit.

features:
  - icon: layers
    title: Agnostique au framework
    details: Exécutez des micro apps React, Vue, Svelte, Angular et JavaScript vanilla côte à côte dans un même shell.
    link: /fr/guide/micro-apps
    linkText: Guide des micro apps
  - icon: box
    title: Aucune dépendance runtime tierce
    details: Chaque paquet ne dépend que d'autres paquets @tuvix.js. Vous installez ceux que vous importez.
    link: /fr/packages/
    linkText: Tous les paquets
  - icon: route
    title: Routage intégré
    details: Le routeur monte et démonte les apps quand l'URL change, en mode history ou hash.
    link: /fr/guide/routing
    linkText: '@tuvix.js/router'
  - icon: broadcast
    title: Event bus
    details: Les apps publient des événements typés et s'y abonnent sans partager de variables globales.
    link: /fr/guide/event-bus
    linkText: '@tuvix.js/event-bus'
  - icon: shield
    title: Sandbox CSS et JS
    details: Le shadow DOM garde les styles de chaque app dans son conteneur. JsSandbox exécute un script sur une window Proxy que vous pouvez jeter.
    link: /fr/guide/sandbox
    linkText: '@tuvix.js/sandbox'
  - icon: bolt
    title: Chargement dynamique
    details: Le loader récupère les bundles des apps à la demande, les met en cache et relance les chargements qui échouent.
    link: /fr/packages/loader
    linkText: '@tuvix.js/loader'
  - icon: terminal
    title: DevTools
    details: Un panneau intégré à la page liste les apps enregistrées, la route active et le trafic de l'event bus.
    link: /fr/packages/devtools
    linkText: '@tuvix.js/devtools'
  - icon: server
    title: Rendu côté serveur
    details: Rendez les micro apps côté serveur et assemblez leur HTML dans le template du shell, sous forme de chaîne ou de flux.
    link: /fr/packages/server
    linkText: '@tuvix.js/server'

frameworks:
  title: Choisissez votre framework
  lead: Chaque adaptateur transforme un composant en micro app que l'orchestrateur peut monter, mettre à jour et démonter.
  copyLabel: Copier la commande d'installation
  copiedLabel: Copié
  items:
    - name: React
      icon: react
      details: createReactMicroApp enveloppe un composant. useTuvixProps et useTuvixBus lisent les props et les événements.
      install: npm i @tuvix.js/react
      link: /fr/guide/react
    - name: Vue
      icon: vue
      details: createVueMicroApp monte une app Vue 3, avec des composables pour les props et l'event bus.
      install: npm i @tuvix.js/vue
      link: /fr/guide/vue
    - name: Svelte
      icon: svelte
      details: createSvelteMicroApp monte des composants Svelte 3, 4 et 5.
      install: npm i @tuvix.js/svelte
      link: /fr/guide/svelte
    - name: Angular
      icon: angular
      details: createAngularMicroApp fait le bootstrap d'un composant Angular 15+ dans son conteneur.
      install: npm i @tuvix.js/angular
      link: /fr/guide/angular
    - name: Vanilla JS
      icon: javascript
      details: defineMicroApp fournit des hooks mount, unmount et update en JavaScript pur.
      install: npm i @tuvix.js/core
      link: /fr/guide/micro-apps

packages:
  title: 15 paquets, chacun avec sa propre version
  lead: Commencez par le paquet tout-en-un. Passez aux paquets individuels quand vous voulez une installation plus légère.
  items:
    - name: tuvix.js
      details: Paquet tout-en-un avec core, router, event bus, loader et sandbox.
      link: /fr/packages/tuvix
    - name: '@tuvix.js/core'
      details: L'orchestrateur. Enregistre les micro apps et exécute leurs cycles de vie.
      link: /fr/packages/core
    - name: '@tuvix.js/router'
      details: Active les micro apps selon l'URL, en mode history ou hash.
      link: /fr/packages/router
    - name: '@tuvix.js/event-bus'
      details: Publish/subscribe typé entre micro apps.
      link: /fr/packages/event-bus
    - name: '@tuvix.js/loader'
      details: Charge les bundles des apps à la demande, avec mise en cache et nouvelles tentatives.
      link: /fr/packages/loader
    - name: '@tuvix.js/sandbox'
      details: Isolation CSS par le Shadow DOM, isolation JS par Proxy.
      link: /fr/packages/sandbox
    - name: '@tuvix.js/server'
      details: Composition côté serveur et streaming pour la page hôte.
      link: /fr/packages/server
    - name: '@tuvix.js/module-federation'
      details: Charge des micro apps depuis des remotes Webpack Module Federation.
      link: /fr/packages/module-federation
    - name: '@tuvix.js/devtools'
      details: Panneau de débogage intégré à la page pour les apps, les routes et les événements.
      link: /fr/packages/devtools
    - name: '@tuvix.js/react'
      details: Adaptateur React, hooks et helpers de rendu côté serveur.
      link: /fr/packages/react
    - name: '@tuvix.js/vue'
      details: Adaptateur Vue 3, composables et helpers de rendu côté serveur.
      link: /fr/packages/vue
    - name: '@tuvix.js/svelte'
      details: Adaptateur Svelte avec prise en charge du rendu côté serveur.
      link: /fr/packages/svelte
    - name: '@tuvix.js/angular'
      details: Adaptateur Angular avec prise en charge du rendu côté serveur.
      link: /fr/packages/angular
    - name: '@tuvix.js/vite'
      details: Plugin Vite qui place le CSS des îlots et les liens modulepreload dans le head SSR, pour que les micro apps rendues côté serveur soient stylées dès le premier affichage (first paint).
      link: /fr/packages/vite
    - name: create-tuvix-app
      details: Génère un nouveau projet avec un hôte et une micro app depuis la ligne de commande.
      link: /fr/packages/create-tuvix-app

footer:
  tagline: Orchestrateur de microfrontends pour React, Vue, Svelte, Angular et JavaScript vanilla.
  columns:
    - title: Documentation
      links:
        - text: Démarrage rapide
          link: /fr/guide/getting-started
        - text: Architecture
          link: /fr/guide/architecture
        - text: Configuration
          link: /fr/guide/configuration
        - text: Playground
          link: /playground
    - title: Paquets
      links:
        - text: Core
          link: /fr/packages/core
        - text: Routeur
          link: /fr/packages/router
        - text: Event bus
          link: /fr/packages/event-bus
        - text: Tous les paquets
          link: /fr/packages/
    - title: Projet
      links:
        - text: GitHub
          link: https://github.com/yasinatesim/tuvix.js
        - text: npm
          link: https://www.npmjs.com/org/tuvix.js
        - text: Versions publiées
          link: https://github.com/yasinatesim/tuvix.js/releases
        - text: Contribuer
          link: /fr/contributing
  copyright: Licence MIT · © 2026 Yasin ATEŞ
---
