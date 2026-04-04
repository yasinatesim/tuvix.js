import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const enConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started', activeMatch: '/guide/' },
      {
        text: 'Packages',
        link: '/packages/',
        activeMatch: '/packages/',
      },
      { text: 'Playground', link: '/playground', activeMatch: '/playground' },
      { text: 'Contributing', link: '/contributing' },
      {
        text: 'v0.1.4',
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/yasinatesim/tuvix.js/releases',
          },
          {
            text: 'Contributing',
            link: 'https://github.com/yasinatesim/tuvix.js/blob/master/CONTRIBUTING.md',
          },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is Tuvix.js?', link: '/guide/what-is-tuvix' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'Architecture', link: '/guide/architecture' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Micro Apps', link: '/guide/micro-apps' },
            { text: 'Lifecycle Hooks', link: '/guide/lifecycle' },
            { text: 'Routing', link: '/guide/routing' },
            { text: 'Event Bus', link: '/guide/event-bus' },
            { text: 'Sandboxing', link: '/guide/sandbox' },
          ],
        },
        {
          text: 'Framework Guides',
          items: [
            { text: 'With React', link: '/guide/react' },
            { text: 'With Vue', link: '/guide/vue' },
            { text: 'With Svelte', link: '/guide/svelte' },
            { text: 'With Angular', link: '/guide/angular' },
          ],
        },
      ],
      '/packages/': [
        {
          text: 'Core',
          items: [
            { text: 'Overview', link: '/packages/' },
            { text: '@tuvix.js/core', link: '/packages/core' },
            { text: '@tuvix.js/router', link: '/packages/router' },
            { text: '@tuvix.js/event-bus', link: '/packages/event-bus' },
            { text: '@tuvix.js/loader', link: '/packages/loader' },
            { text: '@tuvix.js/sandbox', link: '/packages/sandbox' },
          ],
        },
        {
          text: 'Framework Bindings',
          items: [
            { text: '@tuvix.js/react', link: '/packages/react' },
            { text: '@tuvix.js/vue', link: '/packages/vue' },
            { text: '@tuvix.js/svelte', link: '/packages/svelte' },
            { text: '@tuvix.js/angular', link: '/packages/angular' },
          ],
        },
        {
          text: 'Tooling',
          items: [
            { text: '@tuvix.js/devtools', link: '/packages/devtools' },
            { text: '@tuvix.js/server', link: '/packages/server' },
            {
              text: '@tuvix.js/module-federation',
              link: '/packages/module-federation',
            },
            { text: 'create-tuvix-app', link: '/packages/create-tuvix-app' },
            { text: 'tuvix.js (umbrella)', link: '/packages/tuvix' },
          ],
        },
      ],
    },

    editLink: {
      pattern:
        'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'Edit this page on GitHub',
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: { dateStyle: 'short' },
    },

    docFooter: {
      prev: 'Previous',
      next: 'Next',
    },

    outline: {
      label: 'On this page',
    },
  },
};
