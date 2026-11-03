// Готовит данные модели: высоты из Copernicus GLO-30 и объекты из OpenStreetMap.
// Запуск: node tools/prepare.mjs <файл .tif> <файл osm .json>
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const [tifPath, osmPath] = process.argv.slice(2);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Начало координат: школа. X на восток, Y на север, метры.
export const LAT0 = 54.6088, LON0 = 55.1848;
const KX = 111320 * Math.cos(LAT0 * Math.PI / 180), KY = 111320;
const toXY = (lat, lon) => [(lon - LON0) * KX, (lat - LAT0) * KY];
const RECT = { xMin: -620, xMax: 2740, yMin: -1180, yMax: 620 };
const CELL = 6;

// --- Чтение GeoTIFF ---
const b = fs.readFileSync(tifPath);
const le = b.toString('latin1', 0, 2) === 'II';
const u16 = (o) => (le ? b.readUInt16LE(o) : b.readUInt16BE(o));
const u32 = (o) => (le ? b.readUInt32LE(o) : b.readUInt32BE(o));
const f64 = (o) => (le ? b.readDoubleLE(o) : b.readDoubleBE(o));
const u64 = (o) => Number(le ? b.readBigUInt64LE(o) : b.readBigUInt64BE(o));
const big = u16(2) === 43;
let ifd = big ? u64(8) : u32(4);
const tags = {};
const count = big ? u64(ifd) : u16(ifd);
const start = ifd + (big ? 8 : 2), size = big ? 20 : 12;
const typeSize = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 12: 8, 13: 4, 16: 8, 17: 8 };
for (let i = 0; i < count; i++) {
  const p = start + i * size;
  const tag = u16(p), type = u16(p + 2), n = big ? u64(p + 4) : u32(p + 4);
  const bytes = (typeSize[type] || 1) * n;
  const valOff = bytes <= (big ? 8 : 4) ? p + (big ? 12 : 8) : big ? u64(p + 12) : u32(p + 8);
  const read = (k) => { const o = valOff + k * (typeSize[type] || 1); return type === 3 ? u16(o) : type === 4 || type === 13 ? u32(o) : type === 16 ? u64(o) : type === 12 ? f64(o) : b[o]; };
  tags[tag] = n === 1 ? read(0) : Array.from({ length: Math.min(n, 2e6) }, (_, k) => read(k));
}
const W = tags[256], H = tags[257], pred = tags[317] || 1, tw = tags[322], th = tags[323], off = tags[324], cnt = tags[325];
const scale = tags[33550], tie = tags[33922];
const lonMin = tie[3], latMax = tie[4], dLon = scale[0], dLat = scale[1];
console.log('TIFF', { W, H, tw, th, pred, dLon, dLat });

