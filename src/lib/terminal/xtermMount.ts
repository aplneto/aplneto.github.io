import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import { HOME_PATH } from '../filesystem/paths';
import type { VfsManifest, VfsNode } from '../filesystem/types';
import { VirtualFilesystem } from '../filesystem/vfs';
import {
  completeTerminalInput,
  executeCommand,
  formatPromptPath,
  MAX_COMMAND_LENGTH,
  type TerminalSession,
} from './interpreter';

export interface TerminalMountOptions {
  container: HTMLElement;
  manifest: VfsManifest;
  onOpenFile: (node: VfsNode) => void;
  onExit: () => void;
}

const MAX_HISTORY = 100;

export async function mountNotebookTerminal(options: TerminalMountOptions): Promise<void> {
  const { container, manifest, onOpenFile, onExit } = options;
  container.innerHTML = '';

  const vfs = new VirtualFilesystem(manifest);
  const session: TerminalSession = { cwd: HOME_PATH };
  const history: string[] = [];
  let historyIndex = -1;
  let lineBuffer = '';
  let busy = false;

  const term = new Terminal({
    cursorBlink: true,
    convertEol: true,
    fontFamily: "'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace",
    fontSize: 14,
    theme: {
      background: '#151b24',
      foreground: '#d8e1ed',
      cursor: '#7fb2e5',
      selectionBackground: 'rgba(127, 178, 229, 0.3)',
    },
  });

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(container);
  fitAddon.fit();

  const resizeObserver = new ResizeObserver(() => {
    try {
      fitAddon.fit();
    } catch {
      // Ignore resize when hidden
    }
  });
  resizeObserver.observe(container);

  function writePrompt(): void {
    const loc = formatPromptPath(session.cwd);
    term.write(`\r\n\x1b[38;2;127;178;229mguest@notebook:${loc}$\x1b[0m `);
  }

  function replaceCurrentLine(next: string): void {
    const clearCount = lineBuffer.length;
    if (clearCount > 0) {
      term.write('\b \b'.repeat(clearCount));
    }
    lineBuffer = next.slice(0, MAX_COMMAND_LENGTH);
    term.write(lineBuffer);
  }

  async function readRaw(node: VfsNode): Promise<string> {
    if (!node.rawResourceUrl) {
      throw new Error(`No public text available for ${node.name}`);
    }
    const response = await fetch(node.rawResourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to read ${node.name} (${response.status})`);
    }
    return response.text();
  }

  async function runLine(raw: string): Promise<void> {
    const trimmed = raw.trim();
    if (trimmed) {
      history.push(trimmed);
      if (history.length > MAX_HISTORY) {
        history.shift();
      }
    }
    historyIndex = -1;

    if (!trimmed) {
      writePrompt();
      return;
    }

    busy = true;
    try {
      const result = await executeCommand(trimmed, session, vfs, {
        readRaw,
        onOpenFile,
        onClear: () => term.clear(),
        onExit,
      });
      if (result.output) {
        term.write(`\r\n${result.output}`);
      }
    } finally {
      busy = false;
      if (trimmed !== 'clear') {
        writePrompt();
      } else {
        const loc = formatPromptPath(session.cwd);
        term.write(`\x1b[38;2;127;178;229mguest@notebook:${loc}$\x1b[0m `);
      }
    }
  }

  term.writeln('Welcome to aplneto (read-only guest session).');
  term.writeln('Type "help" to list commands, or "open README.md" to read.');
  writePrompt();
  term.focus();

  term.onData((data) => {
    if (busy) return;

    // Enter
    if (data === '\r') {
      const cmd = lineBuffer;
      lineBuffer = '';
      void runLine(cmd);
      return;
    }

    // Ctrl+C
    if (data === '\x03') {
      term.write('^C');
      lineBuffer = '';
      historyIndex = -1;
      writePrompt();
      return;
    }

    // Ctrl+L
    if (data === '\x0c') {
      term.clear();
      const loc = formatPromptPath(session.cwd);
      term.write(`\x1b[38;2;127;178;229mguest@notebook:${loc}$\x1b[0m ${lineBuffer}`);
      return;
    }

    // Backspace
    if (data === '\x7f' || data === '\b') {
      if (lineBuffer.length > 0) {
        lineBuffer = lineBuffer.slice(0, -1);
        term.write('\b \b');
      }
      return;
    }

    // Tab completion
    if (data === '\t') {
      const matches = completeTerminalInput(lineBuffer, session.cwd, vfs);
      if (matches.length === 1) {
        const parts = lineBuffer.split(/\s+/);
        if (parts.length <= 1 && !/\s$/.test(lineBuffer)) {
          replaceCurrentLine(`${matches[0]} `);
        } else {
          const prefix = lineBuffer.slice(0, lineBuffer.length - (parts[parts.length - 1]?.length ?? 0));
          replaceCurrentLine(`${prefix}${matches[0]}`);
        }
      } else if (matches.length > 1) {
        term.write(`\r\n${matches.join('  ')}`);
        writePrompt();
        term.write(lineBuffer);
      }
      return;
    }

    // Arrow up / down for history
    if (data === '\x1b[A') {
      if (history.length === 0) return;
      if (historyIndex === -1) historyIndex = history.length - 1;
      else if (historyIndex > 0) historyIndex -= 1;
      replaceCurrentLine(history[historyIndex] ?? '');
      return;
    }

    if (data === '\x1b[B') {
      if (historyIndex === -1) return;
      if (historyIndex < history.length - 1) {
        historyIndex += 1;
        replaceCurrentLine(history[historyIndex] ?? '');
      } else {
        historyIndex = -1;
        replaceCurrentLine('');
      }
      return;
    }

    // Printable characters
    const printable = data.replace(/[\x00-\x1f\x7f]/g, '');
    if (printable) {
      const remaining = MAX_COMMAND_LENGTH - lineBuffer.length;
      if (remaining > 0) {
        const chunk = printable.slice(0, remaining);
        lineBuffer += chunk;
        term.write(chunk);
      }
    }
  });
}
