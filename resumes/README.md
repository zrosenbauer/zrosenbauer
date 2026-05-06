# Resumes

[RenderCV](https://docs.rendercv.com/)-based resume sources for Zac Rosenbauer.

## Summary

Two flavors live in this repo:

- **Templates** — `resumes/<name>/` (committed). Long-lived baseline resumes maintained over time. `primary` is the canonical one.
- **Tailored copies** — `.tailored/<name>/` at the repo root (gitignored). Per-application clones of a template, edited for a specific company or role.

Each is a pnpm workspace (`@resume/<name>`) and renders to its own local `output/` directory (PDF + Typst + Markdown + HTML + PNGs).

## Setup

Prerequisites:

- **Node 20+** and **pnpm 10+**
- **`uv`** on PATH ([uv install](https://docs.astral.sh/uv/getting-started/installation/)) — used by `uvx` to run RenderCV without a global Python install.

One-time:

```bash
pnpm install
```

That's it — no Python venv, no global RenderCV install. The first render will pull `rendercv[full]==2.8` via `uvx` and cache it.

## Usage

### Render

```bash
pnpm resume:render                  # render every resume sequentially
pnpm resume:watch                   # watch + auto-rerender on YAML changes (parallel)
pnpm --filter @resume/primary render # one resume only
pnpm resume:clean                   # remove every workspace's output/ dir

open resumes/primary/output/Zac_Rosenbauer_CV.pdf
```

Or from inside a workspace directory: `pnpm render` / `pnpm watch` / `pnpm clean`.

### Tailor a template for an application

```bash
pnpm resume:new
# prompts: which template to clone? + new kebab-case name
```

Non-interactive equivalent:

```bash
pnpm turbo gen resume --args "primary" "acme"
```

The generator copies the four YAML files from `resumes/<template>/` byte-for-byte into `.tailored/<name>/`, writes a templated `package.json`, and creates a `fonts` symlink. Edit `.tailored/<name>/cv.yaml` for the role, then render.

### Add a new committed template

```bash
cp -r resumes/primary resumes/<new-name>
# edit resumes/<new-name>/package.json: rename @resume/primary → @resume/<new-name>
pnpm install
```

The generator will offer it as a clone choice on the next run.

### Edit content & design

Each workspace has four YAML files:

| File            | Purpose                                                          |
| --------------- | ---------------------------------------------------------------- |
| `cv.yaml`       | Content: name, sections, bullets, experience, education, etc.    |
| `design.yaml`   | Theme, fonts, colors, spacing, entry templates.                  |
| `locale.yaml`   | Locale strings (month names, "present", etc.).                   |
| `settings.yaml` | Render settings — must include `render_command: {}` (see below). |

Reference `resumes/primary/` for working examples. For fields that aren't in primary, see [docs.rendercv.com](https://docs.rendercv.com/).

### Fonts

Each workspace ships its own `fonts/` directory with the **Vercel Geist** family: **Geist** (sans, variable), **Geist Mono** (variable), and 5 **Geist Pixel** styles (Circle, Grid, Line, Square, Triangle). RenderCV auto-discovers fonts in `fonts/` next to the input YAML, so just reference the family name in `design.yaml`:

```yaml
design:
  typography:
    font_family:
      body: Geist
      section_titles: Geist Mono
```

Primary uses Geist Sans body + Geist Mono section titles for readable body with a techy header signal. Templates are self-contained — `cp -r resumes/primary <anywhere>` and it'll render. The generator copies `fonts/` into each new tailored workspace automatically.

## Troubleshooting

**`KeyError: 'render_command'` on render.** `settings.yaml` is missing `render_command: {}`. Add it (even empty) — required by rendercv 2.8 whenever `--output-folder` is used. The primary template already has it.

**Font not applying.** Check the workspace has a `fonts/` directory (`ls <workspace>/fonts/`) and that the family name in `design.yaml` matches the font's metadata exactly — e.g. `Geist Mono` (with space), not `GeistMono`. To inspect a font's family name:

```bash
uvx --from fonttools ttx -t name fonts/<file>.ttf
# read nameID="1" — that's the family name rendercv expects
```

**Page count exploded after a design change.** Wider fonts, larger body size, or extra spacing all eat vertical space. Levers in `design.yaml` (most impactful first):

- `typography.font_size.body` — drop from `10pt` → `9.5pt`
- `typography.line_spacing` — tighten from `0.85em` → `0.78em`
- `sections.space_between_regular_entries` — `0.42cm` → `0.28cm`
- `entries.{summary,highlights}.space_above` and `highlights.space_between_items` — drop to `0.05cm`
- `page.{top,bottom,left,right}_margin` — last resort

**Stale rendered output.** Run `pnpm --filter @resume/<name> clean` (or `pnpm resume:clean`) and re-render. There's no caching layer; if output doesn't reflect your edits, double-check that you saved.

**`uvx` not found.** Install `uv`: `curl -LsSf https://astral.sh/uv/install.sh | sh`, then restart your shell. RenderCV runs via `uvx --python 3.12 --from 'rendercv[full]==2.8'` — bypassing this means version drift.

**RenderCV is too slow.** First render downloads the package + Typst fonts (~10s); subsequent renders run from cache (~1s per resume).

---

For repo-wide context (GitHub profile README, agent skills, monorepo layout) see `AGENTS.md` at the repo root.
