Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\jobsj\.gemini\antigravity\brain\f59aafa0-962a-4df5-93e7-f6f6d594cc0e\.user_uploaded\media_1790696082076.png"
$bmp = New-Object System.Drawing.Bitmap($srcPath)

$outDir = "c:\Users\jobsj\OneDrive\Documentos\GitHub\PokeIDLE\public\biomes\extracted"
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

# The 8 row Y starts:
$rowYs = @(0, 101, 202, 303, 404, 502, 603, 704)
$rowHeights = @(101, 101, 101, 101, 98, 101, 101, 79)
$tileW = 128

for ($r = 0; $r -lt 8; $r++) {
    $y = $rowYs[$r]
    $h = $rowHeights[$r]
    
    for ($c = 0; $c -lt 8; $c++) {
        $x = $c * $tileW
        
        $rect = New-Object System.Drawing.Rectangle($x, $y, $tileW, $h)
        $tile = $bmp.Clone($rect, $bmp.PixelFormat)
        $filename = "r$($r)_c$($c).png"
        $tile.Save("$outDir\$filename", [System.Drawing.Imaging.ImageFormat]::Png)
        $tile.Dispose()
    }
}

$bmp.Dispose()
Write-Host "Extracted all 64 biomes with exact coordinates to $outDir!"
