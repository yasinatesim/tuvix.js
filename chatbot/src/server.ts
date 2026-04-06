import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createChatRoute } from './routes/chat';
import { createOllamaClient } from './services/ollama';
import { createVectorStore } from './services/vectordb';
import { createRagPipeline, type RagPipeline } from './services/rag';
import { CONFIG } from './config';

interface AppDependencies {
  rag: RagPipeline;
  config: {
    corsOrigin: string;
  };
}

export function createApp(deps: AppDependencies): Express {
  const app = express();

  // Trust first proxy (nginx/load balancer) so req.ip reflects the real client IP
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: deps.config.corsOrigin }));
  app.use(express.json({ limit: '16kb' }));

  // Rate limiting: 10 requests per minute per IP
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  // Concurrent SSE connection tracking: max 2 open streams per IP
  const activeStreams = new Map<string, number>();

  app.use('/api/chat', (req, res, next) => {
    const ip = req.ip ?? 'unknown';
    const now = Date.now();
    const limit = rateLimitMap.get(ip);
    if (!limit || now > limit.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
      next();
    } else if (limit.count >= 10) {
      res.status(429).json({ error: 'Rate limit exceeded. Please wait before sending more requests.' });
    } else {
      limit.count++;
      next();
    }
  });

  app.post('/api/chat', createChatRoute(deps.rag, activeStreams));

  return app;
}

async function main() {
  const ollama = createOllamaClient(CONFIG.ollamaUrl, CONFIG.embedModel, CONFIG.ollamaTimeoutMs);
  const store = createVectorStore(CONFIG.chromaUrl, CONFIG.collectionName);

  await store.init();

  const rag = createRagPipeline(ollama, store, CONFIG.modelName);

  const app = createApp({
    rag,
    config: {
      corsOrigin: CONFIG.corsOrigin,
    },
  });

  app.listen(CONFIG.port, () => {
    console.log(`Chatbot server running on port ${CONFIG.port}`);
  });
}

// Only start server when run directly (not when imported in tests)
if (process.argv[1]?.includes('server')) {
  main().catch(console.error);
}
