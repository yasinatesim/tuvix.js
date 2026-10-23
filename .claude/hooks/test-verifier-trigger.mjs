#!/usr/bin/env node
// PostToolUse(Edit|Write|MultiEdit), advisory: when a test file's tests assert only that something
// exists or does not throw, tell the model to dispatch the test-verifier agent. Never blocks.
import { readFileSync } from 'node:fs';
import { advise, editedFile, readPayload } from './_input.mjs';

const TEST_FILE = /\.(test|spec)\.(ts|tsx|js|jsx|mts|mjs)$/;
const TEST_START = /\b(?:it|test)(?:\.(?:only|concurrent|todo|fails))?\s*\(\s*(['"`])((?:(?!\1).)*)\1/g;
const MATCHER = /\.\s*(not\s*\.\s*)?(?:resolves\s*\.\s*|rejects\s*\.\s*)?(to[A-Z]\w*)\s*\(/g;
const WEAK = new Set(['toBeDefined', 'not.toThrow', 'toBeTruthy', 'not.toBeUndefined', 'not.toBeNull']);

/** Names of tests whose every assertion is a weak existence or no-throw check. */
function weakTests(source) {
  const starts = [...source.matchAll(TEST_START)];
  const weak = [];
  starts.forEach((match, index) => {
    const end = index + 1 < starts.length ? starts[index + 1].index : source.length;
    const body = source.slice(match.index, end);
    const matchers = [...body.matchAll(MATCHER)].map((m) => (m[1] ? `not.${m[2]}` : m[2]));
    if (matchers.length > 0 && matchers.every((m) => WEAK.has(m))) {
      weak.push(`"${match[2]}" (${[...new Set(matchers)].join(', ')})`);
    }
  });
  return weak;
}

const file = editedFile(await readPayload());
if (!file || !TEST_FILE.test(file.rel)) process.exit(0);

let source;
try {
  source = readFileSync(file.absolute, 'utf8');
} catch {
  process.exit(0);
}

const weak = weakTests(source);
if (weak.length > 0) {
  advise(
    'PostToolUse',
    `Advisory from test-verifier-trigger: ${file.rel} has ${weak.length} test(s) whose only assertions are existence or no-throw checks: ${weak.join('; ')}. ` +
      'Name the broken implementation each test must catch and assert the behaviour (DOM, event detail, registry entry). ' +
      'Dispatch the test-verifier agent (.claude/agents/test-verifier.md) on this file before you finish.'
  );
}
process.exit(0);
