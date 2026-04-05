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
          filter: (p) => p.startsWith(`tuvix.js-master/examples/${example}/`),
        });
        res.pipe(extract).on('finish', resolve).on('error', reject);
      })
      .on('error', reject);
  });
}

// ─── Package JSON Generator ─────────────────────────

function generatePackageJson(
  name: string,
  template: string,
  typescript: boolean
): string {
  const deps: Record<string, string> = { 'tuvix.js': '^0.1.0' };
  const devDeps: Record<string, string> = { vite: '^6.0.0' };

  if (typescript) {
    devDeps['typescript'] = '^5.7.0';
  }

  if (template === 'react-app') {
    deps['react'] = '^19.0.0';
    deps['react-dom'] = '^19.0.0';
    deps['@tuvix.js/react'] = '^0.1.0';
    if (typescript) {
      devDeps['@types/react'] = '^19.0.0';
      devDeps['@types/react-dom'] = '^19.0.0';
    }
  } else if (template === 'vue-app') {
    deps['vue'] = '^3.5.0';
    deps['@tuvix.js/vue'] = '^0.1.0';
  } else if (template === 'svelte-app') {
    deps['svelte'] = '^4.0.0';
    deps['@tuvix.js/svelte'] = '^0.1.0';
    devDeps['@sveltejs/vite-plugin-svelte'] = '^3.0.0';
  } else if (template === 'angular-app') {
    deps['@angular/core'] = '^17.0.0';
    deps['@angular/platform-browser'] = '^17.0.0';
    deps['zone.js'] = '^0.14.0';
    deps['@tuvix.js/core'] = '^0.1.0';
    devDeps['@angular/compiler'] = '^17.0.0';
    devDeps['typescript'] = '^5.7.0';
  }

  return JSON.stringify(
    {
      name,
      version: '0.1.0',
      private: true,
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
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
  };

  if (typescript) {
    files['tsconfig.json'] = buildTsconfig({ jsx: 'react-jsx' });
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
    'src/App.vue': typescript
      ? `<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
  </div>
</template>

<script setup lang="ts">
defineProps<Record<string, unknown>>();
</script>
`
      : `<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
  </div>
</template>

<script setup>
defineProps({});
</script>
`,
  };

  if (typescript) {
    files['tsconfig.json'] = buildTsconfig();
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
  const scriptTag = typescript ? '<script lang="ts">' : '<script>';

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
    [`src/main.${mainExt}`]: `import { createSvelteMicroApp } from '@tuvix.js/svelte';
import App from './App.svelte';

export default createSvelteMicroApp({
  name: 'my-svelte-app',
  App,
});
`,
    'src/App.svelte': `${scriptTag}
  export let name = 'Tuvix.js';
</script>

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
  };

  if (typescript) {
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
    'src/main.ts': `import { defineMicroApp } from 'tuvix.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

export default defineMicroApp({
  name: 'my-angular-app',

  async mount({ container }) {
    const el = document.createElement('app-root');
    container.appendChild(el);
    await bootstrapApplication(AppComponent);
  },

  async unmount({ container }) {
    container.innerHTML = '';
  },
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
