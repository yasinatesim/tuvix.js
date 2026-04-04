export function detectPackageManager(): 'npm' | 'pnpm' | 'yarn' | 'bun' {
  // Layer 1: Bun runtime — most reliable signal for bunx
  if ((process.versions as Record<string, string>).bun) return 'bun';

  // Layer 2: npm_execpath — set by npx/pnpx
  const execPath = process.env.npm_execpath ?? '';
  if (execPath.includes('pnpm')) return 'pnpm';
  if (execPath.includes('yarn')) return 'yarn';

  // Layer 3: user agent — format "pnpm/8.x ...", "yarn/1.x ...", "bun/1.x"
  const agent = process.env.npm_config_user_agent ?? '';
  if (agent.startsWith('pnpm')) return 'pnpm';
  if (agent.startsWith('yarn')) return 'yarn';
  if (agent.startsWith('bun/')) return 'bun';

  return 'npm';
}
