# Generate Chrome Web Store images at exact required dimensions.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $Root 'store-assets\screenshots'

function Save-Png($bitmap, $path) {
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Save-Png24($bitmap, $path) {
  $clone = New-Object System.Drawing.Bitmap $bitmap.Width, $bitmap.Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($clone)
  $g.Clear([System.Drawing.Color]::FromArgb(255, 11, 15, 25))
  $g.DrawImage($bitmap, 0, 0, $bitmap.Width, $bitmap.Height)
  $g.Dispose()
  $clone.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $clone.Dispose()
}

function Save-Jpeg($bitmap, $path, [int]$quality = 92) {
  $clone = New-Object System.Drawing.Bitmap $bitmap.Width, $bitmap.Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($clone)
  $g.Clear([System.Drawing.Color]::FromArgb(255, 11, 15, 25))
  $g.DrawImage($bitmap, 0, 0, $bitmap.Width, $bitmap.Height)
  $g.Dispose()

  $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
  $clone.Save($path, $encoder, $params)
  $params.Dispose()
  $clone.Dispose()
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

function Draw-WaveAccent($g, $x, $y, $width, $height) {
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 56, 189, 248)), 3
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $points = New-Object System.Drawing.PointF[] 120
  for ($i = 0; $i -lt 120; $i++) {
    $t = $i / 119.0
    $px = $x + ($width * $t)
    $py = $y + ($height * 0.5) +
      [Math]::Sin($t * [Math]::PI * 6.0) * ($height * 0.18) +
      [Math]::Sin($t * [Math]::PI * 13.0 + 0.6) * ($height * 0.08)
    $points[$i] = New-Object System.Drawing.PointF($px, [single]$py)
  }
  $g.DrawCurve($pen, $points, 0.35)
  $pen.Dispose()
}

function New-MarqueePromoTile($iconPath, $screenshotPath, $destPngPath, $destJpegPath) {
  $w = 1400
  $h = 560
  $bmp = New-GradientBitmap $w $h
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $glow = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 30, 64, 120))
  $g.FillEllipse($glow, 860, -40, 420, 420)
  $glow.Dispose()

  $icon = [System.Drawing.Image]::FromFile($iconPath)
  $g.DrawImage($icon, 88, 196, 168, 168)
  $icon.Dispose()

  $titleFont = New-Object System.Drawing.Font("Segoe UI", 46, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font("Segoe UI", 22, [System.Drawing.FontStyle]::Regular)
  $featFont = New-Object System.Drawing.Font("Segoe UI", 18, [System.Drawing.FontStyle]::Regular)
  $titleBrush = [System.Drawing.Brushes]::White
  $subBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 186, 230, 253))
  $featBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))

  $g.DrawString('AuraAudio EQ & Dynamics', $titleFont, $titleBrush, 300, 150)
  $g.DrawString('Studio-style EQ, Compressor & Limiter for Web Audio', $subFont, $subBrush, 302, 228)

  $features = @(
    '4-Band Parametric EQ with live curve visualizer',
    'Compressor and Limiter with preset slots'
  )
  $featY = 300
  foreach ($line in $features) {
    $g.DrawString([char]0x2022 + ' ' + $line, $featFont, $featBrush, 308, $featY)
    $featY += 34
  }

  Draw-WaveAccent $g 300 390 360 48

  if (Test-Path $screenshotPath) {
    $shot = [System.Drawing.Image]::FromFile($screenshotPath)
    $frameX = 760
    $frameY = 72
    $frameW = 580
    $frameH = 416
    $framePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 71, 85, 105)), 2
    $g.DrawRectangle($framePen, $frameX, $frameY, $frameW, $frameH)
    $framePen.Dispose()

    $innerPad = 8
    $g.DrawImage($shot, $frameX + $innerPad, $frameY + $innerPad, $frameW - ($innerPad * 2), $frameH - ($innerPad * 2))
    $shot.Dispose()
  }

  $titleFont.Dispose()
  $subFont.Dispose()
  $featFont.Dispose()
  $subBrush.Dispose()
  $featBrush.Dispose()
  $g.Dispose()

  Save-Png24 $bmp $destPngPath
  Save-Jpeg $bmp $destJpegPath 92
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
$marqueePngDest = Join-Path $Out 'promo-marquee-1400x560.png'
$marqueeJpegDest = Join-Path $Out 'promo-marquee-1400x560.jpg'
$shotBackup = Join-Path $Out 'screenshot-source-large.png'

# Keep oversized capture as backup, then overwrite with exact size
Copy-Item $shotSrc $shotBackup -Force
Resize-Image $shotBackup 1280 800 $shotDest
Copy-Item $iconSrc $iconDest -Force
New-PromoTile $iconSrc $promoDest
New-MarqueePromoTile $iconSrc $shotDest $marqueePngDest $marqueeJpegDest

function Show-Size($path) {
  $img = [System.Drawing.Image]::FromFile($path)
  Write-Host ("{0}: {1}x{2}" -f (Split-Path $path -Leaf), $img.Width, $img.Height)
  $img.Dispose()
}

Write-Host 'Generated store images:'
Show-Size $iconDest
Show-Size $shotDest
Show-Size $promoDest
Show-Size $marqueePngDest
Show-Size $marqueeJpegDest
