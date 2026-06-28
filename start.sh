#!/bin/bash
# ═══ 筊杯 · 一键启动 ═══
set -e
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# 检查模型，不存在则下载
if [ ! -f "hand_landmarker.task" ]; then
  echo "⬇  首次运行，下载手势检测模型 (7.5MB)…"
  bash model/download.sh
fi

# 找可用端口
PORT=8080
while lsof -i :$PORT -sTCP:LISTEN &>/dev/null; do PORT=$((PORT+1)); done

echo "🚀 启动服务 → http://localhost:$PORT"
python3 -m http.server $PORT &
sleep 1
open "http://localhost:$PORT"
wait
