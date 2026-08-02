/* ============================================================
   One-off: push the repo's data/*.json into Firestore.

   Run once after the service account is configured:
     npm run seed

   Safe to re-run. It merges, so anything already sold or edited in
   Firestore keeps its value rather than being reset to the JSON.
   ============================================================ */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initDb, usingFirestore, db } from './lib/db.js';

try { process.loadEnvFile('./.env'); } catch { /* env may come from the shell */ }

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const read = async (f) => JSON.parse(await readFile(join(dataDir, f), 'utf8'));

await initDb();
if (!usingFirestore) {
  console.error('No Firestore credentials — set GOOGLE_APPLICATION_CREDENTIALS_JSON first.');
  process.exit(1);
}

const store = db();
let written = 0;

const artworks = await read('artworks.json');
for (const art of artworks.artworks ?? []) {
  const { id, ...rest } = art;
  await store.collection('artworks').doc(id).set(rest, { merge: true });
  written += 1;
}

const merch = await read('merch.json');
for (const product of merch.products ?? []) {
  const { id, ...rest } = product;
  await store.collection('merch').doc(id).set(rest, { merge: true });
  written += 1;
}

const releases = await read('releases.json');
await store.collection('meta').doc('releases').set(releases, { merge: true });
written += 1;

console.log(`Seeded ${written} documents.`);
process.exit(0);
