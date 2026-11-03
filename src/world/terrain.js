// Земля: рельеф, раскрашенная поверхность, срез почвы по краю.
import * as THREE from 'three';
import { G, T, EDGE, CORNER, LAND, gy, rawH, rng, unpack, landSDF, minRect, SCHOOL_ID, polyArea } from '../core.js';
import { PLOT, ARTFIELD, ORCHARD, PATHS, SPURS, SWALE, GUTTER, GUTTER_E, CIRCLE, POND, COURT, SPIRAL, spiralAt, LAWNS, TURA_PLAZA, TURA_PARKING } from '../plan.js';

const FARM = ['#cdb160', '#7a6146', '#93ab58', '#c6a95a', '#6d5840', '#a8b562', '#d4b868', '#85a150'];
const KIND = { grass: '#a9a960', meadow: '#b4b466', wetland: '#6f8f52', wood: '#556b3e', scrub: '#7c8c4f', residential: '#9aa55f', park: '#a7ae6a', bare: '#a39377' };

function noiseCanvas(w, h, seed, lo = 0, hi = 255) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'), d = x.createImageData(w, h), r = rng(seed);
  for (let i = 0; i < d.data.length; i += 4) { const v = lo + r() * (hi - lo); d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0);
  return c;
}

const path = (ctx, p, close = true) => {
  ctx.beginPath();
  p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
};

// Рисуем всё в метрах: перенос и масштаб задаёт setTransform, ось y смотрит на север
function meters(ctx, rect, s) {
  ctx.setTransform(s, 0, 0, -s, -rect.xMin * s, rect.yMax * s);
}

