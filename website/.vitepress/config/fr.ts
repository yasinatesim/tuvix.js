import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const frConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      {
        text: 'Guide',
        link: '/fr/guide/getting-started',
        activeMatch: '/fr/guide/',
      },
      {
        text: 'Paquets',
        link: '/fr/packages/',
        activeMatch: '/fr/packages/',
      },
      { text: 'Playground', link: '/playground', activeMatch: '/playground' },
      { text: 'Générateur IA', link: '/chatbot', activeMatch: '/chatbot' },
      { text: 'Contribuer', link: '/fr/contributing' },
      {
        text: 'v0.5.0',
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/yasinatesim/tuvix.js/releases',
          },
          {
            text: 'Contribuer',
            link: 'https://github.com/yasinatesim/tuvix.js/blob/master/CONTRIBUTING.md',
          },
        ],
      },
    ],

    sidebar: {
      '/fr/guide/': [
        {
          text: 'Introduction',
          items: [
            {
              text: "Qu'est-ce que Tuvix.js ?",
              link: '/fr/guide/what-is-tuvix',
            },
            { text: 'Démarrage rapide', link: '/fr/guide/getting-started' },
            { text: 'Configuration', link: '/fr/guide/configuration' },
            { text: 'Architecture', link: '/fr/guide/architecture' },
          ],
        },
        {
          text: 'Concepts clés',
          items: [
            { text: 'Micro apps', link: '/fr/guide/micro-apps' },
            { text: 'Hooks de cycle de vie', link: '/fr/guide/lifecycle' },
            {
              text: 'Événements de cycle de vie',
              link: '/fr/guide/lifecycle-events',
            },
            { text: 'Routage', link: '/fr/guide/routing' },
            { text: 'Routeur externe', link: '/fr/guide/external-router' },
            { text: 'Event bus', link: '/fr/guide/event-bus' },
            { text: 'Sandbox', link: '/fr/guide/sandbox' },
          ],
        },
        {
          text: 'Guides par framework',
          items: [
            { text: 'Avec React', link: '/fr/guide/react' },
            { text: 'Avec Vue', link: '/fr/guide/vue' },
            { text: 'Avec Svelte', link: '/fr/guide/svelte' },
            { text: 'Avec Angular', link: '/fr/guide/angular' },
            { text: 'Îlots SSR', link: '/fr/guide/ssr-islands' },
          ],
        },
        {
          text: 'Aide',
          items: [
            { text: 'Migrer vers 0.5', link: '/fr/guide/migration-0-5' },
            { text: 'Dépannage', link: '/fr/guide/troubleshooting' },
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
          text: 'Liaisons de framework',
          items: [
            { text: '@tuvix.js/react', link: '/fr/packages/react' },
            { text: '@tuvix.js/vue', link: '/fr/packages/vue' },
            { text: '@tuvix.js/svelte', link: '/fr/packages/svelte' },
            { text: '@tuvix.js/angular', link: '/fr/packages/angular' },
          ],
        },
        {
          text: 'Outils',
          items: [
            { text: '@tuvix.js/devtools', link: '/fr/packages/devtools' },
            { text: '@tuvix.js/server', link: '/fr/packages/server' },
            { text: '@tuvix.js/vite', link: '/fr/packages/vite' },
            {
              text: '@tuvix.js/module-federation',
              link: '/fr/packages/module-federation',
            },
            { text: 'create-tuvix-app', link: '/fr/packages/create-tuvix-app' },
            { text: 'tuvix.js (tout-en-un)', link: '/fr/packages/tuvix' },
          ],
        },
      ],
    },

    editLink: {
      pattern:
        'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'Modifier cette page sur GitHub',
    },

    lastUpdated: {
      text: 'Dernière mise à jour',
      formatOptions: { dateStyle: 'short' },
    },

    docFooter: {
      prev: 'Précédent',
      next: 'Suivant',
    },

    outline: {
      label: 'Sur cette page',
    },
  },
};
