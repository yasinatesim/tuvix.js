import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitepress';
import { sharedConfig } from './config/shared';
import { enConfig } from './config/en';
import { trConfig } from './config/tr';
import { esConfig } from './config/es';
import { deConfig } from './config/de';
import { frConfig } from './config/fr';
import { jaConfig } from './config/ja';
import { zhConfig } from './config/zh';
import { itConfig } from './config/it';
import { ptConfig } from './config/pt';
import { hiConfig } from './config/hi';

export default defineConfig({
  ...sharedConfig,
  head: [
    ...(sharedConfig.head ?? []).filter(
      ([tag, attrs]) => !(tag === 'meta' && attrs.name === 'theme-color')
    ),
    [
      'link',
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    ],
    [
      'meta',
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: dark)',
        content: '#080c10',
      },
    ],
    [
      'meta',
      {
        name: 'theme-color',
        media: '(prefers-color-scheme: light)',
        content: '#f8fafb',
      },
    ],
  ],
  vite: {
    resolve: {
      alias: [
        {
          // Every `layout: home` page renders the Orbit home instead of VPHome.
          find: /^.*\/VPHome\.vue$/,
          replacement: fileURLToPath(
            new URL('./theme/components/home/OrbitHome.vue', import.meta.url)
          ),
        },
      ],
    },
    css: {
      preprocessorOptions: {
        scss: { api: 'modern-compiler' },
      },
    },
  },
  locales: {
    root: { label: 'English', lang: 'en', ...enConfig },
    tr: { label: 'Türkçe', lang: 'tr', ...trConfig },
    es: { label: 'Español', lang: 'es', ...esConfig },
    de: { label: 'Deutsch', lang: 'de', ...deConfig },
    fr: { label: 'Français', lang: 'fr', ...frConfig },
    ja: { label: '日本語', lang: 'ja', ...jaConfig },
    zh: { label: '中文', lang: 'zh', ...zhConfig },
    it: { label: 'Italiano', lang: 'it', ...itConfig },
    pt: { label: 'Português', lang: 'pt', ...ptConfig },
    hi: { label: 'हिन्दी', lang: 'hi', ...hiConfig },
  },
});
