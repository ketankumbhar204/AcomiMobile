# Manual Windows folder rename helper for Amico final layout.
# CLOSE Cursor/IDEs and stop terminals using these folders before running.
$ErrorActionPreference = "Stop"
$pairs = @(
  @{ From = "K:\ResidineWeb"; To = "K:\AmicoWeb" },
  @{ From = "K:\Residine"; To = "K:\Amico" },
  @{ From = "K:\Projects\Residine\Backend\residine-backend"; To = "K:\Projects\Residine\Backend\amico-backend" },
  @{ From = "K:\Projects\Residine"; To = "K:\Projects\Amico" }
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
Write-Host "Done. Re-open workspace from K:\Amico (and K:\AmicoWeb)."
