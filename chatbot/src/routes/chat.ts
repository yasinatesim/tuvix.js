import type { Request, Response } from 'express';
import type { RagPipeline, SourceReference } from '../services/rag';

const VALID_FRAMEWORKS = ['react', 'vue', 'svelte', 'angular'] as const;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_STREAMS_PER_IP = 2;

export function createChatRoute(rag: RagPipeline, activeStreams: Map<string, number>) {
  return async (req: Request, res: Response) => {
    const { message, framework } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      res.status(400).json({ error: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer` });
      return;
    }

    // framework is optional — omitting it generates vanilla JS output
    if (framework !== undefined && framework !== null) {
      if (typeof framework !== 'string' || !VALID_FRAMEWORKS.includes(framework as never)) {
        res.status(400).json({ error: `framework must be one of: ${VALID_FRAMEWORKS.join(', ')}` });
        return;
      }
    }

    // Enforce concurrent SSE stream limit per IP
    const ip = req.ip ?? 'unknown';
    const currentStreams = activeStreams.get(ip) ?? 0;
    if (currentStreams >= MAX_STREAMS_PER_IP) {
      res.status(429).json({ error: 'Too many concurrent connections. Please wait for existing requests to finish.' });
      return;
    }
    activeStreams.set(ip, currentStreams + 1);
    res.on('close', () => {
      const remaining = (activeStreams.get(ip) ?? 1) - 1;
      if (remaining <= 0) {
        activeStreams.delete(ip);
      } else {
        activeStreams.set(ip, remaining);
      }
    });

    // Server-side: detect framework from message text; falls back to client value or null (vanilla)
    const msgLower = message.toLowerCase();
    const detectedFramework = VALID_FRAMEWORKS.find((fw) => msgLower.includes(fw)) ?? framework ?? null;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    try {
      let sources: SourceReference[] = [];
      for await (const token of rag.generate(message, detectedFramework, (s) => { sources = s; })) {
        res.write(`data: ${JSON.stringify({ type: 'token', content: token })}\n\n`);
      }
      res.write(`data: ${JSON.stringify({ type: 'sources', content: sources })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    } catch (err) {
      console.error('[chat] RAG pipeline error:', err);
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'An error occurred while generating the response.' })}\n\n`);
    }

    res.end();
  };
}
