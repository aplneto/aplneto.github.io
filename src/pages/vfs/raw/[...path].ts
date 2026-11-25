import type { APIRoute, GetStaticPaths } from 'astro';
import { loadBuiltManifest } from '../../../lib/filesystem/loadManifest';

export const getStaticPaths: GetStaticPaths = async () => {
  const { rawTexts } = await loadBuiltManifest();
  return Object.entries(rawTexts).map(([slug, text]) => ({
    params: { path: `${slug}.txt` },
    props: { text },
  }));
};

export const GET: APIRoute = ({ props }) => {
  const text = typeof props.text === 'string' ? props.text : '';
  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
