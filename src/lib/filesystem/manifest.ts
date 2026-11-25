import { basename, dirname, HOME_PATH, normalizePath, ROOT_PATH } from './paths';
import { ABOUT_MARKDOWN, DISCLAIMER_MARKDOWN, README_MARKDOWN } from './systemFiles';
import { VfsError, type VfsFileKind, type VfsManifest, type VfsNode } from './types';
import { stripFrontmatter } from './vfs';

export interface ManifestEntryInput {
  id: string;
  body?: string;
  data: {
    title: string;
    description: string;
    entryNumber?: number | null;
    publishedAt: Date;
    updatedAt?: Date | null;
    category: 'security' | 'ai' | 'engineering' | 'miscellaneous';
    kind: 'note' | 'experiment' | 'article' | 'devlog';
    status: string;
    tags: string[];
    draft: boolean;
    archived?: boolean;
    virtualPath?: string | null;
  };
}

export interface ManifestProjectInput {
  id: string;
  body?: string;
  data: {
    title: string;
    description: string;
    status?: string;
    stack: string[];
    draft: boolean;
  };
}

export interface BuiltManifestResult {
  manifest: VfsManifest;
  rawTexts: Record<string, string>;
}

const DEFAULT_DIRECTORIES = [
  '/',
  '/home',
  HOME_PATH,
  `${HOME_PATH}/notes`,
  `${HOME_PATH}/notes/security`,
  `${HOME_PATH}/notes/ai`,
  `${HOME_PATH}/notes/engineering`,
  `${HOME_PATH}/notes/miscellaneous`,
  `${HOME_PATH}/Desktop`,
  `${HOME_PATH}/Desktop/pictures`,
  `${HOME_PATH}/experiments`,
  `${HOME_PATH}/projects`,
  `${HOME_PATH}/skills`,
  `${HOME_PATH}/reading`,
  `${HOME_PATH}/archive`,
] as const;

function encodeBase(base: string, path: string): string {
  const b = base.endsWith('/') ? base : `${base}/`;
  const p = path.startsWith('/') ? path.slice(1) : path;
  return `${b}${p}`;
}

function getSlugLeaf(id: string): string {
  const clean = id.replace(/\.(md|mdx)$/i, '');
  const parts = clean.split('/');
  return parts[parts.length - 1] || clean;
}

function ensureDirectory(nodes: Record<string, VfsNode>, rawPath: string): void {
  const normalized = normalizePath(rawPath, ROOT_PATH);
  if (normalized === ROOT_PATH) {
    if (!nodes[ROOT_PATH]) {
      nodes[ROOT_PATH] = {
        type: 'directory',
        name: '/',
        path: ROOT_PATH,
        parentPath: null,
        children: [],
      };
    }
    return;
  }

  const parent = dirname(normalized);
  ensureDirectory(nodes, parent);

  const existing = nodes[normalized];
  if (existing) {
    if (existing.type !== 'directory') {
      throw new VfsError(
        'EINVAL',
        normalized,
        `Path conflict: "${normalized}" cannot be both a file and a directory`,
      );
    }
    return;
  }

  nodes[normalized] = {
    type: 'directory',
    name: basename(normalized),
    path: normalized,
    parentPath: parent,
    children: [],
  };

  const parentNode = nodes[parent];
  if (parentNode?.children && !parentNode.children.includes(normalized)) {
    parentNode.children.push(normalized);
  }
}

interface AddFileParams {
  nodes: Record<string, VfsNode>;
  rawTexts: Record<string, string>;
  virtualPath: string;
  rawSlug: string;
  rawContent: string;
  baseUrl: string;
  fileKind: VfsFileKind;
  canonicalUrl: string;
  title: string;
  description?: string;
  publishedAt?: string;
  updatedAt?: string;
  category?: string;
  kind?: string;
  status?: string;
  entryNumber?: number | null;
  tags?: string[];
  draft?: boolean;
}

function addFile(params: AddFileParams): void {
  const normalized = normalizePath(params.virtualPath, HOME_PATH);
  const parent = dirname(normalized);
  ensureDirectory(params.nodes, parent);

  if (params.nodes[normalized]) {
    throw new VfsError(
      'EINVAL',
      normalized,
      `Virtual path collision at "${normalized}"`,
    );
  }

  const cleanText = stripFrontmatter(params.rawContent);
  params.rawTexts[params.rawSlug] = cleanText;

  const size = new TextEncoder().encode(cleanText).length;

  params.nodes[normalized] = {
    type: 'file',
    name: basename(normalized),
    path: normalized,
    parentPath: parent,
    fileKind: params.fileKind,
    canonicalUrl: encodeBase(params.baseUrl, params.canonicalUrl),
    rawResourceUrl: encodeBase(params.baseUrl, `vfs/raw/${params.rawSlug}.txt`),
    rawSlug: params.rawSlug,
    title: params.title,
    description: params.description,
    publishedAt: params.publishedAt,
    updatedAt: params.updatedAt,
    category: params.category,
    kind: params.kind,
    status: params.status,
    entryNumber: params.entryNumber,
    tags: params.tags,
    draft: params.draft,
    size,
  };

  const parentNode = params.nodes[parent];
  if (parentNode?.children) {
    parentNode.children.push(normalized);
  }
}

