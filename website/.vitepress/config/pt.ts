import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const ptConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      { text: 'Guia', link: '/pt/guide/getting-started', activeMatch: '/pt/guide/' },
      { text: 'Pacotes', link: '/pt/packages/', activeMatch: '/pt/packages/' },
      { text: 'Contribuir', link: '/pt/contributing' },
    ],
    sidebar: {
      '/pt/guide/': [
        {
          text: 'Introdução',
          items: [
            { text: 'O que é Tuvix.js?', link: '/pt/guide/what-is-tuvix' },
            { text: 'Primeiros passos', link: '/pt/guide/getting-started' },
            { text: 'Configuração', link: '/pt/guide/configuration' },
            { text: 'Arquitetura', link: '/pt/guide/architecture' },
          ],
        },
      ],
      '/pt/packages/': [
        {
          text: 'Núcleo',
          items: [
            { text: 'Visão geral', link: '/pt/packages/' },
            { text: '@tuvix.js/core', link: '/pt/packages/core' },
            { text: '@tuvix.js/router', link: '/pt/packages/router' },
            { text: '@tuvix.js/event-bus', link: '/pt/packages/event-bus' },
            { text: '@tuvix.js/loader', link: '/pt/packages/loader' },
            { text: '@tuvix.js/sandbox', link: '/pt/packages/sandbox' },
          ],
        },
        {
          text: 'Bindings de Framework',
          items: [
            { text: '@tuvix.js/react', link: '/pt/packages/react' },
            { text: '@tuvix.js/vue', link: '/pt/packages/vue' },
            { text: '@tuvix.js/svelte', link: '/pt/packages/svelte' },
            { text: '@tuvix.js/angular', link: '/pt/packages/angular' },
          ],
        },
        {
          text: 'Ferramentas',
          items: [
            { text: '@tuvix.js/devtools', link: '/pt/packages/devtools' },
            { text: '@tuvix.js/server', link: '/pt/packages/server' },
            {
              text: '@tuvix.js/module-federation',
              link: '/pt/packages/module-federation',
            },
            { text: 'create-tuvix-app', link: '/pt/packages/create-tuvix-app' },
            { text: 'tuvix.js (pacote completo)', link: '/pt/packages/tuvix' },
          ],
        },
      ],
    },
    editLink: {
      pattern: 'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'Editar esta página no GitHub',
    },
    lastUpdated: { text: 'Última atualização', formatOptions: { dateStyle: 'short' } },
    docFooter: { prev: 'Anterior', next: 'Próximo' },
    outline: { label: 'Nesta página' },
  },
};
