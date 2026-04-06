import type { Request, Response } from 'express';
import type { RagPipeline, SourceReference } from '../services/rag';

const VALID_FRAMEWORKS = ['react', 'vue', 'svelte', 'angular'] as const;

export function createChatRoute(rag: RagPipeline) {
  return async (req: Request, res: Response) => {
    const { message, framework } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    // framework is optional — omitting it generates vanilla JS output
    if (framework !== undefined && framework !== null) {
      if (typeof framework !== 'string' || !VALID_FRAMEWORKS.includes(framework as never)) {
        res.status(400).json({ error: `framework must be one of: ${VALID_FRAMEWORKS.join(', ')}` });
        return;
      }
    }

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
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      res.write(`data: ${JSON.stringify({ type: 'error', content: errorMessage })}\n\n`);
    }

    res.end();
  };
}
