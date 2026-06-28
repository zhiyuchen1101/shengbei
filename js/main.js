// ═══ 入口 — UI、摄像头、MediaPipe ═══
import GODS from './gods.js';
import { HandGesture } from './gesture.js';
import { init as initScene, animate, triggerThrow, onResult, resize } from './scene.js';
import { initAudio } from './audio.js';

/* ── DOM ── */
const sceneEl    = document.getElementById('scene3d');
const godsRow    = document.getElementById('godsRow');
const godInfo    = document.getElementById('godInfo');
const guideText  = document.getElementById('guideText');
const resultOverlay = document.getElementById('resultOverlay');
const resultCard = document.getElementById('resultCard');
const camHint    = document.getElementById('camHint');
const webcam     = document.getElementById('webcam');
const overlayCv  = document.getElementById('overlayCv');
const overlayCtx = overlayCv.getContext('2d');
const loadOv     = document.getElementById('loadOv');

/* ── 状态 ── */
let currentGod = GODS[0];

/* ── 老爷选择 ── */
function buildGodCards() {
  godsRow.innerHTML = GODS.map((g, i) =>
    `<div class="god-card${i === 0 ? ' active' : ''}" data-i="${i}">
      <span class="god-emoji">${g.e}</span>
      <span class="god-name">${g.n}</span>
    </div>`
  ).join('');

  godsRow.querySelectorAll('.god-card').forEach(card => {
    card.addEventListener('click', () => {
      godsRow.querySelectorAll('.god-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      currentGod = GODS[parseInt(card.dataset.i)];
      resultOverlay.classList.remove('show');
      showGodInfo(currentGod);
    });
  });
  showGodInfo(GODS[0]);
}

function showGodInfo(g) {
  godInfo.innerHTML = `<div class="gi-name">${g.e} ${g.n} · ${g.t}</div>
    <div class="gi-desc">${g.bg}</div>
    <div class="gi-scene">🎯 适合求：${g.sc}</div>`;
  godInfo.classList.add('show');
}

/* ── 结果回调 ── */
onResult((resultKey) => {
  const g = currentGod;
  const arr = g.r[resultKey];
  const msg = arr[Math.floor(Math.random() * arr.length)];
  const names = { s: '圣 杯', x: '笑 杯', y: '阴 杯' };
  const icons = { s: '🪷', x: '😊', y: '🙅' };
  const colors = { s: '#5a4030', x: '#8a6e40', y: '#8b6b4a' };

  resultCard.innerHTML = `<div class="ri">${icons[resultKey]}</div>
    <div class="rn" style="color:${colors[resultKey]}">${names[resultKey]}</div>
    <div class="rg">${g.e} ${g.n} 示谕</div>
    <div class="rm">${msg}</div>
    <div class="rx">—— ${g.t}</div>`;
  resultOverlay.classList.add('show');
  clearTimeout(resultOverlay._hideTimer);
  resultOverlay._hideTimer = setTimeout(() => resultOverlay.classList.remove('show'), 2500);

  guideText.textContent = '🙏 心中默念，再挥一次手';
  guideText.className = 'guide-text';
  camHint.textContent = '📷 等待手势…';
  camHint.classList.remove('active');
});

/* ── 手势检测 ── */
const gesture = new HandGesture();
gesture.onThrow = () => {
  initAudio();
  triggerThrow();
  guideText.textContent = '🎯 筊杯已掷出…';
  guideText.className = 'guide-text throwing';
  camHint.textContent = '🎯 已掷出！';
  camHint.classList.add('active');
};

/* ── 手部绘制 ── */
const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17],
];

function drawHands(landmarksArr, ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  if (!landmarksArr || landmarksArr.length === 0) return;
  for (const lm of landmarksArr) {
    if (!lm || lm.length === 0) continue;
    ctx.strokeStyle = 'rgba(139,105,20,0.45)'; ctx.lineWidth = 1;
    for (const [i, j] of HAND_CONNECTIONS) {
      if (lm[i] && lm[j]) {
        ctx.beginPath();
        ctx.moveTo(lm[i].x * w, lm[i].y * h);
        ctx.lineTo(lm[j].x * w, lm[j].y * h);
        ctx.stroke();
      }
    }
    for (let k = 0; k < lm.length; k++) {
      const p = lm[k], x = p.x * w, y = p.y * h;
      ctx.beginPath();
      ctx.arc(x, y, k === 0 ? 3.5 : 1.8, 0, Math.PI * 2);
      ctx.fillStyle = k === 0 ? 'rgba(180,130,40,0.75)' : 'rgba(100,80,60,0.35)';
      ctx.fill();
    }
  }
}

/* ── 摄像头 ── */
async function initCamera() {
  try {
    const stream = await Promise.race([
      navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
    ]);
    webcam.srcObject = stream;
    await webcam.play();
    webcam.addEventListener('loadedmetadata', () => {
      overlayCv.width = webcam.videoWidth;
      overlayCv.height = webcam.videoHeight;
    });
  } catch (e) { /* 摄像头不可用，空格/点击仍可投掷 */ }
}

/* ── MediaPipe ── */
let handLandmarker = null, mediaReady = false, lastVideoTime = -1;

function detectLoop() {
  if (!mediaReady || !handLandmarker || !webcam) {
    requestAnimationFrame(detectLoop);
    return;
  }
  if (webcam.readyState >= 2 && webcam.currentTime !== lastVideoTime) {
    lastVideoTime = webcam.currentTime;
    try {
      const result = handLandmarker.detectForVideo(webcam, performance.now());
      const cw = overlayCv.width, ch = overlayCv.height;
      if (result.landmarks && result.landmarks.length > 0) {
        drawHands(result.landmarks, overlayCtx, cw, ch);
        gesture.update(result.landmarks);
        if (!camHint.classList.contains('active')) {
          camHint.classList.add('active');
          camHint.textContent = '✋ 检测到手，向上挥！';
        }
      } else {
        overlayCtx.clearRect(0, 0, cw, ch);
        gesture.update(null);
        if (camHint.classList.contains('active')) {
          camHint.classList.remove('active');
          camHint.textContent = '📷 等待手势…';
        }
      }
    } catch (e) { /* ignore */ }
  }
  requestAnimationFrame(detectLoop);
}

async function initMediaPipe() {
  try {
    const { HandLandmarker, FilesetResolver } = await import(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs'
    );
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: 'hand_landmarker.task' },
      runningMode: 'VIDEO', numHands: 2,
      minHandDetectionConfidence: 0.5, minTrackingConfidence: 0.5,
    });
    // 加超时
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
    await Promise.race([Promise.resolve(handLandmarker), timeout]);

    mediaReady = true;
    detectLoop();
  } catch (e) { /* 手势检测不可用，空格/点击仍可投掷 */ }
}

/* ── 备用输入 ── */
window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); gesture.onThrow(); }
});
sceneEl.addEventListener('click', () => gesture.onThrow());

/* ── 启动 ── */
async function start() {
  initScene(sceneEl);
  buildGodCards();
  resize();
  animate();
  setTimeout(() => loadOv.classList.add('hidden'), 1200);
  initCamera();
  initMediaPipe();
}
start();
