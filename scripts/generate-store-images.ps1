# Generate Chrome Web Store marketing images (exact sizes, 24-bit PNG / JPEG).
# Save this file as UTF-8.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $Root 'store-assets\screenshots'
New-Item -ItemType Directory -Path $Out -Force | Out-Null

function Save-Png24([System.Drawing.Bitmap]$bitmap, [string]$path) {
  $clone = New-Object System.Drawing.Bitmap $bitmap.Width, $bitmap.Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($clone)
  $g.Clear([System.Drawing.Color]::FromArgb(255, 8, 12, 24))
  $g.DrawImage($bitmap, 0, 0, $bitmap.Width, $bitmap.Height)
  $g.Dispose()
  $clone.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $clone.Dispose()
}

function Save-Jpeg([System.Drawing.Bitmap]$bitmap, [string]$path, [int]$quality = 93) {
  $clone = New-Object System.Drawing.Bitmap $bitmap.Width, $bitmap.Height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($clone)
  $g.Clear([System.Drawing.Color]::FromArgb(255, 8, 12, 24))
  $g.DrawImage($bitmap, 0, 0, $bitmap.Width, $bitmap.Height)
  $g.Dispose()

  $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' } | Select-Object -First 1
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter (
    [System.Drawing.Imaging.Encoder]::Quality, [long]$quality)
  $clone.Save($path, $encoder, $params)
  $params.Dispose()
  $clone.Dispose()
}

function New-Canvas([int]$width, [int]$height) {
  $bmp = New-Object System.Drawing.Bitmap $width, $height, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
    (New-Object System.Drawing.Rectangle 0, 0, $width, $height),
    [System.Drawing.Color]::FromArgb(255, 14, 22, 48),
    [System.Drawing.Color]::FromArgb(255, 6, 10, 22),
    55.0
  )
  $g.FillRectangle($bg, 0, 0, $width, $height)
  $bg.Dispose()

  $glowCyan = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(55, 34, 211, 238))
  $g.FillEllipse($glowCyan, [int]($width * 0.55), -80, [int]($width * 0.55), [int]($height * 0.7))
  $glowCyan.Dispose()

  $glowIndigo = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(45, 99, 102, 241))
  $g.FillEllipse($glowIndigo, -140, [int]($height * 0.4), [int]($width * 0.5), [int]($height * 0.75))
  $glowIndigo.Dispose()

  return @{ Bmp = $bmp; G = $g }
}

function Draw-RoundedRect(
  [System.Drawing.Graphics]$g,
  [int]$x, [int]$y, [int]$w, [int]$h, [int]$radius,
  [System.Drawing.Brush]$fill,
  [System.Drawing.Color]$border,
  [float]$borderWidth = 1.5
) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $radius * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $g.FillPath($fill, $path)
  $pen = New-Object System.Drawing.Pen $border, $borderWidth
  $g.DrawPath($pen, $path)
  $pen.Dispose()
  $path.Dispose()
}

function Draw-Wave(
  [System.Drawing.Graphics]$g,
  [float]$x, [float]$y, [float]$width, [float]$height,
  [System.Drawing.Color]$color,
  [float]$penWidth = 3
) {
  $pen = New-Object System.Drawing.Pen $color, $penWidth
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $points = New-Object System.Drawing.PointF[] 160
  for ($i = 0; $i -lt 160; $i++) {
    $t = $i / 159.0
    $px = $x + ($width * $t)
    $py = $y + ($height * 0.52) +
      [Math]::Sin($t * [Math]::PI * 5.2) * ($height * 0.22) +
      [Math]::Sin($t * [Math]::PI * 11.0 + 0.8) * ($height * 0.10)
    $points[$i] = New-Object System.Drawing.PointF($px, [single]$py)
  }
  $g.DrawCurve($pen, $points, 0.4)
  $pen.Dispose()
}

function EqY([float]$t, [float]$zeroY, [float]$innerH) {
  $boost1 = [Math]::Exp(-([Math]::Pow(($t - 0.12) / 0.08, 2))) * ($innerH * 0.22)
  $dip = [Math]::Exp(-([Math]::Pow(($t - 0.38) / 0.07, 2))) * ($innerH * 0.12)
  $boost2 = [Math]::Exp(-([Math]::Pow(($t - 0.62) / 0.08, 2))) * ($innerH * 0.16)
  $boost3 = [Math]::Exp(-([Math]::Pow(($t - 0.86) / 0.07, 2))) * ($innerH * 0.10)
  return $zeroY - $boost1 + $dip - $boost2 - $boost3
}

