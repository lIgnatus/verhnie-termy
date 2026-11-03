// Школа: Т-образный корпус по контуру из OpenStreetMap, отделка как на визуализации.
// Локальные оси: X вдоль южного фасада (u), Z = -v (вглубь, на север).
import * as THREE from 'three';
import { Batch, gy, W, rng } from '../core.js';
import { ROOMS } from '../content.js';
import { brick, roofSeams, planks, textPlane, emblem } from './tex.js';

const BAR = { w: 41.7, d: 16 };
const WING = { u0: 14, u1: 25, v1: 38 };
const L1 = 0.5, L2 = 4.0, TOP = 7.5, WING_TOP = 5.8, WALL = 0.38;
// Окна стоят по ровной сетке с шагом 3,6 м, вход ровно по центру фасада
const MID = BAR.w / 2, BAY = 3.6;
const BAYS = Array.from({ length: 11 }, (_, i) => MID + (i - 5) * BAY);

function mats() {
  return {
    brick: new THREE.MeshStandardMaterial({ map: brick(3, [226, 208, 172]), roughness: 0.9 }),
    frame: new THREE.MeshStandardMaterial({ color: '#25292d', roughness: 0.45, metalness: 0.25 }),
    sill: new THREE.MeshStandardMaterial({ color: '#4a4f54', roughness: 0.5, metalness: 0.3 }),
    glass: new THREE.MeshStandardMaterial({ color: '#c99a62', emissive: '#ffbd6e', emissiveIntensity: 0.62, roughness: 0.12, metalness: 0.15 }),
    glassCool: new THREE.MeshStandardMaterial({ color: '#8fa4b4', emissive: '#ffd39a', emissiveIntensity: 0.3, roughness: 0.08, metalness: 0.35 }),
    wood: new THREE.MeshStandardMaterial({ map: planks('#bb8550'), roughness: 0.72 }),
    woodV: new THREE.MeshStandardMaterial({ map: planks('#b67f4b'), roughness: 0.72 }),
    darkWood: new THREE.MeshStandardMaterial({ color: '#6b4a2f', roughness: 0.8 }),
    floor: new THREE.MeshStandardMaterial({ map: planks('#c9a374'), roughness: 0.8 }),
    floorLight: new THREE.MeshStandardMaterial({ color: '#d9d3c6', roughness: 0.9 }),
    concrete: new THREE.MeshStandardMaterial({ color: '#bdb6aa', roughness: 0.95 }),
    plinth: new THREE.MeshStandardMaterial({ map: brick(5, [196, 178, 146]), roughness: 0.95 }),
    slab: new THREE.MeshStandardMaterial({ color: '#d8d1c3', roughness: 0.95 }),
    partition: new THREE.MeshStandardMaterial({ color: '#f1ebdf', roughness: 0.9 }),
    metal: new THREE.MeshStandardMaterial({ color: '#59636b', roughness: 0.45, metalness: 0.5 }),
    white: new THREE.MeshStandardMaterial({ color: '#f4f2ee', roughness: 0.6 }),
    teal: new THREE.MeshStandardMaterial({ color: '#4f9c8e', roughness: 0.7 }),
    terracotta: new THREE.MeshStandardMaterial({ color: '#c35f45', roughness: 0.8 }),
    ochre: new THREE.MeshStandardMaterial({ color: '#d8b250', roughness: 0.8 }),
    blue: new THREE.MeshStandardMaterial({ color: '#5f8fc4', roughness: 0.8 }),
    green: new THREE.MeshStandardMaterial({ color: '#6f9a4f', roughness: 0.85 }),
    screen: new THREE.MeshStandardMaterial({ color: '#203040', emissive: '#bfe0ff', emissiveIntensity: 0.65 }),
    dark: new THREE.MeshStandardMaterial({ color: '#2b2f33', roughness: 0.6 }),
    fabric: new THREE.MeshStandardMaterial({ color: '#8c9a7a', roughness: 1 }),
    bed: new THREE.MeshStandardMaterial({ color: '#efe7da', roughness: 1 }),
    lamp: new THREE.MeshStandardMaterial({ color: '#fff1c9', emissive: '#ffcf7a', emissiveIntensity: 2.2 }),
    roof: new THREE.MeshStandardMaterial({ map: roofSeams('#5d666f'), roughness: 0.42, metalness: 0.4, side: THREE.DoubleSide }),
  };
}

