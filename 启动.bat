@echo off
chcp 65001 >nul
title 筊杯 · 潮汕老爷卜卦
cd /d "%~dp0"

:: 检查 Python
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠  未找到 Python，请先安装：https://python.org
    pause
    exit /b 1
)

:: 下载模型（如果不存在）
if not exist "hand_landmarker.task" (
    echo ⬇  首次运行，下载手势检测模型 (7.5MB)...
    powershell -Command "Invoke-WebRequest -Uri 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task' -OutFile 'hand_landmarker.task' -TimeoutSec 60"
    if %errorlevel% neq 0 (
        echo ⚠  下载失败，请检查网络。可手动下载模型放到当前目录。
        pause
        exit /b 1
    )
    echo ✓ 模型下载完成
)

:: 找可用端口
set PORT=8080
:findport
netstat -ano | findstr ":%PORT% " >nul
if %errorlevel% equ 0 (
    set /a PORT+=1
    goto findport
)

:: 启动
echo 🚀 启动服务 → http://localhost:%PORT%
start http://localhost:%PORT%
python -m http.server %PORT%
pause
