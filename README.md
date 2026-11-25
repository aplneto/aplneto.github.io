# aplneto

A personal public notebook built with Astro. Written out of curiosity. Shared in case it helps.

## Local development

With Node.js 22+ and npm installed:

```sh
npm ci
npm run dev
npm run check
npm test
npm run build
```

- `npm run dev` starts the local dev server and includes `draft: true` entries marked with a Draft badge.
- `npm run build` outputs the static site to `dist/` and excludes all drafts from routes, `/vfs/manifest.json`, `/vfs/raw/*`, RSS, and sitemap.
- `npm run preview` serves the production build locally.

Set `SITE_URL` to the site's public origin and `BASE_PATH` to its deployment path when building for a specific destination (for example `SITE_URL=https://aplneto.github.io` and `BASE_PATH=/`).

## Authoring content

### System pages (`src/content/pages/*.md`)

`readme.md`, `disclaimer.md`, `about.md`, and `contact.md` are standard Markdown files. Editing them updates the standalone pages (`/about/`, `/disclaimer/`, `/contact/`), the desktop reader, and `cat` output in the terminal.

### Entries (`src/content/entries/*.md` or `*.mdx`)

Frontmatter fields (validated in `src/content.config.ts`):

- `title` (string, required)
- `description` (string, required)
- `publishedAt` (date `YYYY-MM-DD`, required)
- `updatedAt` (date, optional)
- `entryNumber` (positive integer, optional — never auto-numbered)
- `category`: `security` | `ai` | `engineering` | `miscellaneous`
- `kind`: `note` | `experiment` | `article` | `devlog`
- `status`: `raw` | `speculative` | `exploratory` | `experimental` | `revisited` | `retracted`
- `tags`: string array (optional)
- `draft`: boolean (defaults to `true`)
- `archived`: boolean (optional — places the file in `/home/guest/archive/`)
- `virtualPath`: explicit path inside `/home/guest/` (optional)
- `retractionReason` / `retractedAt`: optional explanation and date when `status: retracted`

### Virtual paths

Each published entry maps to one canonical URL (`/notes/<slug>/`) and one deterministic virtual path:

- `archived: true` → `/home/guest/archive/<slug>.md`
- `kind: experiment` → `/home/guest/experiments/<slug>.md`
- Otherwise → `/home/guest/notes/<category>/<slug>.md`

### Revisions and retractions

When revising an entry, keep `publishedAt` unchanged and set `updatedAt`. For a retraction, set `status: retracted`, provide `retractionReason` and `retractedAt`, and keep the entry accessible rather than silently altering historical claims.

### Terminal commands

The in-desktop terminal supports: `ls [-a|-l|-la|-al]`, `cd [path]`, `pwd`, `cat <file>`, `open <file>`, `tree [path]`, `whoami`, `help [command]`, `clear`, and `exit`, with command history (`↑`/`↓`), tab completion, quoted arguments, and `Ctrl+C`.

## GitHub Pages deployment

The workflow in `.github/workflows/deploy.yml` runs `npm ci`, `npm run check`, `npm test`, and `npm run build`, then deploys `dist/` to GitHub Pages.

1. In repository **Settings → Secrets and variables → Actions → Variables**, set `SITE_URL` and `BASE_PATH` (e.g. `/` for a root or custom-domain site).
2. In **Settings → Pages**, select **GitHub Actions** as the source.
3. For a custom domain, verify domain ownership in GitHub Pages settings, configure DNS with your provider, wait for certificate provisioning, and enable **Enforce HTTPS**.

> Note: Draft filtering protects the generated website, not Git history. A public repository can still expose drafts and past versions, so never commit secrets or confidential material.
