// Деревья, трава и дома деревни.
import * as THREE from 'three';
import { G, T, gy, rng, unpack, inPoly, landSDF, minRect, SCHOOL_ID } from '../core.js';
import { PLOT, ORCHARD, SPRUCES, BIRCHES, CLUMPS, CIRCLE, ARTFIELD, PATHS, CABINS, POND, COURT, TREE_ROWS, LAWNS } from '../plan.js';
import { PATCH } from './terrain.js';

const SKIP_BUILDINGS = new Set([SCHOOL_ID, 1416518231, 1289106989]);

// Крона: шар с шумом, плавная светотень, снизу и внутри темнее, как у настоящей листвы
function crown(detail, seed, sy = 1, rough = 0.2) {
  const g = new THREE.IcosahedronGeometry(1, detail);
  const p = g.attributes.position, r = rng(seed), map = new Map();
  for (let i = 0; i < p.count; i++) {
    const key = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!map.has(key)) map.set(key, 1 + (r() - 0.5) * 2 * rough);
    const k = map.get(key);
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * sy, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}
function shade(g, low = 0.55) {
  const p = g.attributes.position, col = new Float32Array(p.count * 3);
  let y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i < p.count; i++) { y0 = Math.min(y0, p.getY(i)); y1 = Math.max(y1, p.getY(i)); }
  for (let i = 0; i < p.count; i++) { const t = (p.getY(i) - y0) / (y1 - y0 || 1), v = low + (1 - low) * Math.pow(t, 0.7); col.set([v, v, v * 0.96], i * 3); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}
// Крона из нескольких шаров: живой силуэт
function cluster(detail, seed) {
  const r = rng(seed), parts = [[0, 0, 0, 1], [0.55, 0.32, 0.2, 0.72], [-0.5, 0.22, -0.3, 0.76], [0.08, 0.62, -0.4, 0.6], [-0.15, -0.2, 0.5, 0.66]];
  const pos = [], nor = [];
  parts.forEach(([x, y, z, s], i) => {
    const g = crown(detail, seed + i * 7, 1, 0.2).toNonIndexed(); g.scale(s, s, s); g.translate(x + (r() - 0.5) * 0.1, y, z);
    for (let k = 0; k < g.attributes.position.count; k++) { pos.push(g.attributes.position.getX(k), g.attributes.position.getY(k), g.attributes.position.getZ(k)); nor.push(g.attributes.normal.getX(k), g.attributes.normal.getY(k), g.attributes.normal.getZ(k)); }
  });
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.scale(0.8, 0.8, 0.8);
  return shade(out);
}

