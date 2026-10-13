# 全局屏幕边缘光提醒（Siri 式四边 rim），任何提醒脚本都可以调用
# 程序就是本仓库（Electron + WebGL，点击穿透、不抢焦点、播完自动退出）；先在仓库根目录 npm install && npm run build
# 用法：
#   & .\scripts\edge-glow.ps1                                         # 默认宇宙色盘，约 4.5 秒
#   & ...\edge-glow.ps1 -Preset alert -Hold 6000                              # 警示色，停留到 6 秒再收回
#   & ...\edge-glow.ps1 -Colors '#80EF80','#3FE0C5' -NoWait                   # 自定义 1–6 色，不等播完
param(
    [ValidateSet('cosmos', 'alert', 'calm', 'focus', 'okr')][string]$Preset = 'cosmos',
    [string[]]$Colors,
    [int]$Hold = 3700,
    [switch]$NoWait
)
$presets = @{
    cosmos = @()                                                              # 程序内置默认
    alert  = @('#FF453A', '#FF7A45', '#FF4FA3', '#FF9F0A', '#FF453A', '#FF6B8B')
    calm   = @('#64D2FF', '#5E5CE6', '#7C8CFF', '#3FE0C5', '#64D2FF', '#A0B4FF')
    focus  = @('#80EF80', '#3FE0C5', '#B8F5B0', '#30D158', '#80EF80', '#5EE6B0')
    okr    = @('#FCD8A7', '#F8BD6E', '#E05603', '#EFA45B', '#D55103', '#A15833')   # 暖光：奶油 / 杏 / 血橙 / 琥珀 / 橙 / 焦糖
}
$dir = Split-Path -Parent $PSScriptRoot
$electron = Join-Path $dir 'node_modules\electron\dist\electron.exe'
if (-not (Test-Path -LiteralPath $electron)) { return }
$list = if ($Colors) { $Colors } else { $presets[$Preset] }
$argv = @("`"$dir`"", "--hold=$Hold")
if ($list.Count) { $argv += "--colors=$(($list | ForEach-Object { $_.TrimStart('#') }) -join ',')" }
$proc = Start-Process -FilePath $electron -ArgumentList $argv -PassThru
if (-not $NoWait) { [void]$proc.WaitForExit($Hold + 15000) }
