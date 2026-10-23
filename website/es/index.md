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
  badge: Microfrontends en TypeScript · MIT
  title: Muchas apps.
  accent: Una sola experiencia.
  tagline: Tuvix.js monta micro apps de React, Vue, Svelte, Angular y vanilla JS en una sola página host. El enrutamiento, un event bus, el sandboxing y el renderizado en el servidor llegan como paquetes separados que añades cuando los necesitas.
  image:
    src: /logo.svg
    alt: Logo de Tuvix.js
  actions:
    - theme: brand
      text: Primeros pasos
      link: /es/guide/getting-started
    - theme: alt
      text: Prueba el Playground
      link: /playground
  install:
    command: npx create-tuvix-app
    copyLabel: Copiar comando
    copiedLabel: Copiado

showcase:
  file: src/orchestrator.ts
  copyLabel: Copiar
  copiedLabel: Copiado
  shellTitle: Shell host
  routeLabel: URL
  mountedLabel: montada
  busLabel: Event bus compartido

featuresSection:
  title: Qué incluye Tuvix.js
  lead: Ocho piezas. Instala el paquete paraguas tuvix.js para obtener las cinco principales, o añade paquetes sueltos a medida que crece tu shell.

features:
  - icon: layers
    title: Independiente del framework
    details: Ejecuta micro apps de React, Vue, Svelte, Angular y vanilla JS lado a lado en una sola shell.
    link: /es/guide/micro-apps
    linkText: Guía de micro apps
  - icon: box
    title: Sin dependencias de runtime de terceros
    details: Cada paquete depende solo de otros paquetes @tuvix.js. Instalas los que importas.
    link: /es/packages/
    linkText: Todos los paquetes
  - icon: route
    title: Enrutamiento integrado
    details: El router monta y desmonta apps cuando cambia la URL, en modo history o hash.
    link: /es/guide/routing
    linkText: '@tuvix.js/router'
  - icon: broadcast
    title: Event bus
    details: Las apps publican y se suscriben a eventos tipados sin compartir globales.
    link: /es/guide/event-bus
    linkText: '@tuvix.js/event-bus'
  - icon: shield
    title: Sandbox de CSS y JS
    details: El shadow DOM mantiene los estilos de cada app dentro de su contenedor. JsSandbox ejecuta un script contra un window Proxy que puedes descartar.
    link: /es/guide/sandbox
    linkText: '@tuvix.js/sandbox'
  - icon: bolt
    title: Carga dinámica
    details: El loader descarga los bundles de las apps bajo demanda, los guarda en caché y reintenta las cargas fallidas.
    link: /es/packages/loader
    linkText: '@tuvix.js/loader'
  - icon: terminal
    title: DevTools
    details: Un panel dentro de la página lista las apps registradas, la ruta activa y el tráfico del event bus.
    link: /es/packages/devtools
    linkText: '@tuvix.js/devtools'
  - icon: server
    title: Renderizado en el servidor
    details: Renderiza micro apps en el servidor y une su HTML en la plantilla de la shell, como string o como stream.
    link: /es/packages/server
    linkText: '@tuvix.js/server'

frameworks:
  eyebrow: Adaptadores
  title: Elige tu framework
  lead: Cada adaptador convierte un componente en una micro app que el orquestador puede montar, actualizar y desmontar.
  copyLabel: Copiar comando de instalación
  copiedLabel: Copiado
  items:
    - name: React
      details: createReactMicroApp envuelve un componente. useTuvixProps y useTuvixBus leen props y eventos.
      install: npm i @tuvix.js/react
      link: /es/guide/react
    - name: Vue
      details: createVueMicroApp monta una app de Vue 3, con composables para props y el event bus.
      install: npm i @tuvix.js/vue
      link: /es/guide/vue
    - name: Svelte
      details: createSvelteMicroApp monta componentes de Svelte 3, 4 y 5.
      install: npm i @tuvix.js/svelte
      link: /es/guide/svelte
    - name: Angular
      details: createAngularMicroApp inicializa un componente de Angular 15+ dentro de su contenedor.
      install: npm i @tuvix.js/angular
      link: /es/guide/angular
    - name: Vanilla JS
      mark: JS
      color: vanilla
      details: defineMicroApp da a JavaScript plano los hooks mount, unmount y update.
      install: npm i @tuvix.js/core
      link: /es/guide/micro-apps

