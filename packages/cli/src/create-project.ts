import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as tar from 'tar';

// ─── Types ──────────────────────────────────────────

interface CreateProjectOptions {
  name: string;
  template: string;
  typescript: boolean;
  example?: string | null;
}

// ─── Templates ──────────────────────────────────────

type TemplateFn = (_typescript: boolean) => Record<string, string>;

const TEMPLATES: Record<string, TemplateFn> = {
  shell: generateShellTemplate,
  'react-app': generateReactTemplate,
  'vue-app': generateVueTemplate,
  'vanilla-app': generateVanillaTemplate,
  'svelte-app': generateSvelteTemplate,
  'angular-app': generateAngularTemplate,
};

// ─── Main ───────────────────────────────────────────

export async function createProject(
  options: CreateProjectOptions
): Promise<void> {
  const { name, template, typescript, example } = options;
  const targetDir = path.resolve(process.cwd(), name);

  if (!targetDir.startsWith(process.cwd())) {
    throw new Error(
      'Project directory must be within the current working directory.'
    );
  }

  if (fs.existsSync(targetDir)) {
    throw new Error(`Directory "${name}" already exists.`);
  }

  if (example) {
    fs.mkdirSync(targetDir, { recursive: true });
    await downloadAndExtractExample(example, targetDir);
    const filesInDir = fs.readdirSync(targetDir);
    if (filesInDir.length === 0) {
      throw new Error(
        `Example "${example}" was not found or failed to extract.`
      );
    }
    console.log(`    Downloaded example: ${example}`);
    return;
  }

  const templateFn = TEMPLATES[template];
  if (!templateFn) {
    throw new Error(
      `Unknown template "${template}". Available: ${Object.keys(TEMPLATES).join(', ')}`
    );
  }

  const files = templateFn(typescript);
  files['package.json'] = generatePackageJson(name, template, typescript);

  fs.mkdirSync(targetDir, { recursive: true });

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(targetDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log(`    Created: ${filePath}`);
  }
}

async function downloadAndExtractExample(
  example: string,
  targetDir: string
): Promise<void> {
  // Allowlist: example names are kebab-case directory names only (no path components)
  const safeExample = example.replace(/[^a-z0-9-]/gi, '');
  if (!safeExample || safeExample !== example) {
    throw new Error(
      `Invalid example name "${example}". Only alphanumeric characters and hyphens are allowed.`
    );
  }

  const url = 'https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/master';

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(
            new Error(
              `Failed to download example: ${res.statusCode} ${res.statusMessage}`
            )
          );
          return;
        }
        const extract = tar.x({
          cwd: targetDir,
          strip: 3,
          filter: (p) =>
            p.startsWith(`tuvix.js-master/examples/${safeExample}/`),
        });
        res.pipe(extract).on('finish', resolve).on('error', reject);
      })
      .on('error', reject);
  });
}

// ─── Package JSON Generator ─────────────────────────

/** Version range scaffolded for `tuvix.js` and every `@tuvix.js/*` package. */
export const TUVIX_VERSION_RANGE = '^0.5.0';

