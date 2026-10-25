**Title:** [Mod] Edge-style fixed pinned tabs for the vertical tab bar (pinned stacks as drop-downs, inline stacks)

Hi all — I wanted Edge-style pinned tabs in Vivaldi's vertical tab bar, so I built a mod:

_⚠️ Heads-up: this mod was written with the help of an AI assistant. I reviewed and tested it myself, but it comes with no warranty, so use it at your own risk._

- Pinned tabs **and pinned stacks** become a fixed, non-scrolling grid of favicon tiles at the top; regular tabs scroll underneath.
- Click a pinned stack tile to drop down a list of its tabs (auto-collapses when you go to another tab, `+` adds a tab to the stack).
- Regular stacks expand **inline** instead of in the two-level second column.
- No close X on stacks, subtle `+` on expanded stacks, and the scrollbar starts below the pinned area.
- Follows your theme colors (dark mode works).

Tested on **Vivaldi 8.2.4133.94 / Windows**. Install is a small PowerShell script that patches `window.html` (backup + `-Uninstall` included). Like all `window.html` mods, re-run it after Vivaldi updates.

**Download / code:** https://github.com/DragonGitz/vivaldi-pinned-tabs

Screenshots:
1. Pinned grid — `1-pinned-grid.png`
2. Pinned stack drop-down — `2-pinned-stack-dropdown.png`
3. Unpinned stack inline — `3-unpinned-stack-inline.png`
4. `+` buttons close-up — `4-stack-plus-buttons.png`

Feedback and bug reports welcome!
