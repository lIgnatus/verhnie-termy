// Арт-поле по годам и окрестности: мавзолей Тура-хана, визит-центр, будущий музей.
import * as THREE from 'three';
import { Batch, gy, rng, unpack, G } from '../core.js';
import { spiralAt } from '../plan.js';
import { planks, textPlane } from './tex.js';

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });

const ART_SCALE = 1.35;
// Десять объектов по мотивам арт-парка «Таврида»: по одному на каждое лето до 2036 года
export const ART = [
  { year: 2027, name: 'Человек, смотрящий в поле', a: 2.0 },
  { year: 2028, name: 'Кит', a: 3.6, rot: -0.57 },
  { year: 2029, name: 'Солнце', a: 5.0 },
  { year: 2030, name: 'Культурные слои', a: 6.3 },
  { year: 2031, name: 'Качели', a: 7.6 },
  { year: 2032, name: 'Портал', a: 8.8 },
  { year: 2033, name: 'Журавль', a: 9.9 },
  { year: 2034, name: 'Орбиты', a: 11.0 },
  { year: 2035, name: 'Цветная башня', a: 12.1 },
  { year: 2036, name: 'Маяк', a: 13.3 },
];

// Сетчатая фигура: каркас из проволоки поверх еле видного объёма
function wire(geos, color = '#eef2f7') {
  const g = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 });
  const fill = new THREE.MeshStandardMaterial({ color: '#dfe7f0', transparent: true, opacity: 0.08, roughness: 0.3, metalness: 0.6, depthWrite: false });
  for (const geo of geos) {
    g.add(new THREE.LineSegments(new THREE.WireframeGeometry(geo), lineMat));
    g.add(new THREE.Mesh(geo, fill));
  }
  return g;
}
const limb = (a, b, r0, r1, seg = 7) => {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A);
  const g = new THREE.CylinderGeometry(r1, r0, d.length(), seg, 4, true);
  g.translate(0, d.length() / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate(A.x, A.y, A.z);
  return g;
};
const ball = (x, y, z, sx, sy = sx, sz = sx, seg = 9) => { const g = new THREE.SphereGeometry(1, seg, Math.max(5, seg - 3)); g.scale(sx, sy, sz); g.translate(x, y, z); return g; };

// Гранёная фигура: плоская заливка, каждая грань чуть своего цвета, как мозаика
function faceted(geo, palette, seed) {
  const g = geo.toNonIndexed(), r = rng(seed), col = [], c = new THREE.Color();
  for (let i = 0; i < g.attributes.position.count; i += 3) { c.set(palette[Math.floor(r() * palette.length)]).multiplyScalar(0.85 + r() * 0.3); for (let k = 0; k < 3; k++) col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.35, metalness: 0.35 }));
}

