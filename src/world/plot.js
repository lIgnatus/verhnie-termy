// Участок школы: площадки, домики, лобное место, дренаж, граница, люди.
import * as THREE from 'three';
import { Batch, gy, W, rng, polyline, unpack, G } from '../core.js';
import { PLOT, CABINS, CIRCLE, COURT, SPORT, POND, PATHS, SWALE, GUTTER, GUTTER_E, FLAGS, SIGNPOST, ARTFIELD } from '../plan.js';
import { planks, flag, courtLines, textPlane } from './tex.js';

const M = () => ({
  wood: new THREE.MeshStandardMaterial({ map: planks('#b98250'), roughness: 0.75 }),
  deck: new THREE.MeshStandardMaterial({ map: planks('#a8774a'), roughness: 0.8 }),
  dark: new THREE.MeshStandardMaterial({ color: '#3b3f44', roughness: 0.6 }),
  shell: new THREE.MeshStandardMaterial({ map: planks('#9c6b3f'), roughness: 0.75, side: THREE.DoubleSide }),
  glass: new THREE.MeshStandardMaterial({ color: '#d7a065', emissive: '#ffbe6e', emissiveIntensity: 0.75, roughness: 0.2 }),
  white: new THREE.MeshStandardMaterial({ color: '#f3f0e8', roughness: 0.55 }),
  stone: new THREE.MeshStandardMaterial({ color: '#c9bba0', roughness: 0.95 }),
  metal: new THREE.MeshStandardMaterial({ color: '#6c757c', roughness: 0.4, metalness: 0.6 }),
  blueFrame: new THREE.MeshStandardMaterial({ color: '#4d79b8', roughness: 0.6 }),
  ember: new THREE.MeshStandardMaterial({ color: '#ff8a3c', emissive: '#ff7a2a', emissiveIntensity: 2.4 }),
  lamp: new THREE.MeshStandardMaterial({ color: '#fff1c9', emissive: '#ffd27a', emissiveIntensity: 1.8 }),
  poly: new THREE.MeshStandardMaterial({ color: '#e9f2ee', roughness: 0.15, transparent: true, opacity: 0.5, side: THREE.DoubleSide }),
  bed: new THREE.MeshStandardMaterial({ color: '#5e8d3e', roughness: 0.9, flatShading: true }),
  soil: new THREE.MeshStandardMaterial({ color: '#4b3a2a', roughness: 1 }),
  sail: new THREE.MeshStandardMaterial({ color: '#f6efe2', roughness: 0.8, side: THREE.DoubleSide }),
  water: new THREE.MeshStandardMaterial({ color: '#5e9db4', roughness: 0.08, metalness: 0.25 }),
  reed: new THREE.MeshStandardMaterial({ color: '#8b9a52', roughness: 1, flatShading: true }),
});

