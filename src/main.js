import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { loadHeights, gy, W, T, tween, stepTweens, lerp, clamp, ease, landSDF } from './core.js';
import { buildTerrain } from './world/terrain.js';
import { buildNature, buildVillage } from './world/nature.js';
import { buildSchool } from './world/school.js';
import { buildPlot } from './world/plot.js';
import { buildArtField, buildTura, ART } from './world/places.js';
import { buildSky } from './world/sky.js';
import { buildCloud } from './meaning/cloud.js';
import { createGraph } from './meaning/graph.js';
import { STATUS, CORE, PETALS, NODES, LINKS, PLACES, ROOMS, STOPS, THESIS } from './content.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Пауза между шагами сборки: кадр отрисовки или таймер, если вкладка в фоне
const frame = () => new Promise((r) => { const t = setTimeout(r, 60); requestAnimationFrame(() => { clearTimeout(t); r(); }); });

const small = Math.min(innerWidth, innerHeight) < 700 || /Android|iPhone|iPad/i.test(navigator.userAgent);
const quality = small
  ? { dpr: 1.5, shadow: 2048, groundTex: 2048, patchTex: 1536, forest: 2600, tufts: 2400, beds: 500, cloud: 5000, post: false }
  : { dpr: 1.5, shadow: 4096, groundTex: 4096, patchTex: 3072, forest: 6500, tufts: 7500, beds: 900, cloud: 9000, post: true };

const canvas = $('#view');
const loader = $('#loader'), loaderText = $('#loader-text'), bricks = [...document.querySelectorAll('#loader .lb')];
const progress = (i, text) => { bricks.forEach((b, k) => b.classList.toggle('on', k < i)); if (text) loaderText.textContent = text; };

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  loaderText.textContent = 'Браузер не запустил 3D. Откройте страницу в свежем Chrome, Edge или Safari.';
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, quality.dpr));
renderer.setSize(innerWidth, innerHeight, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog('#efd3b4', 4200, 16000);
const camera = new THREE.PerspectiveCamera(34, innerWidth / innerHeight, 2, 60000);
const world = new THREE.Group();
scene.add(world);

// Золотой час: солнце низко на юго-западе и светит в фасад, как на визуализации
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 21), THREE.MathUtils.degToRad(-52));
const sun = new THREE.DirectionalLight('#ffd3a1', 3.1);
sun.castShadow = true;
sun.shadow.mapSize.set(quality.shadow, quality.shadow);
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.5;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#c5dbf2', '#7b6646', 1.05);
scene.add(hemi);

const U = { uTime: { value: 0 } };

// Постобработка: мягкая тень в углах и под деревьями, лёгкое свечение окон и фонарей.
// Облако рисуется отдельной сценой поверх, чтобы не попадать в расчёт теней
const fxScene = new THREE.Scene();
let composer = null;
if (quality.post) {
  const rt = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: 4 });
  composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(innerWidth, innerHeight);
  composer.addPass(new RenderPass(scene, camera));
  const ao = new GTAOPass(scene, camera, innerWidth, innerHeight);
  ao.updateGtaoMaterial({ radius: 2.6, distanceExponent: 1.4, thickness: 1.6, scale: 1.25, samples: 16, distanceFallOff: 1, screenSpaceRadius: false });
  ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 });
  ao.blendIntensity = 0.9;
  composer.addPass(ao);
  const fx = new RenderPass(fxScene, camera); fx.clear = false;
  composer.addPass(fx);
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.28, 0.5, 0.9));
  composer.addPass(new OutputPass());
}
// Как на карте: левая кнопка двигает, правая поворачивает, колесо приближает
const controls = new MapControls(camera, canvas);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.minDistance = 14; controls.maxDistance = 6500;
controls.minPolarAngle = 0.18; controls.maxPolarAngle = 1.42;
controls.screenSpacePanning = false;
controls.zoomSpeed = 1.1; controls.rotateSpeed = 0.55;

// Виды: камера и точка, на которую она смотрит (x, высота, z = -север)
const VIEWS = {
  home: [[-46, 88, 186], [14, 12, -2]],
  area: [[260, 2350, 2700], [1050, 0, 260]],
  plot: [[-210, 250, 300], [20, 0, 110]],
  school: [[44, 54, 92], [13, 6, -2]],
  garden: [[-62, 52, 160], [22, 4, 92]],
  circle: [[-34, 48, 292], [28, 2, 214]],
  art: [[70, 110, 190], [182, 6, 16]],
  tura: [[1930, 240, 990], [2150, 15, 560]],
};
const viewOf = (id) => {
  const v = VIEWS[id];
  if (v) return { pos: new THREE.Vector3(...v[0]), tgt: new THREE.Vector3(...v[1]) };
  const p = PLACES[id];
  const t = W(p.x, p.y, 4), dir = new THREE.Vector3(-0.55, 0.62, 0.86).normalize();
  const d = p.group === 'tura' ? 360 : p.group === 'area' ? 520 : 110;
  return { pos: t.clone().addScaledVector(dir, d), tgt: t };
};

