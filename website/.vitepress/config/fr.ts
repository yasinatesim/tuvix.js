import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const frConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/fr/guide/getting-started', activeMatch: '/fr/guide/' },
      { text: 'Paquets', link: '/fr/packages/', activeMatch: '/fr/packages/' },
      { text: 'Contribuer', link: '/fr/contributing' },
    ],
    sidebar: {
      '/fr/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: "Qu'est-ce que Tuvix.js ?", link: '/fr/guide/what-is-tuvix' },
            { text: 'Démarrage rapide', link: '/fr/guide/getting-started' },
            { text: 'Configuration', link: '/fr/guide/configuration' },
            { text: 'Architecture', link: '/fr/guide/architecture' },
          ],
        },
      ],
      '/fr/packages/': [
        {
          text: 'Cœur',
          items: [
            { text: 'Aperçu', link: '/fr/packages/' },
            { text: '@tuvix.js/core', link: '/fr/packages/core' },
            { text: '@tuvix.js/router', link: '/fr/packages/router' },
            { text: '@tuvix.js/event-bus', link: '/fr/packages/event-bus' },
            { text: '@tuvix.js/loader', link: '/fr/packages/loader' },
            { text: '@tuvix.js/sandbox', link: '/fr/packages/sandbox' },
          ],
        },
        {
          text: 'Liaisons de Framework',
          items: [
            { text: '@tuvix.js/react', link: '/fr/packages/react' },
            { text: '@tuvix.js/vue', link: '/fr/packages/vue' },
            { text: '@tuvix.js/svelte', link: '/fr/packages/svelte' },
            { text: '@tuvix.js/angular', link: '/fr/packages/angular' },
          ],
        },
      ],
    },
    editLink: {
      pattern: 'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'Modifier cette page sur GitHub',
    },
    lastUpdated: { text: 'Dernière mise à jour', formatOptions: { dateStyle: 'short' } },
    docFooter: { prev: 'Précédent', next: 'Suivant' },
    outline: { label: 'Sur cette page' },
  },
};
