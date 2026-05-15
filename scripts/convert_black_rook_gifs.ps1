$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$SourceDir = Join-Path $Root "assets/gif/black_rooks"
$OutputDir = Join-Path $Root "assets/sprites/rooks/black"
$PreviewPath = Join-Path $OutputDir "preview-sheet.png"
$ManifestPath = Join-Path $OutputDir "manifest.json"

$ActionFiles = [ordered]@{
  "board_down" = "board_down.gif"
  "board_down_left" = "board_down_left.gif"
  "board_down_right" = "board_down_right.gif"
  "board_idle" = "board_idle.gif"
  "board_left" = "board_left.gif"
  "board_right" = "board_right.gif"
  "board_step_1" = "board_step_1.gif"
  "board_step_2" = "board_step_2.gif"
  "board_turn" = "board_turn.gif"
  "board_up" = "board_up.gif"
  "board_up_left" = "board_up_left.gif"
  "board_up_right" = "board_up_right.gif"
  "charge_dash" = "charge_dash.gif"
  "crouch" = "crouch.gif"
  "ground_smash" = "ground_smash.gif"
  "guard_block" = "guard_block.gif"
  "heavy_attack_double_crush" = "heavy_attack_double_crush.gif"
  "hit_hurt" = "hit_hurt.gif"
  "idle_ready" = "idle_ready.gif"
  "jump" = "jump.gif"
  "knocked_down_defeat" = "knocked_down_defeat.gif"
  "light_attack_punch" = "light_attack_punch.gif"
  "taunt_command" = "taunt_command.gif"
  "top_view_board_move" = "top_view_board_move.gif"
  "victory" = "victory.gif"
  "walk" = "walk.gif"
}

$ShowdownActions = @(
  "charge_dash",
  "crouch",
  "ground_smash",
  "guard_block",
  "heavy_attack_double_crush",
  "hit_hurt",
  "idle_ready",
  "jump",
  "knocked_down_defeat",
  "light_attack_punch",
  "taunt_command",
  "victory",
  "walk"
)

