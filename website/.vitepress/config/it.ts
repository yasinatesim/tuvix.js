import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const itConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      { text: 'Guida', link: '/it/guide/getting-started', activeMatch: '/it/guide/' },
      { text: 'Pacchetti', link: '/it/packages/', activeMatch: '/it/packages/' },
      { text: 'Playground', link: '/playground', activeMatch: '/playground' },
      { text: 'Contribuire', link: '/it/contributing' },
      { text: 'v0.1.4', items: [{ text: 'Changelog', link: 'https://github.com/yasinatesim/tuvix.js/releases' }, { text: 'Contribuire', link: 'https://github.com/yasinatesim/tuvix.js/blob/master/CONTRIBUTING.md' }] },
    ],
    sidebar: {
      '/it/guide/': [
        {
          text: 'Introduzione',
          items: [
            { text: 'Cos\'è Tuvix.js?', link: '/it/guide/what-is-tuvix' },
            { text: 'Per iniziare', link: '/it/guide/getting-started' },
            { text: 'Configurazione', link: '/it/guide/configuration' },
            { text: 'Architettura', link: '/it/guide/architecture' },
          ],
        },
        {
          text: 'Concetti Principali',
          items: [
            { text: 'Micro App', link: '/it/guide/micro-apps' },
            { text: 'Lifecycle Hooks', link: '/it/guide/lifecycle' },
            { text: 'Routing', link: '/it/guide/routing' },
            { text: 'Event Bus', link: '/it/guide/event-bus' },
            { text: 'Sandbox', link: '/it/guide/sandbox' },
          ],
        },
        {
          text: 'Guide Framework',
          items: [
            { text: 'Con React', link: '/it/guide/react' },
            { text: 'Con Vue', link: '/it/guide/vue' },
            { text: 'Con Svelte', link: '/it/guide/svelte' },
            { text: 'Con Angular', link: '/it/guide/angular' },
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
          text: 'Binding Framework',
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
            {
              text: '@tuvix.js/module-federation',
              link: '/it/packages/module-federation',
            },
            { text: 'create-tuvix-app', link: '/it/packages/create-tuvix-app' },
            { text: 'tuvix.js (pacchetto completo)', link: '/it/packages/tuvix' },
          ],
        },
      ],
    },
    editLink: {
      pattern: 'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'Modifica questa pagina su GitHub',
    },
    lastUpdated: { text: 'Ultimo aggiornamento', formatOptions: { dateStyle: 'short' } },
    docFooter: { prev: 'Precedente', next: 'Successivo' },
    outline: { label: 'In questa pagina' },
  },
};
