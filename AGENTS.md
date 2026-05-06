# Agent Instructions 

This file provides guidance to AI coding agents working with code in this repository.

## Repository purpose

This is a pnpm + Turborepo monorepo for personal artifacts. Two things live here:

1. **Root `README.md`** — the GitHub profile README (`zrosenbauer/zrosenbauer`), rendered directly on the user's GitHub profile page.
2. **Resume templates and tailored copies** — built with [RenderCV](https://docs.rendercv.com/). Committed resumes under `resumes/*` are treated as **templates**; per-application copies are cloned from a chosen template into `.tailored/<name>/` (gitignored) where they're edited and rendered. Each workspace (`@resume/<name>`) renders into its own local `output/` directory.

## Layout

```
.
├── README.md                       # GitHub profile (committed, rendered on profile page)
├── package.json                    # root workspace + scripts
├── pnpm-workspace.yaml             # globs: resumes/*, .tailored/*, !**/_template
├── turbo.json                      # near-empty; only present so `turbo gen` resolves the project root
├── .agents/skills/                 # vendored AI-agent skills (source of truth, cross-tool)
│   └── rendercv/                   # repo-specific wrapper for the rendercv skill
│       └── SKILL.md                # auto-discovered by OpenCode; symlinked into .claude/
├── .claude/skills/                 # Claude Code's skills dir
│   └── rendercv -> ../../.agents/skills/rendercv   # symlink (committed)
├── fonts/                          # shared font files (Geist family)
│   ├── Geist[wght].ttf             # Geist Sans variable, all weights
│   ├── Geist-Italic[wght].ttf
│   ├── GeistMono[wght].ttf         # Geist Mono variable, all weights
│   ├── GeistMono-Italic[wght].ttf
│   └── GeistPixel-{Circle,Grid,Line,Square,Triangle}.ttf
├── turbo/generators/
│   ├── config.js                   # `turbo gen resume` generator (clones a template)
│   └── templates/_meta/            # handlebars template for the cloned package.json
│                                   #   (yaml files are copied verbatim from the source)
├── resumes/                        # committed resume TEMPLATES
│   ├── README.md                   # docs for the resume workflow
│   └── primary/                    # @resume/primary — Zac's primary resume / template
│       ├── package.json            # render/watch/clean (uvx → rendercv 2.8 → ./output)
│       ├── cv.yaml                 # content
│       ├── design.yaml             # theme/typography
│       ├── locale.yaml             # locale strings
│       ├── settings.yaml           # render settings (incl. `render_command: {}`)
│       └── output/                 # rendered PDF/HTML/MD/PNG/Typst (gitignored)
└── .tailored/                      # gitignored at repo root
    └── <name>/                     # @resume/<name> — cloned from a template,
                                    # edited per-application, renders into ./output
```

### Templates vs. tailored copies

- `resumes/*` — committed templates. Treat the YAMLs here as the canonical source you maintain over time (e.g. `resumes/primary/` is the user's primary; you'd add `resumes/leadership/`, `resumes/ic/`, etc. as additional starting points). They're real renderable workspaces, not abstract templates.
- `.tailored/*` — entirely gitignored. Tailored copies cloned from a template by `pnpm resume:new` for a specific company / role. The dir + contents are ignored; pnpm still picks them up as workspaces locally.
- **Each workspace renders to its own local `output/` dir.** `**/output/` is gitignored globally. There's no centralized dist directory — the render output sits next to its source YAMLs.

## Working in this repo

### README edits

- Changes ship the moment they hit `main` — GitHub renders the README directly. Treat `main` as production.
- The README mixes raw HTML (`<div>`, `<img>` for badges and devicons) with markdown. Preserve that style — don't rewrite HTML blocks into pure markdown.
- Badge and devicon image URLs point to external sources (shields.io, devicons on GitHub). When adding a tool icon, follow the existing `devicons/devicon` URL pattern.

### Resume workflows

RenderCV is a Python tool wrapped via `uvx` so no global install is needed (requires `uv` on PATH).

**Root scripts (run from repo root):**

```bash
pnpm resume:new       # turbo gen — clone a template into .tailored/<name>/  (interactive)
pnpm resume:render    # render every resume; cache hits skip unchanged ones
pnpm resume:watch     # watch + rerender every resume (turbo persistent task)
pnpm resume:clean     # remove each workspace's output/ dir
```

**Render a single resume:**

```bash
pnpm --filter @resume/primary render
pnpm --filter @resume/<name> render
```

**Per-resume scripts (run from inside the workspace dir):**

```bash
pnpm render
pnpm watch
pnpm clean
```

### Creating a tailored copy (clone-from-template)

`pnpm resume:new` runs the turbo generator at `turbo/generators/config.js`. It prompts for:

1. **Template** — pick from any directory under `resumes/`. The chosen template's four YAML files are copied verbatim.
2. **Name** (kebab-case) — becomes `@resume/<name>` under `.tailored/<name>/`. `_template` and `output` are reserved; names that already exist under `.tailored/` are rejected.

The generator copies `cv.yaml` / `design.yaml` / `locale.yaml` / `settings.yaml` from `resumes/<template>/` into `.tailored/<name>/` byte-for-byte, then writes a templated `package.json` (`@resume/<name>`) using `turbo/generators/templates/_meta/package.json.hbs`. The render scripts use `--output-folder output` so renders land in `.tailored/<name>/output/`.

After scaffolding, edit `.tailored/<name>/cv.yaml` to tailor for the role, then `pnpm --filter @resume/<name> render` (or `pnpm resume:render` to render everything).

For non-interactive scripted use (positional args match the prompt order):

```bash
pnpm turbo gen resume --args "<template>" "<name>"
```

To add a new committed template, copy an existing one and rename the workspace (`cp -r resumes/primary resumes/leadership`, then edit `resumes/leadership/package.json` and rename `@resume/primary` → `@resume/leadership`). `pnpm install` to refresh the workspace graph.

### Run tasks: pnpm direct, no turbo orchestration

Render / watch / clean are run via pnpm's workspace filter, not turbo. The root scripts are:

- `resume:render` → `pnpm -r --filter '@resume/*' run render` — sequential render across all resume workspaces.
- `resume:watch`  → `pnpm -r --parallel --filter '@resume/*' run watch` — parallel persistent watchers.
- `resume:clean`  → `pnpm -r --filter '@resume/*' run clean`.

Why no turbo for these: each render is ~1s, caching gains were marginal, and pnpm output is cleaner for a single-language workspace. Turbo is still used for the resume generator (`turbo gen resume`) since there's no pnpm-native equivalent for code scaffolding.

### Render gotcha

The `--output-folder` rendercv flag requires a `render_command` key in `settings.yaml` (even an empty `{}`) — without it, rendercv 2.8 throws `KeyError: 'render_command'`. The primary template and the generator's source already include `render_command: {}`.

### RenderCV pinning

Each resume's `package.json` pins `rendercv[full]==2.8` on Python 3.12 via `uvx`. The `[full]` extra pulls in Typst + fonts for PDF/PNG generation. Bumping the version: update all `resumes/*/package.json`, `.tailored/*/package.json`, and the generator template (`turbo/generators/templates/_meta/package.json.hbs`) together.

### Fonts

The repo bundles the full **Vercel Geist** family under `fonts/` at the repo root (MIT licensed — committing binaries is fine):

| Family name (in `design.yaml`)                   | Files                                               | Use for                                          |
| ------------------------------------------------ | --------------------------------------------------- | ------------------------------------------------ |
| `Geist`                                          | `Geist[wght].ttf`, `Geist-Italic[wght].ttf`         | Body, name, headline, connections (readability)  |
| `Geist Mono`                                     | `GeistMono[wght].ttf`, `GeistMono-Italic[wght].ttf` | Section titles, code, accents (techy signal)     |
| `Geist Pixel {Circle,Grid,Line,Square,Triangle}` | five `.ttf` files                                   | One-off pixel accents (rarely body text)         |

Each resume workspace gets a `fonts/` symlink pointing at `../../fonts/`. RenderCV/Typst auto-discover any font file in a `fonts/` dir next to the input YAML, so workspaces just reference the family name. The primary uses **Geist Sans body + Geist Mono section titles** — sans for readability, mono for the techy signal:

```yaml
design:
  typography:
    font_family:
      body: Geist
      name: Geist
      headline: Geist
      connections: Geist
      section_titles: Geist Mono
```

The generator (`pnpm resume:new`) creates the same `fonts -> ../../fonts` symlink in each tailored copy. To refresh the bundled fonts (e.g. when Vercel updates them):

```bash
curl -sL "https://raw.githubusercontent.com/vercel/geist-font/main/fonts/GeistMono/variable/GeistMono%5Bwght%5D.ttf" -o "fonts/GeistMono[wght].ttf"
# repeat for the other eight files; see git history for the exact list
```

### Editing YAMLs

The four-file split (cv/design/locale/settings) is intentional — keep that structure when editing. Don't merge them back into a single file unless asked. Treat `cv.yaml` as the per-resume content and `design.yaml`/`locale.yaml`/`settings.yaml` as shared style; in practice the latter three are duplicated across resumes (an acceptable cost for keeping each one self-contained and independently renderable).

### Vendored agent skills

`.agents/skills/` is the source of truth for any AI-agent skill we've vendored locally. The `.agents/skills/<name>/SKILL.md` layout matches OpenCode's auto-discovery convention, so OpenCode picks them up natively. Claude Code reads them via the symlink at `.claude/skills/<name>` (which points at `../../.agents/skills/<name>`).

Currently vendored:

- `.agents/skills/rendercv/SKILL.md` — originally derived from [`rendercv/rendercv-skill`](https://github.com/rendercv/rendercv-skill) but rewritten as a thin wrapper for this repo. It documents the `pnpm resume:new` flow, tells the agent to disambiguate intent (template vs. tailored copy vs. edit vs. render) using `AskUserQuestion` before doing anything, and points at `resumes/primary/` + [docs.rendercv.com](https://docs.rendercv.com/) for YAML schema details. The upstream's 800-line Pydantic schema dump is intentionally **not** vendored — the live working CV at `resumes/primary/` is a better reference and rendercv's runtime validation errors handle the rest.

To vendor a new skill, create `.agents/skills/<name>/SKILL.md`, then symlink it into `.claude/skills/`:

```bash
mkdir -p .claude/skills
ln -s ../../.agents/skills/<name> .claude/skills/<name>
```
