#!/bin/bash
# 下载 MediaPipe HandLandmarker 模型文件 (7.5MB)
# 来源: Google MediaPipe Models

set -e

MODEL_URL="https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task"
TARGET="$(dirname "$0")/../hand_landmarker.task"

echo "⬇  下载手部检测模型…"
echo "   源: $MODEL_URL"
echo "   目标: $TARGET"

# 尝试直连，失败则提示用代理
if command -v curl &>/dev/null; then
  curl -L --max-time 60 -o "$TARGET" "$MODEL_URL" && echo "✓ 下载完成 ($(du -h "$TARGET" | cut -f1))" || {
    echo "⚠ 直连失败，尝试使用代理…"
    echo "   请设置 https_proxy 环境变量后重试"
    echo "   export https_proxy=http://127.0.0.1:7897"
    exit 1
  }
elif command -v wget &>/dev/null; then
  wget --timeout=60 -O "$TARGET" "$MODEL_URL" && echo "✓ 下载完成 ($(du -h "$TARGET" | cut -f1))"
else
  echo "✗ 需要 curl 或 wget"
  exit 1
fi
