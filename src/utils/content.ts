import type { CollectionEntry } from 'astro:content';

export type EntryItem = CollectionEntry<'entries'>;
export type ProjectItem = CollectionEntry<'projects'>;

/**
 * Single publication filter used across routes, virtual filesystem manifest,
 * raw Markdown resources, RSS, and sitemap.
 * Drafts are shown only when explicitly requested (e.g. local dev server).
 */
export function isPublished<T extends { data: { draft: boolean } }>(
  item: T,
  includeDrafts: boolean = import.meta.env.DEV,
): boolean {
  return !item.data.draft || includeDrafts;
}

/**
 * Feeds and sitemaps must never include drafts, even during local preview/dev.
 */
export function isPublicForFeed<T extends { data: { draft: boolean } }>(item: T): boolean {
  return !item.data.draft;
}

export function sortEntriesByDate(entries: EntryItem[]): EntryItem[] {
  return [...entries].sort(
    (a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf(),
  );
}

export function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function estimateReadingTimeMinutes(body: string | undefined): number {
  if (!body) return 1;
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}

export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${cleanPath}`;
}
