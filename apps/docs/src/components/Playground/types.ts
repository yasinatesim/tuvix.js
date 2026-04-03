// ─── Compiler Worker Protocol ──────────────────────────────────────────────

export interface CompileRequest {
  type: 'compile';
  code: string;
  id: number;
}

export interface CompileResult {
  type: 'result';
  id: number;
  code: string;
  duration: number;
}

export interface CompileError {
  type: 'error';
  id: number;
  message: string;
  line?: number;
  col?: number;
}

export type WorkerMessage = CompileResult | CompileError;

// ─── iframe → Parent postMessage ───────────────────────────────────────────

export interface ConsoleMessage {
  type: 'console';
  level: 'log' | 'warn' | 'error';
  args: string[];
}

export interface RuntimeError {
  type: 'runtime-error';
  msg: string;
  line?: number;
  col?: number;
}

export interface MountedMessage {
  type: 'mounted';
}

export type FrameMessage = ConsoleMessage | RuntimeError | MountedMessage;

// ─── Playground Component ──────────────────────────────────────────────────

export interface PlaygroundProps {
  code: string;
  height?: number;
  readOnly?: boolean;
  imports?: Record<string, string>;
}
