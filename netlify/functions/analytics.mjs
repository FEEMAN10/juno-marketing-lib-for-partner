import { readSummary, json, requireAdmin } from '../lib/util.mjs';

/**
 * /api/analytics  (admin)
 * GET -> the aggregated short-link click summary.
 */
export default async (req) => {
  if (req.method.toUpperCase() !== 'GET') return json({ error: 'Method not allowed' }, 405);

  const auth = requireAdmin(req);
  if (!auth.ok) return auth.res;

  return json({ summary: await readSummary() });
};

export const config = { path: '/api/analytics' };