// А-фрейм: треугольный каркас, остеклённый торец на запад, к саду
function cabin(b, m, x, y) {
  const g = gy(x, y), Wd = 6, D = 8, H = 6.4;
  const grp = new THREE.Group(); grp.position.set(x, g, -y);
  const shape = new THREE.Shape(); shape.moveTo(-Wd / 2, 0); shape.lineTo(Wd / 2, 0); shape.lineTo(0, H); shape.closePath();
  const hole = new THREE.Path(); hole.moveTo(-Wd / 2 + 0.35, 0.2); hole.lineTo(0, H - 0.5); hole.lineTo(Wd / 2 - 0.35, 0.2); hole.closePath(); shape.holes.push(hole);
  const shell = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false });
  shell.translate(0, 0.6, -D / 2); shell.rotateY(Math.PI / 2);
  const inner = new THREE.Shape(); inner.moveTo(-Wd / 2 + 0.36, 0.2); inner.lineTo(Wd / 2 - 0.36, 0.2); inner.lineTo(0, H - 0.52); inner.closePath();
  const front = new THREE.ShapeGeometry(inner); front.rotateY(-Math.PI / 2); front.translate(-D / 2 + 0.15, 0.6, 0);
  const back = new THREE.ShapeGeometry(inner); back.rotateY(Math.PI / 2); back.translate(D / 2 - 0.15, 0.6, 0);
  const add = (mat, geo) => { geo.applyMatrix4(new THREE.Matrix4().makeTranslation(x, g, -y)); b.push(mat, geo); };
  add(m.shell, shell); add(m.glass, front); add(m.wood, back);
  const part = (mat, w, h, d, px, py, pz) => { const q = new THREE.BoxGeometry(w, h, d); q.translate(px, py, pz); add(mat, q); };
  part(m.deck, 3, 0.2, Wd + 1, -D / 2 - 1.5, 0.5, 0);
  part(m.wood, D + 0.4, 0.6, Wd + 0.2, 0, 0.3, 0);
  for (const z of [-1.4, 0, 1.4]) part(m.white, 0.06, H - 1.6, 0.06, -D / 2 + 0.12, 0.6 + (H - 1.6) / 2, z);
  part(m.dark, 0.5, 0.9, 0.5, D / 2 - 1.2, H - 0.2, 0.9);
  return grp;
}

function ribbon(points, width, lift, mat) {
  const pos = [], idx = [], uv = [];
  let d = 0;
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i], a = points[Math.max(i - 1, 0)], c = points[Math.min(i + 1, points.length - 1)];
    const dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    if (i) d += Math.hypot(x - points[i - 1][0], y - points[i - 1][1]);
    for (const s of [-1, 1]) { const px = x + nx * s * width / 2, py = y + ny * s * width / 2; pos.push(px, gy(px, py) + lift, -py); uv.push(d, s < 0 ? 0 : 1); }
    if (i + 1 < points.length) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// Ломаная гуще: чтобы лента повторяла рельеф
function dense(pts, step = 3) {
  const out = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}