function spruceGeo() {
  const parts = [];
  const tiers = [[1, 0.9, 1.1], [0.8, 1.6, 1], [0.6, 2.3, 0.95], [0.4, 2.95, 0.85], [0.2, 3.5, 0.7]];
  for (const [r, y, h] of tiers) { const c = new THREE.ConeGeometry(r, h * 1.35, 9); c.translate(0, y, 0); parts.push(c.toNonIndexed()); }
  const t = new THREE.CylinderGeometry(0.07, 0.09, 0.8, 5); t.translate(0, 0.4, 0); parts.push(t.toNonIndexed());
  const pos = [], nor = [], col = [];
  const green = new THREE.Color('#2f4c37'), tip = new THREE.Color('#4d6b45'), bark = new THREE.Color('#4b3826'), c = new THREE.Color();
  parts.forEach((g, n) => {
    g.computeVertexNormals();
    for (let i = 0; i < g.attributes.position.count; i++) {
      const y = g.attributes.position.getY(i);
      c.copy(n === parts.length - 1 ? bark : green).lerp(tip, n === parts.length - 1 ? 0 : Math.min(y / 4, 1) * 0.6);
      pos.push(g.attributes.position.getX(i), y, g.attributes.position.getZ(i)); nor.push(g.attributes.normal.getX(i), g.attributes.normal.getY(i), g.attributes.normal.getZ(i)); col.push(c.r, c.g, c.b);
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// Цветущая крона яблони: белое с розовым, немного листвы, тень книзу
function blossomGeo() {
  const g = crown(2, 7, 0.82, 0.16);
  const p = g.attributes.position, r = rng(9), col = [];
  const white = new THREE.Color('#fff7f9'), pink = new THREE.Color('#f3b6c9'), leaf = new THREE.Color('#a7c46e'), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const k = r(), t = (p.getY(i) + 0.82) / 1.64;
    c.copy(k < 0.55 ? white : k < 0.82 ? pink : leaf).multiplyScalar((0.6 + 0.4 * t) * (0.94 + r() * 0.1));
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

function instanced(geo, mat, list, { cast = true, receive = true } = {}) {
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  const o = new THREE.Object3D(), c = new THREE.Color();
  list.forEach((t, i) => {
    o.position.set(t.x, t.y, t.z); o.rotation.set(0, t.ry || 0, 0); o.scale.set(t.sx, t.sy, t.sz ?? t.sx); o.updateMatrix();
    m.setMatrixAt(i, o.matrix);
    if (t.c) m.setColorAt(i, c.set(t.c));
  });
  m.castShadow = cast; m.receiveShadow = receive; m.frustumCulled = false;
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  return m;
}

const near = (x, y, pts, d) => pts.some(([a, b]) => Math.hypot(x - a, y - b) < d);
function nearLine(x, y, lines, d) {
  for (const l of lines) for (let i = 0; i + 1 < l.length; i++) {
    const [ax, ay] = l[i], [bx, by] = l[i + 1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1;
    const t = Math.min(Math.max(((x - ax) * dx + (y - ay) * dy) / L, 0), 1);
    if (Math.hypot(x - ax - t * dx, y - ay - t * dy) < d) return true;
  }
  return false;
}

// Газон только у школы, у домиков и на поляне. Остальное луг
const onLawn = (x, y) => LAWNS.some((l) => x > l.x0 && x < l.x1 && y > l.y0 && y < l.y1) || Math.hypot(x - CIRCLE.x, y - CIRCLE.y) < CIRCLE.r + 16;

export function buildNature(parent, { quality }) {
  const r = rng(77);
  const leafMat = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.88 });
  const roads = G.roads.map((q) => unpack(q.p));
  const inside = (x, y, m = 20) => landSDF(x, y) < -m;

  // Лес по контурам OpenStreetMap
  const forest = [];
  const greens = ['#5b7d3c', '#6a8a40', '#7c9446', '#55763d', '#86994a', '#648446'];
  for (const l of G.land) {
    if (l.k !== 'wood' && l.k !== 'scrub') continue;
    const p = unpack(l.p);
    const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
    const x0 = Math.max(Math.min(...xs), T.xMin), x1 = Math.min(Math.max(...xs), T.xMax), y0 = Math.max(Math.min(...ys), T.yMin), y1 = Math.min(Math.max(...ys), T.yMax);
    if (x1 <= x0 || y1 <= y0) continue;
    const want = ((x1 - x0) * (y1 - y0)) / (l.k === 'scrub' ? 260 : 95);
    for (let k = 0; k < want && forest.length < quality.forest; k++) {
      const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0);
      if (!inside(x, y) || !inPoly(x, y, p) || inPoly(x, y, PLOT) || nearLine(x, y, roads, 5)) continue;
      const s = (l.k === 'scrub' ? 2.2 : 3.6) + r() * 3.2;
      forest.push({ x, y: gy(x, y) + s * 0.75, z: -y, sx: s, sy: s * (0.9 + r() * 0.5), ry: r() * 6, c: greens[Math.floor(r() * greens.length)] });
    }
  }
  for (const b of G.buildings) {
    if (SKIP_BUILDINGS.has(b.id)) continue;
    const m = minRect(unpack(b.p));
    for (let k = 0; k < 2; k++) {
      const a = r() * 6.28, d = 9 + r() * 14, x = m.cx + Math.cos(a) * d, y = m.cy + Math.sin(a) * d;
      if (!inside(x, y) || nearLine(x, y, roads, 4) || inPoly(x, y, PLOT)) continue;
      const s = 2.4 + r() * 2;
      forest.push({ x, y: gy(x, y) + s * 0.8, z: -y, sx: s, sy: s, ry: r() * 6, c: r() < 0.3 ? '#efe8ec' : greens[Math.floor(r() * greens.length)] });
    }
  }
  for (const w of G.water) {
    if (w.u) continue;
    const p = unpack(w.p);
    for (let i = 0; i + 1 < p.length; i++) {
      const [ax, ay] = p[i], [bx, by] = p[i + 1], l = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / l, ny = (bx - ax) / l;
      for (let k = 0; k < l / 9; k++) {
        const t = r(), side = r() < 0.5 ? -1 : 1, off = (w.c === 'river' ? 9 : 5) + r() * 9;
        const x = ax + (bx - ax) * t + nx * off * side, y = ay + (by - ay) * t + ny * off * side;
        if (!inside(x, y)) continue;
        const s = 3 + r() * 3.5;
        forest.push({ x, y: gy(x, y) + s * 0.7, z: -y, sx: s, sy: s * 1.1, ry: r() * 6, c: greens[Math.floor(r() * greens.length)] });
      }
    }
  }
  parent.add(instanced(cluster(0, 3), leafMat, forest));

  // Ели участка
  const spruceMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  const spruces = SPRUCES.map(([x, y]) => { const s = 2.1 + r() * 1.1; return { x, y: gy(x, y), z: -y, sx: s, sy: s * (1.1 + r() * 0.3), ry: r() * 6 }; });
  parent.add(instanced(spruceGeo(), spruceMat, spruces));

  // Берёзы, старые деревья вдоль сада и купы на поляне
  const trunkMat = new THREE.MeshStandardMaterial({ color: '#efeae0', roughness: 0.7 });
  const barkMat = new THREE.MeshStandardMaterial({ color: '#5a4430', roughness: 0.9 });
  const birchTrunks = [], crowns = [], oldTrunks = [];
  for (const [x, y] of BIRCHES) {
    const h = 9 + r() * 5;
    birchTrunks.push({ x, y: gy(x, y) + h / 2, z: -y, sx: 0.2, sy: h, sz: 0.2 });
    crowns.push({ x: x + (r() - 0.5), y: gy(x, y) + h * 0.74, z: -y, sx: 2 + r() * 0.6, sy: 3.4 + r(), ry: r() * 6, c: r() < 0.5 ? '#c9c06a' : '#a9b85c' });
  }
  for (const [[ax, ay], [bx, by]] of TREE_ROWS) {
    const l = Math.hypot(bx - ax, by - ay), n = Math.round(l / 7);
    for (let k = 0; k <= n; k++) {
      const x = ax + ((bx - ax) * k) / n + (r() - 0.5) * 1.5, y = ay + ((by - ay) * k) / n + (r() - 0.5) * 2, s = 3.2 + r() * 1.6, g = gy(x, y);
      crowns.push({ x, y: g + 3.4 + s * 0.9, z: -y, sx: s, sy: s * 1.1, ry: r() * 6, c: greens[Math.floor(r() * greens.length)] });
      oldTrunks.push({ x, y: g + 1.8, z: -y, sx: 0.32, sy: 3.6, sz: 0.32 });
    }
  }
  for (const [x, y, s] of CLUMPS) for (let k = 0; k < 3; k++) {
    const qx = x + (r() - 0.5) * s, qy = y + (r() - 0.5) * s, q = 3 + r() * 2.5;
    crowns.push({ x: qx, y: gy(qx, qy) + q * 1.1, z: -qy, sx: q, sy: q * 1.05, ry: r() * 6, c: greens[Math.floor(r() * greens.length)] });
  }
  parent.add(instanced(new THREE.CylinderGeometry(0.5, 0.6, 1, 6), trunkMat, birchTrunks));
  parent.add(instanced(new THREE.CylinderGeometry(0.4, 0.55, 1, 6), barkMat, oldTrunks));
  parent.add(instanced(cluster(1, 5), leafMat, crowns));

  // Цветущий сад: ряды яблонь в полосе между старыми деревьями
  const apples = [], appleTrunks = [];
  for (let y = ORCHARD.y1 - 2.5; y > ORCHARD.y0; y -= 5.6) for (let x = ORCHARD.x0 + 2; x < ORCHARD.x1; x += 5.8) {
    if (r() < 0.06) continue;
    const qx = x + (r() - 0.5) * 0.8, qy = y + (r() - 0.5) * 0.8, s = 1.5 + r() * 0.5, g = gy(qx, qy);
    apples.push({ x: qx, y: g + 1.5 + s * 0.55, z: -qy, sx: s, sy: s, ry: r() * 6 });
    appleTrunks.push({ x: qx, y: g + 0.8, z: -qy, sx: 0.13, sy: 1.6, sz: 0.13 });
  }
  parent.add(instanced(blossomGeo(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 }), apples));
  parent.add(instanced(new THREE.CylinderGeometry(0.5, 0.7, 1, 5), barkMat, appleTrunks));

  // Луг: высокая трава и полевые цветы, газон чистый
  const tufts = [], blooms = [];
  const avoid = Object.values(PATHS);
  const flowerCols = ['#f4f0ff', '#f0c34f', '#c99be6', '#ef9fbe', '#ffffff', '#e8735a', '#9fb4f0'];
  const addTuft = (x, y, tall = 1) => {
    const s = (0.35 + r() * 0.5) * tall;
    tufts.push({ x, y: gy(x, y), z: -y, sx: s, sy: s * (1.4 + r() * 1.8), ry: r() * 6, c: r() < 0.4 ? '#c2ad62' : r() < 0.5 ? '#a3ab55' : '#d3bd76' });
    if (r() < 0.28) blooms.push({ x: x + 0.25, y: gy(x, y) + s * 1.6, z: -y, sx: 0.17, sy: 0.17, c: flowerCols[Math.floor(r() * flowerCols.length)] });
  };
  for (let k = 0; tufts.length < quality.tufts && k < quality.tufts * 4; k++) {
    const x = PATCH.xMin + 10 + r() * (PATCH.xMax - PATCH.xMin - 20), y = PATCH.yMin + 10 + r() * (PATCH.yMax - PATCH.yMin - 20);
    if (inPoly(x, y, ARTFIELD) && r() < 0.7) continue;
    if (onLawn(x, y)) continue;
    if (x > ORCHARD.x0 - 1 && x < ORCHARD.x1 + 1 && y > ORCHARD.y0 - 1 && y < ORCHARD.y1 + 1 && r() < 0.6) continue;
    if (nearLine(x, y, avoid, 2.4) || nearLine(x, y, roads, 4) || near(x, y, CABINS, 6)) continue;
    if (Math.abs(x - COURT.x) < COURT.w / 2 + 2 && Math.abs(y - COURT.y) < COURT.d / 2 + 2) continue;
    if (Math.hypot((x - POND.x) / (POND.rx + 2), (y - POND.y) / (POND.ry + 2)) < 1) continue;
    addTuft(x, y, inPoly(x, y, PLOT) ? 1.1 : 1);
  }
  // Цветник вдоль фасада, как на визуализации: травы и цветы, проход к порталу свободен
  for (let k = 0; k < quality.beds; k++) {
    const x = -8 + r() * 42, y = -9.8 - r() * 3.2;
    if (x > 5 && x < 20) continue;
    addTuft(x, y, 0.6);
    if (r() < 0.45) blooms.push({ x, y: gy(x, y) + 0.45 + r() * 0.3, z: -y, sx: 0.16, sy: 0.16, c: flowerCols[Math.floor(r() * flowerCols.length)] });
  }
  const tuft = new THREE.ConeGeometry(0.35, 1, 4); tuft.translate(0, 0.5, 0);
  parent.add(instanced(tuft, new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, flatShading: true }), tufts, { cast: false }));
  parent.add(instanced(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, emissive: '#2a2010' }), blooms, { cast: false }));

  return { apples: apples.length };
}

