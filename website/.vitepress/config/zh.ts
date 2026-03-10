import type { DefaultTheme, LocaleConfig } from 'vitepress';

export const zhConfig: LocaleConfig<DefaultTheme.Config>[string] = {
  themeConfig: {
    nav: [
      { text: '指南', link: '/zh/guide/getting-started', activeMatch: '/zh/guide/' },
      { text: '包', link: '/zh/packages/', activeMatch: '/zh/packages/' },
      { text: '贡献', link: '/zh/contributing' },
    ],
    sidebar: {
      '/zh/guide/': [
        {
          text: '介绍',
          items: [
            { text: '什么是 Tuvix.js？', link: '/zh/guide/what-is-tuvix' },
            { text: '快速上手', link: '/zh/guide/getting-started' },
            { text: '配置', link: '/zh/guide/configuration' },
            { text: '架构', link: '/zh/guide/architecture' },
          ],
        },
      ],
      '/zh/packages/': [
        {
          text: '核心',
          items: [
            { text: '概述', link: '/zh/packages/' },
            { text: '@tuvix.js/core', link: '/zh/packages/core' },
            { text: '@tuvix.js/router', link: '/zh/packages/router' },
            { text: '@tuvix.js/event-bus', link: '/zh/packages/event-bus' },
            { text: '@tuvix.js/loader', link: '/zh/packages/loader' },
            { text: '@tuvix.js/sandbox', link: '/zh/packages/sandbox' },
          ],
        },
        {
          text: '框架绑定',
          items: [
            { text: '@tuvix.js/react', link: '/zh/packages/react' },
            { text: '@tuvix.js/vue', link: '/zh/packages/vue' },
            { text: '@tuvix.js/svelte', link: '/zh/packages/svelte' },
            { text: '@tuvix.js/angular', link: '/zh/packages/angular' },
          ],
        },
      ],
    },
    editLink: {
      pattern: 'https://github.com/yasinatesim/tuvix.js/edit/master/website/:path',
      text: '在 GitHub 上编辑此页',
    },
    lastUpdated: { text: '最后更新', formatOptions: { dateStyle: 'short' } },
    docFooter: { prev: '上一页', next: '下一页' },
    outline: { label: '本页目录' },
  },
};
