#!/usr/bin/env bash
# 全局屏幕边缘光提醒（macOS / Linux）。先在仓库根目录 npm install && npm run build
# 用法：
#   ./scripts/edge-glow.sh                          # 默认宇宙色盘，约 4.5 秒
#   ./scripts/edge-glow.sh -p alert -H 6000         # 预设 cosmos / alert / calm / focus，停留到 6 秒再收回
#   ./scripts/edge-glow.sh -c 80EF80,7C8CFF -n      # 自定义 1–6 色（逗号分隔 hex），不等播完
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
preset=cosmos; colors=""; hold=3700; wait=1
while getopts "p:c:H:n" o; do
  case $o in p) preset=$OPTARG;; c) colors=$OPTARG;; H) hold=$OPTARG;; n) wait=0;; *) exit 2;; esac
done
if [ -z "$colors" ]; then
  case $preset in
    cosmos) colors="";;                                            # 程序内置默认
    alert)  colors="FF453A,FF7A45,FF4FA3,FF9F0A,FF453A,FF6B8B";;
    calm)   colors="64D2FF,5E5CE6,7C8CFF,3FE0C5,64D2FF,A0B4FF";;
    focus)  colors="80EF80,3FE0C5,B8F5B0,30D158,80EF80,5EE6B0";;
    *) echo "unknown preset: $preset" >&2; exit 2;;
  esac
fi
if [ "$(uname)" = Darwin ]; then
  ELECTRON="$DIR/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron"
else
  ELECTRON="$DIR/node_modules/electron/dist/electron"
fi
[ -x "$ELECTRON" ] || { echo "先在 $DIR 里运行 npm install && npm run build" >&2; exit 1; }
args=("$DIR" "--hold=$hold"); [ -n "$colors" ] && args+=("--colors=${colors//#/}")
if [ $wait = 1 ]; then "$ELECTRON" "${args[@]}" >/dev/null 2>&1; else "$ELECTRON" "${args[@]}" >/dev/null 2>&1 & fi
