# Handing the site over to the artist

Written 2 August 2026, when the site was live on <https://tumanic.com> with the
API on Render and Firestore holding the catalogue.

This is about **accounts and liability**, not code. The code is already his in
every practical sense — it is a public repo. What matters is who owns the
things that take money, hold customer data, and can switch the site off.

## Decide the shape first

**Option A — he owns everything, you walk away.** Clean break. Transfer every
account, rotate every secret, remove yourself.

**Option B — he owns everything, you keep a key.** He owns the accounts; you
are added as a collaborator or team member so you can keep doing the
maintenance. This is what a build fee plus a monthly arrangement should look
like.

Either way **he owns the accounts.** Not because it is polite, but because:

- Money from sales must land in his bank account. Taking his customers' money
  into yours is a tax and liability problem for both of you.
- The privacy notice names a data controller. Whoever that is carries the legal
  duty for customer data and answers to the ICO, not to you.
- If the relationship ever sours, whoever holds the domain holds the site.

The only thing that changes between A and B is whether you keep access
afterwards.

## Order matters — do these in sequence

### 1. Mollie — settle this before anything else

Whoever's Mollie account is connected receives every payment. It must be his,
verified with his ID and his bank details. Mollie runs KYC checks, so this is
not instant — start it first.

Once his account is live, put his API key into Render's environment as
`MOLLIE_API_KEY` and delete the old one. Then run one real payment end to end
before trusting it.

⚠️ If the current account is yours and a sale happens before this is done, the
money arrives in your account and has to be passed on manually. Avoid the
situation rather than managing it.

### 2. The domain

Whoever holds `tumanic.com` at the registrar controls where the site points.

⚠️ **A domain registered less than 60 days ago cannot be transferred to a
different registrar** — ICANN rule, no exceptions. If it was bought recently,
use the registrar's own *account push* instead (Namecheap, GoDaddy and most
others have one). That moves it between accounts at the same registrar,
usually instantly and free.

If you would rather not wait, leave it where it is for now and move it once the
lock lifts — but write the date down, because it is easy to forget for a year.

### 3. Firestore — migrate, do not recreate

If any real orders exist, this database holds customer names, emails and
addresses. Do not start a fresh project and lose them.

Firebase console → Project settings → Users and permissions → add his Google
account as **Owner**, then remove yourself. The project, the data and the
service account key all stay exactly as they are, so nothing in Render needs
touching.

Moving customer data between two different controllers is a disclosure in its
own right. Keeping the same project and changing who owns it avoids that
entirely.

### 4. GitHub repo

Repo → Settings → Danger Zone → **Transfer ownership** to his account.

Two things to expect:

- **`altopurse.github.io` stops working.** It only ever served at that address
  because the repo name matched your username. After transfer it is an ordinary
  project repo. This does not matter — `CNAME` points at `tumanic.com` and that
  keeps working — but do not panic when the old URL 404s.
- **HTTPS has to reissue.** Pages must be re-enabled on his account and the
  custom domain re-entered. The certificate takes up to about 15 minutes, and
  the site may be unreachable in that window. Do it at a quiet hour, not
  before a gig.

If you have a domain verification recorded against your GitHub account,
remove it, or his account cannot claim the same domain.

### 5. Render

Render can move a service to another workspace — that keeps the hostname, which
is by far the easier path.

If instead he creates a fresh service from `render.yaml`, **the hostname
changes**, and two things break until they are updated:

- `apiBase` in `assets/js/config.js` — the site talks to the old address
- `PUBLIC_API_URL` in Render's environment — Mollie's webhook posts to the old
  address, so payments succeed but orders are never marked paid

That second one fails silently and is the single most likely thing to go wrong
in this whole process. Check it deliberately.

### 6. Rotate every secret

Once he owns the accounts, anything you have seen should stop working:

| Secret | Where | Note |
|---|---|---|
| `MOLLIE_API_KEY` | Render | His account's key |
| `ADMIN_TOKEN` | Render | New random value — this is the key to the orders |
| `ANALYTICS_SALT` | Render | Rotating it resets visitor counts. That is by design |
| Firebase service account | Firebase console | Generate a new key, delete the old |

Then delete your local `server/.env`, because it holds the old values.

### 7. The privacy notice is a legal document, not decoration

`privacy.html` currently names the data controller and a contact address. When
ownership moves, **that name must change to whoever is now responsible**, and
the address must be one he actually reads. Leaving your name on it means you are
still the one on the hook for a data request.

Update the "Who is responsible" section and the "Last updated" date together.

### 8. Smaller accounts

Buttondown (mailing list) and Giscus (comments) should be his logins too, if
they are ever connected. Neither is set up yet.

## Before you call it done

Run through these on the live site, signed out, on a phone:

- [ ] A real payment completes and the order shows as paid in `/admin/`
- [ ] `/admin/` opens with the **new** token and rejects the old one
- [ ] `tumanic.com` and `www.tumanic.com` both load over HTTPS
- [ ] The privacy notice names the right controller and a working address
- [ ] He can sign in to GitHub, Render, Firebase, Mollie and the registrar
      himself, without asking you for anything

That last one is the real test. If he still needs you to get into something, it
has not been handed over — it has been lent.

## Write down what changed hands

One short email to him listing every account, who owns it now, and what it
costs per month. Not a formality: in six months nobody remembers whether the
domain renews on his card or yours, and that is how sites quietly expire.
