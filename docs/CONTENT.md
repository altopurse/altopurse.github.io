# Adding content

Everything on the site comes from the JSON files in `data/`. Edit those, commit,
and the site updates — no build step, nothing to compile.

Once Firestore is connected the API serves the same shapes from the database
instead, and these files become the fallback used when the API is unreachable.

---

## Tag a release into a room

The four rooms are empty because no release has a genre yet. Open
`data/releases.json` and set `genre` on each one to `"house"`, `"dnb"`,
`"dubstep"` or `"hiphop"`:

```json
{ "id": "evisceration", "title": "Evisceration", "year": 2026, "genre": "dnb" }
```

Anything left as `null` still shows under **Everything** — it just will not
appear in a room. The page says so rather than pretending the rooms are empty
by design.

## Add a release

Add an object at the **top** of the `releases` array — order in the array is
the order on the page.

```json
{
  "id": "some-track",
  "title": "Some Track",
  "year": 2026,
  "releasedOn": "2026-08-15",
  "genre": "dubstep",
  "latest": true,
  "links": { "hyperfollow": "https://distrokid.com/hyperfollow/tumanic/some-track" }
}
```

Remove `"latest": true` from whatever held it before. Once the Spotify sync is
running this happens on its own and the genres you set are carried across.

## Write about a track

`data/posts.json`, keyed to a release `id`. A release with no post shows no
write-up link at all — nothing ever says "coming soon".

```json
{
  "posts": [
    {
      "release": "evisceration",
      "title": "On Evisceration",
      "published": "2026-08-02",
      "body": [
        "First paragraph.",
        "Second paragraph."
      ],
      "video": "dQw4w9WgXcQ",
      "behindTheScenes": [
        "Whatever you want to say about how it was made."
      ]
    }
  ]
}
```

`video` is the YouTube id only — the part after `v=`, not the whole URL.

## Add an artwork

`data/artworks.json`. Put new pieces at the top. With two or more the section
switches from the feature layout to a grid on its own.

Prices are in **pence** — `85000` is £850. Drop `draftPrice` once a price is
final; while any remain the page shows a note saying prices are drafts.

Put images in `assets/art/` and reference them by path. Web-size them first:

```bash
ffmpeg -i original.jpg -vf "scale=1000:-1:flags=lanczos" -quality 84 assets/art/piece-02.webp
```

Every image needs an `alt` that describes what is in it. Not "artwork" —
describe the thing.

## Add an event

`data/events.json`. The empty state disappears as soon as the array has
anything in it.

```json
{
  "events": [
    {
      "id": "some-night",
      "title": "Some Night",
      "kind": "music",
      "startsAt": "2026-09-12T21:00:00+01:00",
      "venue": "The Venue, Town",
      "ticketUrl": "https://www.skiddle.com/...",
      "blurb": "One or two sentences."
    }
  ]
}
```

`kind` is `"music"` or `"art"`. Leave `ticketUrl` out and the listing shows
without a buy link rather than a dead button.

## Venues and sound systems

Same file, `venues` array:

```json
{
  "id": "the-venue",
  "name": "The Venue",
  "location": "Town",
  "rig": "What the system is and how it is tuned.",
  "blurb": "What the room does to it."
}
```

---

## Rules worth keeping

- **Never put a key in `data/`, `assets/js/config.js`, or anywhere else in this
  repo.** It is public. Secrets belong in Render's environment.
- **Do not invent facts.** If a date, price or dimension is unknown, leave it
  `null`. Every field has a designed unknown state — a wrong number is worse
  than a visible gap.
- **Prices are pence, not pounds.** `4500` is £45.
- Dates are `YYYY-MM-DD`, or full ISO with a timezone offset for event times.