function paintBase(ctx, rect, s, cw, ch) {
  const r = rng(11);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#a4a55e'; ctx.fillRect(0, 0, cw, ch);
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  for (const [w, h, seed, a, mode] of [[48, 26, 3, 0.5, 'soft-light'], [200, 108, 5, 0.34, 'soft-light'], [800, 430, 8, 0.2, 'overlay']]) {
    ctx.globalCompositeOperation = mode; ctx.globalAlpha = a;
    ctx.drawImage(noiseCanvas(w, h, seed), 0, 0, cw, ch);
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

  meters(ctx, rect, s);
  // Поля и луга
  let farm = 0;
  const ordered = G.land.slice().sort((a, b) => (a.k === 'residential' ? -1 : 0) - (b.k === 'residential' ? -1 : 0));
  for (const l of ordered) {
    if (l.k === 'wood') continue;
    const p = unpack(l.p);
    if (l.k === 'farmland') {
      const col = FARM[farm++ % FARM.length];
      ctx.save(); path(ctx, p); ctx.clip();
      ctx.fillStyle = col; ctx.fillRect(rect.xMin, rect.yMin, rect.xMax - rect.xMin, rect.yMax - rect.yMin);
      const m = minRect(p);
      ctx.translate(m.cx, m.cy); ctx.rotate(m.ang);
      ctx.strokeStyle = 'rgba(40,28,10,.16)'; ctx.lineWidth = 2.2;
      for (let v = -1600; v < 1600; v += 11) { ctx.beginPath(); ctx.moveTo(-1800, v); ctx.lineTo(1800, v); ctx.stroke(); }
      ctx.restore();
      ctx.strokeStyle = 'rgba(70,60,30,.35)'; ctx.lineWidth = 4; path(ctx, p); ctx.stroke();
    } else {
      ctx.fillStyle = KIND[l.k] || KIND.grass;
      ctx.globalAlpha = l.k === 'residential' ? 0.65 : 0.75;
      path(ctx, p); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }
  for (const l of G.land) if (l.k === 'wood') { ctx.fillStyle = KIND.wood; path(ctx, unpack(l.p)); ctx.fill(); }

  // Огороды за домами: тёмные и зелёные полосы, как на снимке
  const streets = G.roads.filter((q) => q.c === 'residential').map((q) => unpack(q.p));
  for (const b of G.buildings) {
    if (b.id === SCHOOL_ID) continue;
    const p = unpack(b.p);
    if (polyArea(p) > 260) continue;
    const m = minRect(p);
    let best = null;
    for (const st of streets) for (let i = 0; i + 1 < st.length; i++) {
      const [ax, ay] = st[i], [bx, by] = st[i + 1], dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, t = Math.min(Math.max(((m.cx - ax) * dx + (m.cy - ay) * dy) / L, 0), 1);
      const qx = ax + t * dx, qy = ay + t * dy, d = Math.hypot(m.cx - qx, m.cy - qy);
      if (!best || d < best.d) best = { d, qx, qy, dir: Math.atan2(dy, dx) };
    }
    if (!best || best.d > 70) continue;
    const away = Math.atan2(m.cy - best.qy, m.cx - best.qx);
    ctx.save(); ctx.translate(m.cx, m.cy); ctx.rotate(away);
    const len = 34 + r() * 40, wid = 15 + r() * 8;
    ctx.fillStyle = r() < 0.55 ? 'rgba(92,70,48,.78)' : 'rgba(118,136,70,.75)';
    ctx.fillRect(8, -wid / 2, len, wid);
    ctx.strokeStyle = 'rgba(225,215,190,.28)'; ctx.lineWidth = 0.7; ctx.strokeRect(8, -wid / 2, len, wid);
    ctx.restore();
  }

  // Вода
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const w of G.water) {
    if (w.u) continue;
    const p = unpack(w.p), big = w.c === 'river';
    ctx.strokeStyle = '#4c6b4a'; ctx.lineWidth = big ? 15 : 7; path(ctx, p, false); ctx.stroke();
    ctx.strokeStyle = '#6fa3b4'; ctx.lineWidth = big ? 8 : 3; path(ctx, p, false); ctx.stroke();
  }
  for (const w of G.ponds) { ctx.fillStyle = '#6fa3b4'; path(ctx, unpack(w.p)); ctx.fill(); }

  // Дороги
  const STYLE = { track: [3, 'rgba(172,150,106,.7)'], residential: [6, '#b9a988'], service: [5, '#b0a795'], path: [2.4, '#d0a971'], unclassified: [8.5, '#8e8778'] };
  for (const c of ['track', 'residential', 'service', 'unclassified', 'path']) for (const q of G.roads) {
    if (q.c !== c) continue;
    const p = unpack(q.p), [w, col] = STYLE[c] || STYLE.track;
    if (c === 'unclassified') { ctx.strokeStyle = '#c4b28a'; ctx.lineWidth = w + 4; path(ctx, p, false); ctx.stroke(); }
    ctx.strokeStyle = col; ctx.lineWidth = w; path(ctx, p, false); ctx.stroke();
  }
}

// Овраги и ложбины подсвечены зеленее по кривизне рельефа
function paintRelief(ctx, rect, cw, ch) {
  const step = 12, w = Math.floor((T.xMax - T.xMin) / step), h = Math.floor((T.yMax - T.yMin) / step);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'), d = x.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const X = T.xMin + i * step, Y = T.yMax - j * step, q = 24;
    const lap = rawH(X - q, Y) + rawH(X + q, Y) + rawH(X, Y - q) + rawH(X, Y + q) - 4 * rawH(X, Y);
    const v = Math.min(Math.max(lap * 1.6, -1), 1), k = (j * w + i) * 4;
    if (v > 0) { d.data[k] = 92; d.data[k + 1] = 128; d.data[k + 2] = 62; d.data[k + 3] = v * 95; }
    else { d.data[k] = 220; d.data[k + 1] = 196; d.data[k + 2] = 132; d.data[k + 3] = -v * 70; }
  }
  x.putImageData(d, 0, 0);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(c, ((T.xMin - rect.xMin) / (rect.xMax - rect.xMin)) * cw, ((rect.yMax - T.yMax) / (rect.yMax - rect.yMin)) * ch, (cw * (T.xMax - T.xMin)) / (rect.xMax - rect.xMin), (ch * (T.yMax - T.yMin)) / (rect.yMax - rect.yMin));
}

