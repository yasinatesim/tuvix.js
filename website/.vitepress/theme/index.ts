import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './style.css';
import PackagesOverview from './components/PackagesOverview.vue';
import PackageHeader from './components/PackageHeader.vue';
import CodeExample from './components/CodeExample.vue';

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('PackagesOverview', PackagesOverview);
    app.component('PackageHeader', PackageHeader);
    app.component('CodeExample', CodeExample);
  },
} satisfies Theme;
