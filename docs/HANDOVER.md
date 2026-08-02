# Handover prompt — TUMANIC M·A·E website

Paste everything below into a fresh Claude Code session opened in the project folder.

---

Take over an in-progress website build. Read this whole brief before touching files.

## The project

A site for **TUMANIC** — a UK electronic producer (deep house, drum & bass, dubstep,
hip-hop; weekly releases) who also paints. The site plays his music and sells his
artwork.

Brand name: **TUMANIC M·A·E** — Music · Art · Events. Intended domain: `tumanicmae`.

## Structure the artist asked for

A hand-drawn wireframe specifies three equal panels side by side, with a circular
star emblem sitting on each divider between them:

```
                    TUMANIC M·A·E

  ┌──────────┐  ✳  ┌──────────┐  ✳  ┌──────────┐
  │  MUSIC   │     │   ART    │     │  EVENTS  │
  └──────────┘     └──────────┘     └──────────┘

                 www.tumanicmae
```

The section names in the sketch are set vertically (rotated) inside each panel.
Three panels, not two — earlier work in this repo assumed a two-panel
music/art split and must be reworked to match the sketch.

## Stack (already decided, don't change without asking)

- **Frontend**: static HTML/CSS/JS, no build step. Deployed on GitHub Pages from the
  repo `altopurse.github.io` (user site — serves from the repo root).
- **Backend**: Node/Express on Render, in a `server/` subdirectory of the same repo
  (set Render's root directory to `server`).
- **Database**: Firestore (orders, artwork stock/availability).
- **Payments**: Mollie hosted checkout. Backend creates the payment and returns the
  checkout URL; a Mollie webhook marks the order paid and the original sold.
  Prices must be computed server-side from the database, never trusted from the client.

## What exists so far

In `C:\Users\joset\OneDrive\Desktop\newprojects\altopurse.github.io`:

- `index.html` — full page markup, but built to the **old two-panel layout**. Reuse
  the components (Spotify deck, release list, checkout dialog, footer) and rebuild
  the layout to the three-panel sketch.
- `assets/css/styles.css` — complete stylesheet for the old layout. The token system
  (`:root`) is worth keeping; the grid needs redoing.
- `assets/art/_test-full.jpg` — the painting, cropped square out of the driveway
  photo. Rename and treat as the hero product shot.
- `assets/art/_test-insitu.jpg` — the painting hung on the studio wall, shows scale.

**`index.html` references `assets/js/config.js` and `assets/js/app.js`, which do not
exist yet.** Nothing has been committed, and no git repo has been initialised.

## Source media (not yet in the repo)

- `C:\Users\joset\Downloads\WhatsApp Image 2026-08-02 at 14.38.40.jpeg` — 1200×1600,
  the painting leaning against a car. The canvas occupies roughly x 103–1120,
  y 368–1392; that crop is what produced `_test-full.jpg`.
- `C:\Users\joset\Downloads\WhatsApp Image 2026-08-01 at 21.33.17.jpeg` — 899×1599,
  the painting on the studio wall.
- `C:\Users\joset\Downloads\WhatsApp Video 2026-08-02 at 14.38.41.mp4` — 19 s,
  478×850, a slow pan across the painting. Good source for detail crops; the
  strongest frames are the black-and-white flame/eye motif near the lower right and
  the blue/green fan in the upper left. ffmpeg is installed and on PATH.

Produce web-sized derivatives (hero, in-situ, 2–3 details) into `assets/art/`.
Original files stay out of the repo.

## The artwork

One piece so far: a large square canvas, hand-painted acrylic, a kaleidoscopic
tessellation of flat triangles in primaries plus magenta, purple and orange, with one
black-and-white flame motif breaking the colour. Build the shop data-driven (an array
of pieces in `data/artworks.json`, later served from Firestore) so more work drops in
later, but make this piece the feature — a lone card in a grid looks like a mistake.

Sell the original as one-of-one, plus signed numbered prints in two or three sizes.

## Music — real data, do not invent more

Spotify artist ID `5AhJwuhl8vQJB0rBqZ7UFI`. Use the artist embed player.

Releases: Evisceration (2026, latest), Tu Witchy (2026), trap$hitty (2026),
Smack Me Up (2026), Bel Mercy (2022, most played, ~172k streams),
Glorifying Addictions (2022). Bio line: "UK EDM producer | Deep House / Drum & Bass /
Dubstep / Hip-Hop | Weekly Releases".

Per-track BPM, key and individual track IDs are **not known** — don't fabricate them.

## Unknowns — ask the artist, don't guess into the copy

1. Prices for the original and each print size.
2. The canvas's actual dimensions (it looks about 1 m square, unconfirmed).
3. The painting's title, if it has one, and the year.
4. Contact email for commissions and order receipts.
5. Whether a Mollie account exists yet, and the test/live API keys.
6. What goes in the **Events** panel — gigs, dates, ticket links? There is no content
   for it yet. Design an empty state that reads as deliberate, not broken.

## Standards

- Sentence case, second person, active voice. No exclamation marks, no "simply".
- Visible `:focus-visible` on every control; the checkout dialog traps Tab, closes on
  Escape and returns focus to the button that opened it.
- Honour `prefers-reduced-motion`; animate transform/opacity only.
- `Intl.NumberFormat` for prices, `font-variant-numeric: tabular-nums` in columns.
- Design the empty, long-string and error states before the happy path.
- The site must still render the artwork and the player if the backend is down —
  fall back to the local JSON and explain, in the buy button, that checkout is offline.

Start by reading `index.html` and `assets/css/styles.css`, then propose the
three-panel layout before writing code.
