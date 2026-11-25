# AGENTS.md

## 1. Project overview

Build a personal public notebook using Astro, hosted on GitHub Pages with a custom domain. The website is primarily a way for its author to organize, preserve, revisit, and share notes, experiments, mistakes, and discoveries.

The main subjects are cybersecurity, artificial intelligence, machine learning, and software engineering. The site is not an authoritative publication, academic journal, commercial product, or conventional résumé. Its identity should reflect intellectual curiosity, humility, openness, and the enjoyment of learning.

**Tagline:** Written out of curiosity. Shared in case it helps.

**Working UI label:** Notebook OS (placeholder, not final branding).

The homepage is a miniature desktop environment exposing a simulated, read-only filesystem. Visitors can browse files graphically or through a terminal, and open articles in a physical notebook-inspired reader.

**Homepage headline:** An ongoing attempt to understand things.

The author name, site name, domain, repository URL, and contact details are configurable. Do not invent them.

## 2. Agent workflow

- Inspect the repository and existing instructions before making changes.
- If starting from an empty repository, propose a concise implementation plan before scaffolding. Ask about consequential unresolved decisions together, rather than interrupting for minor details.
- Work incrementally in coherent, testable milestones. Continue through approved milestones without stopping merely to report progress.
- When delegation is available, delegate bounded tasks with explicit acceptance criteria. The coordinating agent remains responsible for integration and verification. Do not assume any particular agent extension or provider is installed.
- Prefer simple, maintainable solutions. Explain non-obvious architectural decisions and avoid speculative abstractions.
- Preserve user-authored content and unrelated changes. Never fabricate research results, publications, personal details, or project claims.
- Do not publish, push, configure external services, or modify DNS without explicit authorization.
- Report actual test results, unresolved issues, and deviations from the plan. Do not claim unperformed checks passed.

## 3. Technical direction

- Astro with static output and TypeScript.
- Astro components, semantic HTML, and plain CSS using custom properties. Avoid React, Tailwind, and other frameworks unless a concrete need is established and approved.
- Markdown and MDX for content; use Astro content collections with validated schemas compatible with the installed Astro version.
- Shiki for syntax highlighting.
- GitHub Actions for building and deploying to GitHub Pages.
- RSS, sitemap, and basic SEO metadata.
- Prefer locally hosted assets and fonts where practical; retain required licenses.
- Use client-side TypeScript (compiled to JavaScript) for desktop interactions, filesystem navigation and the terminal. Keep static article routes usable without JavaScript. The author is more comfortable with Ruby than JavaScript, so keep the implementation approachable and document non-obvious TypeScript.
- Use a single package manager and commit its lockfile. Default to npm unless the repository indicates otherwise.
- Consider KaTeX, Mermaid, Pagefind, and Giscus as later enhancements. Do not introduce all of them in the initial implementation.

## 4. Visual identity

Create a custom theme that evokes a real ruled paper notebook: a personal laboratory notebook left open for others to read. The physical notebook metaphor is the reader identity; the desktop shell uses a complementary dusty-blue Linux-inspired visual language. Avoid corporate styling, generic portfolios, neon hacker aesthetics, and excessive skeuomorphism that interferes with reading.

### Desktop shell

Use a restrained dusty-blue desktop (`#496681`), dark panel (`#263E55`), light window chrome (`#DCE4EC`), and blue folder icons (`#7598B9`). Provide a taskbar, guest-session indicator, desktop shortcuts, and window title bars with functional controls. Avoid copying proprietary OS branding. Use Inter for controls and JetBrains Mono for terminal text. Use a dark terminal (`#151B24`) with pale text and blue prompt. On mobile, present applications as full-width views instead of floating windows.

### Light palette

| Token | Value | Role |
| --- | --- | --- |
| Notebook paper | `#FCF9EF` | Page surface |
| Ballpoint ink | `#385779` | Headings, links, annotations |
| Ruled lines | `#A4BFD8` | Subtle horizontal rules |
| Red margin | `#D89595` | Vertical notebook margin |
| Pencil graphite | `#555550` | Secondary text |
| Highlighter | `#F4E6A0` | Occasional emphasis |
| Body ink | `#283D53` | Long-form reading |

Use semantic CSS tokens and adjust contrast for WCAG AA. Decorative rules and margins should remain faint enough not to compete with text.

### Dark theme

Evoke black-paper stationery with pale gel ink: paper `#222832`, ink `#D8E1ED`, accent ink `#A5BEDB`, rules `#3B4D65`, margin `#855B68`. These are starting values; verify contrast rather than mechanically inverting the light theme.

### Typography

- Caveat: handwritten headings, date fields, and occasional annotations.
- Source Serif 4: readable article prose.
- Inter: navigation and interface controls where appropriate.
- JetBrains Mono: code and technical metadata.

