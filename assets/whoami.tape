# ─────────────────────────────────────────────────────────────
#  README banner: a fake terminal that types `whoami` and prints
#  a YAML-style bio. Geist Mono on a clean Vercel-y dark theme.
#
#  Build:  pnpm profile:gif    (or:  vhs assets/whoami.tape)
#  Output: assets/whoami.gif
#  Edit bio in: assets/whoami
# ─────────────────────────────────────────────────────────────

Output assets/whoami.gif

Set Shell zsh
Set FontFamily "GeistMono Nerd Font"
Set FontSize 22
Set Width 1280
Set Height 285
Set TypingSpeed 65ms
Set Padding 32
Set WindowBar Colorful
Set WindowBarSize 36
Set BorderRadius 12

# Vercel-y near-black with off-white text. Subtle accents only.
Set Theme '{"name":"GeistDark","background":"#0a0a0a","foreground":"#fafafa","cursor":"#fafafa","selection":"#27272a","black":"#18181b","red":"#f43f5e","green":"#22c55e","yellow":"#eab308","blue":"#3b82f6","magenta":"#a855f7","cyan":"#06b6d4","white":"#fafafa","brightBlack":"#52525b","brightRed":"#fb7185","brightGreen":"#4ade80","brightYellow":"#facc15","brightBlue":"#60a5fa","brightMagenta":"#c084fc","brightCyan":"#22d3ee","brightWhite":"#ffffff"}'

# Subsequent loops jump 10% in (just past the typing) — typing happens
# ONCE on first play, then the long cursor-blink section loops forever.
Set LoopOffset 10%

# Hidden setup — clean prompt, alias whoami, clear screen.
Hide
Type "PROMPT='%F{244}❯%f ' RPROMPT=''"
Enter
Type "alias whoami='./assets/whoami' && clear"
Enter
Show

# Visible — types `whoami`, prints YAML output, then a long blink hold.
Sleep 700ms
Type "whoami"
Sleep 500ms
Enter
Sleep 30s
