import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const esConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      { text: 'Guía', link: '/es/guide/getting-started', activeMatch: '/es/guide/' },
      { text: 'Paquetes', link: '/es/packages/', activeMatch: '/es/packages/' },
      { text: 'Contribuir', link: '/es/contributing' },
    ],
    sidebar: {
      '/es/guide/': [
        {
          text: 'Introducción',
          items: [
            { text: '¿Qué es Tuvix.js?', link: '/es/guide/what-is-tuvix' },
            { text: 'Primeros pasos', link: '/es/guide/getting-started' },
            { text: 'Configuración', link: '/es/guide/configuration' },
            { text: 'Arquitectura', link: '/es/guide/architecture' },
          ],
        },
      ],
      '/es/packages/': [
        {
          text: 'Núcleo',
          items: [
            { text: 'Descripción general', link: '/es/packages/' },
            { text: '@tuvix.js/core', link: '/es/packages/core' },
            { text: '@tuvix.js/router', link: '/es/packages/router' },
            { text: '@tuvix.js/event-bus', link: '/es/packages/event-bus' },
            { text: '@tuvix.js/loader', link: '/es/packages/loader' },
            { text: '@tuvix.js/sandbox', link: '/es/packages/sandbox' },
          ],
        },
        {
          text: 'Bindings de Framework',
          items: [
            { text: '@tuvix.js/react', link: '/es/packages/react' },
            { text: '@tuvix.js/vue', link: '/es/packages/vue' },
            { text: '@tuvix.js/svelte', link: '/es/packages/svelte' },
            { text: '@tuvix.js/angular', link: '/es/packages/angular' },
          ],
        },
        {
          text: 'Herramientas',
          items: [
            { text: '@tuvix.js/devtools', link: '/es/packages/devtools' },
            { text: '@tuvix.js/server', link: '/es/packages/server' },
            {
              text: '@tuvix.js/module-federation',
              link: '/es/packages/module-federation',
            },
            { text: 'create-tuvix-app', link: '/es/packages/create-tuvix-app' },
            { text: 'tuvix.js (paquete completo)', link: '/es/packages/tuvix' },
          ],
        },
      ],
    },
    editLink: {
      pattern: 'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'Editar esta página en GitHub',
    },
    lastUpdated: { text: 'Última actualización', formatOptions: { dateStyle: 'short' } },
    docFooter: { prev: 'Anterior', next: 'Siguiente' },
    outline: { label: 'En esta página' },
  },
};
