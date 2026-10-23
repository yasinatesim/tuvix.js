#!/usr/bin/env node
// PreToolUse(Bash): the human owns git writes in this repo. Blocks commands that write history,
// move refs or discard working-tree changes (see gitViolation). Exit 2 = blocked.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { projectRoot, readPayload } from './_input.mjs';

const SEPARATORS = new Set(['&&', '||', ';', '|', '&', '\n', '(', ')']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);
// Wrapper commands that run the rest of the line, with their options that consume the next word.
const PREFIXES = new Map([
  ['sudo', new Set(['-u', '-g', '-h', '-p', '-C', '-D', '-r', '-t', '-U', '-T', '--user', '--group', '--host', '--prompt', '--chdir'])],
  ['env', new Set(['-u', '-C', '--unset', '--chdir'])],
  ['timeout', new Set(['-s', '-k', '--signal', '--kill-after'])],
  ['nice', new Set(['-n', '--adjustment'])],
  ['exec', new Set(['-a'])],
  ['xargs', new Set(['-n', '-I', '-P', '-L', '-d', '-E', '-s', '-a', '--max-args', '--replace', '--max-procs', '--delimiter', '--arg-file'])],
  ['nohup', new Set()],
  ['time', new Set()],
  ['command', new Set()],
]);
// Prefixes whose first positional argument is theirs, not the wrapped command.
const PREFIX_POSITIONALS = new Map([['timeout', 1]]);
// git global options that consume the next word.
const GIT_OPTS_WITH_VALUE = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace']);
// Subcommands that always write history or move refs.
const ALWAYS_BLOCKED = new Set(['commit', 'push', 'restore', 'revert', 'merge', 'rebase', 'cherry-pick', 'am']);

/** Drops heredoc bodies, unless the heredoc feeds a shell (`bash <<EOF`), whose body is code. */
function stripHeredocs(command) {
  const lines = command.split('\n');
  const kept = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    kept.push(line);
    const markers = [...line.matchAll(/<<(-?)\s*(['"]?)([A-Za-z_][A-Za-z0-9_]*)\2/g)];
    if (markers.length === 0) continue;
    const feedsShell = tokenize(line).some((word) => SHELLS.has(word.split('/').pop()));
    for (const [, dash, , delimiter] of markers) {
      while (i + 1 < lines.length) {
        const body = lines[++i];
        if ((dash ? body.replace(/^\t+/, '') : body) === delimiter) break;
        if (feedsShell) kept.push(body);
      }
    }
  }
  return kept.join('\n');
}

/** Bodies of `$(...)` and backtick substitutions, which run even inside double quotes. */
function substitutions(command) {
  const found = [];
  let single = false;
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (single) {
      if (ch === "'") single = false;
    } else if (ch === "'") {
      single = true;
    } else if (ch === '\\') {
      i++;
    } else if (ch === '`') {
      let j = i + 1;
      while (j < command.length && command[j] !== '`') j += command[j] === '\\' ? 2 : 1;
      found.push(command.slice(i + 1, j));
      i = j;
    } else if (ch === '$' && command[i + 1] === '(') {
      let depth = 1;
      let j = i + 2;
      for (; j < command.length && depth > 0; j++) {
        if (command[j] === '(') depth++;
        else if (command[j] === ')') depth--;
      }
      found.push(command.slice(i + 2, j - 1));
      i = j - 1;
    }
  }
  return found;
}

/** Split a shell command into words, honouring quotes, and emit separators as their own tokens. */
function tokenize(command) {
  const tokens = [];
  let word = '';
  let quote = null;
  let hasWord = false;
  const flush = () => {
    if (hasWord) tokens.push(word);
    word = '';
    hasWord = false;
  };
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === '\\' && quote === '"' && i + 1 < command.length) word += command[++i];
      else word += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      hasWord = true;
    } else if (ch === '\\' && i + 1 < command.length) {
      word += command[++i];
      hasWord = true;
    } else if (ch === ' ' || ch === '\t') {
      flush();
    } else if (ch === '\n' || ch === ';' || ch === '(' || ch === ')') {
      flush();
      tokens.push(ch);
    } else if (ch === '&' || ch === '|') {
      flush();
      if (command[i + 1] === ch) {
        tokens.push(ch + ch);
        i++;
      } else tokens.push(ch);
    } else {
      word += ch;
      hasWord = true;
    }
  }
  flush();
  return tokens;
}

