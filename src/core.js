// Общие данные и помощники: высоты, координаты, случайные числа, анимация.
import * as THREE from 'three';
import geo from './geo.json';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const G = geo;
export const T = geo.terrain;
export const VE = 1.2; // рельеф чуть вытянут, чтобы склоны читались
export const EDGE = 8, CORNER = 170;
export const SCHOOL_ID = 788449130;

let H = null;
export async function loadHeights(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error('Не загрузились высоты: ' + r.status);
  // Высоты лежат текстом в base64: так их отдаёт любой хостинг
  const bin = atob((await r.text()).trim()), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  H = new Uint16Array(bytes.buffer);
}
const PAD = T.pad - T.hMin;
export function rawH(x, y) {
  const X = Math.min(Math.max((x - T.xMin) / T.cell, 0), T.nx - 1.001), Y = Math.min(Math.max((y - T.yMin) / T.cell, 0), T.ny - 1.001);
  const i = Math.floor(X), j = Math.floor(Y), fx = X - i, fy = Y - j, n = T.nx;
  const a = H[j * n + i], b = H[j * n + i + 1], c = H[(j + 1) * n + i], d = H[(j + 1) * n + i + 1];
  return ((a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy) / 100;
}
export const gy = (x, y) => (rawH(x, y) - PAD) * VE;
export const W = (x, y, up = 0) => new THREE.Vector3(x, gy(x, y) + up, -y);

// Знаковое расстояние до скруглённого края земли, меньше нуля значит внутри
const CX = (T.xMin + T.xMax) / 2, CY = (T.yMin + T.yMax) / 2, HX = (T.xMax - T.xMin) / 2 - EDGE, HY = (T.yMax - T.yMin) / 2 - EDGE;
export function landSDF(x, y) {
  const qx = Math.abs(x - CX) - (HX - CORNER), qy = Math.abs(y - CY) - (HY - CORNER);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - CORNER;
}
export const LAND = { CX, CY, HX, HY };

export const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => t * t * (3 - 2 * t);
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// Плоский массив [x0,y0,x1,y1,...] в список точек
export const unpack = (f) => { const p = []; for (let i = 0; i + 1 < f.length; i += 2) p.push([f[i], f[i + 1]]); return p; };

export function inPoly(x, y, p) {
  let c = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

export function polyArea(p) {
  let s = 0;
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; s += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(s) / 2;
}

// Прямоугольник минимальной площади вокруг контура: центр, поворот, размеры
export function minRect(p) {
  let best = null;
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    if (l < 0.5) continue;
    const ux = dx / l, uy = dy / l;
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9;
    for (const q of p) { const u = q[0] * ux + q[1] * uy, v = -q[0] * uy + q[1] * ux; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; }
    const w = u1 - u0, d = v1 - v0;
    if (!best || w * d < best.w * best.d) { const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2; best = { w, d, cx: cu * ux - cv * uy, cy: cu * uy + cv * ux, ang: Math.atan2(uy, ux) }; }
  }
  return best;
}

// Ломаная с равномерным шагом и длиной
export function polyline(points) {
  const seg = [];
  let total = 0;
  for (let i = 0; i + 1 < points.length; i++) { const l = Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]); seg.push(l); total += l; }
  const at = (d) => {
    let t = ((d % total) + total) % total;
    for (let i = 0; i < seg.length; i++) {
      if (t <= seg[i]) { const k = seg[i] ? t / seg[i] : 0, a = points[i], b = points[i + 1]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])]; }
      t -= seg[i];
    }
    const e = points[points.length - 1]; return [e[0], e[1], 0];
  };
  return { total, at };
}

// Слитые меши по материалам: тысячи деталей рисуются за несколько вызовов
export class Batch {
  constructor() { this.groups = new Map(); }
  push(mat, geom) {
    let list = this.groups.get(mat);
    if (!list) this.groups.set(mat, (list = []));
    list.push(geom.index ? geom.toNonIndexed() : geom);
    return geom;
  }
  box(mat, w, h, d, x, y, z, ry = 0, rx = 0, rz = 0) {
    const g = new THREE.BoxGeometry(w, h, d);
    if (rz) g.rotateZ(rz);
    if (rx) g.rotateX(rx);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    return this.push(mat, g);
  }
  // Коробка по двум углам плана: удобно для мебели и стен
  span(mat, x0, z0, x1, z1, y, h) { return this.box(mat, Math.abs(x1 - x0), h, Math.abs(z1 - z0), (x0 + x1) / 2, y + h / 2, (z0 + z1) / 2); }
  cyl(mat, r0, r1, h, x, y, z, seg = 8, rx = 0, rz = 0) {
    const g = new THREE.CylinderGeometry(r0, r1, h, seg);
    if (rz) g.rotateZ(rz);
    if (rx) g.rotateX(rx);
    g.translate(x, y, z);
    return this.push(mat, g);
  }
  into(parent, { cast = true, receive = true } = {}) {
    const out = [];
    for (const [mat, list] of this.groups) {
      const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
      mesh.castShadow = cast; mesh.receiveShadow = receive;
      parent.add(mesh); out.push(mesh);
    }
    this.groups.clear();
    return out;
  }
}

// Простые анимации на числах
const tweens = new Set();
export function tween({ dur = 1, delay = 0, fn = ease, onUpdate, onDone }) {
  const t = { t: -delay, dur, fn, onUpdate, onDone, stop() { tweens.delete(t); } };
  tweens.add(t);
  return t;
}
export function stepTweens(dt) {
  for (const t of [...tweens]) {
    t.t += dt;
    if (t.t < 0) continue;
    const k = Math.min(t.t / t.dur, 1);
    t.onUpdate?.(t.fn(k), k);
    if (k >= 1) { tweens.delete(t); t.onDone?.(); }
  }
  return tweens.size > 0;
}