function paintPlot(ctx, rect, s) {
  const r = rng(21);
  meters(ctx, rect, s);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  // Арт-поле: скошенный ковёр и спиральная тропа
  ctx.fillStyle = '#b9b56a'; ctx.globalAlpha = 0.9; path(ctx, ARTFIELD); ctx.fill(); ctx.globalAlpha = 1;
  ctx.save(); path(ctx, ARTFIELD); ctx.clip();
  ctx.strokeStyle = 'rgba(120,130,60,.18)'; ctx.lineWidth = 3;
  for (let v = -300; v < 400; v += 9) { ctx.beginPath(); ctx.moveTo(-100, v); ctx.lineTo(400, v - 90); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(232,218,172,.9)'; ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let a = 0; a < SPIRAL.aMax; a += 0.08) { const [x, y] = spiralAt(a); a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke();

  // Внутри красной линии луг, газон только у школы, у домиков и на поляне
  ctx.save(); path(ctx, PLOT); ctx.clip();
  ctx.fillStyle = '#aaa962'; ctx.fillRect(-120, -300, 300, 360);
  for (let i = 0; i < 3200; i++) { ctx.fillStyle = r() < 0.5 ? 'rgba(96,112,52,.16)' : 'rgba(214,196,128,.16)'; const q = 1 + r() * 3; ctx.fillRect(-100 + r() * 190, -300 + r() * 360, q, q); }
  ctx.fillStyle = '#9fb35c';
  for (const l of LAWNS) ctx.fillRect(l.x0, l.y0, l.x1 - l.x0, l.y1 - l.y0);
  ctx.beginPath(); ctx.arc(CIRCLE.x, CIRCLE.y, CIRCLE.r + 16, 0, 6.3); ctx.fill();
  ctx.strokeStyle = 'rgba(240,240,170,.1)'; ctx.lineWidth = 2.6;
  for (const l of LAWNS) for (let x = l.x0; x < l.x1; x += 5) { ctx.beginPath(); ctx.moveTo(x, l.y0); ctx.lineTo(x, l.y1); ctx.stroke(); }
  // Трава в саду светлее, под кронами лепестки
  ctx.fillStyle = 'rgba(190,205,120,.5)'; ctx.fillRect(ORCHARD.x0 - 3, ORCHARD.y0 - 3, ORCHARD.x1 - ORCHARD.x0 + 6, ORCHARD.y1 - ORCHARD.y0 + 6);
  for (let i = 0; i < 2600; i++) { ctx.fillStyle = 'rgba(255,238,240,.55)'; ctx.fillRect(ORCHARD.x0 + r() * (ORCHARD.x1 - ORCHARD.x0), ORCHARD.y0 + r() * (ORCHARD.y1 - ORCHARD.y0), 0.45, 0.45); }
  // Поляна
  ctx.fillStyle = 'rgba(205,205,120,.6)'; ctx.beginPath(); ctx.ellipse(CIRCLE.x - 6, CIRCLE.y - 6, 40, 34, 0, 0, 6.3); ctx.fill();
  ctx.restore();

  // Двор перед школой: гравий и деревянный настил к порталу
  ctx.fillStyle = '#d8c9a7'; path(ctx, [[-9, -14.5], [36, -16.5], [38, -25], [-8, -27]]); ctx.fill();
  for (let i = 0; i < 1400; i++) { ctx.fillStyle = r() < 0.5 ? 'rgba(150,130,100,.25)' : 'rgba(250,240,220,.3)'; ctx.fillRect(-8 + r() * 45, -27 + r() * 12, 0.25, 0.25); }
  ctx.fillStyle = '#b07a48'; path(ctx, [[8.6, -10.6], [16.2, -11.2], [16, -24], [9, -24]]); ctx.fill();
  ctx.strokeStyle = 'rgba(70,40,20,.35)'; ctx.lineWidth = 0.06;
  for (let y = -11; y > -24; y -= 0.5) { ctx.beginPath(); ctx.moveTo(8.6, y); ctx.lineTo(16.2, y - 0.4); ctx.stroke(); }

  // Дорожки
  const gravel = (pts, w) => {
    ctx.strokeStyle = 'rgba(110,92,62,.5)'; ctx.lineWidth = w + 0.7; path(ctx, pts, false); ctx.stroke();
    ctx.strokeStyle = '#dccba6'; ctx.lineWidth = w; path(ctx, pts, false); ctx.stroke();
  };
  for (const [k, p] of Object.entries(PATHS)) gravel(p, k === 'axis' || k === 'entry' ? 3 : 2);
  for (const p of SPURS) gravel(p, 1.4);

  // Круг лобного места: мощение и кольца
  ctx.fillStyle = '#cdbb98'; ctx.beginPath(); ctx.arc(CIRCLE.x, CIRCLE.y, CIRCLE.r + 7, 0, 6.3); ctx.fill();
  ctx.strokeStyle = 'rgba(120,100,70,.4)'; ctx.lineWidth = 0.25;
  for (let q = 1; q < 3; q++) { ctx.beginPath(); ctx.arc(CIRCLE.x, CIRCLE.y, CIRCLE.r + q * 2.2, 0, 6.3); ctx.stroke(); }

  // Цветы вдоль дорожек
  const flowers = ['#f2e9ff', '#e6a7c6', '#f3cf5b', '#c9a0e8', '#f7b267', '#ffffff'];
  for (const p of [PATHS.axis, PATHS.west, PATHS.entry]) for (let i = 0; i + 1 < p.length; i++) {
    const [ax, ay] = p[i], [bx, by] = p[i + 1], l = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / l, ny = (bx - ax) / l;
    for (let k = 0; k < l * 2.2; k++) {
      const t = r(), side = r() < 0.5 ? -1 : 1, off = 2 + r() * 2.4;
      ctx.fillStyle = flowers[Math.floor(r() * flowers.length)];
      ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.arc(ax + (bx - ax) * t + nx * off * side, ay + (by - ay) * t + ny * off * side, 0.12 + r() * 0.16, 0, 6.3); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Канава: камень и вода
  const stream = (pts, wide) => {
    ctx.strokeStyle = '#7f8a6a'; ctx.lineWidth = wide + 1.4; path(ctx, pts, false); ctx.stroke();
    ctx.strokeStyle = '#a7a593'; ctx.lineWidth = wide; path(ctx, pts, false); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,150,175,.85)'; ctx.lineWidth = wide * 0.42; path(ctx, pts, false); ctx.stroke();
  };
  stream(SWALE, 1.5); stream(GUTTER, 0.6); stream(GUTTER_E, 0.6);
  ctx.fillStyle = '#7f8a6a'; ctx.beginPath(); ctx.ellipse(POND.x, POND.y, POND.rx + 1.6, POND.ry + 1.6, 0.1, 0, 6.3); ctx.fill();
  ctx.fillStyle = '#6fa8bc'; ctx.beginPath(); ctx.ellipse(POND.x, POND.y, POND.rx, POND.ry, 0.1, 0, 6.3); ctx.fill();
  ctx.fillStyle = 'rgba(190,225,235,.5)'; ctx.beginPath(); ctx.ellipse(POND.x - 3, POND.y + 1.5, POND.rx * 0.5, POND.ry * 0.4, 0.1, 0, 6.3); ctx.fill();
}

const texFrom = (canvas, maxAniso) => {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
};

// Вырезаем скруглённый край и добавляем зерно вблизи
function shapeMaterial(mat, grain) {
  mat.onBeforeCompile = (s) => {
    s.uniforms.uRect = { value: new THREE.Vector4(LAND.CX, LAND.CY, LAND.HX, LAND.HY) };
    s.uniforms.uCorner = { value: CORNER };
    s.uniforms.uGrain = { value: grain };
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vPl;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvPl = vec2(position.x, -position.z);');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec2 vPl; uniform vec4 uRect; uniform float uCorner; uniform float uGrain;
        float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hash2(i),hash2(i+vec2(1,0)),f.x), mix(hash2(i+vec2(0,1)),hash2(i+vec2(1,1)),f.x), f.y); }`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec2 q = abs(vPl - uRect.xy) - (uRect.zw - uCorner);
        if (length(max(q, 0.)) + min(max(q.x, q.y), 0.) - uCorner > 0.) discard;
        float g = vnoise(vPl*1.3)*.5 + vnoise(vPl*4.1)*.3 + vnoise(vPl*.37)*.5;
        diffuseColor.rgb *= 1. + (g-.65) * uGrain;`);
  };
  return mat;
}

