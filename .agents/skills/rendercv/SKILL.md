---
name: rendercv
description: >-
  Author, customize, and render the user's resume(s) in this monorepo using
  RenderCV (v2.8). The repo holds committed resume *templates* under
  `resumes/<name>/` and tailored per-application *clones* under
  `.tailored/<name>/` (gitignored). Each workspace renders to its own
  `output/` dir via `pnpm --filter @resume/<name> render`. Use this skill
  when the user wants to create a new resume, tailor an existing one for a
  specific role/company, edit YAML content (cv/design/locale/settings),
  render to PDF, or troubleshoot a render. For YAML schema details, mirror
  `resumes/primary/` or fetch docs.rendercv.com — this skill only documents
  the repo's wrapper, not RenderCV itself.
---

## Repo workflow (READ FIRST — overrides upstream Quick Start)

**This repo wraps RenderCV in a pnpm + Turborepo setup. Always use the repo's
commands; never invoke `rendercv` directly or `rendercv new` — those bypass
the workspace structure and will produce orphaned files.**

### The mental model

- `resumes/<name>/` — committed **templates** that double as canonical
  resumes (e.g. `resumes/primary/`). You edit these to evolve the user's
  baseline content/design over time.
- `.tailored/<name>/` — **gitignored clones** of a chosen template,
  customized for a specific company/role (e.g. `.tailored/acme/`). Treat
  them as throwaway working copies.
- Every workspace renders to its own `./output/` directory next to the
  YAMLs. `**/output/` is gitignored globally.
- Each workspace has a `fonts/` symlink pointing at the repo's shared
  `fonts/` (Geist Mono variable + Geist Pixel: Circle/Grid/Line/Square/
  Triangle). Reference them in `design.yaml` as `Geist Mono` or
  `Geist Pixel <Style>`. The generator creates the symlink automatically
  for tailored copies.

### Step 1 — Disambiguate intent before doing anything

