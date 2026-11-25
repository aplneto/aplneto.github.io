import { HOME_PATH } from '../filesystem/paths';
import type { VfsNode, VfsTreeNode } from '../filesystem/types';
import { VfsError } from '../filesystem/types';
import { sanitizeTerminalText, VirtualFilesystem } from '../filesystem/vfs';

export const MAX_COMMAND_LENGTH = 512;
export const MAX_OUTPUT_CHARS = 32768;

export const COMMAND_HELP: Record<string, string> = {
  ls: 'ls [-a|-l|-la|-al] [path]  List directory contents',
  cd: 'cd [path]                  Change current directory (defaults to ~)',
  pwd: 'pwd                        Print current working directory',
  cat: 'cat <file>                 Print public raw Markdown as inert text',
  open: 'open <file>                Open a file in the graphical Notebook Reader',
  tree: 'tree [path]                Display directory hierarchy',
  whoami: 'whoami                     Print current session user',
  help: 'help [command]             Show supported commands or command details',
  clear: 'clear                      Clear terminal output',
  exit: 'exit                       Close the terminal window',
};

const SUPPORTED_COMMANDS = Object.keys(COMMAND_HELP);

export interface TerminalSession {
  cwd: string;
}

export interface CommandCallbacks {
  readRaw: (node: VfsNode) => Promise<string>;
  onOpenFile: (node: VfsNode) => void;
  onClear: () => void;
  onExit: () => void;
}

export interface CommandResult {
  output: string;
  isError?: boolean;
}

export function formatPromptPath(cwd: string): string {
  if (cwd === HOME_PATH) return '~';
  if (cwd.startsWith(`${HOME_PATH}/`)) {
    return `~/${cwd.slice(HOME_PATH.length + 1)}`;
  }
  return cwd;
}

export function tokenizeCommand(input: string): { args: string[]; error?: string } {
  if (input.length > MAX_COMMAND_LENGTH) {
    return {
      args: [],
      error: `Command exceeds maximum length of ${MAX_COMMAND_LENGTH} characters.`,
    };
  }

  const args: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;
  let hasToken = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if (quote) {
      if (ch === quote) {
        quote = null;
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      hasToken = true;
      continue;
    }

    if (ch === ' ' || ch === '\t') {
      if (hasToken) {
        args.push(current);
        current = '';
        hasToken = false;
      }
      continue;
    }

    if (ch === '|' || ch === '>' || ch === '<' || ch === ';' || ch === '&' || ch === '`') {
      return {
        args: [],
        error: `Unsupported shell operator "${ch}". Pipes, redirects, and chaining are not supported.`,
      };
    }

    current += ch;
    hasToken = true;
  }

  if (quote) {
    return { args: [], error: 'Unclosed quote in command.' };
  }

  if (hasToken) {
    args.push(current);
  }

  return { args };
}

export function completeTerminalInput(
  buffer: string,
  cwd: string,
  vfs: VirtualFilesystem,
): string[] {
  const trimmedLeft = buffer.trimStart();
  if (!trimmedLeft) {
    return SUPPORTED_COMMANDS;
  }

  const endsWithSpace = /\s$/.test(trimmedLeft);
  const parts = trimmedLeft.split(/\s+/);

  if (parts.length === 1 && !endsWithSpace) {
    const prefix = parts[0];
    return SUPPORTED_COMMANDS.filter((cmd) => cmd.startsWith(prefix));
  }

  const cmd = parts[0];
  const partial = endsWithSpace ? '' : parts[parts.length - 1];
  const onlyDirs = cmd === 'cd';
  return vfs.completePath(partial, cwd, { onlyDirs });
}

