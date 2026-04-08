import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createOpenRouterClient } from '../src/services/openrouter';
import { createVectorStore, type ComponentRecord } from '../src/services/vectordb';
import { CONFIG } from '../src/config';

const DATA_DIR = join(import.meta.dirname, 'components');

async function seed() {
  const apiKey = process.env.OPENROUTER_API_KEY ?? CONFIG.openRouterApiKey;
  const chromaUrl = process.env.CHROMA_URL ?? CONFIG.chromaUrl;
  const embedModel = process.env.EMBED_MODEL ?? CONFIG.embedModel;

  if (!apiKey) throw new Error('OPENROUTER_API_KEY is required for seeding');

  const llm = createOpenRouterClient(apiKey, embedModel);
  const store = createVectorStore(chromaUrl, CONFIG.collectionName);
  await store.init();

  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.jsonl'));
  let total = 0;

  for (const file of files) {
    const content = readFileSync(join(DATA_DIR, file), 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    const records: ComponentRecord[] = [];
    for (const [lineIdx, l] of lines.entries()) {
      try {
        records.push(JSON.parse(l));
      } catch {
        console.error(`Skipping malformed JSONL line ${lineIdx + 1} in ${file}`);
      }
    }

    console.log(`Seeding ${records.length} records from ${file}...`);

    // Embed in parallel batches of 5 to respect OpenRouter rate limits
    const BATCH_SIZE = 5;
    const embeddings: number[][] = [];
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const batchEmbeddings = await Promise.all(batch.map((r) => llm.embed(r.description)));
      embeddings.push(...batchEmbeddings);
    }

    await store.upsert(records, embeddings);
    total += records.length;
    console.log(`✅ ${total} records seeded so far`);
  }

  console.log(`✅ Done! ${total} total records seeded.`);
}

seed().catch(console.error);