function gridGeometry(x0, x1, y0, y1, cell, lift = 0, uvRect) {
  const nx = Math.round((x1 - x0) / cell) + 1, ny = Math.round((y1 - y0) / cell) + 1;
  const pos = new Float32Array(nx * ny * 3), uv = new Float32Array(nx * ny * 2);
  for (let j = 0, k = 0; j < ny; j++) for (let i = 0; i < nx; i++, k++) {
    const x = x0 + (i * (x1 - x0)) / (nx - 1), y = y0 + (j * (y1 - y0)) / (ny - 1);
    pos[k * 3] = x; pos[k * 3 + 1] = gy(x, y) + lift; pos[k * 3 + 2] = -y;
    uv[k * 2] = (x - uvRect.xMin) / (uvRect.xMax - uvRect.xMin); uv[k * 2 + 1] = (y - uvRect.yMin) / (uvRect.yMax - uvRect.yMin);
  }
  const idx = new Uint32Array((nx - 1) * (ny - 1) * 6);
  for (let j = 0, k = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1;
    idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return g;
}

// Срез почвы: чернозём, суглинок, известняк
function soilTexture() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
  const x = c.getContext('2d'), r = rng(31);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#2c221a'); g.addColorStop(0.2, '#35281d'); g.addColorStop(0.3, '#5d4631'); g.addColorStop(0.55, '#8a6a46'); g.addColorStop(0.75, '#a5895f'); g.addColorStop(1, '#6f6658');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  for (let i = 0; i < 7000; i++) {
    const y = r() * 512, q = 1 + r() * r() * 9, t = y / 512;
    x.fillStyle = t < 0.3 ? `rgba(${70 + r() * 40},${50 + r() * 30},${30 + r() * 20},.5)` : `rgba(${190 + r() * 50},${170 + r() * 40},${130 + r() * 40},${0.12 + r() * 0.3})`;
    x.beginPath(); x.ellipse(r() * 1024, y, q * (1 + r() * 2), q * 0.7, 0, 0, 6.3); x.fill();
  }
  x.strokeStyle = 'rgba(30,20,12,.3)'; x.lineWidth = 2;
  for (const y0 of [150, 280, 400]) { x.beginPath(); for (let i = 0; i <= 1024; i += 16) { const y = y0 + Math.sin(i * 0.02 + y0) * 8; i ? x.lineTo(i, y) : x.moveTo(i, y); } x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

function skirt(parent) {
  const pts = [];
  const { CX, CY, HX, HY } = LAND, R = CORNER, sx = HX - R, sy = HY - R;
  const arc = (cx, cy, a0) => { for (let i = 0; i <= 18; i++) { const a = a0 + (i / 18) * (Math.PI / 2); pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); } };
  const side = (ax, ay, bx, by) => { const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 12); for (let i = 1; i < n; i++) pts.push([ax + ((bx - ax) * i) / n, ay + ((by - ay) * i) / n]); };
  arc(CX + sx, CY - sy, -Math.PI / 2); side(CX + HX, CY - sy, CX + HX, CY + sy);
  arc(CX + sx, CY + sy, 0); side(CX + sx, CY + HY, CX - sx, CY + HY);
  arc(CX - sx, CY + sy, Math.PI / 2); side(CX - HX, CY + sy, CX - HX, CY - sy);
  arc(CX - sx, CY - sy, Math.PI); side(CX - sx, CY - HY, CX + sx, CY - HY);
  pts.push(pts[0]);
  const n = pts.length, pos = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = [];
  const depth = 150, r = rng(41);
  let dist = 0;
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    if (i) dist += Math.hypot(x - pts[i - 1][0], y - pts[i - 1][1]);
    const top = gy(x, y), bottom = -depth - 18 * Math.sin(i * 0.11) - 8 * r();
    pos.set([x, top, -y, x, bottom, -y], i * 6);
    uv.set([dist / 620, 1, dist / 620, 0], i * 4);
    if (i + 1 < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: soilTexture(), roughness: 1, side: THREE.DoubleSide }));
  parent.add(m);
  // Нижняя грань, чтобы снизу не было дыры
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const cap = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: '#2b2a33', side: THREE.DoubleSide }));
  cap.rotation.x = -Math.PI / 2; cap.position.y = -depth - 26;
  parent.add(cap);
}

