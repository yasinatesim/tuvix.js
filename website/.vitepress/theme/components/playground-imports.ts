/**
 * Import maps for the live playground iframe.
 *
 * Every tuvix package version comes from its package.json in this repo, read
 * at build time, so the playground loads the same versions the site documents.
 * esm.sh serves each tuvix package with the `*` prefix, which leaves all of its
 * dependencies as bare imports. The import map below resolves those bare
 * imports, so the iframe loads exactly one copy of each tuvix package.
 */

import { version as tuvixVersion } from '../../../../packages/tuvix/package.json';
import { version as coreVersion } from '../../../../packages/core/package.json';
import { version as loaderVersion } from '../../../../packages/loader/package.json';
import { version as routerVersion } from '../../../../packages/router/package.json';
import { version as eventBusVersion } from '../../../../packages/event-bus/package.json';
import { version as sandboxVersion } from '../../../../packages/sandbox/package.json';
import { version as reactVersion } from '../../../../packages/react/package.json';
import { version as vueVersion } from '../../../../packages/vue/package.json';
import { version as svelteVersion } from '../../../../packages/svelte/package.json';

/** Repo version of every tuvix package the playground loads. */
export const TUVIX_VERSIONS: Readonly<Record<string, string>> = {
  'tuvix.js': tuvixVersion,
  '@tuvix.js/core': coreVersion,
  '@tuvix.js/loader': loaderVersion,
  '@tuvix.js/router': routerVersion,
  '@tuvix.js/event-bus': eventBusVersion,
  '@tuvix.js/sandbox': sandboxVersion,
  '@tuvix.js/react': reactVersion,
  '@tuvix.js/vue': vueVersion,
  '@tuvix.js/svelte': svelteVersion,
};

/** esm.sh URL for a tuvix package pinned to its repo version, dependencies left external. */
function tuvixUrl(name: string): string {
  return `https://esm.sh/*${name}@${TUVIX_VERSIONS[name]}`;
}

const BASE: Record<string, string> = {
  'tuvix.js': tuvixUrl('tuvix.js'),
  '@tuvix.js/core': tuvixUrl('@tuvix.js/core'),
  '@tuvix.js/loader': tuvixUrl('@tuvix.js/loader'),
  '@tuvix.js/router': tuvixUrl('@tuvix.js/router'),
  '@tuvix.js/event-bus': tuvixUrl('@tuvix.js/event-bus'),
  '@tuvix.js/sandbox': tuvixUrl('@tuvix.js/sandbox'),
};

const FRAMEWORK_IMPORTS: Record<string, Record<string, string>> = {
  react: {
    '@tuvix.js/react': tuvixUrl('@tuvix.js/react'),
    react: 'https://esm.sh/react@18',
    'react-dom': 'https://esm.sh/react-dom@18',
    'react-dom/client': 'https://esm.sh/react-dom@18/client',
    'react/jsx-runtime': 'https://esm.sh/react@18/jsx-runtime',
  },
  vue: {
    '@tuvix.js/vue': tuvixUrl('@tuvix.js/vue'),
    // Full browser build so the runtime template compiler is available
    vue: 'https://cdn.jsdelivr.net/npm/vue@3/dist/vue.esm-browser.js',
  },
  svelte: {
    '@tuvix.js/svelte': tuvixUrl('@tuvix.js/svelte'),
    svelte: 'https://esm.sh/svelte@4',
    'svelte/internal': 'https://esm.sh/svelte@4/internal',
    'svelte/internal/disclose-version':
      'https://esm.sh/svelte@4/internal/disclose-version',
    'svelte/store': 'https://esm.sh/svelte@4/store',
    'svelte/transition': 'https://esm.sh/svelte@4/transition',
    'svelte/animate': 'https://esm.sh/svelte@4/animate',
    'svelte/easing': 'https://esm.sh/svelte@4/easing',
    'svelte/motion': 'https://esm.sh/svelte@4/motion',
  },
  angular: {
    '@angular/core': 'https://esm.sh/@angular/core@17',
    '@angular/common': 'https://esm.sh/@angular/common@17',
    '@angular/forms': 'https://esm.sh/@angular/forms@17',
    '@angular/compiler': 'https://esm.sh/@angular/compiler@17',
    '@angular/platform-browser': 'https://esm.sh/@angular/platform-browser@17',
    '@angular/platform-browser/animations':
      'https://esm.sh/@angular/platform-browser@17/animations',
    rxjs: 'https://esm.sh/rxjs@7',
    'rxjs/operators': 'https://esm.sh/rxjs@7/operators',
  },
};

/**
 * Import map entries for a playground tab: the core tuvix packages plus the
 * tab's framework and its tuvix binding.
 *
 * @example
 * ```ts
 * const imports = playgroundImports('react');
 * imports['@tuvix.js/react']; // 'https://esm.sh/*@tuvix.js/react@<repo version>'
 * ```
 */
export function playgroundImports(tabId: string): Record<string, string> {
  return { ...BASE, ...(FRAMEWORK_IMPORTS[tabId] ?? {}) };
}
