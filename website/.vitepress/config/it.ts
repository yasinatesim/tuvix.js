import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const itConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      {
        text: 'Guida',
        link: '/it/guide/getting-started',
        activeMatch: '/it/guide/',
      },
      {
        text: 'Pacchetti',
        link: '/it/packages/',
        activeMatch: '/it/packages/',
      },
      { text: 'Playground', link: '/playground', activeMatch: '/playground' },
      { text: 'Generatore IA', link: '/chatbot', activeMatch: '/chatbot' },
      { text: 'Contribuire', link: '/it/contributing' },
      {
        text: 'v0.5.0',
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/yasinatesim/tuvix.js/releases',
          },
          {
            text: 'Contribuire',
            link: 'https://github.com/yasinatesim/tuvix.js/blob/master/CONTRIBUTING.md',
          },
        ],
      },
    ],

    sidebar: {
      '/it/guide/': [
        {
          text: 'Introduzione',
          items: [
            { text: "Cos'è Tuvix.js?", link: '/it/guide/what-is-tuvix' },
            { text: 'Per iniziare', link: '/it/guide/getting-started' },
            { text: 'Configurazione', link: '/it/guide/configuration' },
            { text: 'Architettura', link: '/it/guide/architecture' },
          ],
        },
        {
          text: 'Concetti fondamentali',
          items: [
            { text: 'Micro app', link: '/it/guide/micro-apps' },
            { text: 'Hook del ciclo di vita', link: '/it/guide/lifecycle' },
            {
              text: 'Eventi del ciclo di vita',
              link: '/it/guide/lifecycle-events',
            },
            { text: 'Routing', link: '/it/guide/routing' },
            { text: 'Router esterno', link: '/it/guide/external-router' },
            { text: 'Event bus', link: '/it/guide/event-bus' },
            { text: 'Sandboxing', link: '/it/guide/sandbox' },
          ],
        },
        {
          text: 'Guide ai framework',
          items: [
            { text: 'Con React', link: '/it/guide/react' },
            { text: 'Con Vue', link: '/it/guide/vue' },
            { text: 'Con Svelte', link: '/it/guide/svelte' },
            { text: 'Con Angular', link: '/it/guide/angular' },
            { text: 'Island SSR', link: '/it/guide/ssr-islands' },
          ],
        },
        {
          text: 'Aiuto',
          items: [
            { text: 'Migrazione alla 0.5', link: '/it/guide/migration-0-5' },
            {
              text: 'Risoluzione dei problemi',
              link: '/it/guide/troubleshooting',
            },
          ],
        },
      ],
      '/it/packages/': [
        {
          text: 'Core',
          items: [
            { text: 'Panoramica', link: '/it/packages/' },
            { text: '@tuvix.js/core', link: '/it/packages/core' },
            { text: '@tuvix.js/router', link: '/it/packages/router' },
            { text: '@tuvix.js/event-bus', link: '/it/packages/event-bus' },
            { text: '@tuvix.js/loader', link: '/it/packages/loader' },
            { text: '@tuvix.js/sandbox', link: '/it/packages/sandbox' },
          ],
        },
        {
          text: 'Binding per framework',
          items: [
            { text: '@tuvix.js/react', link: '/it/packages/react' },
            { text: '@tuvix.js/vue', link: '/it/packages/vue' },
            { text: '@tuvix.js/svelte', link: '/it/packages/svelte' },
            { text: '@tuvix.js/angular', link: '/it/packages/angular' },
          ],
        },
        {
          text: 'Strumenti',
          items: [
            { text: '@tuvix.js/devtools', link: '/it/packages/devtools' },
            { text: '@tuvix.js/server', link: '/it/packages/server' },
            { text: '@tuvix.js/vite', link: '/it/packages/vite' },
            {
              text: '@tuvix.js/module-federation',
              link: '/it/packages/module-federation',
            },
            {
              text: 'create-tuvix-app',
              link: '/it/packages/create-tuvix-app',
            },
            {
              text: 'tuvix.js (pacchetto ombrello)',
              link: '/it/packages/tuvix',
            },
          ],
        },
      ],
    },

    editLink: {
      pattern:
        'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'Modifica questa pagina su GitHub',
    },

    lastUpdated: {
      text: 'Ultimo aggiornamento',
      formatOptions: { dateStyle: 'short' },
    },

    docFooter: {
      prev: 'Precedente',
      next: 'Successivo',
    },

    outline: {
      label: 'In questa pagina',
    },
  },
};
