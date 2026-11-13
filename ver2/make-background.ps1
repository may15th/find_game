Add-Type -AssemblyName System.Drawing
$b=New-Object Drawing.Bitmap 1200,900
$g=[Drawing.Graphics]::FromImage($b)
$g.SmoothingMode='AntiAlias'
$g.Clear([Drawing.ColorTranslator]::FromHtml('#263c4c'))
function Box($c,$x,$y,$w,$h){$br=New-Object Drawing.SolidBrush ([Drawing.ColorTranslator]::FromHtml($c));$g.FillRectangle($br,$x,$y,$w,$h);$br.Dispose()}
Box '#344b59' 35 40 1130 690
Box '#c3b396' 80 115 210 260
Box '#e6dcc6' 94 129 182 232
Box '#213546' 785 310 350 390
for($i=0;$i -lt 6;$i++){Box '#718190' (810+$i*49) 355 35 180;Box '#d9cdb8' (820+$i*49) 395 15 80}
Box '#8b7156' 0 735 1200 165
Box '#142a38' 450 0 8 95
$br=New-Object Drawing.SolidBrush ([Drawing.ColorTranslator]::FromHtml('#f3d38e'))
$g.FillEllipse($br,375,85,160,32)
$g.Dispose();$b.Save((Join-Path (Get-Location) 'ver2/assets/case02/background/interview-room.png'));$b.Dispose()
