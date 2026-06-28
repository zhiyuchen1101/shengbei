// ═══ Three.js 场景 — 圣杯、供桌、动画 ═══
import * as THREE from 'three';
import { playThrowSound } from './audio.js';

const State = { IDLE: 0, THROW: 1, RESULT: 2 };

let scene, renderer, camera;
let blockA, blockB;
let particleGroup, smokeSystem;
let animState = State.IDLE;
let animTime = 0, idleTime = 0;
let throwData = null;
let activeParticles = [];
let container;

export function init(containerEl) {
  container = containerEl;

  // 渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  container.appendChild(renderer.domElement);

  // 场景
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 20);
  camera.position.set(0, 0, 7);
  camera.lookAt(0, 0, 0);

  // 灯光
  scene.add(new THREE.AmbientLight('#f5f0e8', 2.5));
  const keyLight = new THREE.DirectionalLight('#fffdf5', 3.5);
  keyLight.position.set(3, 5, 4);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(512, 512);
  keyLight.shadow.camera.near = 0.5; keyLight.shadow.camera.far = 20;
  keyLight.shadow.camera.left = -5; keyLight.shadow.camera.right = 5;
  keyLight.shadow.camera.top = 5; keyLight.shadow.camera.bottom = -5;
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight('#ffe0cc', 1.2);
  fillLight.position.set(-2, 2, -1); scene.add(fillLight);

  // 供桌
  const tableGeo = new THREE.BoxGeometry(1.8, 0.08, 1.0);
  const tableMat = new THREE.MeshStandardMaterial({ color: '#d5c8b5', roughness: 0.75, metalness: 0 });
  const table = new THREE.Mesh(tableGeo, tableMat);
  table.position.set(0, -1.45, 0);
  table.receiveShadow = true; table.castShadow = true;
  scene.add(table);

  // 圣杯
  const shape = makeShape();
  blockA = makeBlock(shape, '#c0392b', '#8b6914');
  blockB = makeBlock(shape, '#c0392b', '#8b6914');
  blockA.rotation.set(-0.2, 0, 0);
  blockB.rotation.set(-0.2, 0, 0);
  scene.add(blockA);
  scene.add(blockB);

  // 粒子组
  particleGroup = new THREE.Group();
  scene.add(particleGroup);

  // 香火
  smokeSystem = createSmoke();
  scene.add(smokeSystem);

  resize();
  window.addEventListener('resize', resize);
}

function makeShape() {
  const s = new THREE.Shape();
  s.absarc(0, 0, 0.65, -Math.PI * 0.55, Math.PI * 0.55, false);
  s.absarc(0, -0.09, 0.50, Math.PI * 0.55, -Math.PI * 0.55, true);
  return s;
}

