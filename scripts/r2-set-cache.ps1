<#
  Sets a long browser cache lifetime (Cache-Control: public, max-age=31536000, immutable) on every
  Cloudflare R2 file the website uses, and uploads new files (e.g. the *-288.webp image variants).
  Fixes Lighthouse "Use efficient cache lifetimes" for the r2.dev images and videos.

  R2 sends a Cache-Control header only if one is stored on the object, so each file is uploaded again
  from your local copy with that header. To make sure nothing on R2 is replaced by a different version,
  a file is only re-uploaded when your local copy has exactly the same size as the one on R2.

  One-time setup:   npx wrangler@4 login          (opens the browser to sign in to Cloudflare)
  Preview only:     .\scripts\r2-set-cache.ps1 -Bucket <your-bucket-name> -DryRun
  Run it:           .\scripts\r2-set-cache.ps1 -Bucket <your-bucket-name>

  Important: with "immutable", browsers keep a file for up to a year. When you change an image or
  video later, upload it under a NEW file name (for example hero-v2.webp) and update the page.
#>
param(
  [Parameter(Mandatory = $true)][string]$Bucket,
  [switch]$DryRun
)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$r2 = 'https://pub-29fbff6525d84c4e95d4f3f6b0461ca5.r2.dev/'
$cache = 'public, max-age=31536000, immutable'
$types = @{ '.webp' = 'image/webp'; '.webm' = 'video/webm'; '.mp4' = 'video/mp4'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'; '.vtt' = 'text/vtt' }

function Get-R2Size([string]$key) {
  $url = $r2 + ((($key -split '/') | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/')
  try { return [int64](Invoke-WebRequest $url -UseBasicParsing -Method Head -TimeoutSec 30).Headers['Content-Length'] } catch { return -1 }
}
function Get-R2Cache([string]$key) {
  $url = $r2 + ((($key -split '/') | ForEach-Object { [uri]::EscapeDataString($_) }) -join '/')
  try { return (Invoke-WebRequest $url -UseBasicParsing -Method Head -TimeoutSec 30).Headers['Cache-Control'] } catch { return $null }
}

# 1. Every R2 file referenced by the site's pages, scripts and styles
$keys = New-Object System.Collections.Generic.HashSet[string]
Get-ChildItem $root -Recurse -Include *.html, *.js, *.css -File |
  Where-Object { $_.FullName -notmatch '\\node_modules\\|\\scripts\\' } |
  ForEach-Object {
    foreach ($m in [regex]::Matches([IO.File]::ReadAllText($_.FullName), 'https://pub-29fbff6525d84c4e95d4f3f6b0461ca5\.r2\.dev/([^"''\s)>,]+)')) {
      $k = [uri]::UnescapeDataString($m.Groups[1].Value)
      if ($types.ContainsKey([IO.Path]::GetExtension($k).ToLower())) { [void]$keys.Add($k) }
    }
  }

# 2. Upload each one (with the cache header) when it is safe to do so
$done = 0; $skipped = @()
foreach ($key in ($keys | Sort-Object)) {
  $local = $null
  foreach ($c in "assets\images\$key", "assets\$key") { $p = Join-Path $root ($c -replace '/', '\'); if (Test-Path $p) { $local = $p; break } }
  if (-not $local) { $skipped += "$key  (no local copy found)"; continue }
  $r2Size = Get-R2Size $key
  $localSize = (Get-Item $local).Length
  if ($r2Size -ge 0 -and $r2Size -ne $localSize) { $skipped += "$key  (local copy differs from R2: $localSize vs $r2Size bytes)"; continue }
  $type = $types[[IO.Path]::GetExtension($key).ToLower()]
  $what = if ($r2Size -lt 0) { 'upload new file' } else { 'add cache header' }
  if ($DryRun) { Write-Host ("[dry run] {0,-16} {1}" -f $what, $key); $done++; continue }
  Write-Host ("{0,-16} {1}" -f $what, $key)
  npx --yes wrangler@4 r2 object put "$Bucket/$key" --file "$local" --content-type $type --cache-control $cache --remote
  if ($LASTEXITCODE -ne 0) { throw "wrangler failed for $key" }
  $done++
}

Write-Host ""
Write-Host "$done file(s) $(if ($DryRun) { 'would be' } else { 'were' }) processed."
if ($skipped.Count) { Write-Host "Skipped (left unchanged on R2):"; $skipped | ForEach-Object { Write-Host "  $_" } }

# 3. Check the result
if (-not $DryRun) {
  $missing = @($keys | Where-Object { -not (Get-R2Cache $_) })
  if ($missing.Count) { Write-Host "Still without a Cache-Control header:"; $missing | ForEach-Object { Write-Host "  $_" } }
  else { Write-Host "All $($keys.Count) R2 files now send: Cache-Control: $cache" }
}
