# Re-applying after a Vivaldi update

Vivaldi updates install a new version folder with a fresh `window.html`, so the mod disappears.

1. Close Vivaldi completely.
2. Run: `powershell -ExecutionPolicy Bypass -File .\apply-pinned-mod.ps1`
3. Start Vivaldi.

The script always targets the newest version folder, so it is safe to run as often as you like.