function Get-RelativeAssetPath($Path) {
  $fullPath = (Resolve-Path $Path).Path
  $rootPrefix = $Root.TrimEnd("\", "/") + [System.IO.Path]::DirectorySeparatorChar
  if ($fullPath.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
    return $fullPath.Substring($rootPrefix.Length).Replace("\", "/")
  }

  return $fullPath.Replace("\", "/")
}

function Get-GifDurations($Image, $FrameCount) {
  $durations = @()
  try {
    $item = $Image.GetPropertyItem(0x5100)
    for ($index = 0; $index -lt $FrameCount; $index += 1) {
      $durationMs = [BitConverter]::ToInt32($item.Value, $index * 4) * 10
      $durations += $durationMs
    }
  } catch {
    for ($index = 0; $index -lt $FrameCount; $index += 1) {
      $durations += 120
    }
  }

  return $durations
}

function Get-CommonGifSize($Actions) {
  $width = 0
  $height = 0

  foreach ($action in $Actions) {
    $source = Join-Path $SourceDir $ActionFiles[$action]
    $image = [System.Drawing.Image]::FromFile($source)
    try {
      $width = [Math]::Max($width, $image.Width)
      $height = [Math]::Max($height, $image.Height)
    } finally {
      $image.Dispose()
    }
  }

  return [pscustomobject]@{
    Width = $width
    Height = $height
  }
}

function Save-NormalizedFrame($Bitmap, $FramePath, $TargetSize) {
  if ($null -eq $TargetSize) {
    $Bitmap.Save($FramePath, [System.Drawing.Imaging.ImageFormat]::Png)
    return
  }

  $normalized = New-Object System.Drawing.Bitmap($TargetSize.Width, $TargetSize.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($normalized)
  try {
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

    $x = [Math]::Floor(($TargetSize.Width - $Bitmap.Width) / 2)
    $y = $TargetSize.Height - $Bitmap.Height
    $graphics.DrawImage($Bitmap, $x, $y, $Bitmap.Width, $Bitmap.Height)
    $normalized.Save($FramePath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $graphics.Dispose()
    $normalized.Dispose()
  }
}

function Save-GifFrames($Source, $ActionDir, $TargetSize = $null) {
  $image = [System.Drawing.Image]::FromFile($Source)
  try {
    $dimension = New-Object System.Drawing.Imaging.FrameDimension($image.FrameDimensionsList[0])
    $frameCount = $image.GetFrameCount($dimension)
    $durations = Get-GifDurations $image $frameCount
    $framePaths = @()

    for ($index = 0; $index -lt $frameCount; $index += 1) {
      [void]$image.SelectActiveFrame($dimension, $index)
      $bitmap = New-Object System.Drawing.Bitmap($image.Width, $image.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.Clear([System.Drawing.Color]::Transparent)
        $graphics.DrawImage($image, 0, 0, $image.Width, $image.Height)
        Remove-EdgeMatte $bitmap
        Remove-LightMatte $bitmap
        Remove-DetachedEdgeFragments $bitmap
        $framePath = Join-Path $ActionDir ("frame-{0:D2}.png" -f $index)
        Save-NormalizedFrame $bitmap $framePath $TargetSize
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
      Width = if ($null -eq $TargetSize) { $image.Width } else { $TargetSize.Width }
      Height = if ($null -eq $TargetSize) { $image.Height } else { $TargetSize.Height }
    }
  } finally {
    $image.Dispose()
  }
}

function Test-MatteCandidate($Color) {
  if ($Color.A -eq 0) {
    return $false
  }

  $max = [Math]::Max($Color.R, [Math]::Max($Color.G, $Color.B))
  $min = [Math]::Min($Color.R, [Math]::Min($Color.G, $Color.B))
  $average = ($Color.R + $Color.G + $Color.B) / 3
  return $average -ge 118 -and ($max - $min) -le 30
}

function Remove-EdgeMatte($Bitmap) {
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
    if (-not (Test-MatteCandidate $color)) {
      continue
    }

    $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $color.R, $color.G, $color.B))

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

function Remove-DetachedEdgeFragments($Bitmap) {
  $width = $Bitmap.Width
  $height = $Bitmap.Height
  $visited = New-Object bool[] ($width * $height)
  $components = @()

  for ($startY = 0; $startY -lt $height; $startY += 1) {
    for ($startX = 0; $startX -lt $width; $startX += 1) {
      $startIndex = $startY * $width + $startX
      if ($visited[$startIndex]) {
        continue
      }

      $startColor = $Bitmap.GetPixel($startX, $startY)
      if ($startColor.A -eq 0) {
        $visited[$startIndex] = $true
        continue
      }

      $queue = New-Object 'System.Collections.Generic.Queue[int]'
      $pixels = New-Object 'System.Collections.Generic.List[int]'
      $queue.Enqueue($startIndex)
      $minX = $width
      $maxX = -1
      $touchesRightEdge = $false

      while ($queue.Count -gt 0) {
        $index = $queue.Dequeue()
        if ($visited[$index]) {
          continue
        }

        $visited[$index] = $true
        $x = $index % $width
        $y = [Math]::Floor($index / $width)
        $color = $Bitmap.GetPixel($x, $y)
        if ($color.A -eq 0) {
          continue
        }

        $pixels.Add($index)
        if ($x -lt $minX) {
          $minX = $x
        }
        if ($x -gt $maxX) {
          $maxX = $x
        }
        if ($x -eq $width - 1) {
          $touchesRightEdge = $true
        }

        for ($dy = -1; $dy -le 1; $dy += 1) {
          for ($dx = -1; $dx -le 1; $dx += 1) {
            if ($dx -eq 0 -and $dy -eq 0) {
              continue
            }

            $nextX = $x + $dx
            $nextY = $y + $dy
            if ($nextX -ge 0 -and $nextX -lt $width -and $nextY -ge 0 -and $nextY -lt $height) {
              $nextIndex = $nextY * $width + $nextX
              if (-not $visited[$nextIndex]) {
                $queue.Enqueue($nextIndex)
              }
            }
          }
        }
      }

      if ($pixels.Count -gt 0) {
        $components += [pscustomobject]@{
          Pixels = $pixels
          Count = $pixels.Count
          Width = $maxX - $minX + 1
          TouchesRightEdge = $touchesRightEdge
        }
      }
    }
  }

  if ($components.Count -lt 2) {
    return
  }

  $largest = ($components | Measure-Object -Property Count -Maximum).Maximum
  foreach ($component in $components) {
    if ($component.TouchesRightEdge -and $component.Width -le 18 -and $component.Count -lt $largest * 0.3) {
      foreach ($index in $component.Pixels) {
        $x = $index % $width
        $y = [Math]::Floor($index / $width)
        $color = $Bitmap.GetPixel($x, $y)
        $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $color.R, $color.G, $color.B))
      }
    }
  }
}

function Remove-LightMatte($Bitmap) {
  for ($y = 0; $y -lt $Bitmap.Height; $y += 1) {
    for ($x = 0; $x -lt $Bitmap.Width; $x += 1) {
      $color = $Bitmap.GetPixel($x, $y)
      if ($color.A -eq 0) {
        continue
      }

      $max = [Math]::Max($color.R, [Math]::Max($color.G, $color.B))
      $min = [Math]::Min($color.R, [Math]::Min($color.G, $color.B))
      $average = ($color.R + $color.G + $color.B) / 3

      if ($average -ge 130 -and ($max - $min) -le 32) {
        $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, $color.R, $color.G, $color.B))
      } elseif ($average -ge 112 -and ($max - $min) -le 24) {
        $alpha = [Math]::Min($color.A, [Math]::Round(($average - 112) * 6))
        $Bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $color.R, $color.G, $color.B))
      }
    }
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
$ShowdownFrameSize = Get-CommonGifSize $ShowdownActions

$manifest = [ordered]@{
  piece = "rook"
  team = "black"
  source = Get-RelativeAssetPath $SourceDir
  showdownFrameSize = [ordered]@{
    width = $ShowdownFrameSize.Width
    height = $ShowdownFrameSize.Height
  }
  actions = [ordered]@{}
}
$previewRows = @()

foreach ($action in $ActionFiles.Keys) {
  $source = Join-Path $SourceDir $ActionFiles[$action]
  if (-not (Test-Path $source)) {
    throw "Missing source GIF: $source"
  }

  $actionDir = Join-Path $OutputDir $action
  New-Item -ItemType Directory -Force -Path $actionDir | Out-Null
  $targetSize = if ($ShowdownActions -contains $action) { $ShowdownFrameSize } else { $null }
  $result = Save-GifFrames $source $actionDir $targetSize
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

Write-Output "Generated black rook frames in $(Get-RelativeAssetPath $OutputDir)"
