/* ============================================================
   Spotify sync. Client-credentials flow — no user login, read only.
   Fills in real release dates so the discography sorts itself.
   ============================================================ */

let cached = { token: null, expiresAt: 0 };

async function token() {
  const id = process.env.SPOTIFY_CLIENT_ID?.trim();
  const secret = process.env.SPOTIFY_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new Error('Spotify credentials are not set.');

  if (cached.token && Date.now() < cached.expiresAt - 30_000) return cached.token;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  if (!res.ok) throw new Error(`Spotify auth failed with ${res.status}.`);

  const body = await res.json();
  cached = { token: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return cached.token;
}

/**
 * Every release for the artist, newest first. Spotify returns albums and
 * singles separately paged, so this walks both.
 */
export async function fetchReleases() {
  const artistId = process.env.SPOTIFY_ARTIST_ID?.trim();
  if (!artistId) throw new Error('SPOTIFY_ARTIST_ID is not set.');

  const auth = await token();
  const seen = new Map();
  let url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50&market=GB`;

  while (url) {
    const res = await fetch(url, { headers: { authorization: `Bearer ${auth}` } });
    if (!res.ok) throw new Error(`Spotify returned ${res.status}.`);
    const page = await res.json();

    for (const item of page.items ?? []) {
      // Spotify lists the same track under several markets; key on name.
      const id = item.name.toLowerCase().trim();
      if (seen.has(id)) continue;
      seen.set(id, {
        id: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        title: item.name,
        releasedOn: item.release_date ?? null,
        year: item.release_date ? Number(item.release_date.slice(0, 4)) : null,
        spotifyAlbumId: item.id,
        cover: item.images?.[0]?.url ?? null,
        genre: null,
        links: { spotify: item.external_urls?.spotify ?? null }
      });
    }
    url = page.next;
  }

  const releases = [...seen.values()].sort((a, b) =>
    String(b.releasedOn ?? '').localeCompare(String(a.releasedOn ?? ''))
  );
  if (releases[0]) releases[0].latest = true;

  return releases;
}

/**
 * Genres are the artist's own call — Spotify does not know which of these is
 * dubstep and which is drum and bass. Carry across whatever was already
 * tagged so a sync never wipes that work.
 */
export function keepGenres(fresh, existing = []) {
  const byId = new Map(existing.map((r) => [r.id, r]));
  const byTitle = new Map(existing.map((r) => [r.title.toLowerCase(), r]));
  return fresh.map((r) => {
    const prev = byId.get(r.id) ?? byTitle.get(r.title.toLowerCase());
    return prev?.genre ? { ...r, genre: prev.genre } : r;
  });
}