// Площадь и парковка у визит-центра «Тура-хан»
function paintTura(ctx) {
  const r = rng(61);
  ctx.fillStyle = '#b9b4aa'; path(ctx, TURA_PLAZA); ctx.fill();
  ctx.strokeStyle = 'rgba(80,75,70,.18)'; ctx.lineWidth = 0.5;
  for (let x = 2100; x < 2210; x += 2.4) { ctx.beginPath(); ctx.moveTo(x, -720); ctx.lineTo(x + 1.5, -686); ctx.stroke(); }
  ctx.fillStyle = '#8f8a84'; path(ctx, TURA_PARKING); ctx.fill();
  ctx.strokeStyle = 'rgba(240,240,240,.55)'; ctx.lineWidth = 0.35;
  for (let k = 0; k < 30; k++) { const x = 2172 + k * 3.1, y = -718 - k * 0.78; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 1.2, y - 5); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - 1.6, y - 12); ctx.lineTo(x - 2.8, y - 17); ctx.stroke(); }
  for (let i = 0; i < 400; i++) { ctx.fillStyle = 'rgba(60,55,50,.12)'; ctx.fillRect(2160 + r() * 100, -765 + r() * 50, 0.6, 0.6); }
}

export const PATCH = { xMin: -120, xMax: 330, yMin: -330, yMax: 120 };

