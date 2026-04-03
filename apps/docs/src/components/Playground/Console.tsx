import type { FrameMessage, ConsoleMessage, RuntimeError } from './types';

export interface ParsedMessage {
  kind: 'log' | 'runtime-error';
  text: string;
  level?: 'log' | 'warn' | 'error';
  line?: number;
}

export function parseFrameMessage(data: FrameMessage): ParsedMessage | null {
  if (data.type === 'console') {
    const msg = data as ConsoleMessage;
    return { kind: 'log', text: msg.args.join(' '), level: msg.level };
  }
  if (data.type === 'runtime-error') {
    const msg = data as RuntimeError;
    return { kind: 'runtime-error', text: msg.msg, line: msg.line };
  }
  return null;
}

const LEVEL_ICON: Record<string, string> = {
  log: '›',
  warn: '⚠',
  error: '✕',
  'runtime-error': '✕',
};

const LEVEL_COLOR: Record<string, string> = {
  log: '#e6edf3',
  warn: '#d29922',
  error: '#f85149',
  'runtime-error': '#f85149',
};

interface ConsoleProps {
  messages: ParsedMessage[];
}

export function Console({ messages }: ConsoleProps) {
  return (
    <div style={{
      background: '#0d1117',
      borderTop: '1px solid #30363d',
      fontFamily: 'monospace',
      fontSize: '12px',
      padding: '8px',
      minHeight: '80px',
      maxHeight: '200px',
      overflowY: 'auto',
    }}>
      {messages.length === 0 ? (
        <span style={{ color: '#8b949e' }}>Console output will appear here</span>
      ) : (
        messages.map((msg, i) => {
          const key = msg.kind === 'runtime-error' ? 'runtime-error' : (msg.level ?? 'log');
          return (
            <div key={i} style={{ color: LEVEL_COLOR[key] ?? LEVEL_COLOR.log, marginBottom: '2px' }}>
              <span style={{ marginRight: '6px' }}>{LEVEL_ICON[key]}</span>
              {msg.kind === 'runtime-error' && msg.line ? `[line ${msg.line}] ` : ''}
              {msg.text}
            </div>
          );
        })
      )}
    </div>
  );
}