function Draw-EqCurvePanel([System.Drawing.Graphics]$g, [int]$x, [int]$y, [int]$w, [int]$h) {
  $panelFill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 24, 48))
  $panelBorder = [System.Drawing.Color]::FromArgb(255, 55, 70, 110)
  Draw-RoundedRect $g $x $y $w $h 18 $panelFill $panelBorder 2
  $panelFill.Dispose()

  $innerX = $x + 18
  $innerY = $y + 18
  $innerW = $w - 36
  $innerH = $h - 50

  $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 35, 48, 78)), 1
  for ($i = 1; $i -le 4; $i++) {
    $gx = $innerX + ($innerW * $i / 5.0)
    $g.DrawLine($gridPen, $gx, $innerY, $gx, ($innerY + $innerH))
  }
  for ($i = 1; $i -le 3; $i++) {
    $gy = $innerY + ($innerH * $i / 4.0)
    $g.DrawLine($gridPen, $innerX, $gy, ($innerX + $innerW), $gy)
  }
  $gridPen.Dispose()

  $zeroY = $innerY + ($innerH * 0.5)
  $zeroPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 71, 85, 120)), 1
  $g.DrawLine($zeroPen, $innerX, $zeroY, ($innerX + $innerW), $zeroY)
  $zeroPen.Dispose()

  $curvePen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 99, 102, 241)), 3.5
  $curvePen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $n = 120
  $pts = New-Object System.Drawing.PointF[] $n
  for ($i = 0; $i -lt $n; $i++) {
    $t = $i / ($n - 1.0)
    $px = $innerX + $innerW * $t
    $py = EqY $t $zeroY $innerH
    $pts[$i] = New-Object System.Drawing.PointF($px, [single]$py)
  }
  $g.DrawCurve($curvePen, $pts, 0.35)
  $curvePen.Dispose()

  $bandColors = @(
    [System.Drawing.Color]::FromArgb(255, 0, 240, 255),
    [System.Drawing.Color]::FromArgb(255, 16, 185, 129),
    [System.Drawing.Color]::FromArgb(255, 245, 158, 11),
    [System.Drawing.Color]::FromArgb(255, 244, 63, 94)
  )
  $bandTs = @(0.12, 0.38, 0.62, 0.86)
  for ($b = 0; $b -lt 4; $b++) {
    $t = $bandTs[$b]
    $bx = $innerX + $innerW * $t
    $by = EqY $t $zeroY $innerH
    $dot = New-Object System.Drawing.SolidBrush $bandColors[$b]
    $g.FillEllipse($dot, ($bx - 7), ($by - 7), 14, 14)
    $dot.Dispose()
    $ring = New-Object System.Drawing.Pen ([System.Drawing.Color]::White), 2
    $g.DrawEllipse($ring, ($bx - 7), ($by - 7), 14, 14)
    $ring.Dispose()
  }

  $labelFont = New-Object System.Drawing.Font('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)
  $labelBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
  $g.DrawString('20Hz', $labelFont, $labelBrush, $innerX, ($innerY + $innerH + 6))
  $g.DrawString('1kHz', $labelFont, $labelBrush, ($innerX + $innerW / 2 - 18), ($innerY + $innerH + 6))
  $g.DrawString('20kHz', $labelFont, $labelBrush, ($innerX + $innerW - 48), ($innerY + $innerH + 6))
  $labelFont.Dispose()
  $labelBrush.Dispose()
}

function Draw-FeatureChip(
  [System.Drawing.Graphics]$g,
  [int]$x, [int]$y, [int]$w, [int]$h,
  [string]$text,
  [System.Drawing.Color]$accent
) {
  $fill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 18, 28, 52))
  Draw-RoundedRect $g $x $y $w $h 14 $fill $accent 2
  $fill.Dispose()

  $dot = New-Object System.Drawing.SolidBrush $accent
  $g.FillEllipse($dot, ($x + 14), ($y + ($h / 2) - 5), 10, 10)
  $dot.Dispose()

  $font = New-Object System.Drawing.Font('Segoe UI', 13, [System.Drawing.FontStyle]::Bold)
  $g.DrawString($text, $font, [System.Drawing.Brushes]::White, ($x + 32), ($y + ($h / 2) - 11))
  $font.Dispose()
}