// Дома деревни: стены и двускатная крыша по прямоугольнику контура
export function buildVillage(parent) {
  const r = rng(91);
  const walls = ['#e2d3b2', '#d7b98c', '#c79a62', '#eadfc7', '#cdb79d', '#b88a5d', '#e7cf8e', '#d9c6a8'];
  const roofs = ['#b53a2c', '#a8432f', '#3c6a8a', '#447c6c', '#6a6c70', '#7a4b36', '#2f5e86', '#8b2f2b', '#5d7d3c'];
  const pos = [], col = [];
  const c = new THREE.Color();
  const tri = (a, b, d, color) => { pos.push(...a, ...b, ...d); for (let i = 0; i < 3; i++) col.push(color.r, color.g, color.b); };
  const quad = (a, b, d, e, color) => { tri(a, b, d, color); tri(a, d, e, color); };
  let count = 0;
  for (const b of G.buildings) {
    if (SKIP_BUILDINGS.has(b.id)) continue;
    const p = unpack(b.p);
    const m = minRect(p);
    if (landSDF(m.cx, m.cy) > -15) continue;
    const area = m.w * m.d, big = area > 220, tiny = area < 36;
    const wallH = tiny ? 2.3 : big ? 4.2 : 2.9, roofH = tiny ? 1.1 : big ? 2.6 : 2.3;
    let { w, d, ang } = m;
    if (d > w) { [w, d] = [d, w]; ang += Math.PI / 2; }
    const ux = Math.cos(ang), uy = Math.sin(ang), vx = -uy, vy = ux;
    const base = Math.min(...p.map(([x, y]) => gy(x, y))) - 0.25;
    const P = (u, v, h) => { const x = m.cx + u * ux + v * vx, y = m.cy + u * uy + v * vy; return [x, base + h, -y]; };
    const hw = w / 2, hd = d / 2, o = 0.45;
    const wc = c.set(walls[Math.floor(r() * walls.length)]).clone(), rc = new THREE.Color(roofs[Math.floor(r() * roofs.length)]);
    const sh = wc.clone().multiplyScalar(0.86);
    quad(P(-hw, -hd, 0), P(hw, -hd, 0), P(hw, -hd, wallH), P(-hw, -hd, wallH), wc);
    quad(P(hw, hd, 0), P(-hw, hd, 0), P(-hw, hd, wallH), P(hw, hd, wallH), wc);
    quad(P(hw, -hd, 0), P(hw, hd, 0), P(hw, hd, wallH), P(hw, -hd, wallH), sh);
    quad(P(-hw, hd, 0), P(-hw, -hd, 0), P(-hw, -hd, wallH), P(-hw, hd, wallH), sh);
    tri(P(hw, -hd, wallH), P(hw, hd, wallH), P(hw, 0, wallH + roofH), sh);
    tri(P(-hw, hd, wallH), P(-hw, -hd, wallH), P(-hw, 0, wallH + roofH), sh);
    quad(P(-hw - o, -hd - o, wallH - 0.3), P(hw + o, -hd - o, wallH - 0.3), P(hw + o, 0, wallH + roofH), P(-hw - o, 0, wallH + roofH), rc);
    quad(P(hw + o, hd + o, wallH - 0.3), P(-hw - o, hd + o, wallH - 0.3), P(-hw - o, 0, wallH + roofH), P(hw + o, 0, wallH + roofH), rc);
    count++;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, side: THREE.DoubleSide }));
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh);
  return count;
}
