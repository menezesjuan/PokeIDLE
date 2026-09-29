Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\jobsj\.gemini\antigravity\brain\f59aafa0-962a-4df5-93e7-f6f6d594cc0e\.user_uploaded\media_1790696082076.png"
$bmp = New-Object System.Drawing.Bitmap($srcPath)

$arenaDir = "c:\Users\jobsj\OneDrive\Documentos\GitHub\PokeIDLE\public\biomes\arena"
$thumbDir = "c:\Users\jobsj\OneDrive\Documentos\GitHub\PokeIDLE\public\biomes\thumb"

if (!(Test-Path $arenaDir)) { New-Item -ItemType Directory -Path $arenaDir -Force | Out-Null }
if (!(Test-Path $thumbDir)) { New-Item -ItemType Directory -Path $thumbDir -Force | Out-Null }

$biomes = @(
    @{ Id = "route-1";           Col = 2; RowY = 1;   RowH = 99; Name = "Plains Grass" },
    @{ Id = "route-2";           Col = 1; RowY = 504; RowH = 98; Name = "Meadow" },
    @{ Id = "viridian-forest";   Col = 7; RowY = 204; RowH = 98; Name = "Deep Forest" },
    @{ Id = "route-3";           Col = 0; RowY = 1;   RowH = 99; Name = "Mountain Path" },
    @{ Id = "mt-moon";           Col = 3; RowY = 103; RowH = 98; Name = "Stone Cavern" },
    @{ Id = "route-4";           Col = 4; RowY = 103; RowH = 98; Name = "River Bank" },
    @{ Id = "vermilion-route";   Col = 1; RowY = 1;   RowH = 99; Name = "Seaside Beach" },
    @{ Id = "rock-tunnel";       Col = 7; RowY = 103; RowH = 98; Name = "Dark Tunnel" },
    @{ Id = "pokemon-tower";     Col = 0; RowY = 705; RowH = 78; Name = "Cemetery Tower" },
    @{ Id = "safari-zone";       Col = 0; RowY = 504; RowH = 98; Name = "Safari Savanna" },
    @{ Id = "seafoam-islands";   Col = 3; RowY = 504; RowH = 98; Name = "Frozen Ice Cave" },
    @{ Id = "cinnabar-volcano";  Col = 2; RowY = 605; RowH = 98; Name = "Volcano Magma" }
)

$targetW = 860
$targetH = 180
$thumbW = 160
$thumbH = 90

foreach ($b in $biomes) {
    # Inset 2px left and 2px right to completely avoid any column border seams
    $x = ($b.Col * 128) + 2
    $y = $b.RowY
    $w = 124
    $h = $b.RowH
    
    # Crop raw tile
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $tile = $bmp.Clone($rect, $bmp.PixelFormat)
    
    # 1. Generate Arena Background (860x180) with crisp nearest neighbor stretch
    $arenaBmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $gArena = [System.Drawing.Graphics]::FromImage($arenaBmp)
    $gArena.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $gArena.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
    $gArena.DrawImage($tile, 0, 0, $targetW, $targetH)
    $gArena.Dispose()
    
    $arenaPath = "$arenaDir\$($b.Id).png"
    $arenaBmp.Save($arenaPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $arenaBmp.Dispose()
    
    # 2. Generate UI Thumbnail (160x90)
    $thumbBmp = New-Object System.Drawing.Bitmap($thumbW, $thumbH)
    $gThumb = [System.Drawing.Graphics]::FromImage($thumbBmp)
    $gThumb.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gThumb.DrawImage($tile, 0, 0, $thumbW, $thumbH)
    $gThumb.Dispose()
    
    $thumbPath = "$thumbDir\$($b.Id).png"
    $thumbBmp.Save($thumbPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $thumbBmp.Dispose()
    
    $tile.Dispose()
    Write-Host ("Processed biome: {0} ({1})" -f $b.Id, $b.Name)
}

$bmp.Dispose()
Write-Host "All 12 biomes processed cleanly!"
