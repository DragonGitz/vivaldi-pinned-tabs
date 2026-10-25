# Vivaldi Pinned Tabs (Edge-style) mod

An unofficial UI mod that gives Vivaldi's **vertical tab bar** an Edge-style fixed pinned area.

## Features
- **Fixed pinned grid** — pinned tabs and pinned stacks become small favicon tiles at the top of the tab bar. Regular tabs scroll underneath; the grid never scrolls. Uses your theme colors (works in dark mode).
- **Pinned stack drop-down** — click a pinned stack tile (it shows a count badge) to open a panel under the grid listing its tabs as full rows. It collapses when you activate a tab outside the stack, click the tile again, click the chevron, or press Esc. The `+` in the panel header opens a new tab in that stack.
- **Inline unpinned stacks** — regular stacks expand inline under their own row instead of in Vivaldi's two-level second column (which is hidden).
- **Cleaner stacks** — no close X on stack rows (close via right-click); an expanded stack shows a subtle native-style `+` in its title row.
- **Scrollbar** — the tab-bar scrollbar track starts below the pinned area.
- Middle-click a tile/row to close that tab (configurable).

## Screenshots
| File | Shows |
|---|---|
| `screenshots/1-pinned-grid.png` | Collapsed: six pinned tabs plus three named pinned stacks (Work, Media, Tools, with count badges) as a fixed tile grid above the scrolling tab list, which has a collapsed unpinned stack (Reading). |
| `screenshots/2-pinned-stack-dropdown.png` | How a pinned stack opens: click its tile (Work) and its tabs drop down as a lighter, full-name list under the grid, with the stack name, `+` and collapse buttons in its header and a 1px separator above the regular tabs. |
| `screenshots/3-unpinned-stack-inline.png` | An unpinned stack (Reading) expanded inline under its own row (no second column), with the `+` on its title row. |
| `screenshots/4-stack-plus-buttons.png` | Close-up of the sidebar with both open: the Work pinned-stack drop-down (top) and the expanded Reading stack row with its `+` (bottom). |

All screenshots use local sample pages. Unnamed stacks show the title of their first or active tab.

## Install (Windows)
1. Download/unzip this folder (keep `pinned.js` and `apply-pinned-mod.ps1` together).
2. Close Vivaldi.
3. In the folder, run:
   ```
   powershell -ExecutionPolicy Bypass -File .\apply-pinned-mod.ps1
   ```
4. Start Vivaldi.

The script finds Vivaldi automatically (per-user install in `%LOCALAPPDATA%\Vivaldi\Application`, otherwise `Program Files`), patches the newest version folder, backs up `window.html` to `window.html.bak` once, and is safe to run repeatedly.

- **Per-user install** (the default Vivaldi installer): no admin needed.
- **System-wide install** (`Program Files`): run PowerShell **as administrator**; the script tells you if this is needed.
- **Standalone/other path:** add `-VivaldiDir "D:\Vivaldi\Application"`.
- `-AllVersions` patches every version folder present.

**Manual install:** copy `pinned.js` into `<Vivaldi>\Application\<version>\resources\vivaldi\` and add `<script src="pinned.js"></script>` just before `</body>` in `window.html` in that folder.

### After Vivaldi updates
Updates replace the version folder and remove the mod. Re-run the script — see `REAPPLY-AFTER-UPDATE.md`.

## Uninstall
```
powershell -ExecutionPolicy Bypass -File .\apply-pinned-mod.ps1 -Uninstall
```
This removes the mod from every Vivaldi version folder. Then restart Vivaldi. (Or restore `window.html.bak` and delete `pinned.js`.)

## Configuration
Edit the `CONFIG` block at the top of `pinned.js`, then re-run the installer:

| Option | Default | Meaning |
|---|---|---|
| `TILE` | `34` | Tile size in px |
| `ICON` | `16` | Favicon size in px |
| `GAP` | `4` | Gap between tiles in px |
| `DROP_FRACTION` | `0.45` | Max drop-down height as a fraction of the tab bar |
| `SHOW_UNPINNED_STACKS` | `false` | `true` also puts regular stacks in the grid |
| `MIDDLE_CLICK_CLOSES` | `true` | Middle-click closes a tab |

## Compatibility
- Tested on **Vivaldi 8.2.4133.94, Windows**. The script also loaded in Vivaldi 8.2 on Linux during testing; macOS is untested.
- Vertical (left/right) tab bars only. Horizontal tab bars are untouched.
- Works with Workspaces.

## Known limitations
- **It patches Vivaldi's `window.html`.** That is unsupported by Vivaldi and may break with any update if their internal markup changes.
- **Vivaldi updates overwrite the patch** — re-run the installer after each update.
- **Stack data is not exposed to extensions.** The mod reads Vivaldi's internal tab data (`vivExtData`) from the UI, which can change without notice.
- No drag-and-drop reordering of pinned tiles or dragging tabs into/out of the grid. Unpin/re-pin to rearrange.
- The pinned grid is capped in height; very large pin sets will wrap.

## Disclaimer
This is an unofficial community mod, not affiliated with or endorsed by Vivaldi Technologies. Use at your own risk; keep the `window.html.bak` backup.

## License
MIT — see `LICENSE`.
