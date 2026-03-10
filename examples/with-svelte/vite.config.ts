import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({
    compilerOptions: {
      // Force custom element compilation off for standard components if needed, or leave to plugin defaults
    }
  })],
});
