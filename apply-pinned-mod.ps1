<#
.SYNOPSIS
  Installs (or removes) the Vivaldi Pinned Tabs mod by patching window.html.
.DESCRIPTION
  Copies pinned.js into every Vivaldi version folder found and adds a single
  <script src="pinned.js"></script> line to window.html (idempotent).
  A backup (window.html.bak) is made before the first patch.
  Vivaldi updates create a new version folder, so re-run this after each update.
.PARAMETER VivaldiDir
  Path to Vivaldi's "Application" folder. Auto-detected if omitted
  (per-user: %LOCALAPPDATA%\Vivaldi\Application, system: %ProgramFiles%\Vivaldi\Application).
.PARAMETER AllVersions
  Patch every version folder instead of only the newest.
.PARAMETER Uninstall
  Remove the script line and pinned.js from every version folder (window.html.bak is kept).
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\apply-pinned-mod.ps1
.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\apply-pinned-mod.ps1 -Uninstall
#>
[CmdletBinding()]
param(
  [string]$VivaldiDir,
  [switch]$AllVersions,
  [switch]$Uninstall
)
$ErrorActionPreference = 'Stop'
$Tag = '<script src="pinned.js"></script>'
$Src = Join-Path $PSScriptRoot 'pinned.js'

function Test-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  (New-Object Security.Principal.WindowsPrincipal $id).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not $VivaldiDir) {
  $candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Vivaldi\Application'),
    (Join-Path $env:ProgramFiles 'Vivaldi\Application'),
    (Join-Path ${env:ProgramFiles(x86)} 'Vivaldi\Application')
  ) | Where-Object { $_ -and (Test-Path $_) }
  if (-not $candidates) { throw 'Vivaldi not found. Pass -VivaldiDir "<path to Vivaldi\Application>".' }
  $VivaldiDir = $candidates[0]
}
if (-not (Test-Path $VivaldiDir)) { throw "Folder not found: $VivaldiDir" }
Write-Host "Using Vivaldi install: $VivaldiDir"
Write-Host '(Use -VivaldiDir to pick a different install.)'

$systemInstall = $env:ProgramFiles -and $VivaldiDir.StartsWith($env:ProgramFiles, [StringComparison]::OrdinalIgnoreCase) -or
                 (${env:ProgramFiles(x86)} -and $VivaldiDir.StartsWith(${env:ProgramFiles(x86)}, [StringComparison]::OrdinalIgnoreCase))
if ($systemInstall -and -not (Test-Admin)) {
  Write-Warning "Vivaldi is installed system-wide in $VivaldiDir."
  Write-Warning 'Writing there needs administrator rights. Re-run this script from an elevated PowerShell (Run as administrator).'
  exit 1
}

if (Get-Process -Name vivaldi -ErrorAction SilentlyContinue) {
  Write-Warning 'Vivaldi is running. It is best to close it before running this script; changes only take effect after a full restart.'
}

$versions = Get-ChildItem $VivaldiDir -Directory | Where-Object { $_.Name -match '^\d+(\.\d+)+$' } |
            Sort-Object { [version]$_.Name } -Descending
if (-not $versions) { throw "No Vivaldi version folder found in $VivaldiDir" }
if (-not $AllVersions -and -not $Uninstall) { $versions = $versions | Select-Object -First 1 }

foreach ($v in $versions) {
  $res  = Join-Path $v.FullName 'resources\vivaldi'
  $html = Join-Path $res 'window.html'
  $js   = Join-Path $res 'pinned.js'
  if (-not (Test-Path $html)) { Write-Warning "Skipping $($v.Name): window.html not found"; continue }
  $content = [IO.File]::ReadAllText($html)

  if ($Uninstall) {
    $new = [regex]::Replace($content, '[ \t]*<script src="pinned\.js"></script>\r?\n?', '')
    if ($new -ne $content) { [IO.File]::WriteAllText($html, $new); Write-Host "Removed script tag from $html" }
    else { Write-Host "No script tag in $($v.Name)" }
    if (Test-Path $js) { Remove-Item $js -Force; Write-Host "Deleted $js" }
    continue
  }

  if (-not (Test-Path $Src)) { throw "pinned.js not found next to this script ($Src)" }
  if ($content -match 'pinned\.js') {
    Copy-Item $Src $js -Force
    Write-Host "Vivaldi $($v.Name): already patched, updated pinned.js"
  } else {
    $at = $content.LastIndexOf('</body>')
    if ($at -lt 0) { Write-Warning "Skipping $($v.Name): unexpected window.html format (no </body>)"; continue }
    Copy-Item $Src $js -Force
    if (-not (Test-Path "$html.bak")) { Copy-Item $html "$html.bak" }
    $new = $content.Substring(0, $at) + "  $Tag`r`n" + $content.Substring($at)
    [IO.File]::WriteAllText($html, $new)
    Write-Host "Vivaldi $($v.Name): patched window.html (backup: window.html.bak)"
  }
}
Write-Host ''
Write-Host 'Done. Fully close and restart Vivaldi to apply.'
Write-Host 'Note: Vivaldi updates replace these files. Re-run this script after every update.'