let flight = null;
function flyTo(view, dur = 2.2, done) {
  flight?.stop();
  const p0 = camera.position.clone(), t0 = controls.target.clone(), { pos, tgt } = view;
  const lift = Math.min(p0.distanceTo(pos) * 0.18, 700);
  controls.enabled = false;
  flight = tween({ dur, onUpdate: (k, raw) => {
    camera.position.lerpVectors(p0, pos, k); camera.position.y += Math.sin(raw * Math.PI) * lift;
    controls.target.lerpVectors(t0, tgt, k);
    camera.lookAt(controls.target);
  }, onDone: () => { flight = null; if (state === 'land') controls.enabled = true; done?.(); } });
}

// Тень следует за взглядом камеры
let shadowKey = '';
function fitShadow(force) {
  const t = state === 'land' ? controls.target : new THREE.Vector3(40, 0, 60);
  const d = camera.position.distanceTo(controls.target);
  const half = clamp(d * 0.7, 70, 2400);
  const key = `${Math.round(t.x / (half * 0.05))},${Math.round(t.z / (half * 0.05))},${Math.round(Math.log2(half) * 6)}`;
  if (!force && key === shadowKey) return;
  shadowKey = key;
  const c = sun.shadow.camera;
  sun.target.position.copy(t);
  sun.position.copy(t).addScaledVector(sunDir, 4000);
  c.left = -half; c.right = half; c.top = half; c.bottom = -half; c.near = 100; c.far = 9000;
  c.updateProjectionMatrix();
  renderer.shadowMap.needsUpdate = true;
}

const state0 = { mode: 'land' };
let state = 'land';
let school, plot, art, cloud, graph, sky, terrain;
const pins = [];
const labels = $('#labels');

// ---------- Сборка мира ----------
async function build() {
  progress(1, 'Поднимаем рельеф');
  await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]);
  await loadHeights('assets/height.txt');
  await frame();
  terrain = buildTerrain(world, { quality, renderer });
  progress(2, 'Сажаем лес и сад'); await frame();
  buildNature(world, { quality });
  progress(3, 'Ставим дома деревни'); await frame();
  buildVillage(world);
  progress(4, 'Строим школу'); await frame();
  school = buildSchool(world);
  progress(5, 'Благоустраиваем участок'); await frame();
  plot = buildPlot(world, U);
  art = buildArtField(world);
  art.setYear(2031); for (const p of art.pieces) { p.shown = p.target; p.g.visible = p.target > 0; p.g.scale.setScalar(Math.max(p.target * 1.35, 0.001)); }
  progress(6, 'Тура-хан и музей'); await frame();
  buildTura(world);
  sky = buildSky(scene, sunDir);
  progress(7, 'Собираем облако смыслов'); await frame();
  cloud = buildCloud(composer ? fxScene : scene, PETALS, { count: quality.cloud });
  placeCloud(0);
  graph = createGraph($('#graph'), { nodes: NODES, links: LINKS, petals: PETALS, core: CORE, onSelect: (n, isCore) => (isCore ? showCore() : showNode(n)) });
  makePins();
  progress(8, 'Готово');
}

// ---------- Облако ----------
// Облако висит прямо над школой
const CLOUD_LAND = { pos: new THREE.Vector3(16, 50, 2), scale: 0.1 };
const CLOUD_SKY = { pos: new THREE.Vector3(16, 320, 4), scale: 1 };
const SINK = 150;
function placeCloud(k) {
  cloud.group.position.lerpVectors(CLOUD_LAND.pos, CLOUD_SKY.pos, k);
  cloud.group.scale.setScalar(lerp(CLOUD_LAND.scale, CLOUD_SKY.scale, k));
  cloud.uniforms.uScale.value = cloud.group.scale.x;
}
// Камера отходит так, чтобы ромашка с подписями помещалась между шапкой и панелью
const skyView = () => {
  const Wd = innerWidth, Hd = innerHeight, wide = Wd > 760, R = 336;
  const tv = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), th = tv * (Wd / Hd);
  const freeV = Hd / 2 - (wide ? 118 : 150), freeH = Wd / 2 - (wide ? 140 : 70);
  const d = Math.max((R * (Hd / 2)) / (Math.max(freeV, 80) * tv), (R * (Wd / 2)) / (Math.max(freeH, 80) * th), 900);
  const up = ((wide ? 118 - 84 : 150 - 70) / 2) * ((d * tv) / (Hd / 2));
  return { pos: CLOUD_SKY.pos.clone().add(new THREE.Vector3(0, -up, d)), tgt: CLOUD_SKY.pos.clone().add(new THREE.Vector3(0, -up, 0)) };
};

