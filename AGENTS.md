# Agent Instructions

This file provides guidance to AI coding agents working with code in this repository.

## Repository purpose

This is the **GitHub profile README** repo (`zrosenbauer/zrosenbauer`) — the special "profile repo" whose `README.md` is rendered on the user's GitHub profile page.

Resume / CV work has moved to a separate repo: [`zrosenbauer/cv`](https://github.com/zrosenbauer/cv). Don't add resume infrastructure here.

## Layout

```
.
├── README.md          # GitHub profile content (rendered on the profile page)
├── package.json       # one script: `pnpm profile:gif` (regenerates the banner)
└── assets/
    ├── whoami         # source script for the terminal banner
    ├── whoami.tape    # vhs tape used to render the banner GIF
    └── whoami.gif     # rendered banner referenced from README.md
```

## Working in this repo

### README edits

- **Changes ship the moment they hit `main`** — GitHub renders the README directly on the profile page. Treat `main` as production; don't push speculative edits.
- The README mixes raw HTML (`<div>`, `<img>` for badges and devicons) with markdown. **Preserve that style** — don't rewrite HTML blocks into pure markdown unless asked.
- Badge and devicon image URLs point to external sources (shields.io, devicons on GitHub). When adding a tool icon, follow the existing `devicons/devicon` URL pattern already used in the README.

### Banner GIF

The terminal banner at the top of the README is a GIF rendered from `assets/whoami.tape` via [vhs](https://github.com/charmbracelet/vhs). Regenerate with:

```bash
pnpm profile:gif
```

Requires `vhs` on PATH. Edit `assets/whoami` (the script the banner runs) or `assets/whoami.tape` (the vhs scenario file) to change what the banner shows. Commit `assets/whoami.gif` after re-rendering — the README references the committed file.
