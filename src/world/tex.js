// Текстуры, нарисованные в canvas: кирпич, кровля, надписи, флаги.
import * as THREE from 'three';
import { rng } from '../core.js';

const FONT = '"Vollkorn", Georgia, serif';
const SANS = '"Golos Text", "Segoe UI", Arial, sans-serif';

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c, { repeat, srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}

// Кирпич 250 × 65 мм, шов 10 мм. Плитка 1,6 × 1,6 м
export function brick(seed = 1, base = [214, 188, 142]) {
  const [c, x] = canvas(512, 512), r = rng(seed);
  x.fillStyle = '#b9a98c'; x.fillRect(0, 0, 512, 512);
  const rowH = 512 / 21.33, bw = 512 / 6.15;
  for (let row = 0; row < 22; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let k = -1; k < 8; k++) {
      const v = 0.86 + r() * 0.22, warm = r() * 14;
      x.fillStyle = `rgb(${base[0] * v + warm},${base[1] * v + warm * 0.6},${base[2] * v})`;
      x.fillRect(k * bw + off + 1.4, row * rowH + 1.4, bw - 2.8, rowH - 2.8);
    }
  }
  for (let i = 0; i < 2600; i++) { x.fillStyle = `rgba(80,60,40,${r() * 0.12})`; x.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2); }
  return tex(c, { repeat: [1 / 1.6, 1 / 1.6] });
}

// Цоколь: побелка и цветные кирпичи, как на настоящей школе
export function plinthBand() {
  const [c, x] = canvas(512, 64), r = rng(4);
  x.fillStyle = '#ece6da'; x.fillRect(0, 0, 512, 64);
  const colors = ['#4f9c8e', '#5f8fc4', '#c35f45', '#d8b250', '#7fb069', '#f2efe7'];
  const bw = 512 / 6.15, rowH = 64 / 2.66;
  for (let row = 0; row < 3; row++) for (let k = -1; k < 8; k++) {
    const off = row % 2 ? bw / 2 : 0;
    x.fillStyle = row === 1 && r() < 0.55 ? colors[Math.floor(r() * colors.length)] : `rgb(${236 - r() * 16},${230 - r() * 16},${218 - r() * 16})`;
    x.fillRect(k * bw + off + 1.5, row * rowH + 1.5, bw - 3, rowH - 3);
  }
  const t = tex(c); t.wrapS = THREE.RepeatWrapping;
  return t;
}

export function roofSeams(color = '#4d5964') {
  const [c, x] = canvas(256, 256);
  x.fillStyle = color; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 32) { x.fillStyle = 'rgba(255,255,255,.16)'; x.fillRect(i, 0, 3, 256); x.fillStyle = 'rgba(0,0,0,.22)'; x.fillRect(i + 3, 0, 2, 256); }
  return tex(c, { repeat: [0.5, 0.5] });
}

export function planks(color = '#b07b47') {
  const [c, x] = canvas(256, 256), r = rng(12);
  x.fillStyle = color; x.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 256; i += 21) {
    x.fillStyle = `rgba(${r() < 0.5 ? 255 : 0},${r() < 0.5 ? 220 : 0},${r() < 0.5 ? 170 : 0},${0.04 + r() * 0.07})`; x.fillRect(0, i, 256, 21);
    x.fillStyle = 'rgba(60,35,15,.35)'; x.fillRect(0, i, 256, 1.5);
  }
  for (let i = 0; i < 300; i++) { x.strokeStyle = `rgba(70,40,15,${r() * 0.12})`; x.beginPath(); const y = r() * 256; x.moveTo(r() * 256, y); x.lineTo(r() * 256, y + (r() - 0.5) * 3); x.stroke(); }
  return tex(c, { repeat: [0.4, 0.4] });
}

// Белая ромашка с жёлтой серединой: такие нарисованы на восточной стене
export function daisy() {
  const [c, x] = canvas(256, 256);
  x.translate(128, 128);
  for (let i = 0; i < 9; i++) {
    x.save(); x.rotate((i / 9) * Math.PI * 2 + 0.2);
    x.fillStyle = '#fbfaf4'; x.beginPath(); x.ellipse(0, -62, 20, 58, 0, 0, Math.PI * 2); x.fill();
    x.restore();
  }
  x.fillStyle = '#e1b640'; x.beginPath(); x.arc(0, 0, 22, 0, Math.PI * 2); x.fill();
  return tex(c);
}

