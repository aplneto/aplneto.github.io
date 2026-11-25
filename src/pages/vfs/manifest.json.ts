import type { APIRoute } from 'astro';
import { loadBuiltManifest } from '../../lib/filesystem/loadManifest';

export const GET: APIRoute = async () => {
  const { manifest } = await loadBuiltManifest();
  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};
