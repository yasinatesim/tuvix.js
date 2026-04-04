import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from './Editor';
import { Preview } from './Preview';
import { Console, parseFrameMessage, type ParsedMessage } from './Console';
import { buildFrame } from './frame-builder';
import type { PlaygroundProps, WorkerMessage, FrameMessage } from './types';

const DEBOUNCE_MS = 300;

export default function Playground({
  code: initialCode,
  height = 400,
  readOnly = false,
  imports = {},
}: PlaygroundProps) {
  const [code, setCode] = useState(initialCode);
  const [srcdoc, setSrcdoc] = useState('');
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const [buildError, setBuildError] = useState<string | null>(null);

  const workerRef = useRef<Worker | null>(null);
  const compileIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Boot compiler worker
  useEffect(() => {
    const worker = new Worker(new URL('./compiler.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;

    worker.addEventListener('message', (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      // Discard stale results — id must match last sent compile request
      if (msg.id !== compileIdRef.current && msg.id !== -1) return;

      if (msg.type === 'result') {
        setBuildError(null);
        const html = buildFrame({ compiledCode: msg.code, extraImports: imports });
        setSrcdoc(html);
        setMessages([]);
      } else if (msg.type === 'error') {
        setBuildError(msg.message);
        setMessages([{ kind: 'log', text: `❌ Build error: ${msg.message}`, level: 'error' }]);
      }
    });

    return () => worker.terminate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Compile on mount (initial code)
  useEffect(() => {
    if (workerRef.current) {
      const id = ++compileIdRef.current;
      workerRef.current.postMessage({ type: 'compile', code: initialCode, id });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced compile on code change (skip if readOnly)
  const handleCodeChange = useCallback((value: string | undefined) => {
    if (readOnly || value === undefined) return;
    setCode(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (!workerRef.current) return;
      const id = ++compileIdRef.current;
      workerRef.current.postMessage({ type: 'compile', code: value, id });
    }, DEBOUNCE_MS);
  }, [readOnly]);

  // Handle messages from iframe
  const handleFrameMessage = useCallback((data: FrameMessage) => {
    const parsed = parseFrameMessage(data);
    if (parsed && data.type !== 'mounted') {
      setMessages(prev => [...prev, parsed]);
    }
  }, []);

  // Handle 5s timeout
  const handleTimeout = useCallback(() => {
    setMessages(prev => [...prev, {
      kind: 'log' as const,
      text: '⚠️ Preview timed out — possible infinite loop',
      level: 'warn' as const,
    }]);
  }, []);

  const EDITOR_HEIGHT = height - 80; // reserve 80px for console
  const PREVIEW_HEIGHT = height - 80;

  return (
    <div style={{ display: 'flex', height: `${height}px`, border: '1px solid #30363d', borderRadius: '6px', overflow: 'hidden' }}>
      {/* Left: Editor + Console */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #30363d' }}>
        <Editor
          value={code}
          onChange={handleCodeChange}
          readOnly={readOnly}
          height={EDITOR_HEIGHT}
        />
        <Console messages={messages} />
      </div>

      {/* Right: Preview */}
      <div style={{ flex: 1 }}>
        <Preview
          srcdoc={buildError ? '' : srcdoc}
          onMessage={handleFrameMessage}
          onTimeout={handleTimeout}
          height={PREVIEW_HEIGHT + 80}
        />
      </div>
    </div>
  );
}