function makeBlock(shape, flatColor, curvedColor) {
  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1, depth: 0.07,
    bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 4,
  });
  const mesh = new THREE.Mesh(geo, [
    new THREE.MeshStandardMaterial({ color: curvedColor, roughness: 0.45, metalness: 0.08 }),
    new THREE.MeshStandardMaterial({ color: flatColor,   roughness: 0.25, metalness: 0.12 }),
    new THREE.MeshStandardMaterial({ color: curvedColor, roughness: 0.50, metalness: 0.08 }),
  ]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function createSmoke() {
  const geo = new THREE.BufferGeometry();
  const positions = [];
  for (let i = 0; i < 40; i++) {
    positions.push((Math.random() - 0.5) * 1.5, Math.random() * 2 - 1.5, (Math.random() - 0.5) * 1.2);
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: '#c8b898', size: 0.022, transparent: true, opacity: 0.25,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

// ═══ 粒子 ═══
function spawnParticles(pos) {
  for (let i = 0; i < 20; i++) {
    const g = new THREE.SphereGeometry(0.01 + Math.random() * 0.02, 4, 4);
    const m = new THREE.MeshBasicMaterial({
      color: Math.random() < 0.5 ? '#c8b060' : '#d4956b',
      transparent: true, opacity: 1,
    });
    const p = new THREE.Mesh(g, m);
    p.position.copy(pos);
    p.userData = {
      velocity: new THREE.Vector3((Math.random() - 0.5) * 1, Math.random() * 1.5 + 0.6, (Math.random() - 0.5) * 0.8),
      life: 1, decay: 0.5 + Math.random() * 0.6,
    };
    particleGroup.add(p);
    activeParticles.push(p);
  }
}

function updateParticles(dt) {
  for (let i = activeParticles.length - 1; i >= 0; i--) {
    const p = activeParticles[i];
    p.userData.life -= p.userData.decay * dt;
    if (p.userData.life <= 0) {
      particleGroup.remove(p);
      p.geometry.dispose();
      p.material.dispose();
      activeParticles.splice(i, 1);
    } else {
      p.userData.velocity.y -= 2.5 * dt;
      p.position.x += p.userData.velocity.x * dt;
      p.position.y += p.userData.velocity.y * dt;
      p.position.z += p.userData.velocity.z * dt;
      p.material.opacity = p.userData.life;
      p.scale.setScalar(p.userData.life);
    }
  }
}

// ═══ 状态控制 ═══
let onResultCallback = null;
export function onResult(fn) { onResultCallback = fn; }

function weightedPick() {
  const r = Math.random() * 4;
  if (r < 2) return 's';
  if (r < 3) return 'x';
  return 'y';
}

export function triggerThrow() {
  if (animState !== State.IDLE) return;
  animState = State.THROW;
  animTime = 0;

  const resultKey = weightedPick();
  let fa, fb;
  if (resultKey === 's') { fa = Math.random() < 0.5; fb = !fa; }
  else if (resultKey === 'x') { fa = true; fb = true; }
  else { fa = false; fb = false; }

  const tilt = -0.35;
  throwData = {
    resultKey, fa, fb,
    offsetAX: (Math.random() - 0.5) * 0.8, offsetAZ: (Math.random() - 0.5) * 0.5,
    offsetBX: (Math.random() - 0.5) * 0.8, offsetBZ: (Math.random() - 0.5) * 0.5,
    startRotAX: (Math.random() - 0.5) * 3, startRotAY: (Math.random() - 0.5) * 3, startRotAZ: (Math.random() - 0.5) * 3,
    startRotBX: (Math.random() - 0.5) * 3, startRotBY: (Math.random() - 0.5) * 3, startRotBZ: (Math.random() - 0.5) * 3,
    endRotAX: fa ? tilt : Math.PI + tilt,
    endRotBX: fb ? tilt : Math.PI + tilt,
  };
}

// ═══ 动画循环 ═══
const clock = new THREE.Clock();

export function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  updateParticles(dt);

  // 香火粒子
  if (smokeSystem) {
    const pos = smokeSystem.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i + 1] += dt * 0.2;
      pos[i] += Math.sin(i + idleTime * 2) * dt * 0.04;
      if (pos[i + 1] > 1.5) pos[i + 1] = -1.5;
    }
    smokeSystem.geometry.attributes.position.needsUpdate = true;
  }

  if (animState === State.IDLE) {
    idleTime += dt;
    const fy = Math.sin(idleTime * 0.9) * 0.04;
    blockA.position.set(0, fy + 0.02, 0);
    blockB.position.set(0, fy - 0.01, 0);
    blockA.rotation.set(-0.2, idleTime * 0.2, Math.sin(idleTime * 0.6) * 0.015);
    blockB.rotation.set(-0.2, -idleTime * 0.18, Math.cos(idleTime * 0.6) * 0.015);
  }

  if (animState === State.THROW) {
    animTime += dt;
    const t = Math.min(animTime / 1.4, 1);
    const upPhase = 0.08;
    let y;
    if (t < upPhase) {
      y = (t / upPhase) * 2.2;
    } else {
      // 简单缓出 — 单次落地，不弹跳
      const d2 = (t - upPhase) / (1 - upPhase);
      const ease = 1 - Math.pow(1 - d2, 3); // easeOutCubic
      y = 2.2 + (-2.0 - 2.2) * ease;
    }
    const horizEase = t < 0.2 ? t / 0.2 : 1;
    blockA.position.set(throwData.offsetAX * horizEase, y, throwData.offsetAZ * horizEase);
    blockB.position.set(throwData.offsetBX * horizEase, y, throwData.offsetBZ * horizEase);

    const rotT = Math.max(0, (t - upPhase) / (1 - upPhase));
    blockA.rotation.set(
      throwData.startRotAX + (throwData.endRotAX - throwData.startRotAX) * rotT + Math.sin(t * 15) * 0.2 * (1 - rotT),
      throwData.startRotAY + t * 9,
      throwData.startRotAZ,
    );
    blockB.rotation.set(
      throwData.startRotBX + (throwData.endRotBX - throwData.startRotBX) * rotT + Math.cos(t * 13) * 0.2 * (1 - rotT),
      throwData.startRotBY - t * 7,
      throwData.startRotBZ,
    );

    if (t >= 1) {
      spawnParticles(blockA.position.clone());
      spawnParticles(blockB.position.clone());
      blockA.rotation.set(throwData.endRotAX, throwData.startRotAY + 9, throwData.startRotAZ);
      blockB.rotation.set(throwData.endRotBX, throwData.startRotBY - 7, throwData.startRotBZ);
      playThrowSound();
      animState = State.RESULT;
      animTime = 0;
      if (onResultCallback) onResultCallback(throwData.resultKey);
    }
  }

  if (animState === State.RESULT) {
    animTime += dt;
    if (animTime > 2.0) {
      animState = State.IDLE;
      animTime = 0;
      throwData = null;
    }
  }

  renderer.render(scene, camera);
}

export function resize() {
  if (!container) return;
  const r = container.getBoundingClientRect();
  if (!r.width || !r.height) return;
  renderer.setSize(r.width, r.height);
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
}