// Стена с проёмами. Идёт от (u0,v0) к (u1,v1) против часовой, толщина уходит внутрь.
// Проёмы задаются по абсолютной координате вдоль фасада (u или v), а не от начала стены
function wall(b, m, u0, v0, u1, v1, y0, h, holes, glassMat) {
  const len = Math.hypot(u1 - u0, v1 - v0);
  const along = u0 !== u1 ? (s) => Math.abs(s - u0) : (s) => Math.abs(s - v0);
  const s = new THREE.Shape(); s.moveTo(0, 0); s.lineTo(len, 0); s.lineTo(len, h); s.lineTo(0, h); s.closePath();
  const list = holes.map((o) => ({ ...o, x: along(o.at) }));
  for (const o of list) {
    const p = new THREE.Path(); p.moveTo(o.x - o.w / 2, o.y); p.lineTo(o.x + o.w / 2, o.y); p.lineTo(o.x + o.w / 2, o.y + o.h); p.lineTo(o.x - o.w / 2, o.y + o.h); p.closePath();
    s.holes.push(p);
  }
  const M = new THREE.Matrix4().makeRotationY(Math.atan2(v1 - v0, u1 - u0)).setPosition(u0, y0, -v0);
  const g = new THREE.ExtrudeGeometry(s, { depth: WALL, bevelEnabled: false });
  g.translate(0, 0, -WALL); g.applyMatrix4(M);
  b.push(m.brick, g);
  // Рамы как на визуализации: тёмный профиль, три створки и фрамуга
  for (const o of list) {
    const part = (mat, w, hh, d, x, y, z) => { const q = new THREE.BoxGeometry(w, hh, d); q.translate(x, y, z); q.applyMatrix4(M); b.push(mat, q); };
    const zc = -0.14, f = 0.1;
    part(m.frame, o.w, f, 0.14, o.x, o.y + f / 2, zc); part(m.frame, o.w, f, 0.14, o.x, o.y + o.h - f / 2, zc);
    part(m.frame, f, o.h, 0.14, o.x - o.w / 2 + f / 2, o.y + o.h / 2, zc); part(m.frame, f, o.h, 0.14, o.x + o.w / 2 - f / 2, o.y + o.h / 2, zc);
    part(m.sill, o.w + 0.12, 0.05, 0.26, o.x, o.y - 0.03, 0.08);
    if (o.door) {
      part(m.frame, f * 0.8, o.h, 0.1, o.x, o.y + o.h / 2, zc);
      part(m.frame, o.w, f * 0.8, 0.1, o.x, o.y + o.h * 0.82, zc);
      part(o.door, o.w - 0.16, o.h - 0.1, 0.03, o.x, o.y + o.h / 2, zc);
      continue;
    }
    for (const k of [-1, 1]) part(m.frame, f * 0.7, o.h, 0.1, o.x + (k * o.w) / 6, o.y + o.h / 2, zc);
    part(m.frame, o.w, f * 0.7, 0.1, o.x, o.y + o.h * 0.74, zc);
    part(glassMat, o.w - 0.1, o.h - 0.1, 0.03, o.x, o.y + o.h / 2, zc);
  }
}

const win = (at, y, w = 2.3, h = 2.0) => ({ at, y, w, h });

