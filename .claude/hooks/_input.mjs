// Shared stdin parsing for the hooks in this folder, so the payload format is read in one place.
import { isAbsolute, relative, resolve, sep } from 'node:path';

export const projectRoot = resolve(process.env.CLAUDE_PROJECT_DIR ?? process.cwd());

export async function readPayload() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Repo-relative POSIX path of the file an Edit/Write/MultiEdit touched, or null when it lies outside the repo. */
export function editedFile(payload) {
  const filePath = payload?.tool_input?.file_path ?? payload?.tool_input?.path;
  if (typeof filePath !== 'string' || filePath === '') return null;
  const absolute = isAbsolute(filePath) ? filePath : resolve(projectRoot, filePath);
  const rel = relative(projectRoot, absolute);
  if (rel.startsWith('..') || isAbsolute(rel)) return null;
  return { absolute, rel: rel.split(sep).join('/') };
}

/** Print context for the model without blocking the tool call. */
export function advise(hookEventName, additionalContext) {
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext } })
  );
}