function New-Screenshot1280 {
  $c = New-Canvas 1280 800
  $g = $c.G
  $bmp = $c.Bmp

  $titleFont = New-Object System.Drawing.Font('Segoe UI', 40, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Regular)
  $white = [System.Drawing.Brushes]::White
  $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 186, 230, 253))

  $g.DrawString('AuraAudio EQ & Dynamics', $titleFont, $white, 64, 42)
  $g.DrawString('Studio-quality EQ, Compressor & Limiter for any Chrome tab', $subFont, $muted, 68, 110)

  Draw-EqCurvePanel $g 64 170 760 430

  $cardTitles = @('4 Band EQ', 'Compressor', 'Limiter')
  $cardDescs = @(
    "Freq / Q / Gain`nPrecise +/-24 dB control",
    "Threshold / Ratio`nAttack & Release",
    "Peak protection`n3 preset slots"
  )
  $cardColors = @(
    [System.Drawing.Color]::FromArgb(255, 0, 240, 255),
    [System.Drawing.Color]::FromArgb(255, 16, 185, 129),
    [System.Drawing.Color]::FromArgb(255, 245, 158, 11)
  )

  $cardY = 170
  $cardFont = New-Object System.Drawing.Font('Segoe UI', 18, [System.Drawing.FontStyle]::Bold)
  $descFont = New-Object System.Drawing.Font('Segoe UI', 13, [System.Drawing.FontStyle]::Regular)
  $descBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 203, 213, 225))

  for ($i = 0; $i -lt 3; $i++) {
    $fill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 24, 48))
    Draw-RoundedRect $g 860 $cardY 356 120 16 $fill $cardColors[$i] 2
    $fill.Dispose()

    $accent = New-Object System.Drawing.SolidBrush $cardColors[$i]
    $g.FillEllipse($accent, 882, ($cardY + 28), 14, 14)
    $accent.Dispose()

    $g.DrawString($cardTitles[$i], $cardFont, $white, 910, ($cardY + 22))
    $g.DrawString($cardDescs[$i], $descFont, $descBrush, 882, ($cardY + 58))
    $cardY += 140
  }

  $footerFont = New-Object System.Drawing.Font('Segoe UI', 15, [System.Drawing.FontStyle]::Bold)
  $footerBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 125, 211, 252))
  $g.DrawString('Open icon  >  ENABLE  >  click the page to start processing', $footerFont, $footerBrush, 64, 640)
  $g.DrawString('Free on Chrome Web Store  |  Privacy-friendly (activeTab)', $footerFont, $muted, 64, 680)

  $titleFont.Dispose(); $subFont.Dispose(); $muted.Dispose()
  $cardFont.Dispose(); $descFont.Dispose(); $descBrush.Dispose()
  $footerFont.Dispose(); $footerBrush.Dispose()
  $g.Dispose()
  return $bmp
}

function New-PromoSmall440([string]$iconPath) {
  $c = New-Canvas 440 280
  $g = $c.G
  $bmp = $c.Bmp

  $icon = [System.Drawing.Image]::FromFile($iconPath)
  $g.DrawImage($icon, 28, 78, 110, 110)
  $icon.Dispose()

  Draw-Wave $g 28 200 120 36 ([System.Drawing.Color]::FromArgb(180, 56, 189, 248)) 2.5

  $titleFont = New-Object System.Drawing.Font('Segoe UI', 24, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font('Segoe UI', 13, [System.Drawing.FontStyle]::Regular)
  $chipFont = New-Object System.Drawing.Font('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)
  $white = [System.Drawing.Brushes]::White
  $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 186, 230, 253))

  $g.DrawString('AuraAudio', $titleFont, $white, 160, 68)
  $g.DrawString('EQ  Comp  Limiter', $subFont, $muted, 162, 112)
  $g.DrawString('Studio sound for Chrome', $subFont, $white, 162, 144)

  $chips = @('EQ', 'Comp', 'Limit')
  $chipColors = @(
    [System.Drawing.Color]::FromArgb(255, 0, 200, 220),
    [System.Drawing.Color]::FromArgb(255, 16, 185, 129),
    [System.Drawing.Color]::FromArgb(255, 245, 158, 11)
  )
  $cx = 162
  for ($i = 0; $i -lt 3; $i++) {
    $fill = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 18, 28, 52))
    Draw-RoundedRect $g $cx 188 72 28 10 $fill $chipColors[$i] 1.5
    $fill.Dispose()
    $g.DrawString($chips[$i], $chipFont, $white, ($cx + 12), 192)
    $cx += 80
  }

  $titleFont.Dispose(); $subFont.Dispose(); $chipFont.Dispose(); $muted.Dispose()
  $g.Dispose()
  return $bmp
}

