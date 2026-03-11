import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const trConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      {
        text: 'Rehber',
        link: '/tr/guide/getting-started',
        activeMatch: '/tr/guide/',
      },
      { text: 'Paketler', link: '/tr/packages/', activeMatch: '/tr/packages/' },
      { text: 'Katkı Sağlama', link: '/tr/contributing' },
    ],

    sidebar: {
      '/tr/guide/': [
        {
          text: 'Giriş',
          items: [
            { text: 'Tuvix.js Nedir?', link: '/tr/guide/what-is-tuvix' },
            { text: 'Başlarken', link: '/tr/guide/getting-started' },
            { text: 'Yapılandırma', link: '/tr/guide/configuration' },
            { text: 'Mimari', link: '/tr/guide/architecture' },
          ],
        },
        {
          text: 'Temel Kavramlar',
          items: [
            { text: 'Mikro Uygulamalar', link: '/tr/guide/micro-apps' },
            { text: 'Lifecycle Hooks', link: '/tr/guide/lifecycle' },
            { text: 'Yönlendirme', link: '/tr/guide/routing' },
            { text: 'Event Bus', link: '/tr/guide/event-bus' },
            { text: 'Sandbox', link: '/tr/guide/sandbox' },
          ],
        },
        {
          text: 'Framework Rehberleri',
          items: [
            { text: 'React ile', link: '/tr/guide/react' },
            { text: 'Vue ile', link: '/tr/guide/vue' },
            { text: 'Svelte ile', link: '/tr/guide/svelte' },
            { text: 'Angular ile', link: '/tr/guide/angular' },
          ],
        },
      ],
      '/tr/packages/': [
        {
          text: 'Çekirdek',
          items: [
            { text: 'Genel Bakış', link: '/tr/packages/' },
            { text: '@tuvix.js/core', link: '/tr/packages/core' },
            { text: '@tuvix.js/router', link: '/tr/packages/router' },
            { text: '@tuvix.js/event-bus', link: '/tr/packages/event-bus' },
            { text: '@tuvix.js/loader', link: '/tr/packages/loader' },
            { text: '@tuvix.js/sandbox', link: '/tr/packages/sandbox' },
          ],
        },
        {
          text: 'Framework Bağlamaları',
          items: [
            { text: '@tuvix.js/react', link: '/tr/packages/react' },
            { text: '@tuvix.js/vue', link: '/tr/packages/vue' },
            { text: '@tuvix.js/svelte', link: '/tr/packages/svelte' },
            { text: '@tuvix.js/angular', link: '/tr/packages/angular' },
          ],
        },
        {
          text: 'Araçlar',
          items: [
            { text: '@tuvix.js/devtools', link: '/tr/packages/devtools' },
            { text: '@tuvix.js/server', link: '/tr/packages/server' },
            {
              text: '@tuvix.js/module-federation',
              link: '/tr/packages/module-federation',
            },
            { text: 'create-tuvix-app', link: '/tr/packages/create-tuvix-app' },
            { text: 'tuvix.js (hepsi bir arada)', link: '/tr/packages/tuvix' },
          ],
        },
      ],
    },

    editLink: {
      pattern:
        'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'Bu sayfayı GitHub\'da düzenle',
    },

    lastUpdated: {
      text: 'Son güncelleme',
      formatOptions: { dateStyle: 'short' },
    },

    docFooter: { prev: 'Önceki', next: 'Sonraki' },
    outline: { label: 'Bu sayfada' },
  },
};