export async function executeCommand(
  rawInput: string,
  session: TerminalSession,
  vfs: VirtualFilesystem,
  callbacks: CommandCallbacks,
): Promise<CommandResult> {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { output: '' };
  }

  const { args, error } = tokenizeCommand(trimmed);
  if (error) {
    return { output: error, isError: true };
  }
  if (args.length === 0) {
    return { output: '' };
  }

  const [cmd, ...rest] = args;

  try {
    switch (cmd) {
      case 'pwd': {
        if (rest.length > 0) {
          return { output: 'pwd: too many arguments', isError: true };
        }
        return { output: session.cwd };
      }

      case 'whoami': {
        if (rest.length > 0) {
          return { output: 'whoami: too many arguments', isError: true };
        }
        return { output: 'guest' };
      }

      case 'clear': {
        callbacks.onClear();
        return { output: '' };
      }

      case 'exit': {
        callbacks.onExit();
        return { output: '' };
      }

      case 'help': {
        if (rest.length === 0) {
          const lines = [
            'Supported commands:',
            ...SUPPORTED_COMMANDS.map((name) => `  ${COMMAND_HELP[name]}`),
          ];
          return { output: lines.join('\n') };
        }
        const target = rest[0];
        if (COMMAND_HELP[target]) {
          return { output: COMMAND_HELP[target] };
        }
        return { output: `help: unknown command "${target}"`, isError: true };
      }

      case 'cd': {
        if (rest.length > 1) {
          return { output: 'cd: too many arguments', isError: true };
        }
        const target = rest[0] ?? '~';
        const node = vfs.resolve(target, session.cwd);
        if (node.type !== 'directory') {
          return { output: `cd: not a directory: ${target}`, isError: true };
        }
        session.cwd = node.path;
        return { output: '' };
      }

      case 'ls': {
        let showAll = false;
        let longFormat = false;
        const targets: string[] = [];

        for (const arg of rest) {
          if (arg.startsWith('-') && arg.length > 1) {
            if (arg === '-a') showAll = true;
            else if (arg === '-l') longFormat = true;
            else if (arg === '-la' || arg === '-al') {
              showAll = true;
              longFormat = true;
            } else {
              return { output: `ls: unsupported option "${arg}"`, isError: true };
            }
          } else {
            targets.push(arg);
          }
        }

        const targetPath = targets[0] ?? '.';
        if (targets.length > 1) {
          return { output: 'ls: multiple path arguments are not supported', isError: true };
        }

        const nodes = vfs.list(targetPath, session.cwd, { all: showAll });
        if (nodes.length === 0) {
          return { output: '' };
        }

        if (longFormat) {
          const lines = nodes.map((n) => {
            const typeChar = n.type === 'directory' ? 'd' : '-';
            const size = String(n.size ?? 0).padStart(6, ' ');
            const date = n.publishedAt ?? '          ';
            const suffix = n.type === 'directory' ? '/' : '';
            const draftTag = n.draft ? ' [draft]' : '';
            return `${typeChar}r--  ${size}  ${date}  ${sanitizeTerminalText(n.name)}${suffix}${draftTag}`;
          });
          return { output: lines.join('\n') };
        }

        return {
          output: nodes
            .map((n) => `${sanitizeTerminalText(n.name)}${n.type === 'directory' ? '/' : ''}`)
            .join('  '),
        };
      }

      case 'tree': {
        if (rest.length > 1) {
          return { output: 'tree: too many arguments', isError: true };
        }
        const target = rest[0] ?? '.';
        const rootTree = vfs.tree(target, session.cwd);
        const lines: string[] = [
          `${sanitizeTerminalText(rootTree.node.name)}${rootTree.node.type === 'directory' ? '/' : ''}`,
        ];

        const walk = (treeNode: VfsTreeNode, prefix: string) => {
          treeNode.children.forEach((child, idx) => {
            const isLast = idx === treeNode.children.length - 1;
            const connector = isLast ? '└── ' : '├── ';
            const suffix = child.node.type === 'directory' ? '/' : '';
            lines.push(`${prefix}${connector}${sanitizeTerminalText(child.node.name)}${suffix}`);
            if (child.children.length > 0) {
              walk(child, `${prefix}${isLast ? '    ' : '│   '}`);
            }
          });
        };

        walk(rootTree, '');
        return { output: clampOutput(lines.join('\n')) };
      }

      case 'cat': {
        if (rest.length === 0) {
          return { output: 'cat: missing file operand', isError: true };
        }
        if (rest.length > 1) {
          return { output: 'cat: multiple files are not supported', isError: true };
        }
        const node = vfs.readMetadata(rest[0], session.cwd);
        const raw = await callbacks.readRaw(node);
        return { output: clampOutput(sanitizeTerminalText(raw)) };
      }

      case 'open': {
        if (rest.length === 0) {
          return { output: 'open: missing file operand', isError: true };
        }
        if (rest.length > 1) {
          return { output: 'open: multiple files are not supported', isError: true };
        }
        const node = vfs.readMetadata(rest[0], session.cwd);
        callbacks.onOpenFile(node);
        return { output: `Opening ${sanitizeTerminalText(node.name)} in Notebook Reader…` };
      }

      default:
        return {
          output: `${sanitizeTerminalText(cmd)}: command not found. Type "help" for available commands.`,
          isError: true,
        };
    }
  } catch (err) {
    if (err instanceof VfsError) {
      return { output: `${cmd}: ${err.message}`, isError: true };
    }
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    return { output: `${cmd}: ${msg}`, isError: true };
  }
}

function clampOutput(text: string): string {
  if (text.length <= MAX_OUTPUT_CHARS) return text;
  return `${text.slice(0, MAX_OUTPUT_CHARS)}\n… [output truncated]`;
}