Use appropriate fallback fonts. Do not use handwriting fonts for entire articles. Favor comfortable reading widths (65–75 characters), clear hierarchy, and responsive layouts.

### Notebook design language

- Use CSS repeating linear gradients for faint blue horizontal rules and a vertical red margin. No large raster paper texture is required. Centralize rule spacing and margin offsets as CSS variables.
- Present content on a paper-like sheet with restrained edge shadows, optional punched holes, and notebook index tabs for navigation. Keep these decorative and noninteractive unless they are actual navigation links.
- Reserve a date field in the upper-right corner of entries, populated from actual metadata; show a blank date field on the homepage if desired. Do not fabricate dates.
- Use small original SVG doodles in the margins: neural networks, atoms, locks, bugs, arrows, equations, or geometric sketches. Keep them sparse, deterministic, and out of the reading area. Decorative SVGs must be hidden from assistive technology.
- Provide reusable Astro/MDX components for handwritten annotations, margin notes, highlighted passages, and sketch-style figures. Corrections may use struck-out text with an explicit explanation; never silently alter historical claims.
- Give entries stable notebook entry numbers using optional explicit metadata, never an index derived from chronological sorting. Omit the number if not supplied; do not renumber published entries.
- Hand-drawn technical diagrams may use static SVG or Excalidraw exports; defer rough.js or interactive diagram libraries until needed. Preserve accessible captions and text alternatives for meaningful figures.
- Align ordinary prose to the ruled baseline where practical, but do not force headings, code, tables, equations, or images into a rigid grid. Allow those elements their own spacing and opaque surfaces where needed.
- On narrow screens, reduce the margin, hide purely decorative doodles and punched holes, and move margin annotations into the reading flow. No page-wide horizontal overflow.
- Support keyboard navigation, visible focus, reduced motion, system theme preference, and a persistent manual theme switch. Ensure decorative effects do not interfere with selection, links, or reading.

## 5. Information architecture

- `/`: desktop environment with Home, Terminal, Read me, and Settings shortcuts; accessible conventional links to content and disclaimer.
- `/notes/`: browsable index of published notes and articles.
- `/notes/[slug]/`: individual entry.
- `/experiments/`: filtered view of experimental entries.
- `/projects/`: selected projects, with links to repositories where provided.
- `/about/`: author information, populated only from supplied facts.
- `/disclaimer/`: a note to the reader.
- `/tags/[tag]/`: related entries by tag, when implemented.
- `/rss.xml`: RSS feed of published entries.
- A useful custom 404 page.

Keep conventional navigation available alongside the desktop: Notes, Experiments, Projects, About. Link the disclaimer prominently from the homepage and footer. Use one canonical URL per entry; filtered indexes should link to it rather than duplicate content.

## 6. Content model

Prefer one entry collection with filtered views, plus a separate project collection. Suggested entry metadata:

```yaml
title: Example entry
description: A short description.
entryNumber: null
publishedAt: 2026-11-24
updatedAt: null
category: ai
kind: experiment
status: exploratory
tags: [language-models]
draft: true
repository: null
series: null
```

This is illustrative metadata, not a real publication. Optional values may be omitted or represented consistently according to the validated schema.

Suggested categories: security, ai, engineering, miscellaneous.
Suggested kinds: note, experiment, article, devlog.

Epistemic statuses:

- `raw`: preliminary or loosely organized notes.
- `speculative`: ideas or untested hypotheses.
- `exploratory`: early investigations with limited evidence.
- `experimental`: observations from practical experiments; not a guarantee of validity.
- `revisited`: updated after further learning.
- `retracted`: conclusions the author no longer endorses.

Status is independent of publication state. Drafts must be excluded from production routes, indexes, feeds, sitemap, and search. Retractions should remain accessible when the author chooses, with a prominent explanation and correction date. Do not imply that any status constitutes peer review.

Keep English as the initial content language. Avoid building a translation system prematurely, but do not make future localization unnecessarily difficult.

## 7. Page design

### Homepage / desktop

Present a lightweight desktop with a top panel, wallpaper, application shortcuts, taskbar and file manager. Default to the home directory open, with a clear invitation to explore and a visible README.md and DISCLAIMER.md. The README contains the homepage headline, the phrase “Driven by curiosity, not authority.” and the tagline. Include recent entries in the file manager if useful. Use clearly marked fixtures during development and honest empty states in production.

Applications: File Manager, Terminal, Notebook Reader, Settings and About. Support opening and closing applications and switching between them. Window controls must work if displayed; defer draggable/resizable windows, complex stacking and multiple reader windows until the core experience is stable. On mobile use a simple single-application view with back navigation. Provide a conventional article index and direct links for visitors who prefer not to use the desktop.