packages:
  eyebrow: Paquetes
  title: 15 paquetes, cada uno con su propia versión
  lead: Empieza con el paquete paraguas. Cambia a paquetes sueltos cuando quieras una instalación más pequeña.
  items:
    - name: tuvix.js
      details: Paquete paraguas con core, router, event bus, loader y sandbox.
      link: /es/packages/tuvix
    - name: '@tuvix.js/core'
      details: El orquestador. Registra micro apps y ejecuta sus ciclos de vida.
      link: /es/packages/core
    - name: '@tuvix.js/router'
      details: Activa micro apps según la URL, en modo history o hash.
      link: /es/packages/router
    - name: '@tuvix.js/event-bus'
      details: Publish/subscribe tipado entre micro apps.
      link: /es/packages/event-bus
    - name: '@tuvix.js/loader'
      details: Carga bundles de apps bajo demanda, con caché y reintentos.
      link: /es/packages/loader
    - name: '@tuvix.js/sandbox'
      details: Aislamiento de CSS mediante Shadow DOM y de JS mediante Proxy.
      link: /es/packages/sandbox
    - name: '@tuvix.js/server'
      details: Composición y streaming en el servidor para la página host.
      link: /es/packages/server
    - name: '@tuvix.js/module-federation'
      details: Carga micro apps desde remotes de Webpack Module Federation.
      link: /es/packages/module-federation
    - name: '@tuvix.js/devtools'
      details: Panel de depuración dentro de la página para apps, rutas y eventos.
      link: /es/packages/devtools
    - name: '@tuvix.js/react'
      details: Adaptador de React, hooks y utilidades de renderizado en el servidor.
      link: /es/packages/react
    - name: '@tuvix.js/vue'
      details: Adaptador de Vue 3, composables y utilidades de renderizado en el servidor.
      link: /es/packages/vue
    - name: '@tuvix.js/svelte'
      details: Adaptador de Svelte con soporte de renderizado en el servidor.
      link: /es/packages/svelte
    - name: '@tuvix.js/angular'
      details: Adaptador de Angular con soporte de renderizado en el servidor.
      link: /es/packages/angular
    - name: '@tuvix.js/vite'
      details: Plugin de Vite que coloca el CSS de las islas y los enlaces modulepreload en el head del SSR, para que las micro apps renderizadas en el servidor tengan estilos desde el primer pintado.
      link: /es/packages/vite
    - name: create-tuvix-app
      details: Genera un nuevo proyecto con host y micro app desde la línea de comandos.
      link: /es/packages/create-tuvix-app

footer:
  tagline: Orquestador de microfrontends para React, Vue, Svelte, Angular y vanilla JS.
  columns:
    - title: Documentación
      links:
        - text: Primeros pasos
          link: /es/guide/getting-started
        - text: Arquitectura
          link: /es/guide/architecture
        - text: Configuración
          link: /es/guide/configuration
        - text: Playground
          link: /playground
    - title: Paquetes
      links:
        - text: Core
          link: /es/packages/core
        - text: Router
          link: /es/packages/router
        - text: Event bus
          link: /es/packages/event-bus
        - text: Todos los paquetes
          link: /es/packages/
    - title: Proyecto
      links:
        - text: GitHub
          link: https://github.com/yasinatesim/tuvix.js
        - text: npm
          link: https://www.npmjs.com/org/tuvix.js
        - text: Versiones
          link: https://github.com/yasinatesim/tuvix.js/releases
        - text: Contribuir
          link: /es/contributing
  copyright: Licencia MIT · © 2026 Yasin ATEŞ
---
