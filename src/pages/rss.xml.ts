import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_CONFIG } from '../site.config';
import { isPublicForFeed, sortEntriesByDate, withBase } from '../utils/content';

export const GET: APIRoute = async (context) => {
  const entries = sortEntriesByDate(
    await getCollection('entries', (entry) => isPublicForFeed(entry)),
  );

  return rss({
    title: SITE_CONFIG.siteName,
    description: SITE_CONFIG.description,
    site: context.site ?? 'https://aplneto.github.io',
    items: entries.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.publishedAt,
      description: entry.data.description,
      link: withBase(`/notes/${entry.id}/`),
      categories: [entry.data.category, entry.data.kind, ...entry.data.tags],
    })),
    customData: `<language>${SITE_CONFIG.language}</language>`,
  });
};
