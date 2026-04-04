export const config = {
  ollamaUrl: process.env.OLLAMA_URL ?? 'http://localhost:11434',
  chromaUrl: process.env.CHROMA_URL ?? 'http://localhost:8000',
  modelName: process.env.MODEL_NAME ?? 'deepseek-coder-v2:16b',
  embedModel: process.env.EMBED_MODEL ?? 'nomic-embed-text',
  port: parseInt(process.env.PORT ?? '3001', 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  collectionName: 'tuvix_components',
} as const;

export type Config = typeof config;
