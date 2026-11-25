import { VfsError } from './types';

export const ROOT_PATH = '/';
export const HOME_PATH = '/home/guest';

/**
 * Validate a single path segment (file or directory name).
 * Rejects empty segments, dot navigation, slashes, NUL bytes, and control chars.
 */
export function validateSegment(segment: string): void {
  if (!segment || segment === '.' || segment === '..') {
    throw new VfsError('EINVAL', segment, `Invalid path segment: "${segment}"`);
  }
  if (segment.includes('/') || segment.includes('\\')) {
    throw new VfsError('EINVAL', segment, `Path segment contains separator: "${segment}"`);
  }
  for (let i = 0; i < segment.length; i += 1) {
    const code = segment.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) {
      throw new VfsError('EINVAL', segment, 'Path segment contains control characters');
    }
  }
}

/**
 * Normalize a virtual path against a working directory.
 * Supports:
 * - absolute paths (`/home/guest/notes`)
 * - relative paths (`notes/ai`, `./README.md`, `../about.md`)
 * - `~` and `~/...` home expansion
 * - repeated separators (`//`) and root boundary clamping (`/..` -> `/`)
 */
export function normalizePath(input: string, cwd: string = HOME_PATH): string {
  if (typeof input !== 'string') {
    throw new VfsError('EINVAL', String(input), 'Path must be a string');
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return normalizeAbsolutePath(cwd);
  }

  for (let i = 0; i < trimmed.length; i += 1) {
    const code = trimmed.charCodeAt(i);
    if (code === 0 || code < 0x20 || code === 0x7f) {
      throw new VfsError('EINVAL', trimmed, 'Path contains invalid control characters');
    }
  }

  if (trimmed.includes('\\')) {
    throw new VfsError('EINVAL', trimmed, 'Backslashes are not supported in virtual paths');
  }

  let rawTarget = trimmed;
  if (rawTarget === '~') {
    return HOME_PATH;
  }
  if (rawTarget.startsWith('~/')) {
    rawTarget = `${HOME_PATH}/${rawTarget.slice(2)}`;
  }

  const base = rawTarget.startsWith('/') ? '' : normalizeAbsolutePath(cwd);
  const combined = base ? `${base}/${rawTarget}` : rawTarget;

  return normalizeAbsolutePath(combined);
}

function normalizeAbsolutePath(absPath: string): string {
  const parts = absPath.split('/');
  const resolved: string[] = [];

  for (const part of parts) {
    if (!part || part === '.') {
      continue;
    }
    if (part === '..') {
      if (resolved.length > 0) {
        resolved.pop();
      }
      continue;
    }
    validateSegment(part);
    resolved.push(part);
  }

  return resolved.length === 0 ? ROOT_PATH : `/${resolved.join('/')}`;
}

export function dirname(normalizedPath: string): string {
  if (normalizedPath === ROOT_PATH) return ROOT_PATH;
  const idx = normalizedPath.lastIndexOf('/');
  if (idx <= 0) return ROOT_PATH;
  return normalizedPath.slice(0, idx);
}

export function basename(normalizedPath: string): string {
  if (normalizedPath === ROOT_PATH) return ROOT_PATH;
  const idx = normalizedPath.lastIndexOf('/');
  return normalizedPath.slice(idx + 1);
}

export function joinPath(base: string, ...segments: string[]): string {
  const joined = [base, ...segments].filter(Boolean).join('/');
  return normalizePath(joined, ROOT_PATH);
}
