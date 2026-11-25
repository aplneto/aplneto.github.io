export type VfsNodeType = 'directory' | 'file';

export type VfsFileKind = 'entry' | 'project' | 'system';

export interface VfsNode {
  type: VfsNodeType;
  name: string;
  path: string;
  parentPath: string | null;
  children?: string[];
  fileKind?: VfsFileKind;
  canonicalUrl?: string;
  rawResourceUrl?: string;
  rawSlug?: string;
  title?: string;
  description?: string;
  publishedAt?: string;
  updatedAt?: string;
  category?: string;
  kind?: string;
  status?: string;
  entryNumber?: number | null;
  tags?: string[];
  draft?: boolean;
  size?: number;
}

export interface VfsManifest {
  rootPath: '/';
  homePath: '/home/guest';
  nodes: Record<string, VfsNode>;
}

export interface VfsTreeNode {
  node: VfsNode;
  children: VfsTreeNode[];
}

export type VfsErrorCode = 'ENOENT' | 'ENOTDIR' | 'EISDIR' | 'EINVAL';

export class VfsError extends Error {
  readonly code: VfsErrorCode;
  readonly path: string;

  constructor(code: VfsErrorCode, path: string, message: string) {
    super(message);
    this.name = 'VfsError';
    this.code = code;
    this.path = path;
  }
}