function generatePackageJson(
  name: string,
  template: string,
  typescript: boolean
): string {
  const deps: Record<string, string> = { 'tuvix.js': TUVIX_VERSION_RANGE };
  const devDeps: Record<string, string> = { vite: '^6.0.0' };

  if (typescript) {
    devDeps['typescript'] = '^5.7.0';
  }

  if (template === 'react-app') {
    deps['react'] = '^19.0.0';
    deps['react-dom'] = '^19.0.0';
    deps['@tuvix.js/react'] = TUVIX_VERSION_RANGE;
    // Compiles JSX with the automatic runtime in .jsx files too (without it,
    // Vite emits React.createElement and App.jsx has no React in scope).
    devDeps['@vitejs/plugin-react'] = '^4.3.0';
    if (typescript) {
      devDeps['@types/react'] = '^19.0.0';
      devDeps['@types/react-dom'] = '^19.0.0';
    }
  } else if (template === 'vue-app') {
    deps['vue'] = '^3.5.0';
    deps['@tuvix.js/vue'] = TUVIX_VERSION_RANGE;
    devDeps['@vitejs/plugin-vue'] = '^5.2.0';
  } else if (template === 'svelte-app') {
    deps['svelte'] = '^5.0.0';
    deps['@tuvix.js/svelte'] = TUVIX_VERSION_RANGE;
    devDeps['@sveltejs/vite-plugin-svelte'] = '^5.0.0';
    if (typescript) {
      devDeps['svelte-check'] = '^4.0.0';
    }
  } else if (template === 'angular-app') {
    // The adapter runs zoneless and loads @angular/compiler for JIT
    // components (Vite does not AOT-compile), so no zone.js and the compiler
    // is a runtime dependency.
    deps['@angular/common'] = '^20.0.0';
    deps['@angular/compiler'] = '^20.0.0';
    deps['@angular/core'] = '^20.0.0';
    deps['@angular/platform-browser'] = '^20.0.0';
    deps['rxjs'] = '^7.8.0';
    deps['tslib'] = '^2.6.0';
    deps['@tuvix.js/angular'] = TUVIX_VERSION_RANGE;
    devDeps['typescript'] = '~5.8.0';
  }

  const scripts: Record<string, string> = {
    dev: 'vite',
    build: 'vite build',
    preview: 'vite preview',
  };
  if (template === 'svelte-app' && typescript) {
    scripts['check'] = 'svelte-check --tsconfig ./tsconfig.json';
  }

  return JSON.stringify(
    {
      name,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts,
      dependencies: deps,
      devDependencies: devDeps,
    },
    null,
    2
  );
}

// ─── Shared Helpers ─────────────────────────────────

function buildTsconfig(
  extra?: Record<string, unknown>,
  include?: string[]
): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        moduleResolution: 'bundler',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        ...extra,
      },
      include: include ?? ['src'],
    },
    null,
    2
  );
}

// ─── Template Generators ────────────────────────────

