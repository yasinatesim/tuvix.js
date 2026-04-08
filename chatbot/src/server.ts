import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { createChatRoute } from './routes/chat';
import { createOpenRouterClient } from './services/openrouter';
import { createVectorStore } from './services/vectordb';
import { createRagPipeline, type RagPipeline } from './services/rag';
import { CONFIG } from './config';

interface AppDependencies {
  rag: RagPipeline;
  config: {
    corsOrigin: string;
  };
}

export interface AppInstance {
  app: Express;
  /** Call in tests or shutdown handlers to stop the rate-limit cleanup timer. */
  cleanup(): void;
}

export function createApp(deps: AppDependencies): AppInstance {
  const app = express();

  // Trust first proxy (nginx/load balancer) so req.ip reflects the real client IP
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: deps.config.corsOrigin }));
  app.use(express.json({ limit: '16kb' }));

  // Rate limiting: 10 requests per minute per IP
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
      if (now > entry.resetAt) rateLimitMap.delete(ip);
    }
  }, 60_000);
  cleanupTimer.unref();

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
      const retryAfter = Math.ceil((limit.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      res.status(429).json({ error: 'Rate limit exceeded. Please wait before sending more requests.' });
    } else {
      limit.count++;
      next();
    }
  });

  app.post('/api/chat', createChatRoute(deps.rag, activeStreams));

  return {
    app,
    cleanup() {
      clearInterval(cleanupTimer);
    },
  };
}

async function waitForChromaDb(store: ReturnType<typeof createVectorStore>, maxAttempts = 30, delayMs = 3000): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await store.init();
      console.log('✅ ChromaDB ready!');
      return;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`⏳ Waiting for ChromaDB (attempt ${attempt}/${maxAttempts}): ${msg}`);
      if (attempt === maxAttempts) throw new Error(`ChromaDB not reachable after ${maxAttempts} attempts`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function main() {
  if (!CONFIG.openRouterApiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is required');
  }

  const llm = createOpenRouterClient(CONFIG.openRouterApiKey, CONFIG.embedModel, CONFIG.timeoutMs);
  const store = createVectorStore(CONFIG.chromaUrl, CONFIG.collectionName);

  await waitForChromaDb(store);

  const rag = createRagPipeline(llm, store, CONFIG.modelName);

  const { app } = createApp({
    rag,
    config: {
      corsOrigin: CONFIG.corsOrigin,
    },
  });

  app.listen(CONFIG.port, () => {
    console.log(`Chatbot server running on port ${CONFIG.port}`);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
