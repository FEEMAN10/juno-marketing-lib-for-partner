import { assetsStore, json, requireAdmin } from '../lib/util.mjs';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * /api/upload  (admin)
 * POST { filename, contentType, dataBase64 }
 *   -> { assetId, url, filename, contentType }
 *
 * Stores the raw image bytes in the `assets` blob store. Images are served
 * back publicly by the asset function at /asset/:id.
 */
export default async (req) => {
  if (req.method.toUpperCase() !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const auth = requireAdmin(req);
  if (!auth.ok) return auth.res;

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { filename, contentType, dataBase64 } = body;
  if (!contentType || !dataBase64) {
    return json({ error: 'contentType and dataBase64 are required' }, 400);
  }
  if (!ALLOWED_TYPES.includes(contentType)) {
    return json({ error: `Unsupported image type. Allowed: ${ALLOWED_TYPES.join(', ')}` }, 415);
  }

  let buf;
  try {
    buf = Buffer.from(dataBase64, 'base64');
  } catch {
    return json({ error: 'Invalid base64 image data' }, 400);
  }
  if (!buf.length) return json({ error: 'Empty image' }, 400);
  if (buf.length > MAX_BYTES) return json({ error: 'Image exceeds the 15 MB limit' }, 413);

  const id = crypto.randomUUID();
  const blob = new Blob([buf], { type: contentType });
  await assetsStore().set(id, blob, {
    metadata: { contentType, filename: filename || id },
  });

  return json({ assetId: id, url: `/asset/${id}`, filename: filename || id, contentType }, 201);
};

export const config = { path: '/api/upload' };
