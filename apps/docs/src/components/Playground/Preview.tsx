import { useEffect, useRef } from 'react';
import type { FrameMessage } from './types';

interface PreviewProps {
  srcdoc: string;
  onMessage: (msg: FrameMessage) => void;
  onTimeout: () => void;
  height: number;
}

export function Preview({ srcdoc, onMessage, onTimeout, height }: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for postMessage from iframe — validate source before processing
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as FrameMessage;
      if (data.type === 'mounted' && timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      onMessage(data);
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onMessage]);

  // Start 5s timeout whenever srcdoc changes (new compile result)
  useEffect(() => {
    if (!srcdoc) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      onTimeout();
      timeoutRef.current = null;
    }, 5000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [srcdoc, onTimeout]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts"
      srcDoc={srcdoc}
      style={{
        width: '100%',
        height: `${height}px`,
        border: 'none',
        background: '#ffffff',
      }}
      title="Live Preview"
    />
  );
}
