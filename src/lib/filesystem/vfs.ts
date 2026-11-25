import { HOME_PATH, ROOT_PATH, dirname, normalizePath } from './paths';
import { VfsError, type VfsManifest, type VfsNode, type VfsTreeNode } from './types';

export class VirtualFilesystem {
  private readonly manifest: VfsManifest;

  constructor(manifest: VfsManifest) {
    this.manifest = manifest;
  }

  get homePath(): string {
    return this.manifest.homePath || HOME_PATH;
  }

  get rootPath(): string {
    return this.manifest.rootPath || ROOT_PATH;
  }

  resolve(inputPath: string, cwd: string = this.homePath): VfsNode {
    const normalized = normalizePath(inputPath, cwd);
    const node = this.manifest.nodes[normalized];
    if (!node) {
      throw new VfsError('ENOENT', normalized, `No such file or directory: ${inputPath}`);
    }
    return node;
  }

  exists(inputPath: string, cwd: string = this.homePath): boolean {
    try {
      this.resolve(inputPath, cwd);
      return true;
    } catch {
      return false;
    }
  }

  stat(inputPath: string, cwd: string = this.homePath): VfsNode {
    return this.resolve(inputPath, cwd);
  }

  list(
    inputPath: string = '.',
    cwd: string = this.homePath,
    options: { all?: boolean } = {},
  ): VfsNode[] {
    const node = this.resolve(inputPath, cwd);
    if (node.type !== 'directory') {
      return [node];
    }

    const childPaths = node.children ?? [];
    const nodes = childPaths
      .map((childPath) => this.manifest.nodes[childPath])
      .filter((child): child is VfsNode => Boolean(child))
      .filter((child) => options.all || !child.name.startsWith('.'));

    return sortNodes(nodes);
  }

  tree(
    inputPath: string = '.',
    cwd: string = this.homePath,
    options: { all?: boolean; maxDepth?: number } = {},
  ): VfsTreeNode {
    const root = this.resolve(inputPath, cwd);
    const maxDepth = options.maxDepth ?? 8;

    const build = (node: VfsNode, depth: number): VfsTreeNode => {
      if (node.type !== 'directory' || depth >= maxDepth) {
        return { node, children: [] };
      }
      const children = this.list(node.path, this.rootPath, { all: options.all }).map((child) =>
        build(child, depth + 1),
      );
      return { node, children };
    };

    return build(root, 0);
  }

  readMetadata(inputPath: string, cwd: string = this.homePath): VfsNode {
    const node = this.resolve(inputPath, cwd);
    if (node.type === 'directory') {
      throw new VfsError('EISDIR', node.path, `Is a directory: ${inputPath}`);
    }
    return node;
  }

  completePath(
    partial: string,
    cwd: string = this.homePath,
    options: { onlyDirs?: boolean } = {},
  ): string[] {
    const endsWithSlash = partial.endsWith('/');
    const hasSlash = partial.includes('/');

    let dirInput = '.';
    let prefix = partial;

    if (partial === '~') {
      return ['~/'];
    }

    if (hasSlash) {
      const lastSlash = partial.lastIndexOf('/');
      dirInput = partial.slice(0, lastSlash + 1) || '/';
      prefix = endsWithSlash ? '' : partial.slice(lastSlash + 1);
    }

    let dirNode: VfsNode;
    try {
      dirNode = this.resolve(dirInput, cwd);
    } catch {
      return [];
    }

    if (dirNode.type !== 'directory') {
      return [];
    }

    const includeHidden = prefix.startsWith('.');
    const children = this.list(dirNode.path, this.rootPath, { all: includeHidden });

    const matches = children
      .filter((child) => child.name.startsWith(prefix))
      .filter((child) => !options.onlyDirs || child.type === 'directory')
      .map((child) => {
        const suffix = child.type === 'directory' ? '/' : '';
        if (!hasSlash) {
          return `${child.name}${suffix}`;
        }
        const basePrefix = partial.slice(0, partial.lastIndexOf('/') + 1);
        return `${basePrefix}${child.name}${suffix}`;
      });

    return matches;
  }

  getBreadcrumbs(inputPath: string): VfsNode[] {
    const target = this.resolve(inputPath, this.rootPath);
    const crumbs: VfsNode[] = [];
    let current: VfsNode | undefined = target;

    while (current) {
      crumbs.unshift(current);
      if (current.path === ROOT_PATH) break;
      const parent: string = current.parentPath ?? dirname(current.path);
      current = this.manifest.nodes[parent];
    }

    return crumbs;
  }
}

function sortNodes(nodes: VfsNode[]): VfsNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, 'en');
  });
}

/**
 * Strip YAML frontmatter from raw Markdown/MDX source so `cat` exposes only
 * public body text without internal frontmatter clutter.
 */
export function stripFrontmatter(raw: string): string {
  const normalized = raw.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return normalized.trimStart();
  }
  const endIdx = normalized.indexOf('\n---\n', 4);
  if (endIdx === -1) {
    return normalized;
  }
  return normalized.slice(endIdx + 5).trimStart();
}

/**
 * Neutralize terminal control sequences (ANSI escapes, C0/C1 controls) in
 * untrusted filenames or article text while keeping printable text, newlines, and tabs.
 */
export function sanitizeTerminalText(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    // Strip ESC sequences: ESC [ ... final byte, or ESC ] ... BEL/ST
    if (code === 0x1b) {
      const next = text.charCodeAt(i + 1);
      if (next === 0x5b) {
        // CSI sequence
        i += 2;
        while (i < text.length) {
          const c = text.charCodeAt(i);
          if (c >= 0x40 && c <= 0x7e) break;
          i += 1;
        }
        continue;
      }
      if (next === 0x5d) {
        // OSC sequence
        i += 2;
        while (i < text.length) {
          const c = text.charCodeAt(i);
          if (c === 0x07) break;
          if (c === 0x1b && text.charCodeAt(i + 1) === 0x5c) {
            i += 1;
            break;
          }
          i += 1;
        }
        continue;
      }
      continue;
    }
    if (code === 0x09 || code === 0x0a) {
      out += text[i];
      continue;
    }
    if (code < 0x20 || (code >= 0x7f && code <= 0x9f)) {
      continue;
    }
    out += text[i];
  }
  return out;
}
