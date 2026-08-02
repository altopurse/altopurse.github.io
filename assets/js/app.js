/* ============================================================
   TUMANIC M·A·E — front end
   The page already renders without this file: the feature artwork,
   the discography and the player are in the HTML. Everything here
   is an upgrade on top of that, so a sleeping backend or a failed
   script never costs a visitor the content.
   ============================================================ */

const CFG = window.TUMANIC_CONFIG ?? {};
const API = (CFG.apiBase ?? '').replace(/\/$/, '');

const money = new Intl.NumberFormat(CFG.locale ?? 'en-GB', {
  style: 'currency',
  currency: CFG.currency ?? 'GBP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const longDate = new Intl.DateTimeFormat(CFG.locale ?? 'en-GB', {
  day: 'numeric', month: 'long', year: 'numeric'
});

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Fetch that gives up rather than hanging — Render's free tier sleeps. */
async function getJSON(url, timeoutMs = 6000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/* ── Footer year, contact link ────────────────────────────── */

function chrome() {
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  const contact = $('#contact-link');
  if (!contact) return;
  if (CFG.contactEmail) {
    contact.href = `mailto:${CFG.contactEmail}?subject=${encodeURIComponent('Enquiry via tumanicmae')}`;
  } else {
    // No address yet — send people somewhere real rather than a broken mailto.
    contact.href = '#newsletter';
    contact.textContent = 'Join the list';
  }
}

/* ── Top bar reveals once the gateway is behind you ───────── */

function topbar() {
  const bar = $('#topbar');
  const gate = $('#gateway');
  if (!bar || !gate || !('IntersectionObserver' in window)) return;

  new IntersectionObserver(
    ([entry]) => bar.setAttribute('data-hidden', String(entry.isIntersecting)),
    { rootMargin: '-40% 0px 0px 0px' }
  ).observe(gate);
}

/* ── Extra platform links, when their URLs are known ──────── */

function platforms() {
  const list = $('.platforms');
  if (!list) return;

  const extra = [
    { url: CFG.platforms?.appleMusic,   label: 'Apple Music',   icon: '#ic-apple' },
    { url: CFG.platforms?.youtubeMusic, label: 'YouTube Music', icon: '#ic-ytmusic' }
  ];

  for (const { url, label, icon } of extra) {
    if (!url) continue;
    const li = document.createElement('li');
    li.innerHTML = `<a class="platform" href="${url}" target="_blank" rel="noopener">
      <svg class="platform__ic" aria-hidden="true"><use href="${icon}"/></svg>
      ${label}<span class="platform__ext" aria-hidden="true">↗</span></a>`;
    list.append(li);
  }
}

/* ── Rooms: tabs with roving tabindex ─────────────────────── */

function rooms() {
  const tabs = $$('.room[role="tab"]');
  const panel = $('#panel-releases');
  const empty = $('#disco-empty');
  if (!tabs.length || !panel) return;

  function select(tab, { focus = true } = {}) {
    for (const t of tabs) {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', tab.id);
    if (focus) tab.focus();

    const room = tab.dataset.room;
    let shown = 0;
    for (const track of $$('.track', panel)) {
      const match = room === 'all' || track.dataset.genre === room;
      track.hidden = !match;
      if (match) shown += 1;
    }
    if (empty) empty.hidden = shown > 0;
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => select(tab, { focus: false }));
    tab.addEventListener('keydown', (e) => {
      const i = tabs.indexOf(tab);
      let next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs.at(-1);
      if (!next) return;
      e.preventDefault();
      select(next);
    });
  }

  const jump = $('[data-goto-room]');
  if (jump) jump.addEventListener('click', () => {
    const target = tabs.find((t) => t.dataset.room === jump.dataset.gotoRoom);
    if (target) select(target);
  });
}

/* ── Data: backend first, local JSON as the safety net ────── */

const state = { artworks: [], merch: [], online: false, reason: '' };

async function loadShop() {
  const status = $('#shop-status');

  if (API) {
    try {
      const live = await getJSON(`${API}/api/artworks`);
      state.artworks = live.artworks ?? [];
      state.merch = live.products ?? [];
      state.online = true;
      applyShop({ live: true });
      return;
    } catch (err) {
      state.reason = err.name === 'AbortError' ? 'timeout' : 'unreachable';
    }
  } else {
    state.reason = 'not-configured';
  }

  // Fall back to what ships with the page.
  try {
    const [art, merch] = await Promise.all([
      getJSON('data/artworks.json'),
      getJSON('data/merch.json')
    ]);
    state.artworks = art.artworks ?? [];
    state.merch = merch.products ?? [];
  } catch {
    // The HTML already holds the feature piece, so there is nothing to repair.
  }

  applyShop({ live: false });

  if (status) {
    status.textContent = state.reason === 'not-configured'
      ? 'The shop is not open yet. Everything here is real, but you cannot check out.'
      : 'The shop is offline right now, so checkout is unavailable. The artwork below is up to date.';
    if (state.reason !== 'not-configured') {
      const retry = document.createElement('button');
      retry.className = 'linkish';
      retry.type = 'button';
      retry.textContent = 'Try again';
      retry.style.marginLeft = '.5rem';
      retry.addEventListener('click', () => { status.textContent = 'Checking…'; loadShop(); });
      status.append(' ', retry);
    }
  }
}

function applyShop({ live }) {
  // Prices: format from minor units so the markup never carries a formatted string.
  for (const el of $$('[data-price]')) {
    const minor = Number(el.dataset.price);
    if (Number.isFinite(minor)) el.textContent = money.format(minor / 100);
  }

  const count = $('[data-count="artworks"]');
  if (count && state.artworks.length) count.textContent = String(state.artworks.length);

  const draft = $('#draft-note');
  if (draft) {
    const anyDraft = state.artworks.some(
      (a) => a.original?.draftPrice || (a.prints ?? []).some((p) => p.draftPrice)
    );
    draft.hidden = state.artworks.length > 0 && !anyDraft;
  }

  const sold = new Set();
  for (const a of state.artworks) {
    if (a.original && a.original.available === false) sold.add(a.original.sku);
    for (const p of a.prints ?? []) if (p.available === false) sold.add(p.sku);
  }

  for (const btn of $$('.btn--buy')) {
    const row = btn.closest('.buy');
    if (sold.has(btn.dataset.sku)) {
      btn.disabled = true;
      btn.textContent = 'Sold';
      if (row) row.dataset.sold = 'true';
      continue;
    }
    if (live) {
      btn.disabled = false;
      btn.textContent = 'Buy';
      btn.removeAttribute('aria-describedby');
      btn.addEventListener('click', () => openCheckout(btn), { once: false });
    } else {
      btn.disabled = true;
      btn.textContent = 'Checkout offline';
      btn.setAttribute('aria-describedby', 'shop-status');
    }
  }
}

async function loadReleases() {
  const count = $('[data-count="releases"]');
  let data = null;

  if (API) {
    try { data = await getJSON(`${API}/api/releases`); } catch { /* fall through */ }
  }
  if (!data) {
    try { data = await getJSON('data/releases.json'); } catch { return; }
  }

  const releases = data.releases ?? [];
  if (count && releases.length) count.textContent = String(releases.length);

  // Tag the static list with genres so the rooms can filter it.
  const rows = $$('#disco-list .track');
  releases.forEach((rel, i) => {
    const row = rows[i];
    if (row && rel.genre) row.dataset.genre = rel.genre;
  });

  const untagged = releases.filter((r) => !r.genre).length;
  const status = $('#disco-status');
  if (status && untagged === releases.length && releases.length > 0) {
    status.textContent = 'Releases are not sorted into rooms yet, so every room is empty. Everything is listed below.';
  }
}

/* ── Checkout ─────────────────────────────────────────────── */

let openerEl = null;

function openCheckout(btn) {
  const dialog = $('#buy-dialog');
  if (!dialog) return;
  openerEl = btn;

  const row = btn.closest('.buy');
  const name = row ? $('.buy__name', row)?.textContent?.trim() : 'Artwork';
  const note = row ? $('.buy__note', row)?.textContent?.trim() : '';
  const price = row ? $('.buy__price', row)?.textContent?.trim() : '';

  $('#buy-piece').textContent = name ?? 'Artwork';
  $('#buy-detail').textContent = note ?? '';
  $('#buy-price').textContent = price ?? '';
  $('#buy-form').dataset.sku = btn.dataset.sku ?? '';

  const err = $('#buy-error');
  err.hidden = true;
  err.textContent = '';

  dialog.showModal();          // native modal traps Tab and closes on Escape
  $('#buy-name').focus();
}

function checkout() {
  const dialog = $('#buy-dialog');
  const form = $('#buy-form');
  if (!dialog || !form) return;

  const close = () => dialog.close();
  $('#buy-close')?.addEventListener('click', close);

  // Return focus to whatever opened the dialog.
  dialog.addEventListener('close', () => {
    openerEl?.focus();
    openerEl = null;
  });

  // Clicking the backdrop closes it.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) close();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const err = $('#buy-error');
    const submit = $('#buy-submit');

    for (const field of $$('input[required], textarea[required]', form)) {
      const bad = !field.checkValidity();
      field.setAttribute('aria-invalid', String(bad));
      if (bad) {
        err.hidden = false;
        err.textContent = 'Check the highlighted fields — something is missing or mistyped.';
        field.focus();
        return;
      }
    }

    if (!API) {
      err.hidden = false;
      err.textContent = 'Checkout is not connected yet, so this order cannot be taken.';
      return;
    }

    submit.disabled = true;
    submit.textContent = 'Talking to the payment page…';
    err.hidden = true;

    try {
      // Only the SKU and the buyer's details go up. The server looks the
      // price up in the database — nothing about money is trusted from here.
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sku: form.dataset.sku,
          name: $('#buy-name').value.trim(),
          email: $('#buy-email').value.trim(),
          address: $('#buy-address').value.trim(),
          postcode: $('#buy-postcode').value.trim(),
          country: $('#buy-country').value.trim()
        })
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.checkoutUrl) {
        throw new Error(body.error ?? 'The payment page could not be created.');
      }
      window.location.href = body.checkoutUrl;
    } catch (ex) {
      err.hidden = false;
      err.textContent = `${ex.message} Nothing has been charged. Try again in a moment.`;
      submit.disabled = false;
      submit.textContent = 'Continue to payment';
    }
  });
}