const margin = 8;
const pad = 60;
const north = LAT0 + (RECT.yMax + pad) / KY, south = LAT0 + (RECT.yMin - pad) / KY;
const west = LON0 + (RECT.xMin - pad) / KX, east = LON0 + (RECT.xMax + pad) / KX;
const x0 = Math.floor((west - lonMin) / dLon) - margin, x1 = Math.ceil((east - lonMin) / dLon) + margin;
const y0 = Math.floor((latMax - north) / dLat) - margin, y1 = Math.ceil((latMax - south) / dLat) + margin;
const cw = x1 - x0, ch = y1 - y0;
const dem = new Float32Array(cw * ch);
const cols = Math.ceil(W / tw);
for (let ty = Math.floor(y0 / th); ty <= Math.floor((y1 - 1) / th); ty++) for (let tx = Math.floor(x0 / tw); tx <= Math.floor((x1 - 1) / tw); tx++) {
  const idx = ty * cols + tx;
  const raw = zlib.inflateSync(b.subarray(off[idx], off[idx] + cnt[idx]));
  const bytes = new Uint8Array(raw.buffer, raw.byteOffset, raw.length);
  const stride = tw * 4;
  const vals = new Float32Array(tw * th);
  if (pred === 3) {
    const dv = new DataView(new ArrayBuffer(4));
    for (let r = 0; r < th; r++) {
      const row = bytes.subarray(r * stride, (r + 1) * stride);
      for (let i = 1; i < stride; i++) row[i] = (row[i] + row[i - 1]) & 255;
      for (let c = 0; c < tw; c++) {
        dv.setUint8(0, row[c]); dv.setUint8(1, row[tw + c]); dv.setUint8(2, row[2 * tw + c]); dv.setUint8(3, row[3 * tw + c]);
        vals[r * tw + c] = dv.getFloat32(0, false);
      }
    }
  } else {
    const dv = new DataView(raw.buffer, raw.byteOffset, raw.length);
    for (let i = 0; i < vals.length; i++) vals[i] = dv.getFloat32(i * 4, le);
  }
  for (let r = 0; r < th; r++) for (let c = 0; c < tw; c++) {
    const X = tx * tw + c - x0, Y = ty * th + r - y0;
    if (X >= 0 && Y >= 0 && X < cw && Y < ch) dem[Y * cw + X] = vals[r * tw + c];
  }
}
const lon0dem = lonMin + (x0 + 0.5) * dLon, lat0dem = latMax - (y0 + 0.5) * dLat;
const clampI = (v, a, b_) => (v < a ? a : v > b_ ? b_ : v);
const cr = (p0, p1, p2, p3, t) => 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
const demAt = (lat, lon) => {
  const X = (lon - lon0dem) / dLon, Y = (lat0dem - lat) / dLat;
  const xi = Math.floor(X), yi = Math.floor(Y), fx = X - xi, fy = Y - yi;
  const v = (a, c) => dem[clampI(c, 0, ch - 1) * cw + clampI(a, 0, cw - 1)];
  const row = (j) => cr(v(xi - 1, j), v(xi, j), v(xi + 1, j), v(xi + 2, j), fx);
  return cr(row(yi - 1), row(yi), row(yi + 1), row(yi + 2), fy);
};

// --- OpenStreetMap ---
const osm = JSON.parse(fs.readFileSync(osmPath, 'utf8'));
const nodes = new Map(), ways = new Map();
for (const e of osm.elements) { if (e.type === 'node') nodes.set(e.id, e); else if (e.type === 'way') ways.set(e.id, e); }
const line = (w) => w.nodes.map((i) => nodes.get(i)).filter(Boolean).map((n) => toXY(n.lat, n.lon));
const r1 = (v) => Math.round(v * 10) / 10;
const pack = (p) => p.flat().map(r1);
const inRect = (p, m = 80) => p.some(([x, y]) => x > RECT.xMin - m && x < RECT.xMax + m && y > RECT.yMin - m && y < RECT.yMax + m);
const closed = (w) => w.nodes.length > 3 && w.nodes[0] === w.nodes[w.nodes.length - 1];

const out = { buildings: [], roads: [], water: [], ponds: [], land: [] };
const landKind = (t) => t.natural === 'wood' || t.landuse === 'forest' ? 'wood' : t.landuse === 'farmland' ? 'farmland' : t.natural === 'grassland' ? 'grass' : t.landuse === 'meadow' ? 'meadow' : t.natural === 'wetland' ? 'wetland' : t.natural === 'scrub' ? 'scrub' : t.landuse === 'residential' ? 'residential' : t.landuse === 'landfill' ? 'bare' : t.landuse === 'industrial' ? 'bare' : t.leisure === 'park' ? 'park' : null;

