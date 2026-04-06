import { ChromaClient } from 'chromadb';

async function clearCollection() {
  const chromaUrl = process.env.CHROMA_URL ?? 'http://localhost:8000';
  const client = new ChromaClient({ path: chromaUrl });

  try {
    await client.deleteCollection({ name: 'tuvix_components' });
    console.log('Collection "tuvix_components" deleted.');
  } catch {
    console.log('Collection did not exist — nothing to delete.');
  }

  console.log('Ready to re-seed.');
}

clearCollection().catch(console.error);
