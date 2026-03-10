import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const hiConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      { text: 'गाइड', link: '/hi/guide/getting-started', activeMatch: '/hi/guide/' },
      { text: 'पैकेज', link: '/hi/packages/', activeMatch: '/hi/packages/' },
      { text: 'योगदान', link: '/hi/contributing' },
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
      ],
    },
    editLink: {
      pattern: 'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'इस पृष्ठ को GitHub पर संपादित करें',
    },
    lastUpdated: { text: 'अंतिम अद्यतन', formatOptions: { dateStyle: 'short' } },
    docFooter: { prev: 'पिछला', next: 'अगला' },
    outline: { label: 'इस पृष्ठ पर' },
  },
};
