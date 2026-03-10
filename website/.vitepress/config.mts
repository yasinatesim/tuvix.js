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
