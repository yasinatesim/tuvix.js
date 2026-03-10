import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const itConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      { text: 'Guida', link: '/it/guide/getting-started', activeMatch: '/it/guide/' },
      { text: 'Pacchetti', link: '/it/packages/', activeMatch: '/it/packages/' },
      { text: 'Contribuire', link: '/it/contributing' },
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
