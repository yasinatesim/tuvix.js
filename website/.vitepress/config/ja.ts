import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const jaConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      { text: 'ガイド', link: '/ja/guide/getting-started', activeMatch: '/ja/guide/' },
      { text: 'パッケージ', link: '/ja/packages/', activeMatch: '/ja/packages/' },
      { text: 'コントリビュート', link: '/ja/contributing' },
    ],
    sidebar: {
      '/ja/guide/': [
        {
          text: 'はじめに',
          items: [
            { text: 'Tuvix.jsとは？', link: '/ja/guide/what-is-tuvix' },
            { text: 'はじめ方', link: '/ja/guide/getting-started' },
            { text: '設定', link: '/ja/guide/configuration' },
            { text: 'アーキテクチャ', link: '/ja/guide/architecture' },
          ],
        },
      ],
      '/ja/packages/': [
        {
          text: 'コア',
          items: [
            { text: '概要', link: '/ja/packages/' },
            { text: '@tuvix.js/core', link: '/ja/packages/core' },
            { text: '@tuvix.js/router', link: '/ja/packages/router' },
            { text: '@tuvix.js/event-bus', link: '/ja/packages/event-bus' },
            { text: '@tuvix.js/loader', link: '/ja/packages/loader' },
            { text: '@tuvix.js/sandbox', link: '/ja/packages/sandbox' },
          ],
        },
        {
          text: 'フレームワークバインディング',
          items: [
            { text: '@tuvix.js/react', link: '/ja/packages/react' },
            { text: '@tuvix.js/vue', link: '/ja/packages/vue' },
            { text: '@tuvix.js/svelte', link: '/ja/packages/svelte' },
            { text: '@tuvix.js/angular', link: '/ja/packages/angular' },
          ],
        },
      ],
    },
    editLink: {
      pattern: 'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: 'GitHubでこのページを編集',
    },
    lastUpdated: { text: '最終更新', formatOptions: { dateStyle: 'short' } },
    docFooter: { prev: '前へ', next: '次へ' },
    outline: { label: 'このページの内容' },
  },
};
