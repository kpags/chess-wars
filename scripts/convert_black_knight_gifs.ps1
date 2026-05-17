param()

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SourceDir = Join-Path $Root "assets/gif/black_knight"
$OutputDir = Join-Path $Root "assets/sprites/knights/black"
$PreviewPath = Join-Path $OutputDir "preview-sheet.png"
$ManifestPath = Join-Path $OutputDir "manifest.json"

$ActionFiles = [ordered]@{
  "board_idle" = "board_top_view.png"
  "board_move_animation" = "board_move_animation.gif"
  "charge_dash" = "move_gallop.gif"
  "guard_block" = "defense_block.gif"
  "heavy_attack" = "heavy_attack.gif"
  "hit_hurt" = "hit_hurt.png"
  "idle_ready" = "idle_ready.gif"
  "jump_rear" = "jump_rear.gif"
  "knocked_down_defeat" = "defeat.png"
  "light_attack_pierce" = "light_attack_pierce.gif"
  "ultimate_skill" = "ultimate_skill.gif"
  "victory" = "victory.gif"
  "walk" = "move_gallop.gif"
}

$ShowdownActions = @(
  "charge_dash",
  "guard_block",
  "heavy_attack",
  "hit_hurt",
  "idle_ready",
  "jump_rear",
  "knocked_down_defeat",
  "light_attack_pierce",
  "ultimate_skill",
  "victory",
  "walk"
)

$BoardActions = @(
  "board_idle",
  "board_move_animation"
)

$ShowdownFrameSize = [pscustomobject]@{
  Width = 512
  Height = 320
}

$ShowdownContentSize = [pscustomobject]@{
  Width = 452
  Height = 300
}

$BoardFrameSize = [pscustomobject]@{
  Width = 128
  Height = 128
}

$BoardContentSize = [pscustomobject]@{
  Width = 110
  Height = 110
}

function Get-RelativeAssetPath($Path) {
  $fullPath = (Resolve-Path $Path).Path
  $rootPrefix = $Root.TrimEnd("\", "/") + [System.IO.Path]::DirectorySeparatorChar
  if ($fullPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $fullPath.Substring($rootPrefix.Length).Replace("\", "/")
  }

  return $fullPath.Replace("\", "/")
}

function Get-ImageDurations($Image, $FrameCount) {
  $durations = @()
  try {
    $item = $Image.GetPropertyItem(0x5100)
    for ($index = 0; $index -lt $FrameCount; $index += 1) {
      $durationMs = [BitConverter]::ToInt32($item.Value, $index * 4) * 10
      $durations += $(if ($durationMs -gt 0) { $durationMs } else { 120 })
    }
  } catch {
    for ($index = 0; $index -lt $FrameCount; $index += 1) {
      $durations += 120
    }
  }

  return $durations
}

function Get-OpaqueBounds($Bitmap) {
  $minX = $Bitmap.Width
  $minY = $Bitmap.Height
  $maxX = -1
  $maxY = -1

  for ($y = 0; $y -lt $Bitmap.Height; $y += 1) {
    for ($x = 0; $x -lt $Bitmap.Width; $x += 1) {
      $color = $Bitmap.GetPixel($x, $y)
      if ($color.A -le 8) {
        continue
      }

      if ($x -lt $minX) {
        $minX = $x
      }
      if ($x -gt $maxX) {
        $maxX = $x
      }
      if ($y -lt $minY) {
        $minY = $y
      }
      if ($y -gt $maxY) {
        $maxY = $y
      }
    }
  }

  if ($maxX -lt 0) {
    return $null
  }

  return [pscustomobject]@{
    X = $minX
    Y = $minY
    Width = $maxX - $minX + 1
    Height = $maxY - $minY + 1
  }
}

function Test-BackgroundCandidate($Color) {
  if ($Color.A -eq 0) {
    return $true
  }

  $max = [Math]::Max($Color.R, [Math]::Max($Color.G, $Color.B))
  $min = [Math]::Min($Color.R, [Math]::Min($Color.G, $Color.B))
  $average = ($Color.R + $Color.G + $Color.B) / 3
  $chroma = $max - $min

  return ($average -ge 185 -and $chroma -le 84) -or ($average -ge 118 -and $chroma -le 26)
}

function Remove-EdgeBackground($Bitmap) {
  $width = $Bitmap.Width
  $height = $Bitmap.Height
  $visited = New-Object bool[] ($width * $height)
  $queue = New-Object 'System.Collections.Generic.Queue[int]'

  for ($x = 0; $x -lt $width; $x += 1) {
    $queue.Enqueue($x)
    $queue.Enqueue(($height - 1) * $width + $x)
  }

  for ($y = 0; $y -lt $height; $y += 1) {
    $queue.Enqueue($y * $width)
    $queue.Enqueue($y * $width + ($width - 1))
  }

  while ($queue.Count -gt 0) {
    $index = $queue.Dequeue()
    if ($visited[$index]) {
      continue
    }

    $visited[$index] = $true
    $x = $index % $width
    $y = [Math]::Floor($index / $width)
    $color = $Bitmap.GetPixel($x, $y)
    if (-not (Test-BackgroundCandidate $color)) {
      continue
    }

    if ($color.A -ne 0) {
      $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $color.R, $color.G, $color.B))
    }

    if ($x -gt 0) {
      $queue.Enqueue($index - 1)
    }
    if ($x -lt $width - 1) {
      $queue.Enqueue($index + 1)
    }
    if ($y -gt 0) {
      $queue.Enqueue($index - $width)
    }
    if ($y -lt $height - 1) {
      $queue.Enqueue($index + $width)
    }
  }
}

function Fade-LightMatte($Bitmap) {
  for ($y = 0; $y -lt $Bitmap.Height; $y += 1) {
    for ($x = 0; $x -lt $Bitmap.Width; $x += 1) {
      $color = $Bitmap.GetPixel($x, $y)
      if ($color.A -eq 0) {
        continue
      }

      $max = [Math]::Max($color.R, [Math]::Max($color.G, $color.B))
      $min = [Math]::Min($color.R, [Math]::Min($color.G, $color.B))
      $average = ($color.R + $color.G + $color.B) / 3
      $chroma = $max - $min

      if ($average -ge 212 -and $chroma -le 42) {
        $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $color.R, $color.G, $color.B))
      } elseif ($average -ge 180 -and $chroma -le 36) {
        $alpha = [Math]::Min($color.A, [Math]::Round(($average - 180) * 3))
        $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $color.R, $color.G, $color.B))
      }
    }
  }
}