### File manager

Show directory breadcrumbs, parent navigation, folder/file icons, list or grid presentation, and meaningful empty states. Opening a folder changes the current directory; opening a file launches the notebook reader or navigates to its canonical URL. Provide keyboard-operable links or buttons, visible focus and descriptive labels. Offer hidden-file visibility only if hidden public files exist. No fake controls.

### Entry layout

Use the ruled-paper sheet inside the desktop reader and on standalone canonical article pages, with an entry number when supplied, publication date in the upper-right date field, handwritten section headings, and optional margin annotations. Include a title, optional subtitle or description, publication and revision dates, category, epistemic status, tags, and reading time if useful. Use an accessible table of contents for long entries, readable code blocks, footnotes, figures with captions, and references where supplied. Allow links to repositories and source history when available.

On larger screens, a narrow sidebar may contain the table of contents. On small screens, collapse it into the normal reading flow. Support long code lines without causing page-wide horizontal scrolling.

Do not require an academic article structure. An entry can be a few sentences, an experiment log, or a detailed investigation. Never automatically invent abstracts, citations, or conclusions.

### Projects

Present projects as a modest directory of things the author builds. Each may include a description, technology stack, status, repository, and related notes. Do not turn this into a sales landing page.

## 7A. Virtual filesystem and terminal

### Shared filesystem

Generate a deterministic public filesystem manifest from validated Astro content collections at build time. The file manager, terminal and reader must use one shared TypeScript filesystem API, not separate hardcoded trees. Use a virtual root and `/home/guest` as the initial working directory. Example hierarchy (illustrative, not actual publications):

```text
/home/guest/
  README.md
  DISCLAIMER.md
  about.md
  notes/
    security/
    ai/
    engineering/
    miscellaneous/
  experiments/
  projects/
  reading/
  archive/
```

Map each published entry to exactly one stable virtual file path and one canonical article URL. Use explicit stable slugs or virtual paths; validate collisions, invalid segments and file/directory conflicts at build time. Filtered views may link to the same canonical entry rather than duplicate it. Empty directories are acceptable. Archive only explicitly archived public content. Never expose drafts, private files, repository internals or arbitrary build inputs. Dotfiles, if added, are intentionally public Easter eggs, not secrets.

Manifest records should include node type, name, normalized path, canonical URL for readable files, and available publication/revision metadata. Keep raw Markdown in separately generated public resources if needed for `cat`, rather than shipping every article in the initial desktop bundle. Strip frontmatter or expose only explicitly public metadata. For MDX, show source as inert text, never execute it in the terminal. Use a single publication filter for routes, manifest, raw resources, feeds and search.

Provide pure, testable operations for path normalization, resolution, listing, lookup, reading and tree traversal. Support absolute and relative paths, `.`, `..`, `~`, repeated separators and root boundaries. Reject invalid paths and return predictable errors. Each terminal session has its own current directory; the file manager may navigate independently. Both resolve identical paths to identical nodes.

### Terminal application

Use xterm.js for terminal rendering (verify current package/API and license before integration), with a small custom TypeScript command interpreter. Do not implement a real shell or use a remote execution service. A simpler accessible DOM terminal is acceptable if xterm.js creates unnecessary complexity; explain the decision. Lazy-load the terminal when opened. Start with `guest@notebook:~$` and a short welcome/help message.

Required initial commands:

| Command | Behavior |
| --- | --- |
| `ls [path]` | List directory contents; support `-a`, `-l`, `-la` and `-al` |
| `cd [path]` | Change directory; no argument returns home |
| `pwd` | Print absolute virtual path |
| `cat <file>` | Print public raw Markdown as inert text |
| `open <file>` | Open the same article in the graphical reader |
| `tree [path]` | Show directory hierarchy |
| `whoami` | Return guest |
| `help [command]` | Explain supported commands and syntax |
| `clear` | Clear terminal output |
| `exit` | Close terminal application |

Support command history with up/down arrows, tab completion for commands and paths, basic quoted arguments, backspace and Ctrl+C to cancel input. Provide clear errors for unknown commands, unsupported options, missing paths, and file/directory mismatches. Do not silently pretend unsupported shell syntax works. Defer `find`, `grep`, `head`, `tail`, `stat`, pipes, and other advanced features; pipes and redirects are not required. Optional harmless Easter eggs such as `sudo`, `neofetch`, `fortune` and `uname` may be added after core commands work.

### Security and usability

