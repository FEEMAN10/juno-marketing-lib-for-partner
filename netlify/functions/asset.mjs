import { assetsStore, json } from '../lib/util.mjs';

/**
 * /asset/:id  (public)
 * Streams the stored image bytes back with the right content type.
 */
export default async (req) => {
  const id = new URL(req.url).pathname.split('/').filter(Boolean).pop();
  if (!id) return json({ error: 'Missing asset id' }, 400);

  const result = await assetsStore().getWithMetadata(id, { type: 'arrayBuffer' });
  if (!result || !result.data) return json({ error: 'Asset not found' }, 404);

  const contentType = result.metadata?.contentType || 'application/octet-stream';
  return new Response(result.data, {
    status: 200,
    headers: {
      'content-type': contentType,
      'cache-control': 'public, max-age=31536000, immutable',
      'access-control-allow-origin': '*',
    },
  });
};

export const config = { path: '/asset/:id' };