export function resolveEntryVirtualPath(entry: ManifestEntryInput): string {
  if (entry.data.virtualPath) {
    const normalized = normalizePath(entry.data.virtualPath, HOME_PATH);
    if (!normalized.startsWith(`${HOME_PATH}/`)) {
      throw new VfsError(
        'EINVAL',
        normalized,
        `Entry "${entry.id}" virtualPath must be inside ${HOME_PATH}`,
      );
    }
    return normalized;
  }

  const leaf = getSlugLeaf(entry.id);
  const ext = entry.id.toLowerCase().endsWith('.mdx') ? '.mdx' : '.md';

  if (entry.data.archived) {
    return `${HOME_PATH}/archive/${leaf}${ext}`;
  }
  if (entry.data.kind === 'experiment') {
    return `${HOME_PATH}/experiments/${leaf}${ext}`;
  }
  return `${HOME_PATH}/notes/${entry.data.category}/${leaf}${ext}`;
}

export function buildVfsManifest(options: {
  entries: ManifestEntryInput[];
  projects: ManifestProjectInput[];
  baseUrl?: string;
  systemPages?: {
    readme?: string;
    disclaimer?: string;
    about?: string;
    contact?: string;
  };
}): BuiltManifestResult {
  const baseUrl = options.baseUrl ?? '/';
  const nodes: Record<string, VfsNode> = {};
  const rawTexts: Record<string, string> = {};

  for (const dir of DEFAULT_DIRECTORIES) {
    ensureDirectory(nodes, dir);
  }

  addFile({
    nodes,
    rawTexts,
    virtualPath: `${HOME_PATH}/README.md`,
    rawSlug: 'system/README',
    rawContent: options.systemPages?.readme ?? README_MARKDOWN,
    baseUrl,
    fileKind: 'system',
    canonicalUrl: '/',
    title: 'README.md',
    description: 'About this notebook and how to navigate it.',
  });

  addFile({
    nodes,
    rawTexts,
    virtualPath: `${HOME_PATH}/DISCLAIMER.md`,
    rawSlug: 'system/DISCLAIMER',
    rawContent: options.systemPages?.disclaimer ?? DISCLAIMER_MARKDOWN,
    baseUrl,
    fileKind: 'system',
    canonicalUrl: '/disclaimer/',
    title: 'DISCLAIMER.md',
    description: 'A note to the reader.',
  });

  addFile({
    nodes,
    rawTexts,
    virtualPath: `${HOME_PATH}/about.md`,
    rawSlug: 'system/about',
    rawContent: options.systemPages?.about ?? ABOUT_MARKDOWN,
    baseUrl,
    fileKind: 'system',
    canonicalUrl: '/about/',
    title: 'about.md',
    description: 'About the author.',
  });

  addFile({
    nodes,
    rawTexts,
    virtualPath: `${HOME_PATH}/contact.md`,
    rawSlug: 'system/contact',
    rawContent: options.systemPages?.contact ?? '# Contact\n\nEmail: aplneto@outlook.com\n',
    baseUrl,
    fileKind: 'system',
    canonicalUrl: '/contact/',
    title: 'contact.md',
    description: 'Contact information and socials.',
  });

  for (const entry of options.entries) {
    const virtualPath = resolveEntryVirtualPath(entry);
    const header = `# ${entry.data.title}\n\n_${entry.data.description}_\n\n`;
    const body = entry.body ? stripFrontmatter(entry.body) : '';
    addFile({
      nodes,
      rawTexts,
      virtualPath,
      rawSlug: `entries/${entry.id}`,
      rawContent: `${header}${body}`.trimEnd() + '\n',
      baseUrl,
      fileKind: 'entry',
      canonicalUrl: `/notes/${entry.id}/`,
      title: entry.data.title,
      description: entry.data.description,
      publishedAt: entry.data.publishedAt.toISOString().slice(0, 10),
      updatedAt: entry.data.updatedAt ? entry.data.updatedAt.toISOString().slice(0, 10) : undefined,
      category: entry.data.category,
      kind: entry.data.kind,
      status: entry.data.status,
      entryNumber: entry.data.entryNumber ?? null,
      tags: entry.data.tags,
      draft: entry.data.draft,
    });
  }

  for (const project of options.projects) {
    const leaf = getSlugLeaf(project.id);
    const header = `# ${project.data.title}\n\n${project.data.description}\n\n`;
    const body = project.body ? stripFrontmatter(project.body) : '';
    addFile({
      nodes,
      rawTexts,
      virtualPath: `${HOME_PATH}/projects/${leaf}.md`,
      rawSlug: `projects/${project.id}`,
      rawContent: `${header}${body}`.trimEnd() + '\n',
      baseUrl,
      fileKind: 'project',
      canonicalUrl: `/projects/#${project.id}`,
      title: project.data.title,
      description: project.data.description,
      status: project.data.status,
      tags: project.data.stack,
      draft: project.data.draft,
    });
  }

  // Sort children lists deterministically
  for (const node of Object.values(nodes)) {
    if (node.type === 'directory' && node.children) {
      node.children.sort((a, b) => {
        const na = nodes[a];
        const nb = nodes[b];
        if (na && nb && na.type !== nb.type) {
          return na.type === 'directory' ? -1 : 1;
        }
        return a.localeCompare(b, 'en');
      });
    }
  }

  return {
    manifest: {
      rootPath: ROOT_PATH,
      homePath: HOME_PATH,
      nodes,
    },
    rawTexts,
  };
}
