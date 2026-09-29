Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\jobsj\.gemini\antigravity\brain\f59aafa0-962a-4df5-93e7-f6f6d594cc0e\.user_uploaded\media_1790696082076.png"
$bmp = New-Object System.Drawing.Bitmap($srcPath)

$outDir = "c:\Users\jobsj\OneDrive\Documentos\GitHub\PokeIDLE\public\biomes\raw"
if (!(Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

$tileW = 128
$tileH = 96

for ($r = 0; $r -lt 8; $r++) {
    for ($c = 0; $c -lt 8; $c++) {
        $x = $c * $tileW
        $y = $r * $tileH
        
        # Check within bounds
        if ($x + $tileW -le $bmp.Width -and $y + $tileH -le $bmp.Height) {
            $rect = New-Object System.Drawing.Rectangle($x, $y, $tileW, $tileH)
            $tile = $bmp.Clone($rect, $bmp.PixelFormat)
            $filename = "biome_r$($r)_c$($c).png"
            $tile.Save("$outDir\$filename", [System.Drawing.Imaging.ImageFormat]::Png)
            $tile.Dispose()
        }
    }
}

$bmp.Dispose()
Write-Host "All 64 raw biomes exported successfully to $outDir!"
