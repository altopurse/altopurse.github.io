/* ============================================================
   Push the repo's data/*.json into Firestore.

   Shared by `npm run seed` and by POST /api/admin/seed. It lives here rather
   than in seed.js because seeding from a laptop needs a copy of the service
   account key on that laptop, and the one machine guaranteed to have those
   credentials already is the server. Running it from /admin means the shop can
   be stocked without anyone handling a private key.

   Safe to re-run. Everything merges, so a piece already marked sold stays sold
   rather than being reset to whatever the JSON says.
   ============================================================ */

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { db, usingFirestore } from './db.js';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'data');
const read = async (f) => JSON.parse(await readFile(join(dataDir, f), 'utf8'));

export async function seedFromRepo() {
  if (!usingFirestore) throw new Error('Firestore is not connected, so there is nowhere to seed.');

  const store = db();
  const counts = { artworks: 0, merch: 0, meta: 0 };

  const artworks = await read('artworks.json');
  for (const art of artworks.artworks ?? []) {
    const { id, ...rest } = art;
    if (!id) continue;
    await store.collection('artworks').doc(id).set(rest, { merge: true });
    counts.artworks += 1;
  }

  const merch = await read('merch.json');
  for (const product of merch.products ?? []) {
    const { id, ...rest } = product;
    if (!id) continue;
    await store.collection('merch').doc(id).set(rest, { merge: true });
    counts.merch += 1;
  }

  const releases = await read('releases.json');
  await store.collection('meta').doc('releases').set(releases, { merge: true });
  counts.meta += 1;

  return { ...counts, total: counts.artworks + counts.merch + counts.meta };
}