// Скатная крыша: вальма над прямоугольником
function hipRoof(w, d, rise, over) {
  const r = Math.min(w, d) / 2 + over, ox = -over, oz = over;
  const A = [ox, 0, oz], B = [w + over, 0, oz], C = [w + over, 0, -d - over], D = [ox, 0, -d - over];
  const long = w >= d;
  const R1 = long ? [r - over, rise, -d / 2] : [w / 2, rise, -(r - over)], R2 = long ? [w - r + over, rise, -d / 2] : [w / 2, rise, -d + r - over];
  const pos = [], uv = [];
  const face = (pts, axis) => { for (const p of pts) { pos.push(...p); uv.push(axis === 'x' ? p[0] : -p[2], Math.hypot(p[1], axis === 'x' ? p[2] : p[0])); } };
  if (long) {
    face([A, B, R2, A, R2, R1], 'x'); face([C, D, R1, C, R1, R2], 'x'); face([D, A, R1], 'z'); face([B, C, R2], 'z');
  } else {
    face([A, B, R1], 'x'); face([C, D, R2], 'x'); face([D, A, R1, D, R1, R2], 'z'); face([B, C, R2, B, R2, R1], 'z');
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return g;
}

function furnish(b, m, room, y) {
  const r = rng(room.id.length * 31 + room.u[0] * 7);
  const [u0, u1] = room.u, [v0, v1] = room.v, w = u1 - u0, d = v1 - v0, cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  const chair = (u, v, mat = m.teal) => { b.box(mat, 0.45, 0.45, 0.45, u, y + 0.23, -v); b.box(mat, 0.45, 0.5, 0.06, u, y + 0.7, -v - 0.2); };
  const table = (u, v, tw, td, mat = m.wood, h = 0.75) => { b.box(mat, tw, 0.06, td, u, y + h, -v); for (const [a, c] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(m.darkWood, 0.06, h, 0.06, u + a * (tw / 2 - 0.1), y + h / 2, -v + c * (td / 2 - 0.1)); };
  const floorMat = { eng: m.concrete, print: m.floorLight, kitchen: m.floorLight, media: m.floorLight }[room.kind] || m.floor;
  b.box(floorMat, w - 0.2, 0.04, d - 0.2, cu, y + 0.02, -cv);
  switch (room.kind) {
    case 'eng':
      for (let i = 0; i < 3; i++) { table(u0 + 2 + i * 3.6, v0 + 1.3, 2.6, 1, m.wood, 0.9); b.box(m.metal, 0.5, 0.3, 0.4, u0 + 2 + i * 3.6, y + 1.08, -(v0 + 1.3)); }
      b.box(m.metal, 1.6, 1.3, 1, u0 + 3, y + 0.65, -(v0 + 4.6)); b.box(m.metal, 1.2, 1.6, 0.9, u0 + 6.4, y + 0.8, -(v0 + 4.8));
      b.box(m.ochre, 0.9, 1.9, 0.5, u0 + 9.6, y + 0.95, -(v0 + 5.9)); b.box(m.darkWood, 0.08, 1.6, 4.5, u0 + 0.5, y + 1.6, -cv);
      table(u0 + 9.4, v0 + 3.6, 2.4, 1.6, m.wood, 0.9);
      break;
    case 'hall':
      b.box(m.wood, 3.2, 1.05, 0.7, cu + 1.5, y + 0.52, -(v0 + 4.2)); b.box(m.teal, 3.4, 0.08, 0.8, cu + 1.5, y + 1.08, -(v0 + 4.2));
      for (let i = 0; i < 3; i++) b.box(m.white, 0.1, 1.9, 1.4, u0 + 1.5 + i * 2.2, y + 0.95, -(v0 + 2 + (i % 2) * 1.2));
      b.box(m.wood, 2.6, 0.45, 0.5, cu - 2.4, y + 0.23, -(v0 + 5.8));
      break;
    case 'cowork':
      for (let i = 0; i < 3; i++) { const u = u0 + 3.5 + i * 6; table(u, v0 + 2.6, 4.6, 1.2); for (let k = -2; k <= 2; k++) { chair(u + k * 0.9, v0 + 1.7, m.ochre); chair(u + k * 0.9, v0 + 3.5, m.ochre); } }
      for (let i = 0; i < Math.floor(w / 2.6); i++) b.box(i % 2 ? m.wood : m.darkWood, 2.4, 2.4, 0.4, u0 + 1.6 + i * 2.6, y + 1.2, -(v1 - 0.4));
      b.box(m.fabric, 1, 0.5, 1, u1 - 2.2, y + 0.25, -(v0 + 5.2)); b.box(m.fabric, 1, 0.5, 1, u1 - 3.6, y + 0.25, -(v0 + 5.2));
      break;
    case 'print':
      for (let i = 0; i < 4; i++) { table(u0 + 1.6 + i * 2.8, v1 - 0.8, 2.4, 0.9, m.white, 0.85); b.box(m.dark, 0.6, 0.7, 0.6, u0 + 1.2 + i * 2.8, y + 1.2, -(v1 - 0.8)); b.box(m.terracotta, 0.6, 0.7, 0.6, u0 + 2.1 + i * 2.8, y + 1.2, -(v1 - 0.8)); }
      table(cu, v0 + 2.6, 4, 1.6, m.wood, 0.9);
      break;
    case 'foyer':
      b.cyl(m.wood, 0.45, 0.45, 1.05, cu - 2, y + 0.52, -(v0 + 3)); b.cyl(m.wood, 0.45, 0.45, 1.05, cu + 1.4, y + 0.52, -(v0 + 3.6));
      b.box(m.fabric, 3, 0.45, 0.9, cu, y + 0.22, -(v1 - 0.8)); b.box(m.fabric, 3, 0.6, 0.2, cu, y + 0.6, -(v1 - 0.3));
      b.box(m.wood, 2.4, 1.05, 0.7, u1 - 1.8, y + 0.52, -(v0 + 1.4));
      break;
    case 'kitchen':
      b.box(m.white, w - 1.4, 0.92, 0.65, cu, y + 0.46, -(v1 - 0.45)); b.box(m.wood, w - 1.4, 0.05, 0.7, cu, y + 0.94, -(v1 - 0.45));
      b.box(m.white, 0.8, 2, 0.7, u1 - 0.9, y + 1, -(v1 - 0.45)); b.box(m.wood, 3, 0.92, 1.1, u0 + 3, y + 0.46, -(v0 + 3.6));
      table(u0 + 8.8, v0 + 2.6, 7, 1.2);
      for (let k = 0; k < 7; k++) { chair(u0 + 5.8 + k, v0 + 1.7, m.terracotta); chair(u0 + 5.8 + k, v0 + 3.5, m.terracotta); }
      break;
    case 'bighall':
      b.box(m.wood, w - 1, 0.5, 3.4, cu, y + 0.25, -(v1 - 2));
      b.box(m.screen, 6.4, 3.4, 0.08, cu, y + 2.7, -(v1 - 0.3));
      for (let row = 0; row < 9; row++) for (let k = 0; k < 9; k++) if (k !== 4) chair(u0 + 1.3 + k * 1.05, v0 + 2 + row * 1.6, row % 3 ? m.dark : m.terracotta);
      break;
    case 'lecture':
      for (let t = 0; t < 4; t++) { b.box(m.wood, 0.9, 0.3 + t * 0.3, d - 1.2, u0 + 4 + t * 1.6, y + (0.3 + t * 0.3) / 2, -cv); for (let k = 0; k < 6; k++) chair(u0 + 4 + t * 1.6, v0 + 0.9 + k * 0.92, m.teal); }
      b.box(m.screen, 0.06, 2.4, 4.2, u0 + 0.6, y + 1.9, -cv);
      break;
    case 'class':
      for (let i = 0; i < 4; i++) { const u = u0 + 2 + (i % 2) * 5.6 + 1, v = v0 + 1.8 + Math.floor(i / 2) * 2.8; table(u, v, 2.2, 1.4); for (const [a, c] of [[-0.6, -1], [0.6, -1], [-0.6, 1], [0.6, 1]]) chair(u + a, v + c, m.ochre); }
      b.box(m.dark, 0.06, 1.3, 3.6, u1 - 0.3, y + 1.6, -cv);
      break;
    case 'project':
      table(cu, cv, 6.5, 2.2, m.wood, 0.85);
      for (let i = 0; i < 8; i++) b.box(i % 3 ? m.white : m.ochre, 0.4 + r() * 0.6, 0.2 + r() * 0.6, 0.4 + r() * 0.5, cu - 2.8 + i * 0.8, y + 1.1, -(cv + (r() - 0.5) * 1.2));
      for (let k = -3; k <= 3; k++) { chair(cu + k * 0.9, cv - 1.6, m.blue); chair(cu + k * 0.9, cv + 1.6, m.blue); }
      b.box(m.white, w - 2, 1.6, 0.06, cu, y + 1.6, -(v1 - 0.2));
      break;
    case 'art':
      for (let i = 0; i < 6; i++) { const u = u0 + 1.6 + (i % 3) * 3.3, v = v0 + 1.5 + Math.floor(i / 3) * 3; b.box(m.wood, 0.08, 1.8, 0.08, u, y + 0.9, -v, 0, 0.2); b.box(i % 2 ? m.white : m.ochre, 1, 0.8, 0.04, u, y + 1.4, -v + 0.25, 0, 0.2); }
      table(u1 - 2.4, v0 + 3.4, 1.6, 3, m.wood, 0.9);
      break;
    case 'media':
      b.box(m.white, w - 3, 3, 0.1, cu, y + 1.5, -(v1 - 0.3)); b.box(m.white, w - 3, 0.04, 2.4, cu, y + 0.03, -(v1 - 1.5));
      for (const s of [-1, 1]) { b.box(m.dark, 0.06, 2.2, 0.06, cu + s * 3, y + 1.1, -(v0 + 2.6)); b.box(m.white, 0.7, 0.7, 0.3, cu + s * 3, y + 2.3, -(v0 + 2.6)); }
      table(u0 + 2, v0 + 1.2, 2.6, 0.9); b.box(m.screen, 1.4, 0.8, 0.06, u0 + 2, y + 1.25, -(v0 + 1.4));
      break;
    case 'stay':
      for (let i = 0; i < 3; i++) { const a = u0 + i * (w / 3); b.box(m.bed, 0.95, 0.45, 2, a + 0.8, y + 0.23, -(v1 - 1.3)); b.box(m.bed, 0.95, 0.45, 2, a + 2.5, y + 0.23, -(v1 - 1.3)); b.box(m.wood, 1.1, 0.75, 0.6, a + 3.6, y + 0.38, -(v0 + 0.6)); }
      break;
  }
}

function partitions(b, m, y, list) {
  const h = 3.15, t = 0.14;
  for (const [u0, v0, u1, v1, gaps = []] of list) {
    const horiz = v0 === v1;
    const a = horiz ? u0 : v0, c = horiz ? u1 : v1;
    const cuts = gaps.map((g) => [g - 0.6, g + 0.6]).sort((p, q) => p[0] - q[0]);
    let s = a;
    for (const [g0, g1] of [...cuts, [c, c]]) {
      if (g0 - s > 0.05) {
        if (horiz) b.box(m.partition, g0 - s, h, t, (s + g0) / 2, y + h / 2, -v0);
        else b.box(m.partition, t, h, g0 - s, u0, y + h / 2, -((s + g0) / 2));
      }
      s = g1;
    }
  }
}

function stairs(b, m, u0, v0, y) {
  for (let i = 0; i < 11; i++) b.box(m.concrete, 2.4, 0.16 * (i + 1), 0.3, u0 + 1.3, y + 0.08 * (i + 1), -(v0 + 6.2 - i * 0.3));
}

export function buildSchool(parent) {
  const root = new THREE.Group();
  const o = W(-8.5, -6.5);
  root.position.set(o.x, gy(12, 8), o.z);
  root.rotation.y = -0.0724;
  parent.add(root);

  const f1 = new THREE.Group(), f2 = new THREE.Group(), roofBar = new THREE.Group(), roofWing = new THREE.Group();
  root.add(f1, f2, roofBar, roofWing);
  const m1 = mats(), m2 = mats(), mr = mats(), mw = mats();
  for (const set of [m2, mr, mw]) for (const mat of Object.values(set)) mat.transparent = true;

  // Цоколь
  const b1 = new Batch();
  b1.box(m1.plinth, BAR.w + 0.2, L1 + 0.6, BAR.d + 0.2, BAR.w / 2, (L1 - 0.6) / 2, -BAR.d / 2);
  b1.box(m1.plinth, WING.u1 - WING.u0 + 0.2, L1 + 0.6, WING.v1 - BAR.d + 0.2, (WING.u0 + WING.u1) / 2, (L1 - 0.6) / 2, -(BAR.d + WING.v1) / 2);

  // Первый этаж: окна по сетке, вход в центре, сбоку от двери стеклянные панели
  const H1 = L2 - L1, sill = 0.8;
  const portal = [MID - BAY, MID, MID + BAY];
  const southW1 = BAYS.filter((u) => !portal.includes(u)).map((u) => win(u, sill));
  southW1.push({ at: MID, y: 0, w: 2.6, h: 2.8, door: m1.glass }, { at: MID - BAY, y: 0, w: 2.2, h: 2.8, door: m1.glass }, { at: MID + BAY, y: 0, w: 2.2, h: 2.8, door: m1.glass });
  wall(b1, m1, 0, 0, BAR.w, 0, L1, H1, southW1, m1.glass);
  wall(b1, m1, BAR.w, 0, BAR.w, BAR.d, L1, H1, [win(4, sill), { at: 8, y: 0, w: 1.6, h: 2.5, door: m1.glass }, win(12, sill)], m1.glass);
  wall(b1, m1, BAR.w, BAR.d, WING.u1, BAR.d, L1, H1, BAYS.filter((u) => u > WING.u1 + 1.5 && u < BAR.w - 1.5).map((u) => win(u, sill)), m1.glassCool);
  const wingWins = [18.75, 24.25, 29.75, 35.25].map((v) => win(v, 1.1, 2.4, 3.2));
  wall(b1, m1, WING.u1, BAR.d, WING.u1, WING.v1, L1, WING_TOP - L1, wingWins, m1.glass);
  wall(b1, m1, WING.u1, WING.v1, WING.u0, WING.v1, L1, WING_TOP - L1, [win(16.5, 2.8, 1.8, 1.5), win(19.5, 2.8, 1.8, 1.5), win(22.5, 2.8, 1.8, 1.5)], m1.glassCool);
  wall(b1, m1, WING.u0, WING.v1, WING.u0, BAR.d, L1, WING_TOP - L1, wingWins, m1.glass);
  wall(b1, m1, WING.u0, BAR.d, 0, BAR.d, L1, H1, [win(BAYS[0], sill), win(BAYS[1], sill), { at: BAYS[2], y: 0, w: 1.6, h: 2.5, door: m1.wood }], m1.glassCool);
  wall(b1, m1, 0, BAR.d, 0, 0, L1, H1, [win(4, sill), { at: 8, y: 0, w: 1.6, h: 2.5, door: m1.glass }, win(12, sill)], m1.glass);

  b1.box(m1.slab, WING.u1 - WING.u0 - 0.4, 0.2, WING.v1 - BAR.d - 0.4, (WING.u0 + WING.u1) / 2, L1 - 0.05, -(BAR.d + WING.v1) / 2);
  partitions(b1, m1, L1, [
    [0, 6.8, 12.4, 6.8, [6]], [22, 6.8, BAR.w, 6.8, [25, 37]],
    [2.6, 9.4, 14, 9.4, [8]], [25, 9.4, 39.1, 9.4, [28]],
    [12.4, 0, 12.4, 6.8], [22, 0, 22, 6.8], [2.6, 9.4, 2.6, BAR.d], [14, 9.4, 14, BAR.d], [25, 9.4, 25, BAR.d], [39.1, 9.4, 39.1, BAR.d],
    [WING.u0, BAR.d, WING.u1, BAR.d, [19.5]],
  ]);
  stairs(b1, m1, 0, 9.4, L1); stairs(b1, m1, 39.1, 9.4, L1);

  // Деревянный портал по центру фасада, как на визуализации
  const pw = BAY * 2 + 1.2, pu0 = MID - pw / 2, pu1 = MID + pw / 2, pd = 3.4, eave = 4.4, ridge = 6.6;
  b1.box(m1.wood, pw + 1.6, 0.3, pd + 2.4, MID, 0.15, (pd + 2.4) / 2);
  for (let i = 0; i < 3; i++) b1.box(m1.wood, pw + 1.2 - i * 0.3, 0.17, 0.4, MID, 0.36 + i * 0.17 - 0.17 * 2, pd + 2.4 + (2 - i) * 0.4 - 0.4);
  for (const u of [pu0 + 0.25, pu1 - 0.25]) for (const z of [0.4, pd - 0.25]) b1.box(m1.wood, 0.34, eave, 0.34, u, L1 + eave / 2 - 0.2, z);
  b1.box(m1.wood, pw, 0.42, 0.42, MID, L1 + eave, pd - 0.25);
  // Фронтон из досок и скаты
  const gable = new THREE.Shape(); gable.moveTo(-pw / 2 - 0.4, 0); gable.lineTo(pw / 2 + 0.4, 0); gable.lineTo(0, ridge - eave); gable.closePath();
  const gg = new THREE.ExtrudeGeometry(gable, { depth: 0.3, bevelEnabled: false }); gg.translate(MID, L1 + eave + 0.2, pd - 0.3); b1.push(m1.woodV, gg);
  const half = pw / 2 + 0.6, slope = Math.atan2(ridge - eave, half), len = Math.hypot(ridge - eave, half) + 0.2;
  for (const s of [-1, 1]) b1.box(mr.roof.clone(), len, 0.18, pd + 0.8, MID + s * (half / 2), L1 + eave + 0.2 + (ridge - eave) / 2 + 0.05, pd / 2, 0, 0, -s * slope);
  // Обшивка вокруг двери и фонари по сторонам
  b1.box(m1.woodV, pw - 0.6, 0.9, 0.12, MID, L1 + 3.25, 0.08);
  for (const s of [-1, 1]) { b1.box(m1.frame, 0.26, 0.42, 0.26, MID + s * (pw / 2 - 0.9), L1 + 2.4, pd - 0.08); b1.box(m1.lamp, 0.18, 0.3, 0.18, MID + s * (pw / 2 - 0.9), L1 + 2.4, pd - 0.08); }
  b1.into(f1);

  // Вывеска слева от входа и знак-ёлка, как на визуализации
  const name = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 1.25), new THREE.MeshStandardMaterial({ map: textPlane([{ t: 'ВЕРХНИЕ ТЕРМЫ', size: 196 }], { w: 2048, h: 272, color: '#3f3328', font: '"Golos Text", "Segoe UI", Arial, sans-serif', weight: 600 }), transparent: true, roughness: 0.8 }));
  name.position.set(8.2, L2 + 1.95, 0.03); f2.add(name);
  const sub = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 1.3), new THREE.MeshStandardMaterial({ map: textPlane([{ t: 'ШКОЛА РАЗВИТИЯ', size: 92 }, { t: 'СЕЛЬСКИХ ТЕРРИТОРИЙ', size: 92 }], { w: 1600, h: 280, color: '#3f3328', font: '"Golos Text", "Segoe UI", Arial, sans-serif', weight: 500, align: 'left' }), transparent: true, roughness: 0.8 }));
  sub.position.set(7.4, L2 + 0.55, 0.03); f2.add(sub);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), new THREE.MeshStandardMaterial({ map: emblem('#7a5532'), transparent: true }));
  logo.position.set(1.8, L2 + 1.25, 0.04); f2.add(logo);

  // Второй этаж: окна над окнами первого, слева глухой участок под вывеску
  const b2 = new Batch();
  const southW2 = BAYS.filter((u) => u > 12).map((u) => win(u, sill));
  wall(b2, m2, 0, 0, BAR.w, 0, L2, TOP - L2, southW2, m2.glass);
  wall(b2, m2, BAR.w, 0, BAR.w, BAR.d, L2, TOP - L2, [win(4, sill), win(8, sill), win(12, sill)], m2.glass);
  wall(b2, m2, BAR.w, BAR.d, 0, BAR.d, L2, TOP - L2, BAYS.filter((u) => u < WING.u0 - 1.5 || u > WING.u1 + 1.5).map((u) => win(u, sill)), m2.glassCool);
  wall(b2, m2, 0, BAR.d, 0, 0, L2, TOP - L2, [win(4, sill), win(8, sill), win(12, sill)], m2.glass);
  b2.box(m2.slab, BAR.w - 0.2, 0.25, BAR.d - 0.2, BAR.w / 2, L2 - 0.12, -BAR.d / 2);
  partitions(b2, m2, L2, [
    [0, 6.8, 14, 6.8, [7]], [14, 6.8, 26, 6.8, [20]], [26, 6.8, BAR.w, 6.8, [33]],
    [2.6, 9.4, 14, 9.4, [8]], [14, 9.4, 25, 9.4, [19.5]], [25, 9.4, 39.1, 9.4, [27, 31.6, 36.2]],
    [14, 0, 14, 6.8], [26, 0, 26, 6.8], [2.6, 9.4, 2.6, BAR.d], [14, 9.4, 14, BAR.d], [25, 9.4, 25, BAR.d], [39.1, 9.4, 39.1, BAR.d], [29.7, 9.4, 29.7, BAR.d], [34.4, 9.4, 34.4, BAR.d],
  ]);
  // Карниз между этажами
  b2.box(m2.sill, BAR.w + 0.1, 0.12, 0.1, BAR.w / 2, TOP - 0.25, 0.03);
  b2.into(f2);

  const fb1 = new Batch(), fb2 = new Batch();
  for (const room of ROOMS) furnish(room.floor === 1 ? fb1 : fb2, room.floor === 1 ? m1 : m2, room, room.floor === 1 ? L1 : L2);
  fb1.into(f1, { cast: false }); fb2.into(f2, { cast: false });

  // Крыши: тёмный фальц, вальма
  const rb = new THREE.Mesh(hipRoof(BAR.w, BAR.d, 3.4, 0.75), mr.roof); rb.castShadow = true; rb.receiveShadow = true;
  rb.position.y = TOP; roofBar.add(rb);
  const rbf = new Batch();
  rbf.box(mr.slab, BAR.w - 0.2, 0.2, BAR.d - 0.2, BAR.w / 2, TOP - 0.1, -BAR.d / 2);
  rbf.box(mr.frame, BAR.w + 1.5, 0.22, 0.14, BAR.w / 2, TOP - 0.05, 0.75); rbf.box(mr.frame, BAR.w + 1.5, 0.22, 0.14, BAR.w / 2, TOP - 0.05, -BAR.d - 0.75);
  rbf.box(mr.dark, 0.7, 1.6, 0.7, 9, TOP + 2.3, -5); rbf.box(mr.dark, 0.7, 1.6, 0.7, 33, TOP + 2.3, -11);
  rbf.into(roofBar);
  const rw = new THREE.Mesh(hipRoof(WING.u1 - WING.u0, WING.v1 - BAR.d + 0.8, 2.4, 0.6), mw.roof); rw.castShadow = true;
  rw.position.set(WING.u0, WING_TOP, -BAR.d + 0.8); roofWing.add(rw);
  const tb = new Batch();
  for (let v = BAR.d + 2; v < WING.v1; v += 3.2) { tb.box(mw.wood, WING.u1 - WING.u0 - 0.4, 0.22, 0.22, (WING.u0 + WING.u1) / 2, WING_TOP + 0.1, -v); tb.box(mw.wood, 0.2, 1.8, 0.2, (WING.u0 + WING.u1) / 2, WING_TOP + 0.9, -v); }
  tb.into(roofWing, { cast: false });

  const rooms = [];
  for (const room of ROOMS) {
    const [u0, u1] = room.u, [v0, v1] = room.v, y = room.floor === 1 ? L1 : L2, h = room.kind === 'bighall' ? WING_TOP - L1 : 3.2;
    const hit = new THREE.Mesh(new THREE.BoxGeometry(u1 - u0 - 0.3, h, v1 - v0 - 0.3), new THREE.MeshBasicMaterial({ color: '#ffe3a3', transparent: true, opacity: 0, depthWrite: false }));
    hit.position.set((u0 + u1) / 2, y + h / 2, -(v0 + v1) / 2);
    hit.userData.room = room;
    (room.floor === 1 ? f1 : f2).add(hit);
    rooms.push(hit);
  }

  const groups = { f1, f2, roofBar, roofWing };
  const fade = (set, a) => { for (const mat of Object.values(set)) mat.opacity = a; };
  let level = 0, shown = 0;
  return {
    root, rooms, groups,
    anchor(room) { const [u0, u1] = room.u, [v0, v1] = room.v; const p = new THREE.Vector3((u0 + u1) / 2, (room.floor === 1 ? L1 : L2) + 2.6, -(v0 + v1) / 2); return root.localToWorld(p); },
    setLevel(l) { level = l; },
    get level() { return level; },
    update(dt) {
      const k = Math.min(dt * 2.4, 1);
      shown += (level - shown) * k;
      if (Math.abs(level - shown) < 0.002) shown = level;
      const a = Math.min(shown, 1), c = Math.max(shown - 1, 0);
      roofBar.position.y = a * 18; roofWing.position.y = a * 14;
      fade(mr, 1 - a); fade(mw, 1 - a);
      roofBar.visible = a < 0.99; roofWing.visible = a < 0.99;
      f2.position.y = c * 16; fade(m2, 1 - c); f2.visible = c < 0.99;
      name.material.opacity = sub.material.opacity = logo.material.opacity = 1 - c;
      return shown !== level;
    },
  };
}
