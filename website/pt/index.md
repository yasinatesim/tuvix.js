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
  badge: Microfrontends em TypeScript · MIT
  title: Muitos apps.
  accent: Uma experiência.
  tagline: O Tuvix.js monta micro apps em React, Vue, Svelte, Angular e vanilla JS em uma única página host. Roteamento, um event bus, sandboxing e renderização no servidor vêm como pacotes separados que você adiciona quando precisar.
  image:
    src: /logo.svg
    alt: Logo do Tuvix.js
  actions:
    - theme: brand
      text: Primeiros passos
      link: /pt/guide/getting-started
    - theme: alt
      text: Experimente o Playground
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
  mountedLabel: montado
  busLabel: Event bus compartilhado

featuresSection:
  title: O que vem com o Tuvix.js
  lead: Oito blocos de construção. Instale o pacote guarda-chuva tuvix.js para obter os cinco principais, ou adicione pacotes individuais conforme o seu shell cresce.

features:
  - icon: layers
    title: Independente de framework
    details: Rode micro apps em React, Vue, Svelte, Angular e vanilla JS lado a lado em um único shell.
    link: /pt/guide/micro-apps
    linkText: Guia de micro apps
  - icon: box
    title: Sem dependências de runtime de terceiros
    details: Cada pacote depende apenas de outros pacotes @tuvix.js. Você instala os que importa.
    link: /pt/packages/
    linkText: Todos os pacotes
  - icon: route
    title: Roteamento integrado
    details: O roteador monta e desmonta apps conforme a URL muda, no modo history ou hash.
    link: /pt/guide/routing
    linkText: '@tuvix.js/router'
  - icon: broadcast
    title: Event bus
    details: Os apps publicam e assinam eventos tipados sem compartilhar globais.
    link: /pt/guide/event-bus
    linkText: '@tuvix.js/event-bus'
  - icon: shield
    title: Sandbox de CSS e JS
    details: O Shadow DOM mantém os estilos de cada app dentro do seu container. O JsSandbox executa um script contra uma window Proxy que você pode descartar.
    link: /pt/guide/sandbox
    linkText: '@tuvix.js/sandbox'
  - icon: bolt
    title: Carregamento dinâmico
    details: O loader busca os bundles dos apps sob demanda, guarda-os em cache e tenta de novo os carregamentos que falham.
    link: /pt/packages/loader
    linkText: '@tuvix.js/loader'
  - icon: terminal
    title: DevTools
    details: Um painel na própria página lista os apps registrados, a rota ativa e o tráfego do event bus.
    link: /pt/packages/devtools
    linkText: '@tuvix.js/devtools'
  - icon: server
    title: Renderização no servidor
    details: Renderize micro apps no servidor e junte o HTML deles ao template do shell, como string ou como stream.
    link: /pt/packages/server
    linkText: '@tuvix.js/server'

frameworks:
  eyebrow: Adaptadores
  title: Escolha o seu framework
  lead: Cada adaptador transforma um componente em um micro app que o orquestrador pode montar, atualizar e desmontar.
  copyLabel: Copiar comando de instalação
  copiedLabel: Copiado
  items:
    - name: React
      details: createReactMicroApp envolve um componente. useTuvixProps e useTuvixBus leem props e eventos.
      install: npm i @tuvix.js/react
      link: /pt/guide/react
    - name: Vue
      details: createVueMicroApp monta um app Vue 3, com composables para props e para o event bus.
      install: npm i @tuvix.js/vue
      link: /pt/guide/vue
    - name: Svelte
      details: createSvelteMicroApp monta componentes Svelte 3, 4 e 5.
      install: npm i @tuvix.js/svelte
      link: /pt/guide/svelte
    - name: Angular
      details: createAngularMicroApp inicializa um componente Angular 15+ no seu container.
      install: npm i @tuvix.js/angular
      link: /pt/guide/angular
    - name: Vanilla JS
      mark: JS
      color: vanilla
      details: defineMicroApp dá ao JavaScript puro os hooks mount, unmount e update.
      install: npm i @tuvix.js/core
      link: /pt/guide/micro-apps

packages:
  eyebrow: Pacotes
  title: 15 pacotes, cada um com a própria versão
  lead: Comece pelo pacote guarda-chuva. Mude para pacotes individuais quando quiser uma instalação menor.
  items:
    - name: tuvix.js
      details: Pacote guarda-chuva com core, router, event bus, loader e sandbox.
      link: /pt/packages/tuvix
    - name: '@tuvix.js/core'
      details: O orquestrador. Registra micro apps e executa os ciclos de vida deles.
      link: /pt/packages/core
    - name: '@tuvix.js/router'
      details: Ativa micro apps pela URL, no modo history ou hash.
      link: /pt/packages/router
    - name: '@tuvix.js/event-bus'
      details: Publish/subscribe tipado entre micro apps.
      link: /pt/packages/event-bus
    - name: '@tuvix.js/loader'
      details: Carrega bundles de apps sob demanda, com cache e novas tentativas.
      link: /pt/packages/loader
    - name: '@tuvix.js/sandbox'
      details: Isolamento de CSS por Shadow DOM, isolamento de JS por Proxy.
      link: /pt/packages/sandbox
    - name: '@tuvix.js/server'
      details: Composição e streaming no servidor para a página host.
      link: /pt/packages/server
    - name: '@tuvix.js/module-federation'
      details: Carrega micro apps de remotes do Webpack Module Federation.
      link: /pt/packages/module-federation
    - name: '@tuvix.js/devtools'
      details: Painel de depuração na própria página para apps, rotas e eventos.
      link: /pt/packages/devtools
    - name: '@tuvix.js/react'
      details: Adaptador React, hooks e utilitários de renderização no servidor.
      link: /pt/packages/react
    - name: '@tuvix.js/vue'
      details: Adaptador Vue 3, composables e utilitários de renderização no servidor.
      link: /pt/packages/vue
    - name: '@tuvix.js/svelte'
      details: Adaptador Svelte com suporte a renderização no servidor.
      link: /pt/packages/svelte
    - name: '@tuvix.js/angular'
      details: Adaptador Angular com suporte a renderização no servidor.
      link: /pt/packages/angular
    - name: '@tuvix.js/vite'
      details: Plugin do Vite que coloca o CSS das ilhas e os links modulepreload no head do SSR, para que micro apps renderizados no servidor já tenham estilo na primeira pintura.
      link: /pt/packages/vite
    - name: create-tuvix-app
      details: Gera um novo projeto com host e micro app pela linha de comando.
      link: /pt/packages/create-tuvix-app

footer:
  tagline: Orquestrador de microfrontends para React, Vue, Svelte, Angular e vanilla JS.
  columns:
    - title: Documentação
      links:
        - text: Primeiros passos
          link: /pt/guide/getting-started
        - text: Arquitetura
          link: /pt/guide/architecture
        - text: Configuração
          link: /pt/guide/configuration
        - text: Playground
          link: /playground
    - title: Pacotes
      links:
        - text: Core
          link: /pt/packages/core
        - text: Router
          link: /pt/packages/router
        - text: Event bus
          link: /pt/packages/event-bus
        - text: Todos os pacotes
          link: /pt/packages/
    - title: Projeto
      links:
        - text: GitHub
          link: https://github.com/yasinatesim/tuvix.js
        - text: npm
          link: https://www.npmjs.com/org/tuvix.js
        - text: Releases
          link: https://github.com/yasinatesim/tuvix.js/releases
        - text: Como contribuir
          link: /pt/contributing
  copyright: Licença MIT · © 2026 Yasin ATEŞ
---
