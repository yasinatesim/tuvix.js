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
  badge: TypeScript microfrontends · MIT
  title: Many apps.
  accent: One experience.
  tagline: Tuvix.js mounts React, Vue, Svelte, Angular and vanilla JS micro apps into one host page. Routing, an event bus, sandboxing and server rendering come as separate packages you add when you need them.
  image:
    src: /logo.svg
    alt: Tuvix.js logo
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Try the Playground
      link: /playground
  install:
    command: npx create-tuvix-app
    copyLabel: Copy command
    copiedLabel: Copied

showcase:
  file: src/orchestrator.ts
  copyLabel: Copy
  copiedLabel: Copied
  shellTitle: Host shell
  routeLabel: URL
  mountedLabel: mounted
  busLabel: Shared event bus

featuresSection:
  title: What ships with Tuvix.js
  lead: Eight building blocks. Install the tuvix.js umbrella package to get the core five, or add single packages as your shell grows.

features:
  - icon: layers
    title: Framework agnostic
    details: Run React, Vue, Svelte, Angular and vanilla JS micro apps side by side in one shell.
    link: /guide/micro-apps
    linkText: Micro apps guide
  - icon: box
    title: No third-party runtime dependencies
    details: Each package depends only on other @tuvix.js packages. You install the ones you import.
    link: /packages/
    linkText: All packages
  - icon: route
    title: Built-in routing
    details: The router mounts and unmounts apps as the URL changes, in history or hash mode.
    link: /guide/routing
    linkText: '@tuvix.js/router'
  - icon: broadcast
    title: Event bus
    details: Apps publish and subscribe to typed events without sharing globals.
    link: /guide/event-bus
    linkText: '@tuvix.js/event-bus'
  - icon: shield
    title: CSS and JS sandbox
    details: Shadow DOM keeps each app's styles inside its container. JsSandbox runs a script against a Proxy window you can throw away.
    link: /guide/sandbox
    linkText: '@tuvix.js/sandbox'
  - icon: bolt
    title: Dynamic loading
    details: The loader fetches app bundles on demand, caches them and retries failed loads.
    link: /packages/loader
    linkText: '@tuvix.js/loader'
  - icon: terminal
    title: DevTools
    details: An in-page panel lists registered apps, the active route and event bus traffic.
    link: /packages/devtools
    linkText: '@tuvix.js/devtools'
  - icon: server
    title: Server rendering
    details: Render micro apps on the server and stitch their HTML into the shell template, as a string or a stream.
    link: /packages/server
    linkText: '@tuvix.js/server'

frameworks:
  eyebrow: Adapters
  title: Pick your framework
  lead: Each adapter turns a component into a micro app that the orchestrator can mount, update and unmount.
  copyLabel: Copy install command
  copiedLabel: Copied
  items:
    - name: React
      details: createReactMicroApp wraps a component. useTuvixProps and useTuvixBus read props and events.
      install: npm i @tuvix.js/react
      link: /guide/react
    - name: Vue
      details: createVueMicroApp mounts a Vue 3 app, with composables for props and the event bus.
      install: npm i @tuvix.js/vue
      link: /guide/vue
    - name: Svelte
      details: createSvelteMicroApp mounts Svelte 3, 4 and 5 components.
      install: npm i @tuvix.js/svelte
      link: /guide/svelte
    - name: Angular
      details: createAngularMicroApp bootstraps an Angular 15+ component into its container.
      install: npm i @tuvix.js/angular
      link: /guide/angular
    - name: Vanilla JS
      mark: JS
      color: vanilla
      details: defineMicroApp gives plain JavaScript mount, unmount and update hooks.
      install: npm i @tuvix.js/core
      link: /guide/micro-apps

packages:
  eyebrow: Packages
  title: 15 packages, each with its own version
  lead: Start with the umbrella package. Switch to single packages when you want a smaller install.
  items:
    - name: tuvix.js
      details: Umbrella package with core, router, event bus, loader and sandbox.
      link: /packages/tuvix
    - name: '@tuvix.js/core'
      details: The orchestrator. Registers micro apps and runs their lifecycles.
      link: /packages/core
    - name: '@tuvix.js/router'
      details: Activates micro apps by URL, in history or hash mode.
      link: /packages/router
    - name: '@tuvix.js/event-bus'
      details: Typed publish/subscribe between micro apps.
      link: /packages/event-bus
    - name: '@tuvix.js/loader'
      details: Loads app bundles on demand, with caching and retries.
      link: /packages/loader
    - name: '@tuvix.js/sandbox'
      details: CSS isolation through Shadow DOM, JS isolation through Proxy.
      link: /packages/sandbox
    - name: '@tuvix.js/server'
      details: Server-side composition and streaming for the host page.
      link: /packages/server
    - name: '@tuvix.js/module-federation'
      details: Loads micro apps from Webpack Module Federation remotes.
      link: /packages/module-federation
    - name: '@tuvix.js/devtools'
      details: In-page debug panel for apps, routes and events.
      link: /packages/devtools
    - name: '@tuvix.js/react'
      details: React adapter, hooks and server rendering helpers.
      link: /packages/react
    - name: '@tuvix.js/vue'
      details: Vue 3 adapter, composables and server rendering helpers.
      link: /packages/vue
    - name: '@tuvix.js/svelte'
      details: Svelte adapter with server rendering support.
      link: /packages/svelte
    - name: '@tuvix.js/angular'
      details: Angular adapter with server rendering support.
      link: /packages/angular
    - name: '@tuvix.js/vite'
      details: Vite plugin that puts island CSS and modulepreload links into the SSR head, so server-rendered micro apps are styled on first paint.
      link: /packages/vite
    - name: create-tuvix-app
      details: Scaffolds a new host and micro app project from the command line.
      link: /packages/create-tuvix-app

footer:
  tagline: Microfrontend orchestrator for React, Vue, Svelte, Angular and vanilla JS.
  columns:
    - title: Docs
      links:
        - text: Getting started
          link: /guide/getting-started
        - text: Architecture
          link: /guide/architecture
        - text: Configuration
          link: /guide/configuration
        - text: Playground
          link: /playground
    - title: Packages
      links:
        - text: Core
          link: /packages/core
        - text: Router
          link: /packages/router
        - text: Event bus
          link: /packages/event-bus
        - text: All packages
          link: /packages/
    - title: Project
      links:
        - text: GitHub
          link: https://github.com/yasinatesim/tuvix.js
        - text: npm
          link: https://www.npmjs.com/org/tuvix.js
        - text: Releases
          link: https://github.com/yasinatesim/tuvix.js/releases
        - text: Contributing
          link: /contributing
  copyright: MIT License · © 2026 Yasin ATEŞ
---
