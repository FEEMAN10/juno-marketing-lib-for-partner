import { linksStore } from '../lib/util.mjs';

/**
 * /s/:code  (public)
 * Looks up the short code and 302-redirects to the full target URL.
 */
export default async (req) => {
  const code = new URL(req.url).pathname.split('/').filter(Boolean).pop();
  if (!code) return new Response('Missing short code', { status: 400 });

  const rec = await linksStore().get(code, { type: 'json' });
  if (!rec || !rec.url) {
    return new Response('Short link not found or expired.', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
  return Response.redirect(rec.url, 302);
};

export const config = { path: '/s/:code' };
