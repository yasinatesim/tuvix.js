import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const hiConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      {
        text: 'गाइड',
        link: '/hi/guide/getting-started',
        activeMatch: '/hi/guide/',
      },
      {
        text: 'पैकेज',
        link: '/hi/packages/',
        activeMatch: '/hi/packages/',
      },
      { text: 'Playground', link: '/playground', activeMatch: '/playground' },
      { text: 'AI जेनरेटर', link: '/chatbot', activeMatch: '/chatbot' },
      { text: 'योगदान', link: '/hi/contributing' },
      {
        text: 'v0.5.0',
        items: [
          {
            text: 'Changelog',
            link: 'https://github.com/yasinatesim/tuvix.js/releases',
          },
          {
            text: 'योगदान',
            link: 'https://github.com/yasinatesim/tuvix.js/blob/master/CONTRIBUTING.md',
          },
        ],
      },
    ],

    sidebar: {
      '/hi/guide/': [
        {
          text: 'परिचय',
          items: [
            { text: 'Tuvix.js क्या है?', link: '/hi/guide/what-is-tuvix' },
            { text: 'शुरुआत करें', link: '/hi/guide/getting-started' },
            { text: 'कॉन्फ़िगरेशन', link: '/hi/guide/configuration' },
            { text: 'आर्किटेक्चर', link: '/hi/guide/architecture' },
          ],
        },
        {
          text: 'मुख्य अवधारणाएं',
          items: [
            { text: 'Micro Apps', link: '/hi/guide/micro-apps' },
            { text: 'Lifecycle Hooks', link: '/hi/guide/lifecycle' },
            { text: 'Lifecycle Events', link: '/hi/guide/lifecycle-events' },
            { text: 'रूटिंग', link: '/hi/guide/routing' },
            { text: 'बाहरी राउटर', link: '/hi/guide/external-router' },
            { text: 'Event Bus', link: '/hi/guide/event-bus' },
            { text: 'Sandboxing', link: '/hi/guide/sandbox' },
          ],
        },
        {
          text: 'फ्रेमवर्क गाइड',
          items: [
            { text: 'React के साथ', link: '/hi/guide/react' },
            { text: 'Vue के साथ', link: '/hi/guide/vue' },
            { text: 'Svelte के साथ', link: '/hi/guide/svelte' },
            { text: 'Angular के साथ', link: '/hi/guide/angular' },
            { text: 'SSR Islands', link: '/hi/guide/ssr-islands' },
          ],
        },
        {
          text: 'सहायता',
          items: [
            { text: '0.5 पर माइग्रेट करें', link: '/hi/guide/migration-0-5' },
            { text: 'समस्या निवारण', link: '/hi/guide/troubleshooting' },
          ],
        },
      ],
      '/hi/packages/': [
        {
          text: 'कोर',
          items: [
            { text: 'अवलोकन', link: '/hi/packages/' },
            { text: '@tuvix.js/core', link: '/hi/packages/core' },
            { text: '@tuvix.js/router', link: '/hi/packages/router' },
            { text: '@tuvix.js/event-bus', link: '/hi/packages/event-bus' },
            { text: '@tuvix.js/loader', link: '/hi/packages/loader' },
            { text: '@tuvix.js/sandbox', link: '/hi/packages/sandbox' },
          ],
        },
        {
          text: 'फ्रेमवर्क बाइंडिंग',
          items: [
            { text: '@tuvix.js/react', link: '/hi/packages/react' },
            { text: '@tuvix.js/vue', link: '/hi/packages/vue' },
            { text: '@tuvix.js/svelte', link: '/hi/packages/svelte' },
            { text: '@tuvix.js/angular', link: '/hi/packages/angular' },
          ],
        },
        {
          text: 'टूलिंग',
          items: [
            { text: '@tuvix.js/devtools', link: '/hi/packages/devtools' },
            { text: '@tuvix.js/server', link: '/hi/packages/server' },
            { text: '@tuvix.js/vite', link: '/hi/packages/vite' },
            {
              text: '@tuvix.js/module-federation',
              link: '/hi/packages/module-federation',
            },
            { text: 'create-tuvix-app', link: '/hi/packages/create-tuvix-app' },
            { text: 'tuvix.js (umbrella)', link: '/hi/packages/tuvix' },
          ],
        },
      ],
    },

    editLink: {
      pattern:
        'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'इस पृष्ठ को GitHub पर संपादित करें',
    },

    lastUpdated: {
      text: 'अंतिम अपडेट',
      formatOptions: { dateStyle: 'short' },
    },

    docFooter: {
      prev: 'पिछला',
      next: 'अगला',
    },

    outline: {
      label: 'इस पृष्ठ पर',
    },
  },
};
