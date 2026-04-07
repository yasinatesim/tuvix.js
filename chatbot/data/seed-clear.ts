import { ChromaClient } from 'chromadb';
import { CONFIG } from '../src/config';

async function clearCollection() {
  const chromaUrl = process.env.CHROMA_URL ?? 'http://localhost:8000';
  const client = new ChromaClient({ path: chromaUrl });

  try {
    await client.deleteCollection({ name: CONFIG.collectionName });
    console.log(`Collection "${CONFIG.collectionName}" deleted.`);
  } catch {
    console.log('Collection did not exist — nothing to delete.');
  }

  console.log('Ready to re-seed.');
}

clearCollection().catch(console.error);
