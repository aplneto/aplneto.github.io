import { describe, expect, it, vi } from 'vitest';
import { buildVfsManifest, type ManifestEntryInput } from '../../filesystem/manifest';
import { HOME_PATH } from '../../filesystem/paths';
import type { VfsNode } from '../../filesystem/types';
import { VirtualFilesystem } from '../../filesystem/vfs';
import {
  completeTerminalInput,
  executeCommand,
  tokenizeCommand,
  type TerminalSession,
} from '../interpreter';

function setupTerminalEnv() {
  const entry: ManifestEntryInput = {
    id: 'test-note',
    body: 'Body text here.',
    data: {
      title: 'Test Note',
      description: 'Testing terminal',
      publishedAt: new Date('2026-11-24'),
      category: 'ai',
      kind: 'note',
      status: 'raw',
      tags: ['ai'],
      draft: false,
      archived: false,
      virtualPath: null,
    },
  };
  const { manifest, rawTexts } = buildVfsManifest({ entries: [entry], projects: [] });
  const vfs = new VirtualFilesystem(manifest);
  const session: TerminalSession = { cwd: HOME_PATH };
  const opened: VfsNode[] = [];
  const onClear = vi.fn();
  const onExit = vi.fn();

  const callbacks = {
    readRaw: async (node: VfsNode) => {
      if (node.rawSlug && rawTexts[node.rawSlug]) {
        return rawTexts[node.rawSlug];
      }
      return '';
    },
    onOpenFile: (node: VfsNode) => opened.push(node),
    onClear,
    onExit,
  };

  return { vfs, session, opened, onClear, onExit, callbacks };
}

describe('terminal tokenizer and completion', () => {
  it('supports quoted arguments and rejects unsupported shell operators', () => {
    expect(tokenizeCommand('cat "README.md"')).toEqual({ args: ['cat', 'README.md'] });
    expect(tokenizeCommand('ls | grep foo').error).toContain('Unsupported shell operator');
    expect(tokenizeCommand('cat "unclosed').error).toContain('Unclosed quote');
  });

  it('completes commands and virtual paths', () => {
    const { vfs } = setupTerminalEnv();
    expect(completeTerminalInput('who', HOME_PATH, vfs)).toEqual(['whoami']);
    expect(completeTerminalInput('cat READ', HOME_PATH, vfs)).toEqual(['README.md']);
    expect(completeTerminalInput('cd no', HOME_PATH, vfs)).toEqual(['notes/']);
  });
});

describe('terminal commands', () => {
  it('handles pwd, whoami, ls, cd, tree, cat, open, clear, exit, and errors', async () => {
    const { vfs, session, opened, onClear, onExit, callbacks } = setupTerminalEnv();

    expect((await executeCommand('pwd', session, vfs, callbacks)).output).toBe('/home/guest');
    expect((await executeCommand('whoami', session, vfs, callbacks)).output).toBe('guest');

    const lsRes = await executeCommand('ls -la', session, vfs, callbacks);
    expect(lsRes.output).toContain('README.md');
    expect(lsRes.output).toContain('notes/');

    await executeCommand('cd notes/ai', session, vfs, callbacks);
    expect(session.cwd).toBe('/home/guest/notes/ai');

    const catRes = await executeCommand('cat test-note.md', session, vfs, callbacks);
    expect(catRes.output).toContain('# Test Note');

    const openRes = await executeCommand('open ./test-note.md', session, vfs, callbacks);
    expect(openRes.isError).toBeFalsy();
    expect(opened).toHaveLength(1);
    expect(opened[0].path).toBe('/home/guest/notes/ai/test-note.md');

    await executeCommand('cd', session, vfs, callbacks);
    expect(session.cwd).toBe('/home/guest');

    const treeRes = await executeCommand('tree notes', session, vfs, callbacks);
    expect(treeRes.output).toContain('test-note.md');

    await executeCommand('clear', session, vfs, callbacks);
    expect(onClear).toHaveBeenCalledOnce();

    await executeCommand('exit', session, vfs, callbacks);
    expect(onExit).toHaveBeenCalledOnce();

    const errRes = await executeCommand('ls -z', session, vfs, callbacks);
    expect(errRes.isError).toBe(true);
    expect(errRes.output).toContain('unsupported option');

    const missingRes = await executeCommand('cat nope.md', session, vfs, callbacks);
    expect(missingRes.isError).toBe(true);
  });
});
