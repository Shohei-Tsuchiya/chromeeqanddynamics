$ErrorActionPreference = 'Stop'

$Root = Split-Path -Parent $PSScriptRoot
$Dist = Join-Path $Root 'dist'
$Version = (Get-Content (Join-Path $Root 'manifest.json') -Raw | ConvertFrom-Json).version
$ZipName = "aura-audio-eq-dynamics-v$Version.zip"
$ZipPath = Join-Path $Dist $ZipName
$Stage = Join-Path $Dist 'stage'

$include = @(
  'manifest.json',
  'background.js',
  'content.js',
  'settings.js',
  'popup.html',
  'popup.css',
  'popup.js',
  'icon.png',
  'icon-16.png',
  'icon-32.png',
  'icon-48.png',
  'icon_disabled.png',
  'icon_disabled-16.png',
  'icon_disabled-32.png',
  'icon_disabled-48.png'
)

if (Test-Path $Stage) { Remove-Item $Stage -Recurse -Force }
New-Item -ItemType Directory -Path $Stage -Force | Out-Null

foreach ($file in $include) {
  $src = Join-Path $Root $file
  if (-not (Test-Path $src)) {
    throw "Missing required file: $file"
  }
  Copy-Item $src (Join-Path $Stage $file)
}

if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
New-Item -ItemType Directory -Path $Dist -Force | Out-Null
Compress-Archive -Path (Join-Path $Stage '*') -DestinationPath $ZipPath -Force
Remove-Item $Stage -Recurse -Force

Write-Host "Created: $ZipPath"
Get-Item $ZipPath | Select-Object FullName, Length, LastWriteTime
