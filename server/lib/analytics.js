/* ============================================================
   Analytics, built so it does not need a cookie banner.

   The rule that makes this lawful without consent is simple: nothing is
   stored on the visitor's device, and nothing that identifies a person is
   kept on ours.

     - No cookies, no localStorage, no fingerprinting.
     - Raw IP addresses are personal data under GDPR, so no IP is ever
       written down. It is hashed together with the date and a secret, and
       the date in the hash means today's id cannot be matched to
       tomorrow's. Nobody, including us, can go backwards from the hash.
     - Only counts are kept. There is no per-person journey to read.
     - Referrers are reduced to a hostname so query strings never land here.

   The trade-off is real and worth knowing: you can see what happens on the
   site, not who did it. Following individuals between visits would need a
   consent banner and a lot more paperwork.
   ============================================================ */

import { createHash } from 'node:crypto';
import { db, usingFirestore } from './db.js';

const DAY = 86_400_000;

/** Today in UTC, as YYYY-MM-DD. Also the rotation period for visitor ids. */
function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * A visitor id that only makes sense for one day. The date is inside the
 * hash, so the same person tomorrow produces an unrelated value and cannot
 * be followed across days.
 */
function visitorId(ip, ua, date) {
  const secret = process.env.ANALYTICS_SALT ?? '';
  return createHash('sha256')
    .update(`${secret}|${date}|${ip ?? ''}|${ua ?? ''}`)
    .digest('hex')
    .slice(0, 32);
}

/** Referrers are cut down to a hostname — a full URL can carry personal data. */
function refHost(referrer) {
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    return host || 'direct';
  } catch {
    return 'other';
  }
}

/** Coarse enough to be useful, too coarse to identify anyone. */
function deviceClass(ua = '') {
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function langTag(header = '') {
  const first = header.split(',')[0]?.trim().slice(0, 12);
  return first || 'unknown';
}

const clean = (v, max = 80) =>
  typeof v === 'string' && v ? v.trim().slice(0, max) : null;

/**
 * Record one hit. Returns quietly when Firestore is not configured — losing
 * a stat is never a reason to fail a page view.
 */
export async function record({ ip, ua, lang, referrer, path, event, room }) {
  if (!usingFirestore) return;

  const { FieldValue } = await import('firebase-admin/firestore');
  const date = today();
  const store = db();
  const dayRef = store.collection('analytics_daily').doc(date);

  // First sighting today? create() throws if the marker already exists.
  let isNewVisitor = false;
  try {
    await dayRef.collection('visitors').doc(visitorId(ip, ua, date)).create({ t: Date.now() });
    isNewVisitor = true;
  } catch {
    // Seen already today. Nothing to do — and nothing extra recorded.
  }

  const patch = { date, updatedAt: Date.now() };

  if (event) {
    patch.events = { [clean(event, 40)]: FieldValue.increment(1) };
    if (room) patch.rooms = { [clean(room, 24)]: FieldValue.increment(1) };
  } else {
    patch.pageviews = FieldValue.increment(1);
    patch.paths = { [clean(path, 120) ?? '/']: FieldValue.increment(1) };
    patch.referrers = { [refHost(referrer)]: FieldValue.increment(1) };
    patch.devices = { [deviceClass(ua)]: FieldValue.increment(1) };
    patch.languages = { [langTag(lang)]: FieldValue.increment(1) };
  }

  if (isNewVisitor) patch.visitors = FieldValue.increment(1);

  // Keys here are literal map keys, not field paths, so a path like
  // "/thanks.html" is stored as written rather than read as a nested field.
  await dayRef.set(patch, { merge: true });
}

/** Daily rows, newest first. */
export async function stats({ days = 30 } = {}) {
  if (!usingFirestore) return { available: false, days: [] };

  const since = new Date(Date.now() - days * DAY).toISOString().slice(0, 10);
  const snap = await db().collection('analytics_daily')
    .where('date', '>=', since)
    .orderBy('date', 'desc')
    .get();

  const rows = snap.docs.map((d) => {
    const { updatedAt, ...rest } = d.data();
    return { date: d.id, ...rest };
  });

  const merge = (key) => {
    const total = {};
    for (const row of rows) {
      for (const [k, v] of Object.entries(row[key] ?? {})) total[k] = (total[k] ?? 0) + v;
    }
    return Object.entries(total).sort((a, b) => b[1] - a[1]);
  };

  return {
    available: true,
    from: since,
    totals: {
      pageviews: rows.reduce((n, r) => n + (r.pageviews ?? 0), 0),
      visitors: rows.reduce((n, r) => n + (r.visitors ?? 0), 0)
    },
    days: rows.map((r) => ({ date: r.date, pageviews: r.pageviews ?? 0, visitors: r.visitors ?? 0 })),
    paths: merge('paths'),
    referrers: merge('referrers'),
    devices: merge('devices'),
    languages: merge('languages'),
    events: merge('events'),
    rooms: merge('rooms')
  };
}

/**
 * Retention. Daily totals are just numbers and can be kept, but the visitor
 * markers are deleted as soon as the day they belong to has closed — once
 * the unique count is banked they serve no purpose.
 */
export async function purge({ keepDays = 400, keepVisitorDays = 2 } = {}) {
  if (!usingFirestore) return { purged: 0, markersDeleted: 0 };

  const store = db();
  const cutoff = new Date(Date.now() - keepDays * DAY).toISOString().slice(0, 10);
  const markerCutoff = new Date(Date.now() - keepVisitorDays * DAY).toISOString().slice(0, 10);

  let purged = 0;
  let markersDeleted = 0;

  const all = await store.collection('analytics_daily').get();
  for (const doc of all.docs) {
    if (doc.id < markerCutoff) {
      // Re-query every pass. Reusing one snapshot would keep re-deleting the
      // same 500 docs and never terminate on a day that busy, which would also
      // strand the markers the privacy notice promises to delete within 2 days.
      for (;;) {
        const markers = await doc.ref.collection('visitors').limit(500).get();
        if (markers.empty) break;
        const batch = store.batch();
        markers.docs.forEach((m) => batch.delete(m.ref));
        await batch.commit();
        markersDeleted += markers.size;
        if (markers.size < 500) break;
      }
    }
    if (doc.id < cutoff) {
      await doc.ref.delete();
      purged += 1;
    }
  }

  return { purged, markersDeleted };
}