let landPose = null, mt = null;
function goMeaning(then) {
  if (state !== 'land') { then?.(); return; }
  state = 'meaning';
  document.body.dataset.mode = 'meaning';
  landPose = { pos: camera.position.clone(), tgt: controls.target.clone() };
  closePanel(); setLevel(0, true);
  controls.enabled = false;
  const v = skyView();
  flyTo(v, 2.4);
  mt?.stop();
  const m0 = cloud.uniforms.uMorph.value;
  mt = tween({ dur: 2.6, fn: (t) => t, onUpdate: (k) => {
    const e = ease(k);
    cloud.uniforms.uMorph.value = lerp(m0, 1, clamp(k * 1.15 - 0.1));
    placeCloud(e);
    world.position.y = -SINK * e;
    setNight(e);
  }, onDone: () => { renderDock(); updateCrumbs(); then?.(); } });
  renderDock(); updateCrumbs();
}
function goLand(after) {
  if (state === 'land') { after?.(); return; }
  graph.close(); cloud.uniforms.uFocus.value = -9; cloud.uniforms.uDim.value = 0; cloud.uniforms.uHover.value = -9;
  state = 'land';
  document.body.dataset.mode = 'land';
  closePanel();
  const back = landPose || viewOf('home');
  flyTo(back, 2.2, after);
  mt?.stop();
  const m0 = cloud.uniforms.uMorph.value;
  mt = tween({ dur: 2.2, fn: (t) => t, onUpdate: (k) => {
    const e = ease(k);
    cloud.uniforms.uMorph.value = lerp(m0, 0, e);
    placeCloud(1 - e);
    world.position.y = -SINK * (1 - e);
    setNight(1 - e);
  } });
  renderDock(); updateCrumbs();
}
function setNight(n) {
  sky.uniforms.uNight.value = n;
  cloud.uniforms.uNight.value = n;
  sun.intensity = lerp(3.1, 0.25, n);
  hemi.intensity = lerp(1.05, 0.35, n);
  hemi.color.set('#c5dbf2').lerp(new THREE.Color('#4a4f9a'), n);
  scene.fog.color.set('#efd3b4').lerp(new THREE.Color('#1c1d44'), n);
  renderer.toneMappingExposure = lerp(1.02, 1.0, n);
}

function openPetal(i, nodeId) {
  if (state === 'land') { goMeaning(() => openPetal(i, nodeId)); return; }
  state = 'graph';
  document.body.dataset.mode = 'graph';
  const p = PETALS[i];
  cloud.uniforms.uFocus.value = i; cloud.uniforms.uDim.value = 0.6; cloud.uniforms.uHover.value = -9;
  showPetal(p);
  graph.open(p.id);
  if (nodeId) setTimeout(() => graph.select(nodeId), 60);
  renderDock(); updateCrumbs();
}
function openAll() {
  if (state === 'land') { goMeaning(openAll); return; }
  state = 'graph';
  document.body.dataset.mode = 'graph';
  cloud.uniforms.uFocus.value = -9; cloud.uniforms.uDim.value = 0.75;
  graph.open(null);
  showAbout(false);
  closePanel();
  renderDock(); updateCrumbs();
}
function closePetal() {
  graph.close();
  state = 'meaning';
  document.body.dataset.mode = 'meaning';
  cloud.uniforms.uFocus.value = -9; cloud.uniforms.uDim.value = 0;
  closePanel();
  renderDock(); updateCrumbs();
}

