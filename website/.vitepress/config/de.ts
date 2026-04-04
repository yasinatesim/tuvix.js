import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const deConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      { text: 'Anleitung', link: '/de/guide/getting-started', activeMatch: '/de/guide/' },
      { text: 'Pakete', link: '/de/packages/', activeMatch: '/de/packages/' },
      { text: 'Playground', link: '/playground', activeMatch: '/playground' },
      { text: 'Beitragen', link: '/de/contributing' },
      { text: 'v0.1.4', items: [{ text: 'Changelog', link: 'https://github.com/yasinatesim/tuvix.js/releases' }, { text: 'Beitragen', link: 'https://github.com/yasinatesim/tuvix.js/blob/master/CONTRIBUTING.md' }] },
    ],
    sidebar: {
      '/de/guide/': [
        {
          text: 'Einführung',
          items: [
            { text: 'Was ist Tuvix.js?', link: '/de/guide/what-is-tuvix' },
            { text: 'Erste Schritte', link: '/de/guide/getting-started' },
            { text: 'Konfiguration', link: '/de/guide/configuration' },
            { text: 'Architektur', link: '/de/guide/architecture' },
          ],
        },
      ],
      '/de/packages/': [
        {
          text: 'Kern',
          items: [
            { text: 'Übersicht', link: '/de/packages/' },
            { text: '@tuvix.js/core', link: '/de/packages/core' },
            { text: '@tuvix.js/router', link: '/de/packages/router' },
            { text: '@tuvix.js/event-bus', link: '/de/packages/event-bus' },
            { text: '@tuvix.js/loader', link: '/de/packages/loader' },
            { text: '@tuvix.js/sandbox', link: '/de/packages/sandbox' },
          ],
        },
        {
          text: 'Framework-Bindungen',
          items: [
            { text: '@tuvix.js/react', link: '/de/packages/react' },
            { text: '@tuvix.js/vue', link: '/de/packages/vue' },
            { text: '@tuvix.js/svelte', link: '/de/packages/svelte' },
            { text: '@tuvix.js/angular', link: '/de/packages/angular' },
          ],
        },
        {
          text: 'Werkzeuge',
          items: [
            { text: '@tuvix.js/devtools', link: '/de/packages/devtools' },
            { text: '@tuvix.js/server', link: '/de/packages/server' },
            {
              text: '@tuvix.js/module-federation',
              link: '/de/packages/module-federation',
            },
            { text: 'create-tuvix-app', link: '/de/packages/create-tuvix-app' },
            { text: 'tuvix.js (Gesamtpaket)', link: '/de/packages/tuvix' },
          ],
        },
      ],
    },
    editLink: {
      pattern: 'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'Diese Seite auf GitHub bearbeiten',
    },
    lastUpdated: { text: 'Zuletzt aktualisiert', formatOptions: { dateStyle: 'short' } },
    docFooter: { prev: 'Zurück', next: 'Weiter' },
    outline: { label: 'Auf dieser Seite' },
  },
};
