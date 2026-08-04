/* ============================================================
   One-off: push the repo's data/*.json into Firestore from a terminal.

     npm run seed

   Needs GOOGLE_APPLICATION_CREDENTIALS_JSON in server/.env. If you would
   rather not put a private key on a laptop, use the "Stock the shop" button on
   /admin instead — it runs the same code on the server, which already has the
   credentials.
   ============================================================ */

import { initDb, usingFirestore } from './lib/db.js';
import { seedFromRepo } from './lib/seed.js';

try { process.loadEnvFile('./.env'); } catch { /* env may come from the shell */ }

await initDb();
if (!usingFirestore) {
  console.error('No Firestore credentials — set GOOGLE_APPLICATION_CREDENTIALS_JSON first,');
  console.error('or use the "Stock the shop" button on /admin.');
  process.exit(1);
}

const counts = await seedFromRepo();
console.log(`Seeded ${counts.total} documents — ${counts.artworks} artworks, ${counts.merch} merch, ${counts.meta} meta.`);
process.exit(0);
