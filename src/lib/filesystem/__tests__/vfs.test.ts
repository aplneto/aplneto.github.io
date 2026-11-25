import { describe, expect, it } from 'vitest';
import { isPublished, isPublicForFeed } from '../../../utils/content';
import { buildVfsManifest, type ManifestEntryInput } from '../manifest';
import { HOME_PATH, normalizePath, ROOT_PATH } from '../paths';
import { VfsError } from '../types';
import { sanitizeTerminalText, stripFrontmatter, VirtualFilesystem } from '../vfs';

function makeEntry(overrides: Partial<ManifestEntryInput> & { id: string }): ManifestEntryInput {
  return {
    id: overrides.id,
    body: overrides.body ?? 'Hello world body.',
    data: {
      title: overrides.data?.title ?? 'Sample Entry',
      description: overrides.data?.description ?? 'A short description.',
      publishedAt: overrides.data?.publishedAt ?? new Date('2026-11-24'),
      category: overrides.data?.category ?? 'ai',
      kind: overrides.data?.kind ?? 'note',
      status: overrides.data?.status ?? 'raw',
      tags: overrides.data?.tags ?? ['test'],
      draft: overrides.data?.draft ?? false,
      archived: overrides.data?.archived ?? false,
      virtualPath: overrides.data?.virtualPath ?? null,
    },
  };
}

describe('paths.normalizePath', () => {
  it('handles home expansion, relative paths, dots, and repeated slashes', () => {
    expect(normalizePath('~')).toBe(HOME_PATH);
    expect(normalizePath('~/notes//ai/')).toBe('/home/guest/notes/ai');
    expect(normalizePath('notes/ai', HOME_PATH)).toBe('/home/guest/notes/ai');
    expect(normalizePath('./notes/../experiments/', HOME_PATH)).toBe('/home/guest/experiments');
    expect(normalizePath('/../../../..', HOME_PATH)).toBe(ROOT_PATH);
    expect(normalizePath('', HOME_PATH)).toBe(HOME_PATH);
  });

  it('rejects backslashes and control characters', () => {
    expect(() => normalizePath('notes\\ai', HOME_PATH)).toThrow(VfsError);
    expect(() => normalizePath('notes\x00ai', HOME_PATH)).toThrow(VfsError);
  });
});

describe('buildVfsManifest and publication filter', () => {
  it('excludes drafts in production mode and includes them in dev mode', () => {
    const published = makeEntry({ id: 'pub-one', data: { ...makeEntry({ id: 'pub-one' }).data, draft: false } });
    const draft = makeEntry({ id: 'secret-draft', data: { ...makeEntry({ id: 'secret-draft' }).data, draft: true } });

    expect(isPublished(published, false)).toBe(true);
    expect(isPublished(draft, false)).toBe(false);
    expect(isPublished(draft, true)).toBe(true);
    expect(isPublicForFeed(draft)).toBe(false);

    const prod = buildVfsManifest({ entries: [published], projects: [] });
    const vfs = new VirtualFilesystem(prod.manifest);
    expect(vfs.exists('/home/guest/notes/ai/pub-one.md')).toBe(true);
    expect(vfs.exists('/home/guest/notes/ai/secret-draft.md')).toBe(false);
  });

  it('routes experiments to /home/guest/experiments and archived to /home/guest/archive', () => {
    const exp = makeEntry({
      id: 'exp-1',
      data: { ...makeEntry({ id: 'exp-1' }).data, kind: 'experiment', category: 'security' },
    });
    const arch = makeEntry({
      id: 'old-1',
      data: { ...makeEntry({ id: 'old-1' }).data, archived: true },
    });

    const { manifest } = buildVfsManifest({ entries: [exp, arch], projects: [] });
    const vfs = new VirtualFilesystem(manifest);

    expect(vfs.exists('/home/guest/experiments/exp-1.md')).toBe(true);
    expect(vfs.exists('/home/guest/archive/old-1.md')).toBe(true);
  });

  it('throws on virtual path collisions', () => {
    const a = makeEntry({
      id: 'a',
      data: { ...makeEntry({ id: 'a' }).data, virtualPath: '/home/guest/notes/ai/same.md' },
    });
    const b = makeEntry({
      id: 'b',
      data: { ...makeEntry({ id: 'b' }).data, virtualPath: '/home/guest/notes/ai/same.md' },
    });

    expect(() => buildVfsManifest({ entries: [a, b], projects: [] })).toThrow(VfsError);
  });
});

describe('VirtualFilesystem operations', () => {
  it('lists directories, builds trees, completes paths, and throws predictable errors', () => {
    const entry = makeEntry({ id: 'my-note' });
    const { manifest } = buildVfsManifest({ entries: [entry], projects: [] });
    const vfs = new VirtualFilesystem(manifest);

    const homeList = vfs.list('~');
    expect(homeList.map((n) => n.name)).toContain('README.md');
    expect(homeList.map((n) => n.name)).toContain('DISCLAIMER.md');
    expect(homeList.map((n) => n.name)).toContain('contact.md');
    expect(homeList.map((n) => n.name)).toContain('notes');
    expect(homeList.map((n) => n.name)).toContain('skills');
    expect(homeList.map((n) => n.name)).toContain('Desktop');
    expect(vfs.list('~/Desktop').map((n) => n.name)).toContain('pictures');

    expect(vfs.completePath('READ', HOME_PATH)).toEqual(['README.md']);
    expect(vfs.completePath('notes/a', HOME_PATH)).toEqual(['notes/ai/']);
    expect(() => vfs.resolve('/does/not/exist')).toThrow(VfsError);
    expect(() => vfs.readMetadata('/home/guest/notes')).toThrow(VfsError);
  });

  it('strips frontmatter and neutralizes terminal control sequences', () => {
    const md = '---\ntitle: Test\n---\n\n# Heading\nBody';
    expect(stripFrontmatter(md)).toBe('# Heading\nBody');

    const hostile = 'Hello \x1b[31mred\x1b[0m \x1b]0;title\x07world\x08!';
    expect(sanitizeTerminalText(hostile)).toBe('Hello red world!');
  });
});
