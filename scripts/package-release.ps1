$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$ReleaseDir = Join-Path $ProjectRoot "release"
$PackagePath = Join-Path $ReleaseDir "fitness-guide-vps.zip"
$StageDir = Join-Path $ReleaseDir "fitness-guide"

if (Test-Path $StageDir) {
  Remove-Item -LiteralPath $StageDir -Recurse -Force
}

New-Item -ItemType Directory -Path $StageDir -Force | Out-Null

$excludeDirs = @("node_modules", "release", "dist")
$removeAfterCopy = @(
  "node_modules",
  "client/node_modules",
  "client/dist",
  "release",
  "server/data/fitness.db",
  "server/data/fitness.db-shm",
  "server/data/fitness.db-wal"
)

Get-ChildItem -Path $ProjectRoot -Force | ForEach-Object {
  if ($excludeDirs -contains $_.Name) {
    return
  }

  $target = Join-Path $StageDir $_.Name
  if ($_.PSIsContainer) {
    Copy-Item -LiteralPath $_.FullName -Destination $target -Recurse -Force
  } else {
    Copy-Item -LiteralPath $_.FullName -Destination $target -Force
  }
}

foreach ($relative in $removeAfterCopy) {
  $path = Join-Path $StageDir $relative
  if (Test-Path $path) {
    Remove-Item -LiteralPath $path -Recurse -Force
  }
}

if (Test-Path $PackagePath) {
  Remove-Item -LiteralPath $PackagePath -Force
}

Compress-Archive -Path (Join-Path $StageDir "*") -DestinationPath $PackagePath -Force

Write-Host "Created $PackagePath"
