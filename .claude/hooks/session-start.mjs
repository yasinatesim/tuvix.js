#!/usr/bin/env node
// SessionStart: put SESSION_RULES.md and MEMORY.md in context before the first edit.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { advise, projectRoot } from './_input.mjs';

function readOrNote(rel) {
  try {
    return readFileSync(join(projectRoot, rel), 'utf8').trim();
  } catch {
    return `(${rel} not found)`;
  }
}

advise(
  'SessionStart',
  [
    'MANDATORY RULES (.claude/SESSION_RULES.md). Obey them before writing code.',
    readOrNote('.claude/SESSION_RULES.md'),
    'MEMORY (.claude/memory/MEMORY.md). Background facts from earlier sessions; verify a named file or API still exists before relying on it.',
    readOrNote('.claude/memory/MEMORY.md'),
  ].join('\n\n')
);
