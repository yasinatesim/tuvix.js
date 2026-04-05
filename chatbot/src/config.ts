export const config = {
  ollamaUrl: process.env.OLLAMA_URL ?? 'http://localhost:11434',
  chromaUrl: process.env.CHROMA_URL ?? 'http://localhost:8000',
  modelName: process.env.MODEL_NAME ?? 'qwen2.5-coder:7b',
  embedModel: process.env.EMBED_MODEL ?? 'nomic-embed-text',
  port: parseInt(process.env.PORT ?? '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  collectionName: 'tuvix_components',
  ollamaTimeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS ?? '120000', 10),
} as const;

export type Config = typeof config;
