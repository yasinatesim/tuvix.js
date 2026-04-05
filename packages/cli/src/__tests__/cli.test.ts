import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createProject } from '../create-project';

describe('createProject', () => {
  it('should throw when directory already exists', async () => {
    const tmpName = `.tmp/tuvix-test-${Date.now()}`;
    const tmpDir = path.resolve(process.cwd(), tmpName);
    fs.mkdirSync(tmpDir, { recursive: true });

    await expect(
      createProject({ name: tmpName, template: 'shell', typescript: true })
    ).rejects.toThrow('already exists');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should throw for unknown template', async () => {
    await expect(
      createProject({
        name: `.tmp/tuvix-test-unknown`,
        template: 'invalid',
        typescript: true,
      })
    ).rejects.toThrow('Unknown template');
  });

  it('should create project with shell template', async () => {
    const tmpName = `.tmp/tuvix-shell-${Date.now()}`;
    const tmpDir = path.resolve(process.cwd(), tmpName);

    await createProject({ name: tmpName, template: 'shell', typescript: true });

    expect(fs.existsSync(path.join(tmpDir, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'src/main.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'index.html'))).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should create project with react-app template', async () => {
    const tmpName = `.tmp/tuvix-react-${Date.now()}`;
    const tmpDir = path.resolve(process.cwd(), tmpName);

    await createProject({
      name: tmpName,
      template: 'react-app',
      typescript: true,
    });

    expect(fs.existsSync(path.join(tmpDir, 'src/App.tsx'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'src/main.tsx'))).toBe(true);

    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8')
    );
    expect(pkg.dependencies.react).toBeDefined();
    expect(pkg.dependencies['@tuvix.js/react']).toBeDefined();

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should create project with vue-app template', async () => {
    const tmpName = `.tmp/tuvix-vue-${Date.now()}`;
    const tmpDir = path.resolve(process.cwd(), tmpName);

    await createProject({
      name: tmpName,
      template: 'vue-app',
      typescript: true,
    });

    expect(fs.existsSync(path.join(tmpDir, 'src/App.vue'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'src/main.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'package.json'))).toBe(true);

    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8')
    );
    expect(pkg.dependencies.vue).toBeDefined();
    expect(pkg.dependencies['@tuvix.js/vue']).toBeDefined();

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should create project with vanilla-app template', async () => {
    const tmpName = `.tmp/tuvix-vanilla-${Date.now()}`;
    const tmpDir = path.resolve(process.cwd(), tmpName);

    await createProject({
      name: tmpName,
      template: 'vanilla-app',
      typescript: true,
    });

    expect(fs.existsSync(path.join(tmpDir, 'src/main.ts'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'index.html'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'package.json'))).toBe(true);

    const pkg = JSON.parse(
      fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8')
    );
    expect(pkg.dependencies.react).toBeUndefined();
    expect(pkg.dependencies.vue).toBeUndefined();

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should use master branch URL for example download', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../create-project.ts'),
      'utf-8'
    );
    expect(source).toContain('tar.gz/master');
    expect(source).not.toContain('tar.gz/main');
  });

  it('should create project with svelte-app template (TypeScript)', async () => {
    const tmpName = `.tmp/tuvix-svelte-${Date.now()}`;
    const tmpDir = path.resolve(process.cwd(), tmpName);

    await createProject({
      name: tmpName,
      template: 'svelte-app',
      typescript: true,
    });

    try {
      expect(fs.existsSync(path.join(tmpDir, 'src/App.svelte'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'src/main.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'vite.config.ts'))).toBe(true);
      const pkg = JSON.parse(
        fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8')
      );
      expect(pkg.dependencies['@tuvix.js/svelte']).toBeDefined();
      expect(pkg.dependencies.svelte).toBeDefined();
      expect(pkg.devDependencies['@sveltejs/vite-plugin-svelte']).toBeDefined();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should create project with angular-app template (always TypeScript)', async () => {
    const tmpName = `.tmp/tuvix-angular-${Date.now()}`;
    const tmpDir = path.resolve(process.cwd(), tmpName);

    await createProject({
      name: tmpName,
      template: 'angular-app',
      typescript: false,
    });

    try {
      expect(fs.existsSync(path.join(tmpDir, 'src/main.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'src/app/app.component.ts'))).toBe(
        true
      );
      expect(fs.existsSync(path.join(tmpDir, 'vite.config.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tmpDir, 'tsconfig.json'))).toBe(true);
      const tsconfig = JSON.parse(
        fs.readFileSync(path.join(tmpDir, 'tsconfig.json'), 'utf-8')
      );
      expect(tsconfig.compilerOptions.experimentalDecorators).toBe(true);
      const pkg = JSON.parse(
        fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf-8')
      );
      expect(pkg.dependencies['@angular/core']).toBeDefined();
      expect(pkg.dependencies['zone.js']).toBeDefined();
    } finally {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