function segments(tokens) {
  const out = [[]];
  for (const token of tokens) {
    if (SEPARATORS.has(token)) out.push([]);
    else out[out.length - 1].push(token);
  }
  return out.filter((segment) => segment.length > 0);
}

/** Index of the real command in a simple command, past assignments and wrappers such as `env -i` or `timeout 30`. */
function commandStart(words) {
  let i = 0;
  while (i < words.length) {
    if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i])) {
      i++;
      continue;
    }
    const valued = PREFIXES.get(words[i]);
    if (!valued) break;
    let positionals = PREFIX_POSITIONALS.get(words[i]) ?? 0;
    i++;
    while (i < words.length) {
      if (words[i] === '--') {
        i++;
        break;
      }
      if (words[i].startsWith('-')) i += valued.has(words[i]) ? 2 : 1;
      else if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(words[i])) i++;
      else if (positionals > 0) {
        positionals--;
        i++;
      } else break;
    }
  }
  return i;
}

const shortFlag = (args, letter) => args.some((a) => /^-[A-Za-z]+$/.test(a) && a.includes(letter));

/** `git checkout` discards changes unless it only creates or switches a branch. */
function checkoutDiscards(rest) {
  if (rest.includes('--') || rest.includes('-f') || rest.includes('--force') || rest.includes('-p') || rest.includes('--patch')) return true;
  if (rest[0] === '-b' || rest[0] === '-B' || rest[0] === '--orphan') return false;
  const positionals = rest.filter((a) => !a.startsWith('-'));
  if (positionals.length === 0) return false;
  if (positionals.length > 1) return true;
  const [target] = positionals;
  return target === '.' || /[*?[]/.test(target) || existsSync(resolve(projectRoot, target));
}

/** Returns a reason string when the git invocation in `args` (words after `git`) writes history or discards work. */
function gitViolation(args) {
  let i = 0;
  while (i < args.length && args[i].startsWith('-')) {
    i += GIT_OPTS_WITH_VALUE.has(args[i]) ? 2 : 1;
  }
  const sub = args[i];
  const rest = args.slice(i + 1);
  if (ALWAYS_BLOCKED.has(sub)) return `git ${sub}`;
  switch (sub) {
    case 'reset':
      return rest.includes('--hard') ? 'git reset --hard' : null;
    case 'checkout':
      return checkoutDiscards(rest) ? 'git checkout <paths> (discards changes)' : null;
    case 'switch':
      return rest.includes('--discard-changes') || rest.includes('--force') || shortFlag(rest, 'f')
        ? 'git switch --discard-changes/--force'
        : null;
    case 'branch': {
      const del = rest.includes('--delete') || shortFlag(rest, 'd');
      const force = rest.includes('--force') || shortFlag(rest, 'f');
      return shortFlag(rest, 'D') || (del && force) ? 'git branch -D' : null;
    }
    case 'stash':
      return rest[0] === 'list' || rest[0] === 'show' ? null : 'git stash';
    case 'clean':
      return rest.some((a) => a === '--dry-run' || shortFlag([a], 'n')) ? null : 'git clean';
    default:
      return null;
  }
}

/** Walks every simple command, including `bash -c "..."`, `eval "..."` and `$(...)`/backtick bodies. */
function findViolation(command, depth = 0) {
  if (depth > 4) return null;
  const script = stripHeredocs(command);
  for (const inner of substitutions(script)) {
    const reason = findViolation(inner, depth + 1);
    if (reason) return reason;
  }
  for (const words of segments(tokenize(script))) {
    const i = commandStart(words);
    const head = words[i];
    if (head === undefined) continue;
    const name = head.split('/').pop();
    if (name === 'git') {
      const reason = gitViolation(words.slice(i + 1));
      if (reason) return reason;
    } else if (SHELLS.has(name)) {
      const c = words.indexOf('-c', i + 1);
      if (c !== -1 && words[c + 1]) {
        const reason = findViolation(words[c + 1], depth + 1);
        if (reason) return reason;
      }
    } else if (name === 'eval') {
      const reason = findViolation(words.slice(i + 1).join(' '), depth + 1);
      if (reason) return reason;
    }
  }
  return null;
}

const payload = await readPayload();
const command = payload?.tool_input?.command;
if (typeof command === 'string') {
  const reason = findViolation(command);
  if (reason) {
    process.stderr.write(
      `BLOCKED by .claude/hooks/block-git-write.mjs: ${reason}. ` +
        'The human runs git writes in this repo. Finish the change, report the Verification Protocol results and print the commit message instead.\n'
    );
    process.exit(2);
  }
}
process.exit(0);
