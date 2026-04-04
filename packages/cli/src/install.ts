import { spawn } from 'node:child_process';
import { spinner } from '@clack/prompts';

export async function installDependencies(
  cwd: string,
  pm: string
): Promise<void> {
  const s = spinner();
  s.start(`Installing dependencies with ${pm}`);

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(pm, ['install'], { cwd, stdio: 'ignore' });
      child.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error(`exit ${code}`))
      );
      child.on('error', reject);
    });
    s.stop('Dependencies installed');
  } catch {
    s.stop('Install failed. Run manually:');
    console.log(`  cd ${cwd}`);
    console.log(`  ${pm} install`);
  }
}