export function textPlane(lines, { w = 1024, h = 256, color = '#3a2414', bg = null, font = FONT, weight = 700, size = 120, align = 'center', stroke = null } = {}) {
  const [c, x] = canvas(w, h);
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = color; x.textAlign = align; x.textBaseline = 'middle';
  const list = Array.isArray(lines) ? lines : [lines];
  list.forEach((l, i) => {
    const s = typeof l === 'object' ? l : { t: l };
    x.font = `${s.weight || weight} ${s.size || size}px ${s.font || font}`;
    const y = (h / (list.length + 1)) * (i + 1);
    if (stroke) { x.lineWidth = 6; x.strokeStyle = stroke; x.strokeText(s.t, align === 'center' ? w / 2 : 30, y); }
    x.fillText(s.t, align === 'center' ? w / 2 : 30, y);
  });
  return tex(c);
}

// Знак школы: ёлка из стрелок, как на фасаде визуализации
export function emblem(color = '#5a3a1f') {
  const [c, x] = canvas(256, 256);
  x.strokeStyle = color; x.lineWidth = 12; x.lineCap = 'round';
  x.beginPath(); x.moveTo(128, 18); x.lineTo(128, 238); x.stroke();
  for (let i = 0; i < 6; i++) {
    const y = 50 + i * 32, d = 22 + i * 13;
    x.beginPath(); x.moveTo(128 - d, y + d * 0.8); x.lineTo(128, y); x.lineTo(128 + d, y + d * 0.8); x.stroke();
  }
  return tex(c);
}

export function flag(kind) {
  const [c, x] = canvas(256, 170);
  if (kind === 'ru') {
    [['#ffffff', 0], ['#1c57a5', 1], ['#d52b1e', 2]].forEach(([f, i]) => { x.fillStyle = f; x.fillRect(0, (i * 170) / 3, 256, 170 / 3 + 1); });
  } else if (kind === 'rb') {
    [['#0066b3', 0], ['#ffffff', 1], ['#00965e', 2]].forEach(([f, i]) => { x.fillStyle = f; x.fillRect(0, (i * 170) / 3, 256, 170 / 3 + 1); });
    // Цветок курая в центре
    x.fillStyle = '#f2b51c'; x.translate(128, 85);
    for (let i = 0; i < 7; i++) { x.save(); x.rotate(-1.2 + i * 0.4); x.beginPath(); x.ellipse(0, -20, 4, 16, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
    x.fillRect(-2, -6, 4, 26);
  } else {
    // Флаг района: семь волнистых полос и белый журавль
    const cols = ['#2c6db5', '#ffffff', '#3f9a54', '#ffffff', '#2c6db5', '#ffffff', '#3f9a54'];
    cols.forEach((f, i) => {
      x.fillStyle = f; x.beginPath();
      const y0 = (i * 170) / 7, y1 = ((i + 1) * 170) / 7 + 1;
      x.moveTo(0, y0);
      for (let q = 0; q <= 256; q += 8) x.lineTo(q, y0 + Math.sin(q * 0.05) * 3);
      for (let q = 256; q >= 0; q -= 8) x.lineTo(q, y1 + Math.sin(q * 0.05) * 3);
      x.fill();
    });
    x.fillStyle = '#2c6db5'; x.fillRect(0, 0, 256, 60);
    x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(30, 40); x.lineTo(70, 18); x.lineTo(110, 22); x.lineTo(80, 30); x.lineTo(120, 44); x.lineTo(76, 40); x.lineTo(46, 52); x.closePath(); x.fill();
  }
  return tex(c);
}

// Разметка спортплощадки и корта
export function courtLines(w, d, color, lines = '#f6f1e6') {
  const s = 24, [c, x] = canvas(Math.round(w * s), Math.round(d * s));
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = lines; x.lineWidth = 3;
  x.strokeRect(s, s, c.width - 2 * s, c.height - 2 * s);
  x.beginPath(); x.moveTo(c.width / 2, s); x.lineTo(c.width / 2, c.height - s); x.stroke();
  x.beginPath(); x.arc(c.width / 2, c.height / 2, 2.4 * s, 0, Math.PI * 2); x.stroke();
  x.strokeRect(s, c.height / 2 - 3 * s, 3 * s, 6 * s); x.strokeRect(c.width - 4 * s, c.height / 2 - 3 * s, 3 * s, 6 * s);
  return tex(c);
}

export { SANS, FONT };