function New-Marquee1400([string]$iconPath) {
  $c = New-Canvas 1400 560
  $g = $c.G
  $bmp = $c.Bmp

  $icon = [System.Drawing.Image]::FromFile($iconPath)
  $g.DrawImage($icon, 72, 170, 180, 180)
  $icon.Dispose()

  $titleFont = New-Object System.Drawing.Font('Segoe UI', 46, [System.Drawing.FontStyle]::Bold)
  $subFont = New-Object System.Drawing.Font('Segoe UI', 22, [System.Drawing.FontStyle]::Regular)
  $bodyFont = New-Object System.Drawing.Font('Segoe UI', 16, [System.Drawing.FontStyle]::Regular)
  $white = [System.Drawing.Brushes]::White
  $cyan = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 125, 211, 252))
  $muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 186, 198, 220))

  $g.DrawString('AuraAudio EQ & Dynamics', $titleFont, $white, 290, 118)
  $g.DrawString('Studio-quality processing for web audio', $subFont, $cyan, 294, 196)
  $g.DrawString('4-band EQ, compressor and limiter - apply in real time on YouTube and more.', $bodyFont, $muted, 294, 250)

  Draw-FeatureChip $g 294 320 170 48 '4 Band EQ' ([System.Drawing.Color]::FromArgb(255, 0, 240, 255))
  Draw-FeatureChip $g 482 320 180 48 'Compressor' ([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
  Draw-FeatureChip $g 680 320 150 48 'Limiter' ([System.Drawing.Color]::FromArgb(255, 245, 158, 11))

  Draw-Wave $g 294 400 420 56 ([System.Drawing.Color]::FromArgb(220, 56, 189, 248)) 3.5

  Draw-EqCurvePanel $g 900 90 440 380

  $ctaFont = New-Object System.Drawing.Font('Segoe UI', 14, [System.Drawing.FontStyle]::Bold)
  $g.DrawString('Free on Chrome Web Store', $ctaFont, $cyan, 294, 480)

  $titleFont.Dispose(); $subFont.Dispose(); $bodyFont.Dispose()
  $cyan.Dispose(); $muted.Dispose(); $ctaFont.Dispose()
  $g.Dispose()
  return $bmp
}

function Show-Size([string]$path) {
  $img = [System.Drawing.Image]::FromFile($path)
  Write-Host ("{0}: {1}x{2}  {3}" -f (Split-Path $path -Leaf), $img.Width, $img.Height, $img.PixelFormat)
  $img.Dispose()
}

$iconSrc = Join-Path $Root 'icon.png'
$shotPng = Join-Path $Out 'screenshot-1280x800.png'
$shotJpg = Join-Path $Out 'screenshot-1280x800.jpg'
$promoPng = Join-Path $Out 'promo-small-440x280.png'
$promoJpg = Join-Path $Out 'promo-small-440x280.jpg'
$marqueePng = Join-Path $Out 'promo-marquee-1400x560.png'
$marqueeJpg = Join-Path $Out 'promo-marquee-1400x560.jpg'
$iconDest = Join-Path $Out 'store-icon-128x128.png'

$shot = New-Screenshot1280
Save-Png24 $shot $shotPng
Save-Jpeg $shot $shotJpg 93
$shot.Dispose()

$promo = New-PromoSmall440 $iconSrc
Save-Png24 $promo $promoPng
Save-Jpeg $promo $promoJpg 93
$promo.Dispose()

$marquee = New-Marquee1400 $iconSrc
Save-Png24 $marquee $marqueePng
Save-Jpeg $marquee $marqueeJpg 93
$marquee.Dispose()

Copy-Item $iconSrc $iconDest -Force

Write-Host ''
Write-Host 'Generated store images:'
Show-Size $shotPng
Show-Size $shotJpg
Show-Size $promoPng
Show-Size $promoJpg
Show-Size $marqueePng
Show-Size $marqueeJpg
Show-Size $iconDest
