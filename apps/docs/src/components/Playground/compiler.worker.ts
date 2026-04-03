import * as esbuild from 'esbuild-wasm';
import type { CompileRequest, CompileResult, CompileError } from './types';

let initialized = false;
const queue: CompileRequest[] = [];

async function init() {
  try {
    await esbuild.initialize({
      wasmURL: '/esbuild.wasm',
      worker: false, // we ARE the worker
    });
    initialized = true;
    // Drain queued requests
    for (const req of queue) {
      await handleCompile(req);
    }
    queue.length = 0;
  } catch (err) {
    const msg: CompileError = {
      type: 'error',
      id: -1,
      message: `esbuild init failed: ${err instanceof Error ? err.message : String(err)}`,
    };
    self.postMessage(msg);
  }
}

async function handleCompile(req: CompileRequest) {
  const start = performance.now();
  try {
    const result = await esbuild.transform(req.code, {
      loader: 'ts',
      format: 'esm',
      target: 'es2020',
    });
    const msg: CompileResult = {
      type: 'result',
      id: req.id,
      code: result.code,
      duration: Math.round(performance.now() - start),
    };
    self.postMessage(msg);
  } catch (err: unknown) {
    const errors = (err as { errors?: Array<{ text: string; location?: { line: number; column: number } }> }).errors;
    const first = errors?.[0];
    const msg: CompileError = {
      type: 'error',
      id: req.id,
      message: first?.text ?? String(err),
      line: first?.location?.line,
      col: first?.location?.column,
    };
    self.postMessage(msg);
  }
}

self.addEventListener('message', (e: MessageEvent<CompileRequest>) => {
  if (e.data.type === 'compile') {
    if (!initialized) {
      queue.push(e.data);
    } else {
      handleCompile(e.data);
    }
  }
});

init();
