import { sounds } from './audio.js';

export const WHEEL_SLICES = [
  { t: 'iflas' },
  { v: 500 },
  { v: 300 },
  { v: 700 },
  { v: 200 },
  { v: 900 },
  { t: 'pas' },
  { v: 400 },
  { v: 600 },
  { v: 250 },
  { v: 800 },
  { v: 350 },
  { t: 'iflas' },
  { v: 450 },
  { v: 1000 },
  { v: 150 },
  { v: 550 },
  { v: 300 },
  { v: 650 },
  { v: 200 },
  { v: 750 },
  { v: 400 },
  { v: 1500 },
  { v: 500 }
];

export const SLICE_COLORS = [
  '#e53935',
  '#fb8c00',
  '#fdd835',
  '#43a047',
  '#1e88e5',
  '#8e24aa',
  '#ec407a',
  '#00acc1'
];

export const NUM_SLICES = WHEEL_SLICES.length;
export const STEP_ANGLE = (2 * Math.PI) / NUM_SLICES;

export function getSliceAtAngle(angle) {
  let a = -angle % (2 * Math.PI);
  if (a < 0) a += 2 * Math.PI;
  return Math.floor(a / STEP_ANGLE) % NUM_SLICES;
}

export function drawWheel(canvas, angle) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 600;
  const center = size / 2; // 300
  const radius = 280;

  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(center, center);

  // Outer gold rim
  const rimGrad = ctx.createRadialGradient(0, 0, 250, 0, 0, 298);
  rimGrad.addColorStop(0, '#8a5a00');
  rimGrad.addColorStop(0.5, '#ffd54f');
  rimGrad.addColorStop(1, '#a06b00');
  ctx.beginPath();
  ctx.arc(0, 0, 298, 0, 2 * Math.PI);
  ctx.fillStyle = rimGrad;
  ctx.fill();

  ctx.rotate(angle);

  // Draw 24 slices
  for (let i = 0; i < NUM_SLICES; i++) {
    const slice = WHEEL_SLICES[i];
    const startAngle = i * STEP_ANGLE - Math.PI / 2;
    const endAngle = startAngle + STEP_ANGLE;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, startAngle, endAngle);
    ctx.closePath();

    if (slice.t === 'iflas') {
      ctx.fillStyle = '#151515';
    } else if (slice.t === 'pas') {
      ctx.fillStyle = '#f2f2f2';
    } else if (slice.v >= 1000) {
      ctx.fillStyle = '#c0c0c0';
    } else {
      ctx.fillStyle = SLICE_COLORS[i % SLICE_COLORS.length];
    }
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Slice text
    ctx.save();
    ctx.rotate(startAngle + STEP_ANGLE / 2);

    const text = slice.t === 'iflas' ? 'İFLAS' : slice.t === 'pas' ? 'PAS' : String(slice.v);

    if (slice.t === 'iflas') {
      ctx.fillStyle = '#fff';
    } else if (slice.t === 'pas') {
      ctx.fillStyle = '#c62828';
    } else if (slice.v >= 1000) {
      ctx.fillStyle = '#1a1a1a';
    } else if (SLICE_COLORS[i % SLICE_COLORS.length] === '#fdd835') {
      ctx.fillStyle = '#3a2600';
    } else {
      ctx.fillStyle = '#fff';
    }

    const fontSize = text.length > 4 ? 27 : 31;
    ctx.font = `900 ${fontSize}px Arial`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,.4)';
    ctx.shadowBlur = slice.t ? 0 : 3;
    ctx.fillText(text, radius - 16, 1);
    ctx.restore();
  }

  // Draw 24 outer pegs/pins
  for (let i = 0; i < NUM_SLICES; i++) {
    const pinAngle = i * STEP_ANGLE - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(pinAngle) * 289, Math.sin(pinAngle) * 289, 5.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#fffbe0';
    ctx.fill();
  }

  ctx.restore();

  // Center button / hub
  const centerGrad = ctx.createRadialGradient(290, 290, 5, 300, 300, 52);
  centerGrad.addColorStop(0, '#fff6c2');
  centerGrad.addColorStop(1, '#c58b00');
  ctx.beginPath();
  ctx.arc(300, 300, 50, 0, 2 * Math.PI);
  ctx.fillStyle = centerGrad;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#7a5200';
  ctx.stroke();

  // Center text "ÇEVİR"
  ctx.fillStyle = '#5a3a00';
  ctx.font = '900 22px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ÇEVİR', 300, 301);

  // Top Pointer / Needle
  ctx.beginPath();
  ctx.moveTo(278, 0);
  ctx.lineTo(322, 0);
  ctx.lineTo(300, 48);
  ctx.closePath();
  ctx.fillStyle = '#d50000';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
}

export function spinWheel(canvas, state) {
  return new Promise(resolve => {
    const startAngle = state.cark;
    const totalRotation = 2 * Math.PI * (3 + Math.random() * 2) + Math.random() * 2 * Math.PI;
    const duration = 4000 + Math.random() * 1200;
    const startTime = performance.now();
    let lastSlice = getSliceAtAngle(startAngle);

    function frame(now) {
      const p = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      state.cark = startAngle + totalRotation * ease;
      drawWheel(canvas, state.cark);

      const currentSlice = getSliceAtAngle(state.cark);
      if (currentSlice !== lastSlice) {
        lastSlice = currentSlice;
        sounds.tik();
      }

      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        state.cark %= (2 * Math.PI);
        resolve(WHEEL_SLICES[getSliceAtAngle(state.cark)]);
      }
    }
    requestAnimationFrame(frame);
  });
}