- Strictly read-only simulation. No eval, Function constructor, OS commands, arbitrary network fetches, real filesystem access, or execution of user input. Resolve reads only through known manifest nodes and their generated public resources.
- Render terminal output as text; neutralize terminal control sequences in untrusted article content and filenames. Do not inject input or Markdown source into HTML. Validate reader links against generated internal routes.
- Bound command length, output size and history; handle asynchronous reads and failures without corrupting session state.
- Terminal navigation is optional. Provide a keyboard-accessible file manager, conventional links and standalone statically rendered articles. Support mobile input, visible focus, reduced motion, and sensible focus restoration when closing applications.
- Settings may persist theme and harmless UI preferences locally; no accounts, tracking or server state.

## 8. Reader disclaimer

Use the following author-approved draft as the initial disclaimer. Preserve its meaning and voice; request approval for substantive changes.

> This website is, first and foremost, my personal notebook made public.
>
> I'm not an expert in most of the subjects I write about, but I am deeply curious about them. Much of what you'll find here comes from personal experiments, independent study, and an occasional urge to understand how things work.
>
> My investigations are driven more by curiosity than scientific rigor. As such, my findings may be incomplete, my assumptions flawed, and my conclusions outright wrong. Nothing here should be mistaken for peer-reviewed research or authoritative guidance.
>
> The primary purpose of this website is to organize my thoughts, document my discoveries, and give my future self somewhere to look when I've inevitably forgotten something.
>
> I've chosen to make these notes public in the hope that someone, somewhere, might find them useful, interesting, or even just entertaining.
>
> If you spot a mistake, disagree with a conclusion, or have something interesting to add, I would genuinely love to hear from you.
>
> After all, understanding things is the whole point.

## 9. Suggested repository organization

```text
AGENTS.md
README.md
astro.config.mjs
package.json
src/
  layouts/
  pages/
  content/
    entries/
    projects/
  content.config.ts
  styles/
  utils/
  lib/
    filesystem/
    terminal/
  components/
    desktop/
    reader/
public/
.github/
  workflows/
```

Adapt this structure to the installed Astro version and actual requirements. Keep reusable layout and presentation logic separate from authored content. Centralize site metadata and design tokens.

## 10. Deployment and privacy

Configure Astro's site URL and base path to support the intended GitHub Pages deployment. Document how to set the custom domain, verify domain ownership, configure DNS and HTTPS, and enable the Actions deployment workflow. Leave actual domain configuration and publication to the author. Do not commit placeholder domain settings as real production values.

The site must not require a backend or database. Avoid analytics, cookies, trackers, external comments, and unnecessary third-party requests by default. Never place secrets, private client information, or confidential work material in public content or build artifacts. Remind the author that a public Git repository can expose drafts and history even when drafts are excluded from the generated website.

## 11. Implementation milestones

1. Foundation and filesystem: scaffold Astro, content schemas, canonical routes, publication filter, generated manifest and pure filesystem API. Test path resolution and draft exclusion.
2. Desktop and file manager: implement shell, taskbar, shortcuts, navigation, README and disclaimer access, responsive layout and keyboard interaction.
3. Terminal: integrate renderer and command interpreter, required commands, completion and history; verify shared filesystem behavior and inert output.
4. Notebook reader: implement ruled paper, handwritten headings, dates, doodles, annotations, code blocks, light/dark themes and standalone article routes. Connect graphical and terminal open actions.
5. Publishing and handoff: RSS, sitemap, SEO, preferences, GitHub Actions, documentation and accessibility/responsive checks. Document deployment without publishing. Search may be added if needed; defer advanced commands, window management, math, diagrams and comments until core functionality is stable and scope is approved.

## 12. Definition of done for the initial release

- Clean install, development server, type check, automated tests and production build work using documented commands.
- Desktop, file manager, terminal and reader are functional, with honest empty states and a useful 404.
- Adding a published Markdown entry automatically creates its canonical route and virtual file without manually editing a tree.
- GUI and terminal resolve the same files; required commands, relative/absolute paths, home expansion, completion, history and errors are tested.
- Drafts and private inputs are absent from generated routes, manifest, raw resources, RSS, sitemap and search. No arbitrary execution or write operations exist.
- Direct article URLs work without JavaScript; mobile and keyboard users can navigate without the terminal.
- Light/dark notebook reader themes preserve readable prose, code, figures and annotations; decorations do not overlap content.
- Disclaimer is prominent and epistemic status is explained. No fabricated publications, broken placeholder links, secrets or unapproved tracking.
- Deployment configuration and README are ready for actual domain and repository settings. Document authoring, virtual paths, terminal commands, revisions and retractions.
- Verify representative desktop/mobile flows in a browser when available, including opening the same file through both interfaces. Report actual checks and remaining limitations.

The objective is a small, durable, pleasant place to keep learning in public. The desktop is how visitors discover the author's thoughts; the notebook is how they read them. Prioritize the writing and reader over the simulation.