function generateShellTemplate(typescript: boolean): Record<string, string> {
  const ext = typescript ? 'ts' : 'js';
  const files: Record<string, string> = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tuvix.js Shell</title>
</head>
<body>
  <div id="header"></div>
  <nav>
    <a href="/dashboard">Dashboard</a>
    <a href="/settings">Settings</a>
  </nav>
  <main id="main"></main>
  <script type="module" src="/src/main.${ext}"></script>
</body>
</html>`,
    [`src/main.${ext}`]: `import { createOrchestrator } from 'tuvix.js';

const orchestrator = createOrchestrator({
  router: {
    mode: 'history',
    routes: [
      { path: '/dashboard/*', app: 'dashboard' },
      { path: '/settings/*', app: 'settings' },
    ],
  },
  onError(error, appName) {
    console.error(\`App "\${appName}" failed:\`, error);
  },
});

orchestrator.register({
  name: 'dashboard',
  entry: 'https://cdn.example.com/dashboard/main.js',
  container: '#main',
  activeWhen: '/dashboard/*',
});

orchestrator.start();
`,
  };

  if (typescript) {
    files['tsconfig.json'] = buildTsconfig();
  }

  return files;
}

function generateReactTemplate(typescript: boolean): Record<string, string> {
  const ext = typescript ? 'tsx' : 'jsx';
  const files: Record<string, string> = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tuvix.js React App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.${ext}"></script>
</body>
</html>`,
    [`src/main.${ext}`]: `import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
`,
    [`src/App.${ext}`]: typescript
      ? `export function App(props: Record<string, unknown>) {
  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui' }}>
      <h1>React Micro App</h1>
      <p>This is a Tuvix.js micro frontend.</p>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}
`
      : `export function App(props) {
  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui' }}>
      <h1>React Micro App</h1>
      <p>This is a Tuvix.js micro frontend.</p>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}
`,
    'vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
  };

  if (typescript) {
    files['tsconfig.json'] = buildTsconfig({ jsx: 'react-jsx' }, [
      'src',
      'vite.config.ts',
    ]);
  }

  return files;
}

function generateVueTemplate(typescript: boolean): Record<string, string> {
  const ext = typescript ? 'ts' : 'js';
  const files: Record<string, string> = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tuvix.js Vue App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.${ext}"></script>
</body>
</html>`,
    [`src/main.${ext}`]: `import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({
  name: 'my-vue-app',
  App,
});
`,
    'src/App.vue': `<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
    <pre>{{ JSON.stringify(props, null, 2) }}</pre>
  </div>
</template>

${typescript ? '<script setup lang="ts">' : '<script setup>'}
import { inject } from 'vue';
import { TUVIX_PROPS_KEY } from '@tuvix.js/vue';

// The props the shell passes to mount() and update(), kept reactive.
const props = inject${typescript ? '<Record<string, unknown>>' : ''}(TUVIX_PROPS_KEY, {});
</script>
`,
    'vite.config.ts': `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
`,
  };

  if (typescript) {
    // Declares `*.vue` modules so tsc accepts the App import.
    files['src/vite-env.d.ts'] = `/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}
`;
    files['tsconfig.json'] = buildTsconfig(undefined, [
      'src',
      'vite.config.ts',
    ]);
  }

  return files;
}

function generateVanillaTemplate(typescript: boolean): Record<string, string> {
  const ext = typescript ? 'ts' : 'js';
  const files: Record<string, string> = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tuvix.js Vanilla App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.${ext}"></script>
</body>
</html>`,
    [`src/main.${ext}`]: `import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'my-vanilla-app',

  async mount({ container }) {
    container.innerHTML = \`
      <div style="padding: 24px; font-family: system-ui">
        <h1>Vanilla Micro App</h1>
        <p>This is a Tuvix.js micro frontend.</p>
      </div>
    \`;
  },

  async unmount({ container }) {
    container.innerHTML = '';
  },
});
`,
  };

  if (typescript) {
    files['tsconfig.json'] = buildTsconfig();
  }

  return files;
}

// ─── Svelte Template ────────────────────────────────

function generateSvelteTemplate(typescript: boolean): Record<string, string> {
  const mainExt = typescript ? 'ts' : 'js';
  const props = typescript
    ? `<script lang="ts">
  let { name = 'Tuvix.js' }: { name?: string } = $props();
</script>`
    : `<script>
  let { name = 'Tuvix.js' } = $props();
</script>`;

  const files: Record<string, string> = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tuvix.js Svelte App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.${mainExt}"></script>
</body>
</html>`,
    [`src/main.${mainExt}`]: `import { SvelteMap } from 'svelte/reactivity';
import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

// SvelteMap lets update({ props }) re-render in place instead of remounting.
export default createSvelteMicroApp({
  name: 'my-svelte-app',
  App,
  SvelteMap,
});
`,
    'src/App.svelte': `${props}

<div style="padding: 24px; font-family: system-ui">
  <h1>Svelte Micro App</h1>
  <p>This is a {name} micro frontend.</p>
</div>
`,
    'vite.config.ts': `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
});
`,
    // svelte-check and vite-plugin-svelte read preprocessing from here;
    // vitePreprocess handles <script lang="ts">.
    'svelte.config.js': `import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
};
`,
  };

  if (typescript) {
    // Declares `*.svelte` modules so tsc and svelte-check accept the App import.
    files['src/vite-env.d.ts'] = `/// <reference types="svelte" />
/// <reference types="vite/client" />
`;
    files['tsconfig.json'] = buildTsconfig(undefined, [
      'src',
      'vite.config.ts',
    ]);
  }

  return files;
}

// ─── Angular Template ────────────────────────────────

function generateAngularTemplate(_typescript: boolean): Record<string, string> {
  // Angular is always TypeScript — _typescript param accepted for interface compatibility
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tuvix.js Angular App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,
    'src/main.ts': `// Load the JIT compiler before any Angular package that ships partially
// compiled code (@angular/common, forms, router) is evaluated.
import '@angular/compiler';
import { createSsrAngularMicroApp } from '@tuvix.js/angular';
import { AppComponent } from './app/app.component';

export default createSsrAngularMicroApp({
  name: 'my-angular-app',
  component: AppComponent,
});
`,
    'src/app/app.component.ts': `import { Component } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-root',
  template: \`
    <div style="padding: 24px; font-family: system-ui">
      <h1>Angular Micro App</h1>
      <p>This is a Tuvix.js micro frontend.</p>
    </div>
  \`,
})
export class AppComponent {}
`,
    'vite.config.ts': `import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    target: 'es2022',
  },
});
`,
    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          experimentalDecorators: true,
          useDefineForClassFields: false,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ['src'],
      },
      null,
      2
    ),
  };
}
