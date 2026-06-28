// ═══ 手势检测 — 任意手向上抛 ═══

/** 单手上抛检测器。追踪手腕 Y 坐标，检测快速上移 */
export class HandGesture {
  constructor() {
    this.history = [];
    this.cooldown = 0;
    this.onThrow = null; // 回调
  }

  /** @param {Array} landmarksArr — MediaPipe HandLandmarker 返回的 landmarks */
  update(landmarksArr) {
    if (this.cooldown > 0) { this.cooldown--; return; }

    // 取第一只手的手腕 (landmark 0)
    let wrist = null;
    if (landmarksArr && landmarksArr.length > 0 && landmarksArr[0] && landmarksArr[0].length > 0) {
      wrist = landmarksArr[0][0];
    }
    if (!wrist) { this.history = []; return; }

    const now = performance.now();
    this.history.push({ y: wrist.y, t: now });
    while (this.history.length > 25) this.history.shift();
    if (this.history.length < 10) return;

    // 比较前后两半：Y 减小 = 手向上移动
    const mid = Math.floor(this.history.length / 2);
    const firstHalf = this.history.slice(0, mid);
    const secondHalf = this.history.slice(mid);

    const avgOld = firstHalf.reduce((s, p) => s + p.y, 0) / firstHalf.length;
    const avgNew = secondHalf.reduce((s, p) => s + p.y, 0) / secondHalf.length;
    const dy = avgOld - avgNew; // >0 = 向上
    const dt = (secondHalf[secondHalf.length - 1].t - firstHalf[0].t) / 1000;
    const speed = dt > 0 ? dy / dt : 0;

    // 阈值：上移 >7% 画面高度，速度 >0.4/s
    if (dy > 0.07 && speed > 0.4) {
      this.cooldown = 50; // ~1.7 秒冷却
      this.history = [];
      if (this.onThrow) this.onThrow();
    }
  }
}
