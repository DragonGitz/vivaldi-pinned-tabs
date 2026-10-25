# Changelog

## v1.0.1 — 2026-10-25
Fixes from the pre-release audit.
- Fixed a render loop while an unpinned stack was expanded (the inline `+` was rebuilt every frame).
- The tab bar observer now ignores the mod's own DOM, class and style writes, so the mod stays idle when nothing changes.
- Favicons are copied with `cloneNode` instead of re-parsing HTML.
- Adding a tab to a stack no longer throws if the tab closes mid-way.
- Removed dead code.
- Installer: `-Uninstall` cleans every version folder, prints which install it uses, checks `</body>` before copying anything, patches only the last `</body>`, and recommends closing Vivaldi first.
- Added `.gitattributes`.

## v1.0.0 — 2026-10-25
First public release. Tested on Vivaldi 8.2.4133.94 (Windows).
- Fixed, non-scrolling grid of favicon tiles for pinned tabs and pinned stacks (theme colors, dark mode).
- Pinned stacks open a drop-down list under the grid; auto-collapses when a tab outside the stack is activated; `+` in the header adds a tab.
- Unpinned stacks expand inline under their row; Vivaldi's two-level second column is hidden.
- No close X on stacks (use right-click); subtle native-style `+` on expanded stack rows.
- Tab-bar scrollbar starts below the pinned area.
- PowerShell installer with auto-detection, backup, idempotent patching and `-Uninstall`.