// ---------- Подписи на модели ----------
function makePins() {
  for (const [id, p] of Object.entries(PLACES)) {
    const e = document.createElement('button');
    e.className = 'pin pin-' + p.group; e.type = 'button';
    e.innerHTML = `<span class="pin-dot"></span><span class="pin-text">${esc(p.title)}</span>`;
    e.addEventListener('click', () => openPlace(id));
    labels.appendChild(e);
    const [pri, maxD, minD = 15] = PIN[id] || [3, 900];
    pins.push({ id, e, world: W(p.x, p.y, p.h), maxD, minD, pri, kind: 'place', layer: p.layer, w: p.title.length * 7.6 + 26 });
  }
  for (const room of ROOMS) {
    const e = document.createElement('button');
    e.className = 'pin pin-room'; e.type = 'button';
    e.innerHTML = `<span class="pin-dot"></span><span class="pin-text">${esc(room.title)}</span>`;
    e.addEventListener('click', () => showRoom(room));
    labels.appendChild(e);
    pins.push({ id: room.id, e, room, kind: 'room', maxD: 260, minD: 5, pri: 1, w: room.title.length * 7.6 + 26 });
  }
  PETALS.forEach((p, i) => {
    const e = document.createElement('button');
    e.className = 'petal-label'; e.type = 'button'; e.style.setProperty('--c', p.color);
    e.innerHTML = `<span class="pl-title">${esc(p.title)}</span><span class="pl-lead">${esc(p.lead)}</span>`;
    e.addEventListener('click', () => openPetal(i));
    e.addEventListener('pointerenter', () => { if (state === 'meaning') cloud.uniforms.uHover.value = i; });
    e.addEventListener('pointerleave', () => { if (cloud.uniforms.uHover.value === i) cloud.uniforms.uHover.value = -9; });
    labels.appendChild(e);
    pins.push({ id: 'petal-' + i, e, kind: 'petal', petal: i });
  });
  const core = document.createElement('button');
  core.className = 'petal-label core-label'; core.type = 'button';
  core.innerHTML = `<span class="pl-title">${esc(CORE.short)}</span><span class="pl-lead">Ядро ромашки</span>`;
  core.addEventListener('click', showCore);
  labels.appendChild(core);
  pins.push({ id: 'core', e: core, kind: 'petal', petal: -1 });
  const cl = document.createElement('button');
  cl.className = 'cloud-cta'; cl.type = 'button';
  cl.innerHTML = '<span>Облако смыслов</span><small>нажмите, чтобы раскрыть</small>';
  cl.addEventListener('click', () => goMeaning());
  labels.appendChild(cl);
  pins.push({ id: 'cloud', e: cl, kind: 'cloud' });
}

// Важность подписи и дальность, с которой она видна: [приоритет, максимум, минимум]
const PIN = { school: [0, 1700], orchard: [1, 1200], cabins: [1, 1200], lobnoe: [1, 1100], artfield: [1, 1700], sport: [2, 460], court: [2, 520], drain: [2, 800], flags: [3, 300], greenhouse: [3, 330], terrace: [3, 330], village: [2, 5200, 700], tura: [0, 4200], visit: [1, 3200], museum: [1, 3200], nt: [2, 5200] };
const v3 = new THREE.Vector3();
let showLabels = true;
function updatePins() {
  const w = innerWidth, h = innerHeight, camD = camera.position.distanceTo(controls.target);
  const lvl = school.level;
  for (const p of pins) {
    let on = false, pos = null;
    if (p.kind === 'place' && state === 'land' && showLabels && !flight) {
      if (p.layer === 'drain' && !plot.drain.visible) on = false;
      else { pos = p.world; const d = camera.position.distanceTo(pos); on = d < p.maxD && d > p.minD && !(lvl > 0 && camD < 200 && p.id !== 'school'); }
    } else if (p.kind === 'room' && state === 'land' && lvl > 0 && !flight) {
      const f = p.room.floor, vis = lvl === 1 ? f === 2 || p.room.kind === 'bighall' : f === 1;
      if (vis) { pos = school.anchor(p.room); on = camera.position.distanceTo(pos) < p.maxD; if (lvl === 1 && f === 1 && p.room.kind === 'bighall') pos.y -= 0; }
    } else if (p.kind === 'petal' && state === 'meaning' && cloud.uniforms.uMorph.value > 0.92) {
      pos = cloud.anchor(p.petal, 1.12); on = true;
    } else if (p.kind === 'cloud' && state === 'land' && !flight) {
      pos = cloud.group.localToWorld(v3.set(0, innerWidth > 760 ? 150 : -170, 0)).clone(); on = true;
    }
    if (on && pos) {
      v3.copy(pos).project(camera);
      on = v3.z < 1 && Math.abs(v3.x) < 1.05 && Math.abs(v3.y) < 1.05;
      if (on) { p.sx = ((v3.x + 1) / 2) * w; p.sy = ((1 - v3.y) / 2) * h; p.e.style.transform = `translate(${p.sx}px, ${p.sy}px)`; }
    }
    p.want = on;
  }
  // Подписи не налезают друг на друга: важные остаются, остальные прячутся
  const placed = [];
  for (const p of pins.filter((q) => q.want && (q.kind === 'place' || q.kind === 'room')).sort((a, b) => (a.pri ?? 1) - (b.pri ?? 1))) {
    const bw = p.w || 150, box = [p.sx - bw / 2, p.sy - 44, p.sx + bw / 2, p.sy - 14];
    if (placed.some((q) => box[0] < q[2] && box[2] > q[0] && box[1] < q[3] && box[3] > q[1])) p.want = false;
    else placed.push(box);
  }
  for (const p of pins) if (p.on !== p.want) { p.on = p.want; p.e.classList.toggle('on', p.want); }
}