export function buildTerrain(parent, { quality, renderer }) {
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const rect = { xMin: T.xMin, xMax: T.xMax, yMin: T.yMin, yMax: T.yMax };
  const W_ = quality.groundTex, H_ = Math.round((W_ * (T.yMax - T.yMin)) / (T.xMax - T.xMin));
  const big = document.createElement('canvas'); big.width = W_; big.height = H_;
  const bx = big.getContext('2d');
  const s = W_ / (T.xMax - T.xMin);
  paintBase(bx, rect, s, W_, H_);
  paintRelief(bx, rect, W_, H_);
  meters(bx, rect, s); paintPlot(bx, rect, s); paintTura(bx);

  const terrain = new THREE.Mesh(gridGeometry(T.xMin, T.xMax, T.yMin, T.yMax, 12, 0, rect), shapeMaterial(new THREE.MeshStandardMaterial({ map: texFrom(big, aniso), roughness: 0.96, metalness: 0 }), 0.34));
  terrain.receiveShadow = true;
  parent.add(terrain);

  // Вставка высокого разрешения вокруг участка
  const P = quality.patchTex, ps = P / (PATCH.xMax - PATCH.xMin);
  const near = document.createElement('canvas'); near.width = P; near.height = P;
  const nx = near.getContext('2d');
  paintBase(nx, PATCH, ps, P, P);
  paintRelief(nx, PATCH, P, P);
  paintPlot(nx, PATCH, ps);
  const patch = new THREE.Mesh(gridGeometry(PATCH.xMin, PATCH.xMax, PATCH.yMin, PATCH.yMax, 6, 0.04, PATCH), shapeMaterial(new THREE.MeshStandardMaterial({ map: texFrom(near, aniso), roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), 0.28));
  patch.receiveShadow = true;
  parent.add(patch);

  skirt(parent);
  return { terrain, patch };
}

export { landSDF, EDGE };