const memberOf = new Set();
for (const e of osm.elements) if (e.type === 'relation' && e.tags) {
  const kind = landKind(e.tags);
  if (!kind) continue;
  const outs = e.members.filter((m) => m.type === 'way' && m.role !== 'inner').map((m) => ways.get(m.ref)).filter(Boolean);
  const pieces = outs.map((w) => line(w));
  outs.forEach((w) => memberOf.add(w.id));
  // Склеиваем незамкнутые куски внешнего контура
  const rings = [];
  while (pieces.length) {
    let ring = pieces.shift();
    for (let guard = 0; guard < 400 && pieces.length; guard++) {
      const end = ring[ring.length - 1];
      const near = (a, c) => Math.hypot(a[0] - c[0], a[1] - c[1]) < 0.5;
      if (near(end, ring[0])) break;
      const i = pieces.findIndex((q) => near(q[0], end) || near(q[q.length - 1], end));
      if (i < 0) break;
      const q = pieces.splice(i, 1)[0];
      ring = ring.concat(near(q[0], end) ? q : q.slice().reverse());
    }
    rings.push(ring);
  }
  for (const ring of rings) if (inRect(ring)) out.land.push({ k: kind, p: pack(ring) });
}

for (const e of osm.elements) {
  if (e.type !== 'way' || !e.tags) continue;
  const t = e.tags, p = line(e);
  if (p.length < 2 || !inRect(p)) continue;
  if (t.building) {
    out.buildings.push({ id: e.id, p: pack(p), n: t.name || undefined, a: t['addr:housenumber'] || undefined, s: t['addr:street'] || undefined, lv: t['building:levels'] ? +t['building:levels'] : undefined, t: t.tourism || t.building });
  } else if (t.highway) {
    out.roads.push({ c: t.highway, n: t.name || undefined, s: t.surface || undefined, p: pack(p) });
  } else if (t.waterway && t.waterway !== 'weir') {
    out.water.push({ c: t.waterway, n: t.name || undefined, u: t.tunnel ? 1 : undefined, p: pack(p) });
  } else if (t.natural === 'water') {
    out.ponds.push({ p: pack(p) });
  } else if (!memberOf.has(e.id)) {
    const kind = landKind(t);
    if (kind && closed(e)) out.land.push({ k: kind, n: t.name || undefined, p: pack(p) });
  }
}
out.places = [];
for (const e of osm.elements) if (e.type === 'node' && e.tags && (e.tags.place || e.tags.historic || e.tags.natural === 'spring')) {
  const [x, y] = toXY(e.lat, e.lon);
  out.places.push({ n: e.tags.name, k: e.tags.place || e.tags.historic || e.tags.natural, x: r1(x), y: r1(y) });
}

// --- Сетка высот ---
const nx = Math.round((RECT.xMax - RECT.xMin) / CELL) + 1, ny = Math.round((RECT.yMax - RECT.yMin) / CELL) + 1;
let grid = new Float32Array(nx * ny);
for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
  const x = RECT.xMin + i * CELL, y = RECT.yMin + j * CELL;
  grid[j * nx + i] = demAt(LAT0 + y / KY, LON0 + x / KX);
}
// Сглаживание: DEM это поверхность с кронами, резкие бугры здесь не нужны
const blur = (src, radius, passes = 2) => {
  let a = src, c = new Float32Array(src.length);
  for (let n = 0; n < passes; n++) {
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0, k = 0; for (let d = -radius; d <= radius; d++) { const q = clampI(i + d, 0, nx - 1); s += a[j * nx + q]; k++; } c[j * nx + i] = s / k; }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { let s = 0, k = 0; for (let d = -radius; d <= radius; d++) { const q = clampI(j + d, 0, ny - 1); s += c[q * nx + i]; k++; } a[j * nx + i] = s / k; }
  }
  return a;
};
grid = blur(grid.slice(), 3, 2);

