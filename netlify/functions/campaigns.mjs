import { readCatalog, writeCatalog, json, requireAdmin, slug } from '../lib/util.mjs';

const RATIOS = ['9:16', '4:5', '1:1', '16:9', '1.91:1'];
// English lives in the top-level title/description; these are optional overrides.
const CONTENT_LANGS = ['ru', 'th', 'id', 'ar', 'zh'];

/**
 * /api/campaigns
 *   GET                 -> public list of published campaigns
 *   GET   ?all=1        -> full list incl. drafts (admin)
 *   POST                -> create campaign (admin)
 *   PUT                 -> update campaign (admin, body.id required)
 *   DELETE ?id=...      -> delete campaign (admin)
 */
export default async (req) => {
  const method = req.method.toUpperCase();
  const url = new URL(req.url);

  if (method === 'GET') {
    let list = await readCatalog();
    if (url.searchParams.get('all') === '1') {
      const auth = requireAdmin(req);
      if (!auth.ok) return auth.res;
    } else {
      list = list.filter((c) => c.status === 'published');
    }
    return json({ campaigns: list });
  }

  // Every mutation requires the admin key.
  const auth = requireAdmin(req);
  if (!auth.ok) return auth.res;

  if (method === 'POST' || method === 'PUT') {
    let body;
    try {
      body = await req.json();
    } catch {
      return json({ error: 'Invalid JSON body' }, 400);
    }

    const visuals = normalizeVisuals(body.visuals);
    const errors = [];
    if (!body.title || !String(body.title).trim()) errors.push('title is required');
    if (!isValidUrl(body.landingPageUrl)) errors.push('a valid landing page URL is required');
    if (!body.utmCampaign || !String(body.utmCampaign).trim()) errors.push('utm_campaign is required');
    if (!visuals.some((v) => v.ratio === '9:16')) errors.push('a 9:16 portrait key visual is required');
    if (errors.length) return json({ error: errors.join('; ') }, 400);

    const list = await readCatalog();
    const now = new Date().toISOString();

    if (method === 'PUT') {
      const idx = list.findIndex((c) => c.id === body.id);
      if (idx === -1) return json({ error: 'Campaign not found' }, 404);
      list[idx] = {
        ...list[idx],
        title: String(body.title).trim(),
        description: String(body.description || '').trim(),
        translations: normalizeTranslations(body.translations),
        landingPageUrl: String(body.landingPageUrl).trim(),
        utmCampaign: slug(body.utmCampaign),
        status: body.status === 'draft' ? 'draft' : 'published',
        visuals,
        updatedAt: now,
      };
      await writeCatalog(list);
      return json({ campaign: list[idx] });
    }

    const campaign = {
      id: crypto.randomUUID(),
      title: String(body.title).trim(),
      description: String(body.description || '').trim(),
      translations: normalizeTranslations(body.translations),
      landingPageUrl: String(body.landingPageUrl).trim(),
      utmCampaign: slug(body.utmCampaign),
      status: body.status === 'draft' ? 'draft' : 'published',
      visuals,
      createdAt: now,
      updatedAt: now,
    };
    list.push(campaign);
    await writeCatalog(list);
    return json({ campaign }, 201);
  }

  if (method === 'DELETE') {
    const id = url.searchParams.get('id');
    if (!id) return json({ error: 'id query parameter required' }, 400);
    const list = await readCatalog();
    await writeCatalog(list.filter((c) => c.id !== id));
    return json({ ok: true });
  }

  return json({ error: 'Method not allowed' }, 405);
};

function normalizeVisuals(input) {
  if (!Array.isArray(input)) return [];
  return input
    .filter((v) => v && RATIOS.includes(v.ratio) && v.assetId)
    .map((v) => ({
      ratio: v.ratio,
      assetId: String(v.assetId),
      url: v.url || `/asset/${v.assetId}`,
      filename: v.filename || '',
      contentType: v.contentType || '',
    }));
}

// Optional per-language title/description overrides. English is the base
// (top-level title/description); only non-empty language entries are stored.
function normalizeTranslations(input) {
  const out = {};
  if (input && typeof input === 'object') {
    for (const code of CONTENT_LANGS) {
      const v = input[code];
      if (v && typeof v === 'object') {
        const title = String(v.title || '').trim();
        const description = String(v.description || '').trim();
        const landingPageUrl = isValidUrl(v.landingPageUrl) ? String(v.landingPageUrl).trim() : '';
        if (title || description || landingPageUrl) out[code] = { title, description, landingPageUrl };
      }
    }
  }
  return out;
}

function isValidUrl(u) {
  try {
    const parsed = new URL(String(u));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const config = { path: '/api/campaigns' };
