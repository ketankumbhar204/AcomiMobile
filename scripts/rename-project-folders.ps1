# Optional Windows folder rename helper for Acomi final disk layout.
# CLOSE Cursor/IDEs and stop terminals using these folders before running.
# Do NOT run unless explicitly approved — workspace folders intentionally remain Amico* until then.
$ErrorActionPreference = "Stop"
$pairs = @(
  @{ From = "K:\AmicoWeb"; To = "K:\AcomiWeb" },
  @{ From = "K:\AmicoMobile"; To = "K:\AcomiMobile" },
  @{ From = "K:\Projects\Amico\Backend\amico-backend"; To = "K:\Projects\Amico\Backend\acomi-backend" },
  @{ From = "K:\Projects\Amico"; To = "K:\Projects\Acomi" }
)
foreach ($p in $pairs) {
  if (-not (Test-Path -LiteralPath $p.From)) { Write-Host "SKIP missing: $($p.From)"; continue }
  $parent = Split-Path -Parent $p.To
  $leaf = Split-Path -Leaf $p.To
  if (-not (Test-Path -LiteralPath $parent)) { throw "Parent missing: $parent" }
  if (Test-Path -LiteralPath $p.To) { Write-Host "SKIP exists: $($p.To)"; continue }
  Write-Host "Rename: $($p.From) -> $($p.To)"
  Rename-Item -LiteralPath $p.From -NewName $leaf
}
Write-Host "Done. Re-open workspace from the new Acomi paths."
