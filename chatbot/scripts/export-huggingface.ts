import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(import.meta.dirname, '../data/components');
const OUT_DIR = join(import.meta.dirname, '../data/huggingface');

function exportDataset() {
  mkdirSync(OUT_DIR, { recursive: true });

  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.jsonl'));
  const allRecords: unknown[] = [];

  for (const file of files) {
    const content = readFileSync(join(DATA_DIR, file), 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    const records = lines.map((l) => JSON.parse(l));
    allRecords.push(...records);
  }

  // Write combined JSONL
  const combined = allRecords.map((r) => JSON.stringify(r)).join('\n');
  writeFileSync(join(OUT_DIR, 'dataset.jsonl'), combined + '\n');

  // Write metadata
  const metadata = {
    total_records: allRecords.length,
    frameworks: ['react', 'vue', 'svelte', 'angular'],
    categories: [...new Set(allRecords.map((r) => (r as Record<string, string>).category))],
    license: 'MIT',
    description: 'Tuvix.js micro-frontend component examples v2 — 600 records, 10 categories, 4 frameworks, correct API patterns',
  };
  writeFileSync(join(OUT_DIR, 'metadata.json'), JSON.stringify(metadata, null, 2));

  console.log(`Exported ${allRecords.length} records to ${OUT_DIR}`);
}

exportDataset();
