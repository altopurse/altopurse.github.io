/* ============================================================
   Site configuration. Plain script, loaded before app.js.
   Everything here is public — never put a secret in this file.
   ============================================================ */

window.TUMANIC_CONFIG = {

  /* Render web service URL, e.g. 'https://tumanic-api.onrender.com'.
     Leave empty and the shop runs in offline mode: artwork and player
     still render from local JSON, buy buttons explain they are off. */
  apiBase: 'https://altopurse-github-io.onrender.com',

  locale: 'en-GB',
  currency: 'GBP',

  spotifyArtistId: '5AhJwuhl8vQJB0rBqZ7UFI',

  /* Where to send commission and booking enquiries. Until this is set the
     button points at the mailing list instead of an empty mailto. */
  contactEmail: null,

  /* Add a URL and its icon appears in the Music section automatically.
     null means the link is unknown, so nothing is rendered — a dead icon
     is worse than no icon. */
  platforms: {
    spotify:      'https://open.spotify.com/artist/5AhJwuhl8vQJB0rBqZ7UFI',
    youtube:      'https://youtube.com/@tumanic_music',
    hyperfollow:  'https://distrokid.com/hyperfollow/tumanic/evisceration',
    appleMusic:   null,
    youtubeMusic: null
  },

  /* Giscus comment threads. Fill these in from giscus.app after enabling
     Discussions on the repo. Leave repo null to keep comments off. */
  giscus: {
    repo: null,
    repoId: null,
    category: 'General',
    categoryId: null
  }
};
