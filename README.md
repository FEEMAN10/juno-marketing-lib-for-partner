# Juno Markets — Partner Marketing Library

A self-service marketing library for Juno Markets partners. Partners pick a
campaign, add their referral code, get a fully UTM-tracked link (plus an
optional branded short link), and download / share / copy ready-made creatives.
Campaigns are created and managed by the Juno team in a password-protected admin
console.

Built to run on **Netlify** (static frontend + Netlify Functions + Netlify Blobs).
No external database or third-party services required.

---

## What partners can do  (`/`)

1. **Choose a campaign** from the ones Juno has published.
2. **Enter their referral code.**
3. The app **injects the UTM parameters** automatically:
   `utm_source=partners`, `utm_medium=landing-page`, `utm_campaign=<campaign>`.
4. **See the final tracked URL**, e.g.
   `http://juno-promo.com/id/trading-gold-24-7?refercode=T3s71B&utm_source=partners&utm_medium=landing-page&utm_campaign=trading-gold-24-7`
5. **Copy** the link, or **create a short link** on Juno's domain (`/s/AbC123`).
6. **View the campaign creatives** uploaded by the Juno team.
7. **Download**, **share** (Web Share API), or **copy** each creative to clipboard.

## What the Juno team can do  (`/admin`)

Sign in with the admin key, then create/edit campaigns with:

- Landing page URL *(required)*
- `utm_campaign` value *(required)*
- A **9:16 portrait** key visual *(required)*
- Optional visuals in **4:5, 1:1, 16:9, 1.91:1**
- Description + draft/published status

---

## Project layout

```
public/                     Static frontend (published by Netlify)
  index.html                Partner marketing library
  admin/index.html          Admin console
  assets/css/styles.css
  assets/js/app.js          Partner logic (link builder, creatives)
  assets/js/admin.js        Admin logic (campaign CRUD, uploads)
netlify/
  lib/util.mjs              Shared helpers (Blob stores, auth, slug, short codes)
  functions/
    campaigns.mjs           GET list · POST/PUT/DELETE (admin)   -> /api/campaigns
    upload.mjs              POST image (admin)                    -> /api/upload
    asset.mjs              GET image bytes (public)               -> /asset/:id
    shorten.mjs            POST create short link (public)        -> /api/shorten
    redirect.mjs           GET short link redirect (public)       -> /s/:code
netlify.toml
package.json
```

Data is stored in **Netlify Blobs**: `campaigns` (catalog JSON), `assets`
(uploaded images), and `shortlinks` (short-code → URL).

---

## Deploy to Netlify

### 1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket)

```bash
git init && git add . && git commit -m "Juno partner marketing library"
# then create a repo and push
```

### 2. Create the site on Netlify

- New site → import the repo. Netlify auto-detects `netlify.toml`
  (publish dir `public`, functions dir `netlify/functions`).
- Or drag-and-drop deploy after `npm install`.

### 3. Set environment variables  (Site settings → Environment variables)

| Variable         | Required | Purpose                                                                 |
|------------------|----------|-------------------------------------------------------------------------|
| `ADMIN_PASSWORD` | **Yes**  | The admin key used to sign in at `/admin` and authorize all writes.     |
| `SHORTLINK_BASE` | No       | Base URL for short links, e.g. `https://juno-promo.com`. Defaults to the deploy origin. |
| `ALLOWED_HOSTS`  | No       | Extra comma-separated origins allowed as short-link targets (campaign landing origins are always allowed). |

> **Set a strong `ADMIN_PASSWORD`.** It's the only thing protecting campaign
> management and uploads.

### 4. Netlify Blobs

Blobs are enabled automatically for sites with Functions — no setup needed.

### 5. (Optional) Custom domain / short links on `juno-promo.com`

Point the domain at the Netlify site and set `SHORTLINK_BASE=https://juno-promo.com`
so generated short links read `https://juno-promo.com/s/AbC123`.

---

## Local development

```bash
npm install
npx netlify login          # once
npx netlify link           # link to the Netlify site (enables Blobs locally)
ADMIN_PASSWORD=devkey npx netlify dev
```

Open `http://localhost:8888` (partner) and `http://localhost:8888/admin`
(sign in with `devkey`). `netlify dev` runs the functions and a local Blobs
sandbox, so uploads and short links work end-to-end.

---

## Security notes

- The admin uses a single shared key (`ADMIN_PASSWORD`) sent as a Bearer token.
  It's compared in constant time server-side. Good for a small internal team;
  for per-user accounts, swap in Netlify Identity or an SSO provider later.
- The short-link endpoint only accepts targets whose origin matches a campaign
  landing page (or `ALLOWED_HOSTS`), preventing open-redirect abuse.
- Uploaded images are validated for type (jpg/png/webp/gif) and size (≤15 MB).
