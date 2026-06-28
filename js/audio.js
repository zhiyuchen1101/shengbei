// ═══ 音效 — 木头碰撞 + 低频共振 ═══
let audioCtx = null;

/** 预初始化 — 需在用户交互后调用（浏览器自动播放策略） */
export function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

/** 掷筊落地音 — 两片圣杯先后撞击 + 木头共振 */
export function playThrowSound() {
  try {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // 两片圣杯落地时间差（模拟先后落地）
    const delays = [0, 0.08];

    delays.forEach((delay, idx) => {
      // 木头撞击 — 短促噪声爆发
      const bufLen = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        // 噪声 + 指数衰减
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;

      // 低通滤波器 — 模拟木头沉闷音色
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + idx * 300, now + delay);

      // 音量包络
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.20, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.06);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(now + delay);
    });

    // 低频共振 — 木头回响
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.08, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain2);
    gain2.connect(ctx.destination);
    osc.start(now + 0.05);
    osc.stop(now + 0.5);
  } catch (e) { /* silent */ }
}
