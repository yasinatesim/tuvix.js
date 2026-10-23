#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit): auto-fix one edited file under packages/*/src with ESLint and
// Prettier. Exit 2 (feedback to the model) only when ESLint errors remain or Prettier cannot parse it.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { editedFile, projectRoot, readPayload } from './_input.mjs';

const SOURCE = /^packages\/[^/]+\/src\/.+\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;
const LINTED = /\.(ts|tsx)$/;

function run(args) {
  const result = spawnSync('pnpm', ['exec', ...args], {
    cwd: projectRoot,
    encoding: 'utf8',
    timeout: 60_000,
  });
  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ? String(result.error) : ''}`.trim(),
  };
}

const file = editedFile(await readPayload());
if (!file || !SOURCE.test(file.rel) || !existsSync(file.absolute)) process.exit(0);

const problems = [];
if (LINTED.test(file.rel)) {
  const eslint = run(['eslint', '--fix', '--no-warn-ignored', file.rel]);
  if (!eslint.ok) problems.push(`ESLint errors left after --fix in ${file.rel}:\n${eslint.output}`);
}
const prettier = run(['prettier', '--write', '--log-level', 'warn', file.rel]);
if (!prettier.ok) problems.push(`Prettier failed on ${file.rel}:\n${prettier.output}`);

if (problems.length > 0) {
  process.stderr.write(`${problems.join('\n\n')}\n`);
  process.exit(2);
}
process.exit(0);