When the user asks to "make a resume", "create a CV", "update my resume", or
similar, do not assume which path they mean. Ask. If `AskUserQuestion` is
available (you're running inside Claude Code), use it. Otherwise ask in
chat. The four primary intents:

| Intent | Action |
| --- | --- |
| Tailor an existing template for a specific company/role | `pnpm resume:new` (clones into `.tailored/<name>/`) |
| Add a new committed template (a new baseline variant) | Manual copy of an existing `resumes/*` workspace |
| Edit an existing resume's content/design | Edit the YAML files in the relevant workspace directly |
| Just render | `pnpm resume:render` (or filtered) |

**Sample `AskUserQuestion` payload when intent is unclear:**

```json
{
  "questions": [{
    "question": "What kind of resume work do you want?",
    "header": "Resume intent",
    "multiSelect": false,
    "options": [
      {
        "label": "Tailored copy for a specific role",
        "description": "Clone a template into .tailored/<name>/ and edit it for this application. Gitignored. Most common.",
        "preview": "resumes/primary/   <- template (untouched)\n.tailored/acme/    <- new clone, you edit this"
      },
      {
        "label": "New committed template",
        "description": "Add a new baseline variant under resumes/ (e.g. leadership-focused vs IC-focused). Tracked in git.",
        "preview": "resumes/primary/      <- existing\nresumes/leadership/   <- new committed template"
      },
      {
        "label": "Edit an existing resume",
        "description": "Open the YAMLs of a resume already in this repo and modify content/design.",
        "preview": "resumes/<name>/cv.yaml         (template)\n.tailored/<name>/cv.yaml       (tailored copy)"
      },
      {
        "label": "Just render the existing resumes",
        "description": "Run pnpm resume:render to (re)build PDFs/HTML/etc.",
        "preview": "pnpm resume:render"
      }
    ]
  }]
}
```

If the user's intent is already obvious (e.g. they said "I'm applying to
ACME, copy my primary"), skip the question and go straight to that path —
but say in one sentence what you're about to do so they can redirect.

### Step 2a — Tailor an existing template (most common)

Walk the user through this as you go. Don't run all the steps silently.

1. List available templates so the user can pick:
   ```bash
   ls resumes/ | grep -v README
   ```
2. Pick a kebab-case name for the tailored copy (e.g. `acme`,
   `acme-staff-eng`, `recruiter-foo`).
3. Run the generator (interactive form prompts; the non-interactive form is
   safer for agent use):
   ```bash
   pnpm turbo gen resume --args "<template>" "<name>"
   # e.g.
   pnpm turbo gen resume --args "primary" "acme"
   ```
   This copies the four YAML files from `resumes/<template>/` byte-for-byte
   into `.tailored/<name>/` and writes a templated `package.json`.
4. Refresh the workspace graph:
   ```bash
   pnpm install
   ```
5. Now edit `.tailored/<name>/cv.yaml` (and the other YAMLs as needed) to
   tailor the content for the role. Mirror `resumes/primary/cv.yaml` for
   field shapes; consult [docs.rendercv.com](https://docs.rendercv.com/) if
   you need a field that isn't in the primary.
6. Render to verify:
   ```bash
   pnpm --filter @resume/<name> render
   open .tailored/<name>/output/Zac_Rosenbauer_CV.pdf
   ```

### Step 2b — Add a new committed template

Less common. Use when the user wants a second long-lived baseline (e.g. a
leadership-focused variant they'll maintain alongside `primary`).

1. Copy an existing template:
   ```bash
   cp -r resumes/primary resumes/<new-template>
   ```
2. Edit `resumes/<new-template>/package.json` and rename
   `@resume/primary` → `@resume/<new-template>`.
3. `pnpm install` to refresh the workspace graph. The
   `pnpm resume:new` generator will now offer this template as a clone
   source on its next run.
4. Edit `resumes/<new-template>/cv.yaml` etc. with the variant's content.
5. Render: `pnpm --filter @resume/<new-template> render`.

### Step 2c — Edit an existing resume

Just open the YAMLs in the relevant workspace and edit. Important rules:

- Keep the four-file split (`cv.yaml` / `design.yaml` / `locale.yaml` /
  `settings.yaml`) — don't merge them into one file unless the user
  explicitly asks.
- `settings.yaml` must keep `render_command: {}` (even empty). Without it,
  rendercv 2.8 throws `KeyError: 'render_command'` whenever
  `--output-folder` is used.
- After editing, render to verify nothing broke:
  ```bash
  pnpm --filter @resume/<name> render
  ```

### Step 2d — Render

Tasks run via `pnpm -r --filter '@resume/*'` directly — no turbo orchestration:

```bash
pnpm resume:render                  # render every resume sequentially
pnpm resume:watch                   # watch + auto-rerender (parallel, persistent)
pnpm --filter @resume/<name> render # one resume only
pnpm resume:clean                   # remove every output/ dir
```

Output lands in `<workspace>/output/` (PDF + Typst + Markdown + HTML + PNGs).

### Don'ts

- **Don't** call `rendercv` or `uvx rendercv` directly. The wrapped
  `package.json` scripts already pin Python 3.12 and `rendercv[full]==2.8`
  via `uvx` — bypassing them means version drift.
- **Don't** call `rendercv new` to scaffold a resume. Use
  `pnpm turbo gen resume` instead so the workspace gets registered.
- **Don't** add `--output-folder` overrides anywhere other than the
  package.json scripts that already include them. The default
  `rendercv_output/` is shimmed to `./output/` per workspace by the existing
  scripts.
- **Don't** delete `settings.yaml`'s `render_command: {}` line — see above.
- **Don't** edit anything under `resumes/dist/` — that directory was
  removed; if you see one it's a stale artifact that should be deleted.
- **Don't** delete or replace a workspace's `fonts` symlink. It points at
  the repo's shared font dir; replacing it with a copy duplicates ~1.2 MB
  per workspace.

### Where to read next

- `AGENTS.md` at the repo root — repo overview and conventions.
- `resumes/README.md` — focused docs for the resume workflow.
- `resumes/primary/{cv,design,locale,settings}.yaml` — a real, working CV.
  Mirror its structure when adding sections, formatting bullets, etc. It's
  the fastest reference for "how is this field actually written?".
- [docs.rendercv.com](https://docs.rendercv.com/) — the upstream YAML
  schema, all 6 themes (`classic`, `harvard`, `engineeringresumes`,
  `engineeringclassic`, `sb2nov`, `moderncv`), all 22 locales, and entry
  type details. Fetch when you need a field that isn't in `primary`.
- RenderCV's own validation errors at render time are precise — if a field
  is wrong, just render and follow the error.

