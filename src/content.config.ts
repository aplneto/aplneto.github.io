import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const entries = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/entries' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    entryNumber: z.number().int().positive().nullable().optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().nullable().optional(),
    category: z.enum(['security', 'ai', 'engineering', 'miscellaneous']),
    kind: z.enum(['note', 'experiment', 'article', 'devlog']),
    status: z.enum([
      'raw',
      'speculative',
      'exploratory',
      'experimental',
      'revisited',
      'retracted',
    ]),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(true),
    archived: z.boolean().default(false),
    virtualPath: z.string().nullable().optional(),
    repository: z.string().url().nullable().optional(),
    series: z.string().nullable().optional(),
    retractionReason: z.string().nullable().optional(),
    retractedAt: z.coerce.date().nullable().optional(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    status: z.string().optional(),
    stack: z.array(z.string()).default([]),
    repository: z.string().url().nullable().optional(),
    url: z.string().url().nullable().optional(),
    draft: z.boolean().default(true),
    relatedEntries: z.array(z.string()).default([]),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().optional(),
  }),
});

export const collections = { entries, projects, pages };