// ---------- Карточки ----------
const panel = $('#panel'), panelBody = $('#panel-body');
function openPanelHTML(html) {
  panelBody.innerHTML = html;
  panel.scrollTop = 0; panelBody.scrollTop = 0;
  document.body.classList.add('panel-open');
  graph?.relayout();
}
function closePanel() { document.body.classList.remove('panel-open'); graph?.relayout(); }
$('#panel-close').addEventListener('click', closePanel);

const statusChip = (s) => (s ? `<span class="st st-${s}" title="${esc(STATUS[s].hint)}">${esc(STATUS[s].label)}</span>` : '');
const nodeById = new Map(NODES.map((n) => [n.id, n]));
const petalOf = (n) => PETALS.find((p) => p.id === n.p);
const chip = (id) => { const n = nodeById.get(id); if (!n) return ''; const p = petalOf(n); return `<button class="chip" data-node="${id}" style="--c:${p.color}"><i></i>${esc(n.title)}</button>`; };
const sources = (src) => (src?.length ? `<div class="src"><h4>Источники</h4>${src.map((s) => (s.u ? `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)}</a>` : `<span>${esc(s.t)}</span>`)).join('')}</div>` : '');
const factsHTML = (f) => (f?.length ? `<dl class="facts">${f.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : '');
const imgHTML = (src, note) => (src ? `<figure class="card-img"><img src="${src}" alt="${esc(note || '')}" loading="lazy"><figcaption>${esc(note || '')}</figcaption></figure>` : '');

function showPlace(id) {
  const p = PLACES[id];
  let extra = '';
  if (p.action === 'interior') extra = `<button class="act" data-act="interior">Снять крышу и заглянуть внутрь</button>`;
  if (p.action === 'years') {
    const shown = art.pieces.filter((q) => q.target > 0).length;
    extra = `<div class="years"><label for="year-range">Лето <b id="year-val">${2026 + shown}</b>: объектов на поле <b id="year-count">${shown}</b></label><input id="year-range" type="range" min="2026" max="2036" step="1" value="${2026 + shown}"><div class="ticks"><span>2026</span><span>2031</span><span>2036</span></div><ol id="year-list">${ART.map((a) => `<li data-y="${a.year}">${a.year}: ${esc(a.name)}</li>`).join('')}</ol></div>`;
  }
  if (id === 'drain') extra += `<button class="act" data-act="drain">${plot.drain.visible ? 'Скрыть' : 'Показать'} движение воды</button>`;
  openPanelHTML(`
    <div class="eyebrow">${statusChip(p.status)}${p.tag ? `<span class="tag">${esc(p.tag)}</span>` : ''}</div>
    <h2>${esc(p.title)}</h2>
    ${imgHTML(p.img, p.imgNote)}
    <p>${esc(p.text)}</p>
    ${factsHTML(p.facts)}
    ${extra}
    ${p.meanings?.length ? `<div class="links"><h4>Смыслы этого места</h4>${p.meanings.map(chip).join('')}</div>` : ''}
  `);
  if (p.action === 'years') bindYears();
}
function bindYears() {
  const input = $('#year-range'), paint = () => {
    const y = +input.value;
    art.setYear(y);
    const n = ART.filter((a) => a.year <= y).length;
    $('#year-val').textContent = y; $('#year-count').textContent = n;
    document.querySelectorAll('#year-list li').forEach((li) => li.classList.toggle('on', +li.dataset.y <= y));
  };
  input.addEventListener('input', paint); paint();
}
function showRoom(room) {
  openPanelHTML(`
    <div class="eyebrow">${statusChip('plan')}<span class="tag">${room.floor === 1 ? 'Первый этаж' : 'Второй этаж'}</span></div>
    <h2>${esc(room.title)}</h2>
    ${imgHTML(room.img, room.img ? 'Из концепт-визуализации' : '')}
    <p>${esc(room.text)}</p>
    ${factsHTML([['Площадь', `${Math.round((room.u[1] - room.u[0]) * (room.v[1] - room.v[0]))} м²`]])}
    ${room.meanings?.length ? `<div class="links"><h4>Смыслы этого места</h4>${room.meanings.map(chip).join('')}</div>` : ''}
    <p class="note">Планировка условная: школа типовая, поэтажного плана пока нет.</p>
  `);
}
function showNode(n) {
  const p = petalOf(n);
  const near = graph.neighbors(n.id).filter((x) => x.id !== CORE.id);
  const place = n.place && PLACES[n.place] ? n.place : n.place === 'interior' ? 'school' : n.place === 'plot' ? 'plot' : null;
  openPanelHTML(`
    <div class="eyebrow">${statusChip(n.status)}<span class="tag" style="--c:${p.color}"><i></i>${esc(p.title)}</span></div>
    <h2>${esc(n.title)}</h2>
    <p>${esc(n.text)}</p>
    ${place ? `<button class="act" data-act="place:${place}${n.place === 'interior' ? ':in' : ''}">Показать на модели</button>` : ''}
    ${near.length ? `<div class="links"><h4>Связано</h4>${near.map((x) => chip(x.id)).join('')}</div>` : ''}
    ${sources(n.src)}
  `);
}
function showPetal(p) {
  const list = NODES.filter((n) => n.p === p.id);
  openPanelHTML(`
    <div class="eyebrow"><span class="tag" style="--c:${p.color}"><i></i>Лепесток</span></div>
    <h2>${esc(p.title)}</h2>
    <p class="lead">${esc(p.lead)}</p>
    <div class="links"><h4>Смыслы лепестка</h4>${list.map((n) => chip(n.id)).join('')}</div>
    <p class="note">Нажмите на узел графа: справа откроется объяснение и связи. Узлы можно перетаскивать.</p>
  `);
}
function showCore() {
  openPanelHTML(`
    <div class="eyebrow">${statusChip(CORE.status)}<span class="tag">Ядро ромашки</span></div>
    <h2>${esc(CORE.title)}</h2>
    <p>${esc(CORE.text)}</p>
    <div class="links"><h4>Лепестки</h4>${PETALS.map((p, i) => `<button class="chip" data-petal="${i}" style="--c:${p.color}"><i></i>${esc(p.title)}</button>`).join('')}</div>
    <button class="act" data-act="all">Показать все связи сразу</button>
  `);
}

panel.addEventListener('click', (e) => {
  const c = e.target.closest('[data-node],[data-petal],[data-act]');
  if (!c) return;
  if (c.dataset.node) {
    const n = nodeById.get(c.dataset.node), i = PETALS.findIndex((p) => p.id === n.p);
    if (state === 'graph' && graph.focus === n.p) graph.select(n.id);
    else openPetal(i, n.id);
  } else if (c.dataset.petal) openPetal(+c.dataset.petal);
  else {
    const a = c.dataset.act;
    if (a === 'interior') { flyTo(viewOf('school'), 1.6); setLevel(1); closePanel(); }
    else if (a === 'all') openAll();
    else if (a === 'drain') { setLayer('drain', !plot.drain.visible); showPlace('drain'); }
    else if (a.startsWith('place:')) {
      const [, id, inside] = a.split(':');
      goLand(() => { openPlace(id); if (inside) setLevel(1); });
    }
  }
});

function openPlace(id) {
  if (state !== 'land') { goLand(() => openPlace(id)); return; }
  const stop = { school: 'school', orchard: 'garden', cabins: 'garden', lobnoe: 'circle', court: 'circle', artfield: 'art', tura: 'tura', visit: 'tura', museum: 'tura', plot: 'plot' }[id];
  flyTo(stop ? viewOf(stop) : viewOf(id), 1.8);
  if (id === 'drain') setLayer('drain', true);
  if (PLACES[id]) showPlace(id);
  activeStop = stop || null;
  renderDock();
}

// ---------- Нижняя панель: кладка из кирпичей ----------
let activeStop = 'home';
const layers = { border: true, drain: false, labels: true, motion: true };
function renderDock() {
  const stops = $('#stops'), lay = $('#layers');
  if (state === 'land') {
    stops.innerHTML = STOPS.map((s) => `<button class="brick${activeStop === s.id ? ' on' : ''}" data-stop="${s.id}">${esc(s.title)}</button>`).join('') + `<button class="brick brick-cloud" data-go="cloud">Облако смыслов</button>`;
    lay.innerHTML = [['border', 'Граница участка'], ['drain', 'Дренаж'], ['labels', 'Подписи'], ['motion', 'Движение']].map(([k, t]) => `<button class="brick brick-toggle${layers[k] ? ' on' : ''}" data-layer="${k}" aria-pressed="${layers[k]}">${esc(t)}</button>`).join('');
  } else {
    const f = state === 'graph' ? graph.focus : null;
    stops.innerHTML = `<button class="brick brick-back" data-go="land">На землю</button>` + PETALS.map((p, i) => `<button class="brick brick-petal${f === p.id ? ' on' : ''}" style="--c:${p.color}" data-petal="${i}">${esc(p.title)}</button>`).join('');
    lay.innerHTML = `<button class="brick brick-toggle${state === 'meaning' ? ' on' : ''}" data-go="daisy">Ромашка</button><button class="brick brick-toggle${state === 'graph' && !f ? ' on' : ''}" data-go="all">Все связи</button><button class="brick brick-toggle" data-go="core">Ядро</button><button class="brick brick-toggle${layers.motion ? ' on' : ''}" data-layer="motion" aria-pressed="${layers.motion}">Движение</button>`;
  }
}
$('#dock').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.stop) { activeStop = b.dataset.stop; closePanel(); setLevel(b.dataset.stop === 'school' ? school.level : 0); flyTo(viewOf(b.dataset.stop)); renderDock(); if (b.dataset.stop === 'school') showPlace('school'); }
  else if (b.dataset.go === 'cloud') goMeaning();
  else if (b.dataset.go === 'land') goLand();
  else if (b.dataset.go === 'daisy') closePetal();
  else if (b.dataset.go === 'all') openAll();
  else if (b.dataset.go === 'core') { if (state === 'graph') closePetal(); showCore(); }
  else if (b.dataset.petal) openPetal(+b.dataset.petal);
  else if (b.dataset.layer) setLayer(b.dataset.layer, !layers[b.dataset.layer]);
});
function setLayer(k, v) {
  layers[k] = v;
  if (k === 'border') plot.border.visible = v;
  if (k === 'drain') { plot.drain.visible = v; if (v && state === 'land' && activeStop !== 'plot') { activeStop = 'plot'; flyTo(viewOf('plot')); } }
  if (k === 'labels') showLabels = v;
  renderDock();
}

// Слои школы: снаружи, без крыши, первый этаж
const levelsEl = $('#levels');
function setLevel(l, quiet) {
  school.setLevel(l);
  levelsEl.querySelectorAll('button').forEach((b) => b.classList.toggle('on', +b.dataset.level === l));
  levelsEl.classList.toggle('show', !quiet && (l > 0 || activeStop === 'school') && state === 'land');
}
levelsEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; setLevel(+b.dataset.level); if (activeStop !== 'school') { activeStop = 'school'; flyTo(viewOf('school'), 1.4); renderDock(); } });

// ---------- Хлебные крошки ----------
function updateCrumbs() {
  const c = $('#crumbs');
  const parts = [`<button data-crumb="land" class="${state === 'land' ? 'on' : ''}">Земля</button>`];
  if (state !== 'land') parts.push(`<button data-crumb="daisy" class="${state === 'meaning' ? 'on' : ''}">Облако смыслов</button>`);
  if (state === 'graph') { const f = graph.focus; parts.push(`<button class="on">${esc(f ? PETALS.find((p) => p.id === f).title : 'Все связи')}</button>`); }
  c.innerHTML = parts.join('<span>/</span>');
}
$('#crumbs').addEventListener('click', (e) => { const b = e.target.closest('[data-crumb]'); if (!b) return; if (b.dataset.crumb === 'land') goLand(); else if (b.dataset.crumb === 'daisy') closePetal(); });

// ---------- О проекте ----------
function showAbout(v = true) { $('#about').hidden = !v; }
$('#about-btn').addEventListener('click', () => showAbout($('#about').hidden));
$('#about-close').addEventListener('click', () => showAbout(false));
$('#about-lead').textContent = THESIS.lead;
$('#about-steps').innerHTML = THESIS.steps.map((s) => `<li>${esc(s)}</li>`).join('');

// ---------- Указатель ----------
const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
let down = null, hoverCloud = false;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointermove', (e) => {
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (!cloud || flight) return;
  ray.setFromCamera(mouse, camera);
  if (state === 'land') {
    hoverCloud = ray.intersectObject(cloud.hit, false).length > 0;
    let room = null;
    if (school.level > 0) { const hit = ray.intersectObjects(school.rooms, false)[0]; room = hit?.object.userData.room || null; }
    for (const r of school.rooms) r.material.opacity = r.userData.room === room ? 0.28 : 0;
    canvas.style.cursor = hoverCloud || room ? 'pointer' : '';
    cloud.uniforms.uGlow.value = hoverCloud ? 1 : 0;
  } else if (state === 'meaning') {
    const i = cloud.pick(ray.ray);
    cloud.uniforms.uHover.value = i == null ? -9 : i;
    canvas.style.cursor = i == null ? '' : 'pointer';
  }
});
canvas.addEventListener('pointerup', (e) => {
  if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6 || performance.now() - down.t > 600) { down = null; return; }
  down = null;
  mouse.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(mouse, camera);
  if (state === 'land') {
    if (school.level > 0) { const hit = ray.intersectObjects(school.rooms, false)[0]; if (hit) { showRoom(hit.object.userData.room); return; } }
    if (ray.intersectObject(cloud.hit, false).length) goMeaning();
  } else if (state === 'meaning') {
    const i = cloud.pick(ray.ray);
    if (i === -1) showCore(); else if (i != null) openPetal(i);
  }
});
controls.addEventListener('start', () => { flight?.stop(); flight = null; controls.enabled = state === 'land'; $('#hint').classList.add('gone'); });

// Камера не уходит за край земли
function clampTarget() {
  const t = controls.target;
  t.x = clamp(t.x, T.xMin + 200, T.xMax - 200); t.z = clamp(t.z, -T.yMax + 150, -T.yMin - 150);
  const g = gy(t.x, -t.z);
  if (t.y < g - 5) t.y = g;
}

// ---------- Цикл ----------
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  tick(dt);
  requestAnimationFrame(loop);
}
function tick(dt, draw = true) {
  if (layers.motion) U.uTime.value += dt;
  stepTweens(dt);
  if (state === 'land' && !flight) { controls.update(); clampTarget(); }
  const busy = school.update(dt);
  art.update(dt);
  if (layers.motion) plot.step(dt);
  cloud.uniforms.uTime.value = U.uTime.value;
  sky.uniforms.uTime.value = U.uTime.value;
  cloud.uniforms.uPixel.value = (renderer.domElement.height / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  fitShadow(busy);
  if (!draw) return;
  if (composer) composer.render(dt); else renderer.render(scene, camera);
  updatePins();
}

function resize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);
  composer?.setSize(innerWidth, innerHeight);
  if (state !== 'land') flyTo(skyView(), 0.6);
  graph?.relayout();
}
addEventListener('resize', resize);
addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('#about').hidden) showAbout(false); else if (document.body.classList.contains('panel-open')) closePanel(); else if (state === 'graph') closePetal(); else if (state === 'meaning') goLand(); } });

// Ссылка с якорем открывает нужный вид: #oblako, #shkola, #tura
const HASH = { oblako: () => goMeaning(), svyazi: () => openAll(), shkola: () => { activeStop = 'school'; flyTo(viewOf('school')); setLevel(1); }, tura: () => openPlace('tura'), pole: () => openPlace('artfield'), sad: () => openPlace('orchard') };

build().then(async () => {
  const v = viewOf('home');
  camera.position.copy(v.pos).add(new THREE.Vector3(-260, 520, 900));
  controls.target.copy(v.tgt);
  camera.lookAt(controls.target);
  fitShadow(true);
  if (composer) composer.render(0.016); else renderer.render(scene, camera);
  renderDock(); updateCrumbs();
  await frame();
  loader.classList.add('done');
  setTimeout(() => loader.remove(), 900);
  requestAnimationFrame(loop);
  setTimeout(() => $('#hint').classList.add('gone'), 14000);
  flyTo(v, 3.2, () => { const h = location.hash.slice(1); HASH[h]?.(); });
}).catch((e) => { console.error(e); loaderText.textContent = 'Не получилось собрать модель: ' + e.message; });

export { scene, camera, world, state0 };
// Для проверки в браузере
window.__vt = { advance(s) { for (let t = 0; t < s; t += 0.05) tick(0.05, false); tick(0.001); graph?.debugSteps?.(Math.round(s * 60)); }, flyTo, viewOf, goMeaning, goLand, openPetal, openAll, setLevel, openPlace, camera, controls, VIEWS, get state() { return state; } };
