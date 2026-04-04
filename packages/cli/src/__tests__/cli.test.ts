import { describe, it, expect, vi } from 'vitest';
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
});
