# Generate Chrome Web Store images at exact required dimensions.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $Root 'store-assets\screenshots'

function Save-Png($bitmap, $path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function New-GradientBitmap($width, $height) {
  $bmp = New-Object System.Drawing.Bitmap $width, $height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
    (New-Object System.Drawing.Rectangle 0, 0, $width, $height),
    [System.Drawing.Color]::FromArgb(255, 30, 41, 59),
    [System.Drawing.Color]::FromArgb(255, 11, 15, 25),
    45
  )
  $g.FillRectangle($brush, 0, 0, $width, $height)
  $brush.Dispose()
  $g.Dispose()
  return $bmp
}

function Resize-Image($sourcePath, $width, $height, $destPath) {
  $src = [System.Drawing.Image]::FromFile($sourcePath)
  $bmp = New-Object System.Drawing.Bitmap $width, $height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::FromArgb(255, 11, 15, 25))
  $g.DrawImage($src, 0, 0, $width, $height)
  $g.Dispose()
  $src.Dispose()
  Save-Png $bmp $destPath
  $bmp.Dispose()
}

function New-PromoTile($iconPath, $destPath) {
  $w = 440
  $h = 280
  $bmp = New-GradientBitmap $w $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $icon = [System.Drawing.Image]::FromFile($iconPath)
  $iconSize = 96
  $iconX = 32
  $iconY = [int](($h - $iconSize) / 2)
  $g.DrawImage($icon, $iconX, $iconY, $iconSize, $iconSize)
  $icon.Dispose()

  $titleFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font("Segoe UI", 11, [System.Drawing.FontStyle]::Regular)
  $titleBrush = [System.Drawing.Brushes]::White
  $subBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))

  $title = 'AuraAudio EQ & Dynamics'
  $subtitle = '4-Band EQ · Compressor · Limiter'
  $textX = 148
  $titleY = 98
  $subY = 138

  $g.DrawString($title, $titleFont, $titleBrush, $textX, $titleY)
  $g.DrawString($subtitle, $subFont, $subBrush, $textX, $subY)

  $titleFont.Dispose()
  $subFont.Dispose()
  $subBrush.Dispose()
  $g.Dispose()
  Save-Png $bmp $destPath
  $bmp.Dispose()
}

New-Item -ItemType Directory -Path $Out -Force | Out-Null

$iconSrc = Join-Path $Root 'icon.png'
$shotSrc = Join-Path $Out 'screenshot-1280x800.png'
if (-not (Test-Path $shotSrc)) {
  throw "Source screenshot not found: $shotSrc"
}

$iconDest = Join-Path $Out 'store-icon-128x128.png'
$shotDest = Join-Path $Out 'screenshot-1280x800.png'
$promoDest = Join-Path $Out 'promo-small-440x280.png'
$shotBackup = Join-Path $Out 'screenshot-source-large.png'

# Keep oversized capture as backup, then overwrite with exact size
Copy-Item $shotSrc $shotBackup -Force
Resize-Image $shotBackup 1280 800 $shotDest
Copy-Item $iconSrc $iconDest -Force
New-PromoTile $iconSrc $promoDest

function Show-Size($path) {
  $img = [System.Drawing.Image]::FromFile($path)
  Write-Host ("{0}: {1}x{2}" -f (Split-Path $path -Leaf), $img.Width, $img.Height)
  $img.Dispose()
}

Write-Host 'Generated store images:'
Show-Size $iconDest
Show-Size $shotDest
Show-Size $promoDest
