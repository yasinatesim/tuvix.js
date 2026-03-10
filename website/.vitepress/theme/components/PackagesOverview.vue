<script setup lang="ts">
import { useData } from 'vitepress';

const { lang } = useData();

interface Package {
  name: string;
  title: string;
  description: string;
  badge: string;
  link: string;
  icon: string;
}

interface LocalePackages {
  core: Package[];
  bindings: Package[];
  tooling: Package[];
}

const labels: Record<string, { core: string; bindings: string; tooling: string }> = {
  en: { core: 'Core Packages', bindings: 'Framework Bindings', tooling: 'Tooling' },
  tr: { core: 'Temel Paketler', bindings: 'Framework Bağlamaları', tooling: 'Araçlar' },
  es: { core: 'Paquetes Principales', bindings: 'Bindings de Framework', tooling: 'Herramientas' },
  de: { core: 'Kernpakete', bindings: 'Framework-Bindungen', tooling: 'Werkzeuge' },
  fr: { core: 'Paquets Principaux', bindings: 'Liaisons Framework', tooling: 'Outils' },
  ja: { core: 'コアパッケージ', bindings: 'フレームワークバインディング', tooling: 'ツール' },
  zh: { core: '核心包', bindings: '框架绑定', tooling: '工具' },
  it: { core: 'Pacchetti Core', bindings: 'Binding Framework', tooling: 'Strumenti' },
  pt: { core: 'Pacotes Principais', bindings: 'Bindings de Framework', tooling: 'Ferramentas' },
  hi: { core: 'मुख्य पैकेज', bindings: 'फ्रेमवर्क बाइंडिंग', tooling: 'टूलिंग' },
};

const prefix = lang.value === 'en' ? '' : `/${lang.value}`;

const packages: LocalePackages = {
  core: [
    {
      name: '@tuvix.js/core',
      title: 'Core',
      description: 'The orchestrator — registers, mounts, and manages all micro app lifecycles.',
      badge: 'Required',
      link: `${prefix}/packages/core`,
      icon: '⚙️',
    },
    {
      name: '@tuvix.js/router',
      title: 'Router',
      description: 'URL-based micro app routing with history and hash mode support.',
      badge: 'Core',
      link: `${prefix}/packages/router`,
      icon: '🔀',
    },
    {
      name: '@tuvix.js/event-bus',
      title: 'Event Bus',
      description: 'Typed inter-app communication. Publish and subscribe across micro apps.',
      badge: 'Core',
      link: `${prefix}/packages/event-bus`,
      icon: '📡',
    },
    {
      name: '@tuvix.js/loader',
      title: 'Loader',
      description: 'Dynamic module loading with caching, retry and error boundary support.',
      badge: 'Core',
      link: `${prefix}/packages/loader`,
      icon: '📦',
    },
    {
      name: '@tuvix.js/sandbox',
      title: 'Sandbox',
      description: 'CSS and JS isolation using Shadow DOM and JS Proxy. Prevent style leakage.',
      badge: 'Core',
      link: `${prefix}/packages/sandbox`,
      icon: '🔒',
    },
  ],
  bindings: [
    {
      name: '@tuvix.js/react',
      title: 'React',
      description: 'React 18+ bindings with hooks — useMicroApp, useTuvixEvent.',
      badge: 'Binding',
      link: `${prefix}/packages/react`,
      icon: '⚛️',
    },
    {
      name: '@tuvix.js/vue',
      title: 'Vue',
      description: 'Vue 3 bindings with composables — useMicroApp, useTuvixEvent.',
      badge: 'Binding',
      link: `${prefix}/packages/vue`,
      icon: '💚',
    },
    {
      name: '@tuvix.js/svelte',
      title: 'Svelte',
      description: 'Svelte 3/4/5 bindings with reactive stores and lifecycle integration.',
      badge: 'Binding',
      link: `${prefix}/packages/svelte`,
      icon: '🔥',
    },
    {
      name: '@tuvix.js/angular',
      title: 'Angular',
      description: 'Angular 15+ module, service and directive bindings for micro apps.',
      badge: 'Binding',
      link: `${prefix}/packages/angular`,
      icon: '🔺',
    },
  ],
  tooling: [
    {
      name: '@tuvix.js/devtools',
      title: 'DevTools',
      description: 'In-browser debug panel. Inspect registered apps, events and loader state.',
      badge: 'Dev',
      link: `${prefix}/packages/devtools`,
      icon: '🛠️',
    },
    {
      name: '@tuvix.js/server',
      title: 'Server',
      description: 'Server-side composition — pre-render and stitch micro app HTML on the server.',
      badge: 'SSR',
      link: `${prefix}/packages/server`,
      icon: '🖥️',
    },
    {
      name: '@tuvix.js/module-federation',
      title: 'Module Federation',
      description: 'Webpack 5 Module Federation integration for sharing remote micro apps.',
      badge: 'Integration',
      link: `${prefix}/packages/module-federation`,
      icon: '🌐',
    },
    {
      name: 'create-tuvix-app',
      title: 'create-tuvix-app',
      description: 'CLI scaffolding tool. Instantly bootstrap a Tuvix.js micro app project.',
      badge: 'CLI',
      link: `${prefix}/packages/create-tuvix-app`,
      icon: '🚀',
    },
  ],
};

const l = labels[lang.value] ?? labels.en;
</script>

<template>
  <div>
    <h2>{{ l.core }}</h2>
    <div class="pkg-grid">
      <a
        v-for="pkg in packages.core"
        :key="pkg.name"
        :href="pkg.link"
        class="pkg-card"
      >
        <div class="pkg-card-name">{{ pkg.icon }} {{ pkg.name }}</div>
        <div class="pkg-card-title">{{ pkg.title }}</div>
        <div class="pkg-card-desc">{{ pkg.description }}</div>
        <span class="pkg-card-badge">{{ pkg.badge }}</span>
      </a>
    </div>

    <h2>{{ l.bindings }}</h2>
    <div class="pkg-grid">
      <a
        v-for="pkg in packages.bindings"
        :key="pkg.name"
        :href="pkg.link"
        class="pkg-card"
      >
        <div class="pkg-card-name">{{ pkg.icon }} {{ pkg.name }}</div>
        <div class="pkg-card-title">{{ pkg.title }}</div>
        <div class="pkg-card-desc">{{ pkg.description }}</div>
        <span class="pkg-card-badge">{{ pkg.badge }}</span>
      </a>
    </div>

    <h2>{{ l.tooling }}</h2>
    <div class="pkg-grid">
      <a
        v-for="pkg in packages.tooling"
        :key="pkg.name"
        :href="pkg.link"
        class="pkg-card"
      >
        <div class="pkg-card-name">{{ pkg.icon }} {{ pkg.name }}</div>
        <div class="pkg-card-title">{{ pkg.title }}</div>
        <div class="pkg-card-desc">{{ pkg.description }}</div>
        <span class="pkg-card-badge">{{ pkg.badge }}</span>
      </a>
    </div>
  </div>
</template>
