import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createOllamaClient } from '../src/services/ollama';
import { createVectorStore, type ComponentRecord } from '../src/services/vectordb';
import { CONFIG } from '../src/config';

const DATA_DIR = join(import.meta.dirname, 'components');

async function seed() {
  const ollamaUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434';
  const chromaUrl = process.env.CHROMA_URL ?? 'http://localhost:8000';
  const embedModel = process.env.EMBED_MODEL ?? 'nomic-embed-text';

  const ollama = createOllamaClient(ollamaUrl, embedModel);
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

    const embeddings: number[][] = [];
    for (const record of records) {
      const embedding = await ollama.embed(record.description);
      embeddings.push(embedding);
    }

    await store.upsert(records, embeddings);
    total += records.length;
  }

  console.log(`Seeded ${total} records total.`);
}

seed().catch(console.error);