// Русло Слака и ручьёв: мягкая ложбина вдоль линии
const distSeg = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1; const t = clampI(((px - ax) * dx + (py - ay) * dy) / l, 0, 1); return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)); };
const carve = (pts, radius, depth) => {
  for (let k = 0; k + 3 < pts.length; k += 2) {
    const ax = pts[k], ay = pts[k + 1], bx = pts[k + 2], by = pts[k + 3];
    const i0 = clampI(Math.floor((Math.min(ax, bx) - radius - RECT.xMin) / CELL), 0, nx - 1), i1 = clampI(Math.ceil((Math.max(ax, bx) + radius - RECT.xMin) / CELL), 0, nx - 1);
    const j0 = clampI(Math.floor((Math.min(ay, by) - radius - RECT.yMin) / CELL), 0, ny - 1), j1 = clampI(Math.ceil((Math.max(ay, by) + radius - RECT.yMin) / CELL), 0, ny - 1);
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const d = distSeg(RECT.xMin + i * CELL, RECT.yMin + j * CELL, ax, ay, bx, by);
      if (d < radius) { const q = 1 - d / radius; carveMask[j * nx + i] = Math.max(carveMask[j * nx + i], depth * q * q * (3 - 2 * q)); }
    }
  }
};
const carveMask = new Float32Array(nx * ny);
for (const w of out.water) if (!w.u) carve(w.p, w.c === 'river' ? 20 : 12, w.c === 'river' ? 3.2 : 1.4);
for (let i = 0; i < grid.length; i++) grid[i] -= carveMask[i];

// Площадка под школу
const at = (x, y) => { const X = (x - RECT.xMin) / CELL, Y = (y - RECT.yMin) / CELL; const i = clampI(Math.floor(X), 0, nx - 2), j = clampI(Math.floor(Y), 0, ny - 2), fx = X - i, fy = Y - j; const g = (a, c) => grid[c * nx + a]; return g(i, j) * (1 - fx) * (1 - fy) + g(i + 1, j) * fx * (1 - fy) + g(i, j + 1) * (1 - fx) * fy + g(i + 1, j + 1) * fx * fy; };
const pad0 = at(12, 8);
for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
  const x = RECT.xMin + i * CELL, y = RECT.yMin + j * CELL;
  const d = Math.hypot((x - 13) / 1.25, y - 8);
  if (d < 90) { const q = clampI((90 - d) / 45, 0, 1); const s = q * q * (3 - 2 * q); grid[j * nx + i] = grid[j * nx + i] * (1 - s) + pad0 * s; }
}

let hMin = 1e9, hMax = -1e9; for (const v of grid) { if (v < hMin) hMin = v; if (v > hMax) hMax = v; }
const u = new Uint16Array(nx * ny);
for (let i = 0; i < u.length; i++) u[i] = Math.round((grid[i] - hMin) * 100);
fs.writeFileSync(path.join(root, 'public/assets/height.bin'), Buffer.from(u.buffer));
out.terrain = { nx, ny, cell: CELL, ...RECT, hMin: +hMin.toFixed(2), hMax: +hMax.toFixed(2), pad: +pad0.toFixed(2) };
out.origin = { lat: LAT0, lon: LON0 };
fs.writeFileSync(path.join(root, 'src/geo.json'), JSON.stringify(out));

console.log('сетка', nx, ny, 'высоты', hMin.toFixed(1), hMax.toFixed(1));
console.log('объекты', { здания: out.buildings.length, дороги: out.roads.length, вода: out.water.length, пруды: out.ponds.length, земля: out.land.length, точки: out.places.length });
const kinds = {}; for (const l of out.land) kinds[l.k] = (kinds[l.k] || 0) + 1; console.log(kinds);
for (const [n, x, y] of [['школа', 12, 8], ['перед школой', 12, -40], ['сад верх', 15, -45], ['сад низ', 15, -150], ['домики', 50, -90], ['лобное', 38, -205], ['юг участка', 30, -270], ['запад участка', -60, -30], ['арт-поле', 180, -20], ['шоссе у поля', 200, 80], ['мавзолей', 2161, -420], ['визит-центр', 2153, -685], ['слак', 300, -700]]) console.log(n.padEnd(14), at(x, y).toFixed(1));