function artPiece(i) {
  const g = new THREE.Group(), b = new Batch(), r = rng(i * 13 + 3);
  const white = mat('#f4f1ea'), wood = mat('#a8743f'), gold = mat('#e2b24a', { metalness: 0.5, roughness: 0.3 });
  switch (i) {
    case 0: { // Огромный сидящий человек из сетки, обнимает колени и смотрит на поле
      const parts = [ball(0, 9.4, 0.4, 1.15, 1.35, 1.2), ball(0, 6.6, 0.9, 1.75, 2.5, 1.35), limb([-1.3, 7.9, 0.6], [-1.1, 5.6, -2.4], 0.55, 0.42), limb([1.3, 7.9, 0.6], [1.1, 5.6, -2.4], 0.55, 0.42),
        limb([-0.9, 4.2, 0.8], [-0.9, 6.0, -2.6], 0.9, 0.62), limb([0.9, 4.2, 0.8], [0.9, 6.0, -2.6], 0.9, 0.62), limb([-0.9, 6.0, -2.6], [-0.8, 0.4, -3.2], 0.6, 0.45), limb([0.9, 6.0, -2.6], [0.8, 0.4, -3.2], 0.6, 0.45),
        ball(0, 4.0, 0.9, 1.6, 1.0, 1.3)];
      g.add(wire(parts));
      break;
    }
    case 1: { // Гранёный синий кит выныривает из земли
      const pts = []; for (let k = 0; k <= 14; k++) { const t = k / 14; pts.push(new THREE.Vector3(-9 + t * 18, Math.sin(t * Math.PI) * 6.2 - 0.8, 0)); }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.TubeGeometry(curve, 28, 1, 7, false);
      const p = tube.attributes.position, tmp = new THREE.Vector3();
      for (let k = 0; k < p.count; k++) {
        const seg = Math.floor(k / 8) / 28, rad = 0.4 + 2.1 * Math.sin(Math.min(seg * 1.25, 1) * Math.PI * 0.95) * (1 - seg * 0.55);
        const c = curve.getPoint(Math.min(seg, 1)); tmp.set(p.getX(k), p.getY(k), p.getZ(k)).sub(c).multiplyScalar(rad); p.setXYZ(k, c.x + tmp.x, c.y + tmp.y * 0.85, c.z + tmp.z);
      }
      g.add(faceted(tube, ['#1f4f9e', '#2a6fc0', '#3d8fd6', '#174a7a', '#4aa3c9', '#1c3f78'], 7));
      const fin = new THREE.ConeGeometry(1.6, 3.4, 4); fin.scale(1, 1, 0.25); fin.rotateZ(-0.9); fin.translate(8.8, 1.1, 0);
      g.add(faceted(fin, ['#1f4f9e', '#3d8fd6', '#174a7a'], 9));
      break;
    }
    case 2: { // Колючее «Солнце»: многолучевая переливающаяся звезда на лучах
      const center = 4.6, n = 18, cols = ['#f2c14e', '#e8689a', '#4a93e0', '#2fb3a0', '#c9a0e8'];
      for (let k = 0; k < n; k++) {
        const y = 1 - (k / (n - 1)) * 2, rr = Math.sqrt(1 - y * y), th = k * 2.39996;
        const dir = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr), len = 4.2 + r() * 1.6;
        const cone = new THREE.ConeGeometry(0.42, len, 5); cone.translate(0, len / 2, 0);
        cone.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)); cone.translate(0, center, 0);
        b.push(new THREE.MeshStandardMaterial({ color: cols[k % cols.length], metalness: 0.85, roughness: 0.18, flatShading: true }), cone);
      }
      b.push(gold, new THREE.IcosahedronGeometry(1.1, 0).translate(0, center, 0));
      break;
    }
    case 3: { // «Культурные слои»: ступенчатая пирамида из светящихся кубов
      const cols = ['#2fb3a0', '#4a93e0', '#7fe0d0', '#3a6fd0', '#9fe8ff'];
      for (let lv = 0; lv < 6; lv++) for (let a = -5 + lv; a <= 5 - lv; a++) for (let c = -2 + Math.floor(lv / 2); c <= 2 - Math.floor(lv / 2); c++) {
        if (r() < 0.12 && lv > 0) continue;
        const m = new THREE.MeshStandardMaterial({ color: cols[Math.floor(r() * cols.length)], emissive: cols[Math.floor(r() * cols.length)], emissiveIntensity: 0.35 + r() * 0.5, roughness: 0.2, transparent: true, opacity: 0.88 });
        const cube = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 1.05), m); cube.position.set(a * 1.1, 0.55 + lv * 1.1, c * 1.1); cube.castShadow = true; g.add(cube);
      }
      break;
    }
    case 4: { // Качели между двумя гранёными фигурами из цветного стекла
      const glassCols = ['#e8689a', '#f2c14e', '#2fb3a0', '#4a93e0', '#e0653f', '#8d7fe0'];
      for (const s of [-1, 1]) {
        const tower = new THREE.Group();
        const pts = [[0, 0, -1.4], [0, 0, 1.4], [s * -1.6, 0, 0], [s * 1.6, 6.5, 0], [s * 2.4, 9.2, 0], [s * 3.6, 9.6, 0]];
        const frame = new THREE.MeshStandardMaterial({ color: '#2b2f33', roughness: 0.5, metalness: 0.6 });
        const edge = (a, c) => tower.add(new THREE.Mesh(limb(a, c, 0.09, 0.09, 5), frame));
        edge(pts[0], pts[3]); edge(pts[1], pts[3]); edge(pts[2], pts[3]); edge(pts[0], pts[2]); edge(pts[1], pts[2]); edge(pts[0], pts[1]); edge(pts[3], pts[4]); edge(pts[4], pts[5]);
        for (const [a, c, d] of [[0, 2, 3], [1, 2, 3], [0, 1, 3]]) {
          const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([...pts[a], ...pts[c], ...pts[d]], 3)); tri.computeVertexNormals();
          tower.add(new THREE.Mesh(tri, new THREE.MeshStandardMaterial({ color: glassCols[Math.floor(r() * glassCols.length)], transparent: true, opacity: 0.62, side: THREE.DoubleSide, roughness: 0.15, metalness: 0.2 })));
        }
        tower.position.x = -s * 5.6; g.add(tower);
      }
      b.cyl(mat('#2b2f33'), 0.05, 0.05, 6.5, -0.7, 6.4, 0, 4); b.cyl(mat('#2b2f33'), 0.05, 0.05, 6.5, 0.7, 6.4, 0, 4);
      b.box(wood, 2, 0.12, 0.6, 0, 3.1, 0);
      b.box(mat('#2b2f33'), 4.6, 0.12, 0.12, 0, 9.65, 0);
      break;
    }
    case 5: { // Портал: зеркальный диск в сетчатой сфере
      const sphere = new THREE.IcosahedronGeometry(3.4, 2); sphere.translate(0, 3.6, 0);
      g.add(new THREE.LineSegments(new THREE.EdgesGeometry(sphere, 1), new THREE.LineBasicMaterial({ color: '#e9eef5' })));
      const disc = new THREE.Mesh(new THREE.CircleGeometry(2.4, 40), new THREE.MeshStandardMaterial({ color: '#dfe8f2', metalness: 1, roughness: 0.04, side: THREE.DoubleSide }));
      disc.position.set(0, 3.6, 0); g.add(disc);
      b.push(mat('#3a3f44', { metalness: 0.6 }), new THREE.TorusGeometry(2.45, 0.12, 8, 40).translate(0, 3.6, 0));
      break;
    }
    case 6: { // Журавль из сетки: символ с флага района
      const parts = [ball(0, 6.2, 0, 1.3, 1.1, 2.6), limb([0, 6.8, -1.8], [0, 10.6, -3.0], 0.42, 0.24), ball(0, 10.9, -3.3, 0.45, 0.42, 0.75), limb([0, 10.9, -3.9], [0, 10.5, -5.6], 0.14, 0.02, 5),
        limb([0.4, 5.2, 0.3], [0.3, 0.2, 0.4], 0.16, 0.12, 5), limb([-0.4, 5.2, 0.3], [-0.9, 2.6, 1.6], 0.16, 0.12, 5), ball(0, 6.6, 2.6, 0.9, 0.5, 1.4)];
      const wing = (s) => { const w = new THREE.PlaneGeometry(5.2, 2.6, 6, 3); w.rotateX(-Math.PI / 2); w.rotateZ(s * 0.5); w.translate(s * 3.0, 7.3, 0.4); return w; };
      parts.push(wing(-1), wing(1));
      g.add(wire(parts));
      break;
    }
    case 7: { // Орбиты: кольца и полосатые шары
      const cols = ['#e0453a', '#2fb3a0', '#f2c14e', '#4a93e0'];
      for (let k = 0; k < 3; k++) { const t = new THREE.TorusGeometry(3.6, 0.28, 10, 48); t.rotateX(Math.PI / 2 + (k - 1) * 0.9); t.rotateY(k * 1.1); t.translate(0, 5, 0); b.push(mat(cols[k], { roughness: 0.3 }), t); }
      for (let k = 0; k < 4; k++) { const a = k * 1.7, s = 0.8 + r() * 0.5; b.push(mat(cols[(k + 1) % 4], { roughness: 0.3 }), new THREE.SphereGeometry(s, 16, 12).translate(Math.cos(a) * 3.6, 5 + Math.sin(a * 1.3) * 2.2, Math.sin(a) * 3.6)); }
      b.push(mat('#f4f1ea'), new THREE.SphereGeometry(1.1, 16, 12).translate(0, 5, 0));
      b.cyl(mat('#3a3f44'), 0.12, 0.2, 4, 0, 2, 0, 8);
      break;
    }
    case 8: { // Цветная башня: контейнеры с узором и леса вокруг
      const cols = ['#e8689a', '#f2c14e', '#2fb3a0', '#4a93e0', '#e0653f', '#f4f1ea'];
      for (let k = 0; k < 5; k++) { const w = 3.2 - k * 0.3, h = 2.1; b.box(mat(cols[(k * 2) % cols.length]), w, h, w, (r() - 0.5) * 0.4, h / 2 + k * h, (r() - 0.5) * 0.4, k * 0.35); b.box(mat(cols[(k * 2 + 3) % cols.length]), w + 0.04, 0.35, w + 0.04, 0, k * h + h * 0.7, 0, k * 0.35); }
      for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) b.box(mat('#3a3f44', { metalness: 0.6 }), 0.1, 11, 0.1, x, 5.5, z);
      for (let k = 1; k < 5; k++) { b.box(mat('#3a3f44', { metalness: 0.6 }), 4, 0.08, 0.08, 0, k * 2.1, -2); b.box(mat('#3a3f44', { metalness: 0.6 }), 0.08, 0.08, 4, 2, k * 2.1, 0); }
      b.cyl(white, 0.05, 0.05, 3, 0, 12, 0, 4);
      break;
    }
    case 9: { // Маяк на холме с деревянными блоками-скамьями
      b.cyl(white, 1.5, 2.1, 10, 0, 5, 0, 16);
      for (let k = 0; k < 3; k++) b.cyl(mat('#e0653f'), 1.55 + k * 0.2 - 0.05, 1.6 + k * 0.2, 0.7, 0, 2.2 + k * 3, 0, 16);
      b.cyl(mat('#2b2f33'), 1.7, 1.7, 0.25, 0, 10.1, 0, 16);
      b.push(new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffd27a', emissiveIntensity: 2.6 }), new THREE.CylinderGeometry(1.0, 1.0, 1.3, 16).translate(0, 10.9, 0));
      b.push(mat('#2b2f33'), new THREE.ConeGeometry(1.4, 1.2, 16).translate(0, 12.1, 0));
      for (let k = 0; k < 18; k++) { const a = r() * 6.28, d = 4.5 + r() * 6; b.box(wood, 1.4, 0.45, 0.6, Math.cos(a) * d, 0.22, Math.sin(a) * d, a); }
      break;
    }
  }
  b.into(g);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function buildArtField(parent) {
  const pieces = ART.map((a, i) => {
    const [x, y] = spiralAt(a.a);
    const g = artPiece(i);
    g.position.set(x, gy(x, y) - 0.1, -y); g.rotation.y = a.rot ?? -a.a + Math.PI / 2;
    g.scale.setScalar(ART_SCALE);
    parent.add(g);
    return { ...a, g, x, y, shown: 1, target: 1 };
  });
  return {
    pieces,
    setYear(year) { for (const p of pieces) p.target = p.year <= year ? 1 : 0; },
    update(dt) {
      let busy = false;
      for (const p of pieces) {
        if (p.shown === p.target) continue;
        p.shown += Math.sign(p.target - p.shown) * Math.min(dt * 2.2, Math.abs(p.target - p.shown));
        const s = p.shown < 1 ? 1 - Math.pow(1 - p.shown, 3) : 1;
        p.g.scale.setScalar(Math.max(s * ART_SCALE, 0.001)); p.g.visible = p.shown > 0.001;
        busy = true;
      }
      return busy;
    },
  };
}

