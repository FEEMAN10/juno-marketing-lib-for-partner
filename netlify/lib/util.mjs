import { getStore } from '@netlify/blobs';

/* ------------------------------------------------------------------ *
 * Blob stores
 * ------------------------------------------------------------------ */
export function campaignsStore() {
  return getStore({ name: 'campaigns', consistency: 'strong' });
}
export function assetsStore() {
  return getStore({ name: 'assets', consistency: 'strong' });
}
export function linksStore() {
  return getStore({ name: 'shortlinks', consistency: 'strong' });
}
export function analyticsStore() {
  return getStore({ name: 'analytics', consistency: 'strong' });
}

/* ------------------------------------------------------------------ *
 * Click analytics — a single aggregate summary document updated on each
 * short-link click. Fine for this scale; perfect accuracy isn't required
 * (a rare concurrent click may be undercounted).
 * ------------------------------------------------------------------ */
const SUMMARY_KEY = 'summary';

export function emptySummary() {
  return { total: 0, firstClickAt: null, lastClickAt: null, campaigns: {}, refercodes: {}, days: {}, langs: {} };
}

export async function readSummary() {
  const s = await analyticsStore().get(SUMMARY_KEY, { type: 'json' });
  return s && typeof s === 'object' ? { ...emptySummary(), ...s } : emptySummary();
}

export async function recordClick({ campaign, refercode, lang, at }) {
  const store = analyticsStore();
  const s = (await store.get(SUMMARY_KEY, { type: 'json' })) || emptySummary();
  const camp = campaign || '(unknown)';
  const ref = refercode || '(none)';
  const lg = lang || 'unknown';
  const day = at.slice(0, 10);

  s.total = (s.total || 0) + 1;
  s.firstClickAt = s.firstClickAt || at;
  s.lastClickAt = at;
  const bump = (obj, key) => { obj[key] = (obj[key] || 0) + 1; };
  s.days = s.days || {}; bump(s.days, day);
  s.refercodes = s.refercodes || {}; bump(s.refercodes, ref);
  s.langs = s.langs || {}; bump(s.langs, lg);
  s.campaigns = s.campaigns || {};
  const c = s.campaigns[camp] || (s.campaigns[camp] = { total: 0, refercodes: {}, days: {}, langs: {} });
  c.total += 1;
  bump(c.refercodes, ref);
  bump(c.days, day);
  bump(c.langs, lg);

  await store.setJSON(SUMMARY_KEY, s);
  return s;
}

/* The whole campaign catalog is stored as a single JSON document.
 * Campaigns are admin-managed and low in volume, so this keeps reads/writes
 * simple and consistent (no list-pagination or per-key race conditions). */
const CATALOG_KEY = 'catalog';

export async function readCatalog() {
  const data = await campaignsStore().get(CATALOG_KEY, { type: 'json' });
  return Array.isArray(data) ? data : [];
}
export async function writeCatalog(list) {
  await campaignsStore().setJSON(CATALOG_KEY, list);
}

/* ------------------------------------------------------------------ *
 * HTTP helpers
 * ------------------------------------------------------------------ */
export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  });
}

/* ------------------------------------------------------------------ *
 * Auth — a single shared admin key kept in the ADMIN_PASSWORD env var.
 * Sent by the admin UI as `Authorization: Bearer <key>`.
 * ------------------------------------------------------------------ */
export function requireAdmin(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return {
      ok: false,
      res: json({ error: 'Server not configured: set the ADMIN_PASSWORD environment variable in Netlify.' }, 500),
    };
  }
  const auth = req.headers.get('authorization') || '';
  const provided = auth.replace(/^Bearer\s+/i, '').trim() || req.headers.get('x-admin-key') || '';
  if (!safeEqual(provided, expected)) {
    return { ok: false, res: json({ error: 'Unauthorized. Check your admin key.' }, 401) };
  }
  return { ok: true };
}

function safeEqual(a, b) {
  a = String(a);
  b = String(b);
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

/* ------------------------------------------------------------------ *
 * Misc
 * ------------------------------------------------------------------ */
export function slug(s) {
  return String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// URL-safe short code, avoiding ambiguous characters (0/O, 1/l/I).
export function shortCode(len = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = '';
  for (let i = 0; i < len; i++) out += chars[bytes[i] % chars.length];
  return out;
}
