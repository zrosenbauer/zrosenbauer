# Resumes

This directory holds **resume templates** built with [RenderCV](https://docs.rendercv.com/). Each subdirectory is a committed pnpm workspace (`@resume/<name>`) that doubles as:

- a real, renderable resume, and
- a starting point you clone whenever you tailor a resume for a specific company or role.

The clone goes into `.tailored/<name>/` at the repo root (gitignored), where you edit the YAML. Every workspace — template or tailored — renders into its own local `output/` directory.

## Layout

```
resumes/
├── README.md              # this file
└── primary/               # @resume/primary — base template
    ├── package.json       # render/watch/clean scripts (uvx → rendercv 2.8)
    ├── cv.yaml            # content: name, headline, sections, bullets
    ├── design.yaml        # theme, fonts, colors, spacing
    ├── locale.yaml        # locale strings (months, "present", etc.)
    ├── settings.yaml      # render settings (incl. required `render_command: {}`)
    └── output/            # rendered PDF/HTML/MD/PNG/Typst (gitignored)
```

Tailored copies live elsewhere:

```
.tailored/                 # gitignored at repo root
└── <name>/                # @resume/<name> — same shape as resumes/primary,
    ├── ...                # cloned YAMLs, edited per-application
    └── output/            # local renders
```

## Common commands

Run from the repo root:

```bash
pnpm resume:new        # clone a template into .tailored/<name>/  (interactive, via turbo gen)
pnpm resume:render     # render every resume sequentially (pnpm -r filter)
pnpm resume:watch      # watch + rerender on YAML changes (pnpm -r --parallel)
pnpm resume:clean      # remove every workspace's output/ dir
```

Single-resume operations:

```bash
pnpm --filter @resume/primary render
pnpm --filter @resume/<name>  render
```

Or from inside a resume's workspace dir:

```bash
pnpm render
pnpm watch
pnpm clean
```

## Cloning a template (`pnpm resume:new`)

The generator at `turbo/generators/config.js` runs through these prompts:

1. **Template** — pick any directory in `resumes/`.
2. **Name** — kebab-case, e.g. `acme`, `recruiter-foo`. `_template` and `output` are reserved; existing names under `.tailored/` are rejected.

It then:

- Copies `cv.yaml` / `design.yaml` / `locale.yaml` / `settings.yaml` from `resumes/<template>/` into `.tailored/<name>/` byte-for-byte.
- Writes a templated `package.json` (`@resume/<name>`) with the render scripts. Renders go to `.tailored/<name>/output/` — same shape as the templates.

Non-interactive form (positional args = prompts in order):

```bash
pnpm turbo gen resume --args "<template>" "<name>"
# e.g.
pnpm turbo gen resume --args "primary" "acme"
```

After scaffolding, edit `.tailored/<name>/cv.yaml` to tailor the resume, then render.

## Adding a new committed template

Templates are just normal workspaces, so to add one (e.g. a leadership-focused base):

```bash
cp -r resumes/primary resumes/leadership
```

Then edit `resumes/leadership/package.json` — rename `@resume/primary` → `@resume/leadership`. The render scripts use `--output-folder output` so no path changes are needed.

Run `pnpm install` to refresh pnpm's workspace graph. The generator will offer it as a choice on the next run.

## Fonts

The repo bundles the full **Vercel Geist** family under `fonts/` at the repo root: Geist Sans, Geist Mono (both variable, all weights + italic), and 5 Geist Pixel styles. Each workspace has a `fonts -> ../../fonts` symlink so RenderCV/Typst auto-discover them.

Reference fonts in `design.yaml` by family name:

- `Geist` — readable sans, use for body / name / headline / connections.
- `Geist Mono` — wider techy mono, use for section titles or accents.
- `Geist Pixel Circle` / `Grid` / `Line` / `Square` / `Triangle` — pixel accents (rare; body text isn't readable in pixel).

**Primary defaults to Geist Sans body + Geist Mono section titles** — readable body with a techy signal in the headers. Tweak `design.yaml`'s `typography.font_family` to mix differently.

The generator creates the symlink for tailored copies automatically; it's an untracked file in `.tailored/<name>/` that resolves to the repo's shared `fonts/` dir.

## Editing tips

- Keep the four-file split (`cv` / `design` / `locale` / `settings`) — don't merge into one file. The split is intentional so `cv.yaml` is the "what" and the other three are the "how it looks".
- `settings.yaml` must keep `render_command: {}` (even empty). Without it, rendercv 2.8 throws `KeyError: 'render_command'` whenever `--output-folder` is used.
- Pinned to `rendercv[full]==2.8` on Python 3.12, invoked via `uvx`. Bumping the version: update every workspace's `package.json` plus the generator template at `turbo/generators/templates/_meta/package.json.hbs`.
- All `output/` directories are gitignored globally via `**/output/`. If you ever want a specific rendered file tracked (e.g. the primary PDF for linking from the GitHub profile), add an exception in `.gitignore` and use `git add -f` for that file.

For broader repo context (the GitHub profile README, etc.) see `AGENTS.md` at the repo root.
