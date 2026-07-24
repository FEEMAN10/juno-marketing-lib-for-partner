import { linksStore, readCatalog, json, shortCode } from '../lib/util.mjs';

/**
 * /api/shorten  (public — used by partners)
 * POST { url } -> { code, shortUrl }
 *
 * Creates a branded short link (/s/<code>) that redirects to the full
 * referral + UTM URL. To prevent the endpoint from being abused as an
 * open redirect, the target URL's origin must match one of the campaign
 * landing-page origins (or an origin listed in ALLOWED_HOSTS).
 */
export default async (req) => {
  if (req.method.toUpperCase() !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { url } = body;
  if (!url) return json({ error: 'url is required' }, 400);

  let target;
  try {
    target = new URL(url);
  } catch {
    return json({ error: 'Invalid URL' }, 400);
  }
  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    return json({ error: 'Only http/https URLs are allowed' }, 400);
  }

  const allowed = new Set();
  for (const c of await readCatalog()) {
    const urls = [c.landingPageUrl];
    if (c.translations) {
      for (const tr of Object.values(c.translations)) {
        if (tr && tr.landingPageUrl) urls.push(tr.landingPageUrl);
      }
    }
    for (const u of urls) {
      try { allowed.add(new URL(u).origin); } catch { /* ignore malformed stored URL */ }
    }
  }
  for (const h of (process.env.ALLOWED_HOSTS || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    allowed.add(h);
  }
  if (allowed.size > 0 && !allowed.has(target.origin)) {
    return json({ error: 'This URL host is not allowed for short links' }, 400);
  }

  const store = linksStore();
  let code;
  for (let i = 0; i < 6; i++) {
    code = shortCode(6);
    const existing = await store.get(code);
    if (!existing) break;
  }
  await store.setJSON(code, { url: target.toString(), createdAt: new Date().toISOString() });

  const base = (process.env.SHORTLINK_BASE || new URL(req.url).origin).replace(/\/$/, '');
  return json({ code, shortUrl: `${base}/s/${code}` }, 201);
};

export const config = { path: '/api/shorten' };
