# 筊杯 · 潮汕老爷卜卦

> 🙏 基于 Web 的潮汕掷筊交互体验 — 摄像头手势识别 + Three.js 3D 动画

## ✨ 特性

- 🖐 **摄像头手势检测** — MediaPipe AI 实时追踪手部，向上挥手即可掷筊
- 🎬 **3D 圣杯动画** — Three.js 月牙形圣杯模型，上抛旋转落地 + 粒子特效
- 🔮 **10 位老爷可选** — 三山国王、妈祖、关帝、伯公、财神、月老、文昌、玄天上帝、城隍、注生娘娘
- 📜 **卦象解读** — 圣杯（吉）/ 笑杯（中）/ 阴杯（凶），各有专属幽默卦辞
- 🎨 **宣纸美学** — 素雅米白配色，签文纸质感
- ⌨️ **降级可用** — 摄像头不可用时，空格键/点击圣杯也能掷筊

## 🚀 快速开始

```bash
# 1. 下载手部检测模型（7.5MB）
bash model/download.sh

# 2. 启动本地服务
python3 -m http.server 8080

# 3. 浏览器打开
open http://localhost:8080
```

## 📁 项目结构

```
shengbei/
├── index.html          # 入口
├── css/style.css       # 宣纸主题样式
├── js/
│   ├── main.js         # 入口：UI + 摄像头 + MediaPipe
│   ├── scene.js        # Three.js 场景：圣杯模型 + 动画
│   ├── gods.js         # 10位老爷数据
│   ├── gesture.js      # 手势检测器（纯逻辑，可单测）
│   └── audio.js        # 木头碰撞音效
├── model/
│   └── download.sh     # AI 模型下载脚本
└── README.md
```

## 🛠 技术栈

| 层 | 技术 |
|---|------|
| 3D 渲染 | Three.js (ES module) |
| 手势检测 | MediaPipe HandLandmarker |
| 音效 | Web Audio API |
| 样式 | CSS 宣纸主题 |

## 📄 License

MIT