// Деревянная тропа над землёй по линии из карты
function boardwalk(points, width, lift, material, railMat) {
  const dense = [];
  for (let i = 0; i + 1 < points.length; i++) { const [ax, ay] = points[i], [bx, by] = points[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 3)); for (let k = 0; k < n; k++) dense.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]); }
  dense.push(points[points.length - 1]);
  const pos = [], uv = [], idx = [], rails = [];
  let d = 0;
  dense.forEach(([x, y], i) => {
    const a = dense[Math.max(i - 1, 0)], c = dense[Math.min(i + 1, dense.length - 1)], dx = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    if (i) d += Math.hypot(x - dense[i - 1][0], y - dense[i - 1][1]);
    const h = gy(x, y) + lift;
    for (const s of [-1, 1]) { const px = x + (nx * s * width) / 2, py = y + (ny * s * width) / 2; pos.push(px, h, -py); uv.push(s < 0 ? 0 : width, d); rails.push([px, h + 0.9, -py, s]); }
    if (i + 1 < dense.length) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  const deck = new THREE.Mesh(g, material); deck.receiveShadow = true;
  const grp = new THREE.Group(); grp.add(deck);
  const line = (side) => { const pts = rails.filter((q) => q[3] === side).map((q) => new THREE.Vector3(q[0], q[1], q[2])); const geo = new THREE.BufferGeometry().setFromPoints(pts); grp.add(new THREE.Line(geo, railMat)); };
  line(-1); line(1);
  return grp;
}

export function buildTura(parent) {
  const b = new Batch();
  const stone = mat('#d9c7a6', { roughness: 0.95 }), stoneDark = mat('#b59d78', { roughness: 0.95 }), dark = mat('#3c3530');
  const larch = new THREE.MeshStandardMaterial({ map: planks('#c09060'), roughness: 0.75, side: THREE.DoubleSide });

  // Мавзолей: квадрат 6,6 × 6,6 м, портал со стрельчатой аркой, верхний купол утрачен
  {
    const x = 2161, y = -420, g = gy(x, y), grp = new THREE.Group();
    grp.position.set(x, g, -y); grp.rotation.y = 0.2;
    const mb = new Batch();
    mb.box(stone, 6.6, 3.4, 6.6, 0, 1.7, 0);
    mb.cyl(stone, 3.1, 3.3, 1.8, 0, 4.3, 0, 8);
    mb.push(stoneDark, new THREE.SphereGeometry(2.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.4).translate(0, 5.2, 0));
    mb.box(stone, 4.6, 6.4, 1.2, 0, 3.2, 3.6);
    const arch = new THREE.Shape(); arch.moveTo(-1, 0); arch.lineTo(1, 0); arch.lineTo(1, 2.4); arch.quadraticCurveTo(1, 3.4, 0, 4); arch.quadraticCurveTo(-1, 3.4, -1, 2.4); arch.closePath();
    mb.push(dark, new THREE.ShapeGeometry(arch).translate(0, 0.3, 4.22));
    mb.push(mat('#5a4636', { roughness: 1 }), new THREE.CircleGeometry(9, 24).rotateX(-Math.PI / 2).translate(0, 0.05, 0));
    mb.into(grp);
    parent.add(grp);
  }

  // Тропа длиной 620 м: зигзаг по склону и петля вокруг мавзолея, линия из карты
  const path = G.roads.find((q) => q.c === 'path');
  if (path) parent.add(boardwalk(unpack(path.p), 2.4, 0.45, larch, new THREE.LineBasicMaterial({ color: '#8a6440' })));

  // Визит-центр по контуру из карты: клин врезан в склон, кровля из досок служит смотровой площадкой
  const vc = G.buildings.find((q) => q.id === 1416518231);
  if (vc) {
    const p = unpack(vc.p).slice(0, -1);
    const yN = (x) => -668.6 + ((x - 2128) * 10.7) / 65.6, yS = (x) => -694.1 + ((x - 2112.7) * 10.5) / 88.1;
    const south = p.filter(([x, y]) => y < yN(x) - 8);
    const base = Math.min(...south.map(([x, y]) => gy(x, y))) - 0.2;
    const H = 6.8;
    const roofY = (x, y) => base + 0.4 + H * Math.min(Math.max((yN(x) - y) / (yN(x) - yS(x)), 0), 1);
    // Кровля
    const shape = new THREE.Shape(p.map(([x, y]) => new THREE.Vector2(x, y)));
    const rg = new THREE.ShapeGeometry(shape);
    const rp = rg.attributes.position, ruv = [];
    for (let k = 0; k < rp.count; k++) { const x = rp.getX(k), y = rp.getY(k); rp.setXYZ(k, x, Math.max(roofY(x, y), gy(x, y) + 0.15), -y); ruv.push(x * 0.5, y * 1.2); }
    rg.setAttribute('uv', new THREE.Float32BufferAttribute(ruv, 2));
    rg.computeVertexNormals();
    const roofMat = new THREE.MeshStandardMaterial({ map: planks('#c79a68'), roughness: 0.8, side: THREE.DoubleSide });
    const roof = new THREE.Mesh(rg, roofMat); roof.castShadow = true; roof.receiveShadow = true; parent.add(roof);
    // Южный фасад: стекло в глубине, перед ним колонны и вертикальные рейки
    const glass = new THREE.MeshStandardMaterial({ color: '#2d3a42', roughness: 0.08, metalness: 0.6, emissive: '#ffcf8a', emissiveIntensity: 0.12 });
    const slat = new THREE.MeshStandardMaterial({ color: '#c08a55', roughness: 0.7 });
    const sp = p.filter(([x, y]) => y < yN(x) - 6).sort((a, c) => a[0] - c[0]);
    for (let i = 0; i + 1 < sp.length; i++) {
      const [ax, ay] = sp[i], [bx, by] = sp[i + 1], l = Math.hypot(bx - ax, by - ay), ang = Math.atan2(by - ay, bx - ax);
      const n = Math.floor(l / 0.42);
      for (let k = 0; k <= n; k++) {
        const t = k / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t, top = roofY(x, y), h = top - base;
        if (h < 0.6) continue;
        const gap = k % 9 === 4;
        b.box(gap ? larch : slat, gap ? 0.32 : 0.09, h, gap ? 0.32 : 0.2, x - Math.sin(ang) * 0.6, base + h / 2, -(y + Math.cos(ang) * 0.6), -ang);
      }
      const mx = (ax + bx) / 2, my = (ay + by) / 2, hm = roofY(mx, my) - base;
      b.box(glass, l, Math.max(hm - 0.5, 0.5), 0.1, mx + Math.sin(ang) * 1.6, base + Math.max(hm - 0.5, 0.5) / 2, -(my - Math.cos(ang) * 1.6), -ang);
    }
    // Вывеска на светлой полосе внизу фасада, как на фото
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(26, 1.05), new THREE.MeshStandardMaterial({ map: textPlane([{ t: 'ЕВРАЗИЙСКИЙ МУЗЕЙ КОЧЕВЫХ ЦИВИЛИЗАЦИЙ', size: 70 }], { w: 2400, h: 96, color: '#2f2a25', bg: '#f1ece2', font: '"Golos Text", Arial, sans-serif', weight: 600 }) }));
    const sx = 2150, sy = yS(2150) - 1.4;
    sign.position.set(sx, base + 1.0, -sy); sign.rotation.y = Math.atan2(10.5, 88.1);
    parent.add(sign);
    // Ступени-трибуна на западном краю кровли
    for (let k = 0; k < 9; k++) { const x = 2126, y = yS(x) + 2 + k * 1.6; b.box(larch, 12, 0.4, 1.6, x, roofY(x, y) + 0.1, -y, -0.12); }
    // Деревянные скамьи на площади
    for (let k = 0; k < 7; k++) { const x = 2118 + k * 12, y = yS(x) - 9; b.box(larch, 3.4, 0.45, 0.8, x, gy(x, y) + 0.22, -y, -0.12); }
  }
  b.into(parent);

  // Будущий музей в стороне от оси визит-центр → мавзолей: врезан в склон, зелёные кровли, стекло
  const museum = new THREE.Group();
  const green = new THREE.MeshStandardMaterial({ color: '#7f9f58', roughness: 0.95, side: THREE.DoubleSide });
  const gls = new THREE.MeshStandardMaterial({ color: '#9fb8c6', roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.78, emissive: '#ffd59a', emissiveIntensity: 0.1 });
  const slabM = new THREE.MeshStandardMaterial({ color: '#8e9195', roughness: 0.6 });
  const wedge = (cx, cy, w, d, h, ang) => {
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const P = (u, v) => [cx + u * ca - v * sa, cy + u * sa + v * ca];
    const corners = [P(-w / 2, -d / 2), P(w / 2, -d / 2), P(w / 2, d / 2), P(-w / 2, d / 2)];
    const base = Math.min(...corners.map(([x, y]) => gy(x, y))) - 0.5;
    const top = (v) => base + h * ((d / 2 - v) / d) + 0.4;
    const q = [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([u, v]) => { const [x, y] = P(u, v); return [x, Math.max(top(v), gy(x, y) + 0.2), -y]; });
    const roofG = new THREE.BufferGeometry();
    roofG.setAttribute('position', new THREE.Float32BufferAttribute([...q[0], ...q[1], ...q[2], ...q[0], ...q[2], ...q[3]], 3)); roofG.computeVertexNormals();
    museum.add(new THREE.Mesh(roofG, green));
    const [fx, fy] = P(0, -d / 2 - 1.5);
    const vis = new THREE.Mesh(new THREE.BoxGeometry(w + 4, 0.7, 4.5), slabM); vis.position.set(fx, base + h + 0.3, -fy); vis.rotation.y = -ang; museum.add(vis);
    const [gx, gy_] = P(0, -d / 2 + 0.6);
    const front = new THREE.Mesh(new THREE.BoxGeometry(w - 1, h, 0.2), gls); front.position.set(gx, base + h / 2, -gy_); front.rotation.y = -ang; museum.add(front);
    for (let k = -Math.floor(w / 8); k <= Math.floor(w / 8); k++) { const [mx, my] = P(k * 4, -d / 2 + 0.3); const m = new THREE.Mesh(new THREE.BoxGeometry(0.3, h, 0.3), slabM); m.position.set(mx, base + h / 2, -my); museum.add(m); }
  };
  wedge(2050, -618, 74, 36, 13, 0.22);
  wedge(2010, -582, 46, 28, 8.5, 0.62);
  museum.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  parent.add(museum);
  return { museum };
}