export function buildPlot(parent, U) {
  const m = M(), b = new Batch(), r = rng(5);

  // Спортплощадка и место отдыха
  const sp = new THREE.Group();
  const sg = gy(SPORT.x, SPORT.y);
  sp.position.set(SPORT.x, sg, -SPORT.y); sp.rotation.y = -SPORT.ang;
  const surf = new THREE.Mesh(new THREE.BoxGeometry(SPORT.w, 0.12, SPORT.d), new THREE.MeshStandardMaterial({ map: courtLines(SPORT.w, SPORT.d, '#b9573c'), roughness: 0.9 }));
  surf.position.y = 0.06; surf.receiveShadow = true; sp.add(surf);
  const sb = new Batch();
  for (const s of [-1, 1]) {
    const x = s * (SPORT.w / 2 - 1.1);
    sb.box(m.white, 0.12, 2, 0.12, x, 1, -1.5); sb.box(m.white, 0.12, 2, 0.12, x, 1, 1.5); sb.box(m.white, 0.12, 0.12, 3.1, x, 2, 0);
  }
  sb.box(m.metal, 0.14, 3.2, 0.14, 0, 1.6, -SPORT.d / 2 + 0.6); sb.box(m.white, 1.4, 1, 0.06, 0, 3.3, -SPORT.d / 2 + 0.7);
  // Старые рамы-турники остаются
  for (let i = 0; i < 3; i++) { sb.box(m.blueFrame, 0.1, 2.6, 0.1, -6 + i * 2.2, 1.3, SPORT.d / 2 + 2); sb.box(m.blueFrame, 0.1, 2.6, 0.1, -6 + i * 2.2 + 1.6, 1.3, SPORT.d / 2 + 2); sb.box(m.blueFrame, 1.7, 0.08, 0.08, -6 + i * 2.2 + 0.8, 2.55 - i * 0.4, SPORT.d / 2 + 2); }
  // Навес и скамейки: место отдыха
  for (const [a, c] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) sb.box(m.wood, 0.2, 2.6, 0.2, 11 + a * 2.6, 1.3, SPORT.d / 2 + 3 + c * 1.6);
  for (let i = 0; i < 9; i++) sb.box(m.wood, 0.14, 0.12, 4, 8.4 + i * 0.65, 2.66, SPORT.d / 2 + 3);
  sb.box(m.wood, 4.2, 0.45, 0.6, 11, 0.25, SPORT.d / 2 + 2.2); sb.box(m.wood, 4.2, 0.45, 0.6, 11, 0.25, SPORT.d / 2 + 3.8);
  for (let i = 0; i < 4; i++) sb.box(m.wood, 2.4, 0.45, 0.5, -SPORT.w / 2 + 4 + i * 6.5, 0.25, -SPORT.d / 2 - 1.4);
  sb.into(sp);
  parent.add(sp);

  // Котельная остаётся, но закрыта деревянным экраном
  const kx = -24, ky = 6, kg = gy(kx, ky);
  b.box(m.white, 6, 3, 4, kx, kg + 1.5, -ky);
  for (let i = 0; i < 16; i++) b.box(m.wood, 0.16, 3.3, 0.1, kx - 3.4 + i * 0.45, kg + 1.65, -ky + 2.15);
  b.cyl(m.dark, 0.25, 0.3, 12, kx + 2.2, kg + 6, -ky - 1.2, 8);

  // Флагштоки
  const flagMats = [];
  ['ru', 'rb', 'district'].forEach((k, i) => {
    const [x, y] = FLAGS[i], g = gy(x, y);
    b.cyl(m.metal, 0.06, 0.09, 10, x, g + 5, -y, 8);
    b.cyl(m.stone, 0.5, 0.6, 0.4, x, g + 0.2, -y, 10);
    const geo = new THREE.PlaneGeometry(2.4, 1.6, 16, 8); geo.translate(1.2, 0, 0);
    const mat = new THREE.MeshStandardMaterial({ map: flag(k), side: THREE.DoubleSide, roughness: 0.8 });
    mat.onBeforeCompile = (s) => {
      s.uniforms.uTime = U.uTime;
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;').replace('#include <begin_vertex>', `#include <begin_vertex>
        float k = position.x / 2.4;
        transformed.z += sin(position.x * 2.6 - uTime * 4.2 + ${i}.0) * .22 * k + sin(position.x*5.3 - uTime*6.1) * .05 * k;
        transformed.y -= k * k * .12;`);
    };
    flagMats.push(mat);
    const f = new THREE.Mesh(geo, mat); f.position.set(x + 0.08, g + 9.1, -y); f.rotation.y = 0.5; f.castShadow = true;
    parent.add(f);
  });

  // Указатель, как на визуализации
  {
    const [x, y] = SIGNPOST, g = gy(x, y);
    b.box(m.wood, 0.22, 3.4, 0.22, x, g + 1.7, -y);
    ['АУДИТОРИИ', 'ПРОЕКТНЫЕ МАСТЕРСКИЕ', 'КОВОРКИНГ', 'СОБЫТИЯ', 'ЖИЛЬЁ'].forEach((t, i) => {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.34), new THREE.MeshStandardMaterial({ map: textPlane([{ t, size: 64 }], { w: 640, h: 112, bg: '#c99b63', color: '#3a2414', font: '"Golos Text", Arial, sans-serif', weight: 600 }), side: THREE.DoubleSide }));
      p.position.set(x + 0.95, g + 3.05 - i * 0.42, -y + 0.13); p.rotation.y = -0.35 + (i % 2) * 0.12;
      parent.add(p);
    });
  }

  // У фасада, как на визуализации: скамьи на бетонных опорах, кашпо с травами, валуны
  {
    const concrete = new THREE.MeshStandardMaterial({ color: '#b9b2a6', roughness: 0.95 });
    const rock = new THREE.MeshStandardMaterial({ color: '#a39a8c', roughness: 1, flatShading: true });
    for (const [x, y, a] of [[-5, -14.6, 0.07], [1.5, -15, 0.07], [24.5, -16.6, 0.07], [31, -17, 0.07]]) {
      const g = gy(x, y);
      b.box(m.wood, 3.4, 0.12, 0.62, x, g + 0.48, -y, a);
      for (const s of [-1, 1]) b.box(concrete, 0.4, 0.42, 0.62, x + s * 1.3, g + 0.21, -y, a);
    }
    for (const [x, y] of [[6.5, -15.2], [18.6, -16], [-9, -16], [35, -18.5]]) { const g = gy(x, y); b.box(m.wood, 1.6, 0.7, 1.6, x, g + 0.35, -y); b.box(m.bed, 1.4, 0.5, 1.4, x, g + 0.85, -y); }
    for (const [x, y, s] of [[3.8, -18.5, 0.9], [21.5, -24, 1.2], [-11, -21, 1.4], [28, -26, 1.0], [8, -27, 0.8]]) { const q = new THREE.IcosahedronGeometry(s, 1); q.scale(1.3, 0.75, 1); q.translate(x, gy(x, y) + s * 0.35, -y); b.push(rock, q); }
  }

  // Гостевые домики
  for (const [x, y] of CABINS) cabin(b, m, x, y);

  // Лобное место: круг, ступени, ряды скамей, костёр
  {
    const { x, y, r: R } = CIRCLE, g = gy(x, y);
    b.cyl(m.stone, R, R + 0.3, 0.5, x, g + 0.1, -y, 48);
    b.cyl(m.stone, R + 2.4, R + 2.8, 0.25, x, g - 0.05, -y, 48);
    b.cyl(m.dark, 1.1, 1.2, 0.35, x, g + 0.5, -y, 16);
    const ember = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 1), m.ember); ember.position.set(x, g + 0.75, -y); ember.scale.y = 0.6; parent.add(ember);
    for (let ring = 0; ring < 3; ring++) {
      const rr = R + 4 + ring * 1.6;
      for (let a = 0.35; a < Math.PI * 1.65; a += 1.9 / rr) {
        const ang = a + Math.PI * 0.18, bx = x + Math.cos(ang) * rr, by = y + Math.sin(ang) * rr;
        b.box(m.wood, 1.4, 0.45 + ring * 0.25, 0.45, bx, gy(bx, by) + 0.2 + ring * 0.12, -by, -ang + Math.PI / 2);
      }
    }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, lx = x + Math.cos(a) * (R + 9.6), ly = y + Math.sin(a) * (R + 9.6), lg = gy(lx, ly); b.cyl(m.dark, 0.05, 0.06, 3, lx, lg + 1.5, -ly, 6); const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), m.lamp); l.position.set(lx, lg + 3.05, -ly); parent.add(l); }
  }

  // Корт
  {
    const { x, y, w, d } = COURT, g = gy(x, y);
    const c = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), new THREE.MeshStandardMaterial({ map: courtLines(w, d, '#3f7f79'), roughness: 0.85 }));
    c.position.set(x, g + 0.06, -y); c.receiveShadow = true; parent.add(c);
    b.box(m.dark, 0.06, 0.9, d, x, g + 0.5, -y);
    for (const [a, q] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) b.box(m.metal, 0.1, 3, 0.1, x + a * w / 2, g + 1.5, -y + q * d / 2);
    b.box(m.metal, w, 0.08, 0.08, x, g + 3, -y + d / 2); b.box(m.metal, w, 0.08, 0.08, x, g + 3, -y - d / 2);
  }

  // Теплицы, грядки и терраса во дворе
  for (const [x, y] of [[34, 33], [42, 33]]) {
    const g = gy(x, y), arch = new THREE.CylinderGeometry(1.6, 1.6, 6, 16, 1, true, -Math.PI / 2, Math.PI);
    arch.rotateX(Math.PI / 2); arch.rotateY(Math.PI / 2);
    const mesh = new THREE.Mesh(arch, m.poly); mesh.position.set(x, g, -y); mesh.rotation.y = Math.PI / 2 - 0.07; parent.add(mesh);
  }
  for (let i = 0; i < 6; i++) { const x = 30 + (i % 3) * 4.2, y = 23.5 + Math.floor(i / 3) * 3.2, g = gy(x, y); b.box(m.wood, 3, 0.5, 1.4, x, g + 0.25, -y); b.box(m.soil, 2.8, 0.06, 1.2, x, g + 0.52, -y); for (let k = 0; k < 6; k++) b.box(m.bed, 0.3, 0.3, 0.3, x - 1.1 + k * 0.44, g + 0.68, -y + (k % 2 ? 0.25 : -0.25)); }
  {
    const x = 37, y = 15.5, g = gy(x, y);
    b.box(m.deck, 12, 0.3, 9, x, g + 0.15, -y);
    for (let i = 0; i < 4; i++) { const tx = x - 4 + (i % 2) * 6, ty = y - 2 + Math.floor(i / 2) * 4; b.cyl(m.wood, 0.7, 0.7, 0.08, tx, g + 1.05, -ty, 14); b.cyl(m.dark, 0.06, 0.06, 0.75, tx, g + 0.65, -ty, 6); }
    const sail = new THREE.BufferGeometry();
    sail.setAttribute('position', new THREE.Float32BufferAttribute([x - 6, g + 4.2, -(y - 4.5), x + 6, g + 3.4, -(y - 4.5), x, g + 4.6, -(y + 4.5), x + 6, g + 3.4, -(y - 4.5), x + 6.5, g + 4.4, -(y + 4.5), x, g + 4.6, -(y + 4.5)], 3));
    sail.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0.5, 1, 1, 0, 1, 1, 0.5, 1], 2));
    sail.computeVertexNormals(); b.push(m.sail, sail);
    for (const [px, py, h] of [[x - 6, y - 4.5, 4.2], [x + 6, y - 4.5, 3.4], [x, y + 4.5, 4.6], [x + 6.5, y + 4.5, 4.4]]) b.cyl(m.wood, 0.08, 0.1, h, px, g + h / 2, -py, 6);
    for (let i = 0; i < 14; i++) { const t = i / 13, l = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), m.lamp); l.position.set(x - 6 + t * 12, g + 4.0 - Math.sin(t * Math.PI) * 0.5, -(y - 4.5) - 0.2); parent.add(l); }
  }

  // Фонари вдоль главной аллеи
  {
    const line = polyline(PATHS.axis.concat(PATHS.entry.slice().reverse().slice(1)));
    for (let d = 6; d < line.total; d += 16) {
      const [x, y, a] = line.at(d), ox = x + Math.cos(a + Math.PI / 2) * 2.2, oy = y + Math.sin(a + Math.PI / 2) * 2.2, g = gy(ox, oy);
      b.cyl(m.dark, 0.05, 0.07, 3.2, ox, g + 1.6, -oy, 6);
      const l = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6), m.lamp); l.position.set(ox, g + 3.25, -oy); parent.add(l);
    }
    for (let d = 20; d < line.total; d += 37) { const [x, y, a] = line.at(d), ox = x + Math.cos(a - Math.PI / 2) * 2.4, oy = y + Math.sin(a - Math.PI / 2) * 2.4; b.box(m.wood, 2, 0.45, 0.55, ox, gy(ox, oy) + 0.25, -oy, -a); }
  }

  // Дождевой пруд и камыш
  {
    const water = new THREE.Mesh(new THREE.CircleGeometry(1, 40), m.water);
    water.rotation.x = -Math.PI / 2; water.scale.set(POND.rx, POND.ry, 1); water.position.set(POND.x, gy(POND.x, POND.y) + 0.08, -POND.y);
    parent.add(water);
    for (let i = 0; i < 70; i++) { const a = r() * 6.28, k = 1 + r() * 0.2, x = POND.x + Math.cos(a) * POND.rx * k, y = POND.y + Math.sin(a) * POND.ry * k; b.cyl(m.reed, 0.04, 0.08, 1 + r(), x, gy(x, y) + 0.5, -y, 4); }
  }
  b.into(parent);

  // Слой «Граница участка»: красная линия заказчика
  const border = ribbon(dense(PLOT.concat([PLOT[0]]), 2), 1.1, 0.5, new THREE.MeshBasicMaterial({ color: '#e5402f', transparent: true, opacity: 0.92, depthWrite: false, side: THREE.DoubleSide }));
  border.renderOrder = 3;
  parent.add(border);

  // Слой «Дренаж»: бегущая вода по лоткам и канаве
  const flowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: U.uTime }, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: 'uniform float uTime; varying vec2 vUv; void main(){ float d = fract(vUv.x * .12 - uTime * .9); float a = smoothstep(.0,.15,d) * smoothstep(.55,.2,d); float edge = 1. - abs(vUv.y - .5) * 2.; gl_FragColor = vec4(mix(vec3(.25,.6,.95), vec3(.75,.95,1.), a), (.35 + a * .65) * smoothstep(0.,.5,edge)); }',
  });
  const drain = new THREE.Group();
  for (const p of [SWALE, GUTTER, GUTTER_E]) { const mesh = ribbon(dense(p, 1.5), p === SWALE ? 2.2 : 1.2, 0.45, flowMat); mesh.renderOrder = 4; drain.add(mesh); }
  drain.visible = false;
  parent.add(drain);

  // Люди на дорожках: участок живой
  const routes = [PATHS.axis, PATHS.west, PATHS.entry.concat(PATHS.terrace.slice(1)), PATHS.sport, PATHS.west.slice().reverse()].map((p) => polyline(p));
  const people = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.28, 1.1, 3, 6), new THREE.MeshStandardMaterial({ roughness: 0.8 }), 26);
  const colors = ['#c35f45', '#4f9c8e', '#2f4f6f', '#d8b250', '#e9e2d0', '#5f8fc4', '#8a5a9a', '#2d2d2d'];
  const walkers = [];
  const c = new THREE.Color();
  for (let i = 0; i < people.count; i++) { walkers.push({ route: routes[i % routes.length], d: r() * 400, v: (0.9 + r() * 0.6) * (r() < 0.5 ? 1 : -1), off: (r() - 0.5) * 1.6 }); people.setColorAt(i, c.set(colors[i % colors.length])); }
  people.castShadow = true; people.frustumCulled = false;
  parent.add(people);
  const o = new THREE.Object3D();
  const step = (dt) => {
    walkers.forEach((w, i) => {
      w.d += w.v * dt;
      const [x, y, a] = w.route.at(w.d), px = x + Math.cos(a + Math.PI / 2) * w.off, py = y + Math.sin(a + Math.PI / 2) * w.off;
      o.position.set(px, gy(px, py) + 0.85 + Math.abs(Math.sin(w.d * 3)) * 0.04, -py); o.updateMatrix();
      people.setMatrixAt(i, o.matrix);
    });
    people.instanceMatrix.needsUpdate = true;
  };

  // Овцы у западной границы, как на фото
  const sheep = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.7, 1), new THREE.MeshStandardMaterial({ color: '#efe9de', roughness: 1, flatShading: true }), 9);
  for (let i = 0; i < 9; i++) { const x = -96 + r() * 18, y = -40 + r() * 30; o.position.set(x, gy(x, y) + 0.55, -y); o.scale.set(1.4, 0.9, 0.95); o.rotation.y = r() * 6; o.updateMatrix(); sheep.setMatrixAt(i, o.matrix); }
  sheep.castShadow = true; parent.add(sheep);

  return { border, drain, step };
}
