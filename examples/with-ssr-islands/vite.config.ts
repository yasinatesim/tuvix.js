import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { tuvix } from '@tuvix.js/vite';

// In this monorepo the @tuvix.js adapters are symlinked from packages/*, and
// each package has its own node_modules with dev copies of the frameworks
// (packages/angular, for example, develops against Angular 16). `dedupe`
// makes the adapters import the same framework copy as the island
// components. An app that installs @tuvix.js from npm does not need it.
const frameworks = [
  'react',
  'react-dom',
  'vue',
  '@vue/server-renderer',
  'svelte',
  '@angular/core',
  '@angular/common',
  '@angular/compiler',
  '@angular/platform-browser',
  '@angular/platform-server',
];

export default defineConfig(({ command, isSsrBuild }) => ({
  plugins: [react(), vue(), svelte(), tuvix()],
  resolve: { dedupe: frameworks },
  // Strip Angular's dev-only checks from the production client bundle, like
  // the Angular CLI does.
  define: command === 'build' && !isSsrBuild ? { ngDevMode: 'false' } : {},
  build: {
    rollupOptions: isSsrBuild ? {} : { input: 'src/entry-client.tsx' },
  },
  optimizeDeps: {
    // No index.html: tell Vite where the client graph starts, and pre-bundle
    // the Angular packages up front so the first Angular mount does not
    // trigger a dependency re-optimisation and a full reload in dev.
    entries: ['src/entry-client.tsx'],
    include: [
      '@angular/core',
      '@angular/common',
      '@angular/compiler',
      '@angular/platform-browser',
    ],
  },
}));
