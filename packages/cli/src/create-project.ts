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

const TEMPLATES: Record<string, () => Record<string, string>> = {
  shell: generateShellTemplate,
  'react-app': generateReactTemplate,
  'vue-app': generateVueTemplate,
  'vanilla-app': generateVanillaTemplate,
};

// ─── Main ───────────────────────────────────────────

export async function createProject(options: CreateProjectOptions): Promise<void> {
  const { name, template, example } = options;
  const targetDir = path.resolve(process.cwd(), name);

  if (!targetDir.startsWith(process.cwd())) {
    throw new Error('Project directory must be within the current working directory.');
  }

  if (fs.existsSync(targetDir)) {
    throw new Error(`Directory "${name}" already exists.`);
  }

  if (example) {
    fs.mkdirSync(targetDir, { recursive: true });
    await downloadAndExtractExample(example, targetDir);
    
    // Check if the directory is actually empty, meaning the example wasn't found
    const filesInDir = fs.readdirSync(targetDir);
    if (filesInDir.length === 0) {
      throw new Error(`Example "${example}" was not found or failed to extract.`);
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

  const files = templateFn();
  files['package.json'] = generatePackageJson(name, template);

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

async function downloadAndExtractExample(example: string, targetDir: string): Promise<void> {
  const url = 'https://codeload.github.com/yasinatesim/tuvix.js/tar.gz/main';

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download example: ${res.statusCode} ${res.statusMessage}`));
        return;
      }

      const extract = tar.x({
        cwd: targetDir,
        strip: 3, 
        filter: (p) => p.startsWith(`tuvix.js-main/examples/${example}/`)
      });

      res.pipe(extract)
        .on('finish', resolve)
        .on('error', reject);
    }).on('error', reject);
  });
}

// ─── Package JSON Generator ─────────────────────────

function generatePackageJson(name: string, template: string): string {
  const deps: Record<string, string> = { 'tuvix.js': '^0.1.0' };
  const devDeps: Record<string, string> = {
    typescript: '^5.7.0',
    vite: '^6.0.0',
  };

  if (template === 'react-app') {
    deps['react'] = '^19.0.0';
    deps['react-dom'] = '^19.0.0';
    deps['@tuvix.js/react'] = '^0.1.0';
    devDeps['@types/react'] = '^19.0.0';
    devDeps['@types/react-dom'] = '^19.0.0';
  } else if (template === 'vue-app') {
    deps['vue'] = '^3.5.0';
    deps['@tuvix.js/vue'] = '^0.1.0';
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

// ─── Template Generators ────────────────────────────

function generateShellTemplate(): Record<string, string> {
  return {
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
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,
    'src/main.ts': `import { createOrchestrator } from 'tuvix.js';

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
console.log('🚀 Tuvix.js shell started');
`,
    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
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

function generateReactTemplate(): Record<string, string> {
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tuvix.js React App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`,
    'src/main.tsx': `import { createReactMicroApp } from '@tuvix.js/react';
import { App } from './App';

export default createReactMicroApp({
  name: 'my-react-app',
  App,
});
`,
    'src/App.tsx': `export function App(props: Record<string, unknown>) {
  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui' }}>
      <h1>🚀 React Micro App</h1>
      <p>This is a Tuvix.js micro frontend.</p>
      <pre>{JSON.stringify(props, null, 2)}</pre>
    </div>
  );
}
`,
    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
          jsx: 'react-jsx',
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

function generateVueTemplate(): Record<string, string> {
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tuvix.js Vue App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,
    'src/main.ts': `import { createVueMicroApp } from '@tuvix.js/vue';
import App from './App.vue';

export default createVueMicroApp({
  name: 'my-vue-app',
  App,
});
`,
    'src/App.vue': `<template>
  <div style="padding: 24px; font-family: system-ui">
    <h1>🚀 Vue Micro App</h1>
    <p>This is a Tuvix.js micro frontend.</p>
  </div>
</template>

<script setup lang="ts">
defineProps<Record<string, unknown>>();
</script>
`,
    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
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

function generateVanillaTemplate(): Record<string, string> {
  return {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tuvix.js Vanilla App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`,
    'src/main.ts': `import { defineMicroApp } from 'tuvix.js';

export default defineMicroApp({
  name: 'my-vanilla-app',

  async mount({ container }) {
    container.innerHTML = \`
      <div style="padding: 24px; font-family: system-ui">
        <h1>🚀 Vanilla Micro App</h1>
        <p>This is a Tuvix.js micro frontend.</p>
      </div>
    \`;
  },

  async unmount({ container }) {
    container.innerHTML = '';
  },
});
`,
    'tsconfig.json': JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2020',
          module: 'ESNext',
          moduleResolution: 'bundler',
          strict: true,
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