/* ── Mailing list ─────────────────────────────────────────── */

function newsletter() {
  const form = $('#newsletter');
  if (!form) return;
  const msg = $('#sub-msg');
  const input = $('#sub-email');
  const btn = $('#sub-submit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!input.checkValidity()) {
      input.setAttribute('aria-invalid', 'true');
      msg.dataset.state = 'error';
      msg.textContent = 'That email address does not look right — check it and try again.';
      input.focus();
      return;
    }
    input.setAttribute('aria-invalid', 'false');

    if (!API) {
      msg.dataset.state = 'error';
      msg.textContent = 'The list is not connected yet. Try again once the site is live.';
      return;
    }

    btn.disabled = true;
    msg.dataset.state = '';
    msg.textContent = 'Adding you…';

    try {
      const res = await fetch(`${API}/api/subscribe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: input.value.trim() })
      });
      if (!res.ok) throw new Error('That did not go through.');
      msg.dataset.state = 'ok';
      msg.textContent = 'You are on the list. Check your inbox to confirm.';
      form.reset();
    } catch (ex) {
      msg.dataset.state = 'error';
      msg.textContent = `${ex.message} Try again in a moment.`;
    } finally {
      btn.disabled = false;
    }
  });
}

/* ── Comments ─────────────────────────────────────────────── */

function comments() {
  const mount = $('#comments');
  const g = CFG.giscus ?? {};
  if (!mount || !g.repo || !g.repoId || !g.categoryId) return;

  $('#comments-fallback')?.remove();
  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.async = true;
  s.crossOrigin = 'anonymous';
  Object.assign(s.dataset, {
    repo: g.repo,
    repoId: g.repoId,
    category: g.category ?? 'General',
    categoryId: g.categoryId,
    mapping: 'pathname',
    reactionsEnabled: '1',
    emitMetadata: '0',
    inputPosition: 'top',
    theme: 'dark_dimmed',
    lang: 'en',
    loading: 'lazy'
  });
  mount.append(s);
}

/* ── Go ───────────────────────────────────────────────────── */

chrome();
topbar();
platforms();
rooms();
checkout();
newsletter();
comments();
loadShop();
loadReleases();
