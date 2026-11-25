import { dirname, HOME_PATH } from '../filesystem/paths';
import type { VfsManifest, VfsNode } from '../filesystem/types';
import { VirtualFilesystem } from '../filesystem/vfs';

export type AppId = 'files' | 'reader' | 'terminal' | 'settings' | 'about';
export type ViewMode = 'list' | 'grid';

/**
 * Coordinates the desktop shell, file manager, reader, settings, and terminal
 * using the shared VirtualFilesystem manifest.
 */
export function initDesktopShell(root: HTMLElement, manifest: VfsManifest): void {
  const vfs = new VirtualFilesystem(manifest);
  let cwd = HOME_PATH;
  let viewMode: ViewMode = loadViewMode();
  let activeApp: AppId = 'files';
  let activeReaderPath: string | null = null;
  let lastTrigger: HTMLElement | null = null;
  let terminalLoaded = false;

  const openApps = new Set<AppId>(['files']);

  const windows = new Map<AppId, HTMLElement>();
  root.querySelectorAll<HTMLElement>('[data-app-window]').forEach((win) => {
    const id = win.dataset.appWindow as AppId | undefined;
    if (id) windows.set(id, win);
  });

  const breadcrumbsEl = root.querySelector<HTMLElement>('[data-fm-breadcrumbs]');
  const listEl = root.querySelector<HTMLElement>('[data-fm-items]');
  const upBtn = root.querySelector<HTMLButtonElement>('[data-fm-up]');
  const viewButtons = root.querySelectorAll<HTMLButtonElement>('[data-fm-view]');
  const readerTitleEl = root.querySelector<HTMLElement>('[data-reader-window-title]');
  const readerCanonicalEl = root.querySelector<HTMLAnchorElement>('[data-reader-canonical]');
  const readerMountEl = root.querySelector<HTMLElement>('[data-reader-mount]');
  const taskbarEl = root.querySelector<HTMLElement>('[data-taskbar-apps]');

  function loadViewMode(): ViewMode {
    try {
      const saved = localStorage.getItem('notebook-fm-view');
      return saved === 'grid' ? 'grid' : 'list';
    } catch {
      return 'list';
    }
  }

  function saveViewMode(next: ViewMode): void {
    try {
      localStorage.setItem('notebook-fm-view', next);
    } catch {
      // Ignore storage errors
    }
  }

  function syncWindows(): void {
    windows.forEach((win, id) => {
      const isOpen = openApps.has(id);
      const isActive = activeApp === id;
      win.hidden = !isOpen || !isActive;
      win.classList.toggle('is-active', isOpen && isActive);
    });

    if (taskbarEl) {
      taskbarEl.querySelectorAll<HTMLButtonElement>('[data-taskbar-app]').forEach((btn) => {
        const id = btn.dataset.taskbarApp as AppId;
        const isOpen = openApps.has(id);
        btn.hidden = !isOpen;
        btn.classList.toggle('is-active', isOpen && activeApp === id);
        btn.setAttribute('aria-pressed', String(isOpen && activeApp === id));
      });
    }
  }

  function focusWindow(id: AppId): void {
    const win = windows.get(id);
    if (!win) return;
    const focusTarget =
      win.querySelector<HTMLElement>('[data-app-focus]') ??
      win.querySelector<HTMLElement>('button, a, input, [tabindex]');
    focusTarget?.focus();
  }

  function openApp(id: AppId, trigger?: HTMLElement | null): void {
    if (trigger) lastTrigger = trigger;
    openApps.add(id);
    activeApp = id;
    syncWindows();

    if (id === 'terminal' && !terminalLoaded) {
      terminalLoaded = true;
      void mountTerminal();
    } else {
      focusWindow(id);
    }
  }

  function closeApp(id: AppId): void {
    openApps.delete(id);
    if (activeApp === id) {
      const remaining = Array.from(openApps);
      activeApp = remaining.length > 0 ? remaining[remaining.length - 1] : 'files';
    }
    syncWindows();
    if (openApps.size === 0 || activeApp !== id) {
      lastTrigger?.focus();
    }
  }

  function minimizeApp(id: AppId): void {
    if (activeApp === id) {
      const others = Array.from(openApps).filter((app) => app !== id);
      activeApp = others.length > 0 ? others[0] : id;
    }
    const win = windows.get(id);
    if (win) win.hidden = true;
    if (taskbarEl) {
      taskbarEl.querySelectorAll<HTMLButtonElement>('[data-taskbar-app]').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.taskbarApp === activeApp && !windows.get(activeApp)?.hidden);
      });
    }
  }

  function openFileInReader(node: VfsNode, trigger?: HTMLElement | null): void {
    if (!readerMountEl) return;
    const sourceEl = root.querySelector<HTMLElement>(
      `[data-reader-source="${CSS.escape(node.path)}"]`,
    );

    if (!sourceEl) {
      if (node.canonicalUrl) {
        window.location.href = node.canonicalUrl;
      }
      return;
    }

    activeReaderPath = node.path;
    readerMountEl.innerHTML = sourceEl.innerHTML;
    if (readerTitleEl) {
      readerTitleEl.textContent = node.title || node.name;
    }
    if (readerCanonicalEl) {
      const hasSeparatePage =
        Boolean(node.canonicalUrl) && node.canonicalUrl !== window.location.pathname;
      if (hasSeparatePage && node.canonicalUrl) {
        readerCanonicalEl.href = node.canonicalUrl;
        readerCanonicalEl.hidden = false;
      } else {
        readerCanonicalEl.hidden = true;
      }
    }

    openApp('reader', trigger);
  }

  function renderFileManager(): void {
    if (!breadcrumbsEl || !listEl) return;

    const crumbs = vfs.getBreadcrumbs(cwd);
    breadcrumbsEl.innerHTML = '';
    crumbs.forEach((crumb, idx) => {
      if (idx > 0) {
        const sep = document.createElement('span');
        sep.className = 'fm-crumb-sep';
        sep.setAttribute('aria-hidden', 'true');
        sep.textContent = '/';
        breadcrumbsEl.appendChild(sep);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fm-crumb';
      btn.textContent = crumb.path === '/' ? 'root' : crumb.name;
      btn.setAttribute('aria-label', `Open ${crumb.path}`);
      if (crumb.path === cwd) {
        btn.setAttribute('aria-current', 'location');
      }
      btn.addEventListener('click', () => {
        cwd = crumb.path;
        renderFileManager();
      });
      breadcrumbsEl.appendChild(btn);
    });

    if (upBtn) {
      upBtn.disabled = cwd === '/';
    }

    viewButtons.forEach((btn) => {
      const mode = btn.dataset.fmView as ViewMode;
      btn.setAttribute('aria-pressed', String(mode === viewMode));
    });

    listEl.dataset.view = viewMode;
    listEl.innerHTML = '';

    const items = vfs.list(cwd, cwd);
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'fm-empty';
      empty.textContent = 'This folder is empty.';
      listEl.appendChild(empty);
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'fm-grid';

    for (const item of items) {
      const li = document.createElement('li');
      li.className = 'fm-item';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'fm-item__btn';
      btn.setAttribute(
        'aria-label',
        item.type === 'directory' ? `Open folder ${item.name}` : `Read ${item.name}`,
      );

      const icon = document.createElement('span');
      icon.className = item.type === 'directory' ? 'fm-icon fm-icon--dir' : 'fm-icon fm-icon--file';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = item.type === 'directory' ? '📁' : '📄';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'fm-item__name';
      nameSpan.textContent = item.name;

      btn.appendChild(icon);
      btn.appendChild(nameSpan);

      if (item.draft) {
        const badge = document.createElement('span');
        badge.className = 'fm-item__badge';
        badge.textContent = 'Draft';
        btn.appendChild(badge);
      }

      btn.addEventListener('click', () => {
        if (item.type === 'directory') {
          cwd = item.path;
          renderFileManager();
        } else {
          openFileInReader(item, btn);
        }
      });

      li.appendChild(btn);

      if (item.type === 'file' && item.canonicalUrl && item.canonicalUrl !== window.location.pathname) {
        const link = document.createElement('a');
        link.className = 'fm-item__permalink';
        link.href = item.canonicalUrl;
        link.textContent = 'Page';
        link.title = `Open standalone page for ${item.name}`;
        li.appendChild(link);
      }

      ul.appendChild(li);
    }

    listEl.appendChild(ul);
  }

  async function mountTerminal(): Promise<void> {
    const mountEl = root.querySelector<HTMLElement>('[data-terminal-mount]');
    if (!mountEl) return;
    mountEl.innerHTML = '<p class="terminal-loading">Loading terminal…</p>';
    try {
      const mod = await import('../terminal/xtermMount');
      await mod.mountNotebookTerminal({
        container: mountEl,
        manifest,
        onOpenFile: (node) => openFileInReader(node),
        onExit: () => closeApp('terminal'),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load terminal.';
      mountEl.innerHTML = `<p class="terminal-loading">${message}</p>`;
    }
  }

  // Wire desktop shortcuts & taskbar
  root.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    const shortcut = target.closest<HTMLElement>('[data-open-app]');
    if (shortcut) {
      const appId = shortcut.dataset.openApp as AppId;
      const openPath = shortcut.dataset.openPath;
      if (appId === 'files' && openPath) {
        try {
          const node = vfs.resolve(openPath);
          if (node.type === 'directory') {
            cwd = node.path;
            renderFileManager();
          }
        } catch {
          // Ignore invalid shortcut path
        }
      }
      if (appId === 'reader' && openPath) {
        try {
          const node = vfs.resolve(openPath);
          if (node.type === 'file') {
            openFileInReader(node, shortcut);
            return;
          }
        } catch {
          // Ignore invalid shortcut path
        }
      }
      openApp(appId, shortcut);
      return;
    }

    const closeBtn = target.closest<HTMLElement>('[data-close-app]');
    if (closeBtn) {
      closeApp(closeBtn.dataset.closeApp as AppId);
      return;
    }

    const minBtn = target.closest<HTMLElement>('[data-minimize-app]');
    if (minBtn) {
      minimizeApp(minBtn.dataset.minimizeApp as AppId);
      return;
    }

    const taskBtn = target.closest<HTMLElement>('[data-taskbar-app]');
    if (taskBtn) {
      const id = taskBtn.dataset.taskbarApp as AppId;
      const win = windows.get(id);
      if (win && !win.hidden && activeApp === id) {
        minimizeApp(id);
      } else {
        openApp(id, taskBtn);
      }
      return;
    }

    const viewBtn = target.closest<HTMLButtonElement>('[data-fm-view]');
    if (viewBtn) {
      viewMode = viewBtn.dataset.fmView === 'grid' ? 'grid' : 'list';
      saveViewMode(viewMode);
      renderFileManager();
    }
  });

  upBtn?.addEventListener('click', () => {
    if (cwd === '/') return;
    cwd = dirname(cwd);
    renderFileManager();
  });

  // Settings controls
  const themeRadios = root.querySelectorAll<HTMLInputElement>('input[name="desktop-theme"]');
  const wallpaperRadios = root.querySelectorAll<HTMLInputElement>('input[name="desktop-wallpaper"]');
  const motionCheck = root.querySelector<HTMLInputElement>('[data-setting-reduced-motion]');

  function syncSettingsUI(): void {
    let currentTheme = 'system';
    let currentWallpaper = 'default';
    try {
      currentTheme = localStorage.getItem('notebook-theme') || 'system';
      currentWallpaper = localStorage.getItem('notebook-wallpaper') || 'default';
    } catch {
      currentTheme = 'system';
      currentWallpaper = 'default';
    }
    themeRadios.forEach((radio) => {
      radio.checked = radio.value === currentTheme;
    });
    wallpaperRadios.forEach((radio) => {
      radio.checked = radio.value === currentWallpaper;
    });
    root.dataset.wallpaper = currentWallpaper;
    if (motionCheck) {
      motionCheck.checked = document.documentElement.dataset.reducedMotion === 'true';
    }
  }

  wallpaperRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      root.dataset.wallpaper = radio.value;
      try {
        localStorage.setItem('notebook-wallpaper', radio.value);
      } catch {
        // Ignore storage errors
      }
    });
  });

  themeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (!radio.checked) return;
      try {
        if (radio.value === 'system') {
          localStorage.removeItem('notebook-theme');
          delete document.documentElement.dataset.theme;
        } else {
          localStorage.setItem('notebook-theme', radio.value);
          document.documentElement.dataset.theme = radio.value;
        }
      } catch {
        // Ignore storage errors
      }
    });
  });

  motionCheck?.addEventListener('change', () => {
    const enabled = motionCheck.checked;
    try {
      localStorage.setItem('notebook-reduced-motion', String(enabled));
    } catch {
      // Ignore storage errors
    }
    if (enabled) {
      document.documentElement.dataset.reducedMotion = 'true';
    } else {
      delete document.documentElement.dataset.reducedMotion;
    }
  });

  // Initial render
  syncSettingsUI();
  renderFileManager();
  syncWindows();

  // Keep activeReaderPath referenced for clarity
  void activeReaderPath;
}
