/* ============================================================
   Visit counting. No cookies, no storage, no banner needed.

   This file writes nothing to the visitor's device — no cookie, no
   localStorage, no fingerprint. That is what keeps it outside the consent
   rules rather than merely compliant with them.

   It also stops entirely if the browser signals an opt-out, and never runs
   on the admin pages.
   ============================================================ */

(() => {
  const CFG = window.TUMANIC_CONFIG ?? {};
  const API = (CFG.apiBase ?? '').replace(/\/$/, '');
  if (!API) return;

  // Honour every opt-out signal a browser can send.
  if (navigator.globalPrivacyControl) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

  // The artist looking at their own dashboard is not a statistic.
  if (location.pathname.startsWith('/admin')) return;

  const send = (payload) => {
    // text/plain deliberately: application/json makes this a preflighted
    // request, and sendBeacon cannot preflight, so it would fail silently
    // cross-origin. The server accepts both types.
    const body = JSON.stringify(payload);
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${API}/api/collect`, new Blob([body], { type: 'text/plain' }));
        return;
      }
      fetch(`${API}/api/collect`, {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body,
        keepalive: true,
        mode: 'cors'
      }).catch(() => {});
    } catch {
      // A missed count is never worth an error in someone's console.
    }
  };

  send({ path: location.pathname, referrer: document.referrer });

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    const room = t.closest('[role="tab"][data-room]');
    if (room) return send({ event: 'room', room: room.dataset.room });

    if (t.closest('.btn--buy'))  return send({ event: 'buy_click' });
    if (t.closest('#deck-link')) return send({ event: 'open_spotify' });
    if (t.closest('.platform'))  return send({ event: 'platform_click' });
    if (t.closest('.door'))      return send({ event: 'door_click' });
    if (t.closest('#sub-submit'))return send({ event: 'newsletter_submit' });
  }, { passive: true });
})();