function Normalize-Frame($Bitmap, $FramePath, $TargetSize, $TargetContentSize) {
  $bounds = Get-OpaqueBounds $Bitmap
  $normalized = New-Object System.Drawing.Bitmap($TargetSize.Width, $TargetSize.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($normalized)

  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

    if ($null -ne $bounds) {
      $scale = [Math]::Min($TargetContentSize.Width / $bounds.Width, $TargetContentSize.Height / $bounds.Height)
      $width = [int][Math]::Max(1, [Math]::Min($TargetSize.Width, [Math]::Round($bounds.Width * $scale)))
      $height = [int][Math]::Max(1, [Math]::Min($TargetSize.Height, [Math]::Round($bounds.Height * $scale)))
      $x = [int][Math]::Floor(($TargetSize.Width - $width) / 2)
      $y = [int]($TargetSize.Height - $height)
      $destRect = New-Object System.Drawing.Rectangle $x, $y, $width, $height
      $sourceRect = New-Object System.Drawing.Rectangle $bounds.X, $bounds.Y, $bounds.Width, $bounds.Height
      $graphics.DrawImage($Bitmap, $destRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
    }

    $normalized.Save($FramePath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $normalized.Dispose()
  }
}

function Convert-SourceFrames($Source, $ActionDir, $TargetSize, $TargetContentSize) {
  $image = [System.Drawing.Image]::FromFile($Source)
  try {
    $isGif = [System.IO.Path]::GetExtension($Source).Equals(".gif", [System.StringComparison]::OrdinalIgnoreCase)
    if ($isGif) {
      $dimension = New-Object System.Drawing.Imaging.FrameDimension($image.FrameDimensionsList[0])
      $frameCount = $image.GetFrameCount($dimension)
      $durations = Get-ImageDurations $image $frameCount
    } else {
      $dimension = $null
      $frameCount = 1
      $durations = @(700)
    }

    $framePaths = @()
    for ($index = 0; $index -lt $frameCount; $index += 1) {
      if ($isGif) {
        [void]$image.SelectActiveFrame($dimension, $index)
      }

      $bitmap = New-Object System.Drawing.Bitmap($image.Width, $image.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.DrawImage($image, 0, 0, $image.Width, $image.Height)
        Remove-EdgeBackground $bitmap
        Fade-LightMatte $bitmap
        $framePath = Join-Path $ActionDir ("frame-{0:D2}.png" -f $index)
        Normalize-Frame $bitmap $framePath $TargetSize $TargetContentSize
        $framePaths += $framePath
      } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
      }
    }

    return [ordered]@{
      Frames = $frameCount
      DurationsMs = $durations
      FramePaths = $framePaths
      Width = $TargetSize.Width
      Height = $TargetSize.Height
    }
  } finally {
    $image.Dispose()
  }
}

function Render-PreviewSheet($Rows, $Path) {
  $cellWidth = 176
  $cellHeight = 132
  $labelHeight = 18
  $maxFrames = ($Rows | ForEach-Object { $_.FramePaths.Count } | Measure-Object -Maximum).Maximum
  $preview = New-Object System.Drawing.Bitmap($($maxFrames * $cellWidth), $($Rows.Count * $cellHeight), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($preview)

  try {
    $graphics.Clear([System.Drawing.Color]::FromArgb(255, 28, 24, 22))
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

    for ($rowIndex = 0; $rowIndex -lt $Rows.Count; $rowIndex += 1) {
      $row = $Rows[$rowIndex]
      for ($frameIndex = 0; $frameIndex -lt $row.FramePaths.Count; $frameIndex += 1) {
        $frame = [System.Drawing.Image]::FromFile($row.FramePaths[$frameIndex])
        try {
          $scale = [Math]::Min(($cellWidth - 24) / $frame.Width, ($cellHeight - $labelHeight - 18) / $frame.Height)
          $width = [Math]::Max(1, [Math]::Round($frame.Width * $scale))
          $height = [Math]::Max(1, [Math]::Round($frame.Height * $scale))
          $x = $frameIndex * $cellWidth + [Math]::Floor(($cellWidth - $width) / 2)
          $y = $rowIndex * $cellHeight + $cellHeight - 12 - $height
          $graphics.DrawImage($frame, $x, $y, $width, $height)
        } finally {
          $frame.Dispose()
        }
      }
    }

    $preview.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $preview.Dispose()
  }
}

if (-not (Test-Path $SourceDir)) {
  throw "Missing source GIF directory: $SourceDir"
}

New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

$manifest = [ordered]@{
  piece = "knight"
  team = "black"
  source = Get-RelativeAssetPath $SourceDir
  showdownFrameSize = [ordered]@{
    width = $ShowdownFrameSize.Width
    height = $ShowdownFrameSize.Height
  }
  showdownContentSize = [ordered]@{
    width = $ShowdownContentSize.Width
    height = $ShowdownContentSize.Height
  }
  boardFrameSize = [ordered]@{
    width = $BoardFrameSize.Width
    height = $BoardFrameSize.Height
  }
  actions = [ordered]@{}
}
$previewRows = @()

foreach ($action in $ActionFiles.Keys) {
  $source = Join-Path $SourceDir $ActionFiles[$action]
  if (-not (Test-Path $source)) {
    throw "Missing source asset: $source"
  }

  $actionDir = Join-Path $OutputDir $action
  New-Item -ItemType Directory -Force -Path $actionDir | Out-Null
  $targetSize = if ($BoardActions -contains $action) { $BoardFrameSize } else { $ShowdownFrameSize }
  $targetContentSize = if ($BoardActions -contains $action) { $BoardContentSize } else { $ShowdownContentSize }
  $result = Convert-SourceFrames $source $actionDir $targetSize $targetContentSize
  $manifest.actions[$action] = [ordered]@{
    frames = $result.Frames
    durationsMs = $result.DurationsMs
    frameWidth = $result.Width
    frameHeight = $result.Height
    path = Get-RelativeAssetPath $actionDir
  }
  $previewRows += [pscustomobject]@{
    Action = $action
    FramePaths = $result.FramePaths
  }
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $ManifestPath -Encoding UTF8
Render-PreviewSheet $previewRows $PreviewPath

Write-Output "Generated black knight frames in $(Get-RelativeAssetPath $OutputDir)"
