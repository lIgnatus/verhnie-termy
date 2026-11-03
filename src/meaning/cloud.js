// Облако смыслов из частиц. В покое это цветное облако над участком,
// по клику частицы перелетают в ромашку: ядро и восемь лепестков.
import * as THREE from 'three';
import { rng } from '../core.js';

export const DAISY = { core: 70, r0: 92, r1: 300, width: 64 };

export function buildCloud(scene, petals, { count = 9000 } = {}) {
  const r = rng(808);
  const gauss = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const P = petals.length;
  const coreN = Math.round(count * 0.14), perPetal = Math.floor((count - coreN) / P);
  const N = coreN + perPetal * P;
  const pos = new Float32Array(N * 3), tgt = new Float32Array(N * 3), col = new Float32Array(N * 3), size = new Float32Array(N), rnd = new Float32Array(N), pet = new Float32Array(N);
  const c = new THREE.Color(), c2 = new THREE.Color();

  // Клубы облака: у каждого лепестка свой клуб, цвета ложатся пятнами
  const lobes = petals.map((_, i) => { const a = (i / P) * Math.PI * 2 + 0.4; return [Math.cos(a) * (130 + r() * 50), (r() - 0.4) * 70, Math.sin(a) * (110 + r() * 40)]; });
  let k = 0;
  const put = (x, y, z, tx, ty, tz, color, s, petal) => {
    pos.set([x, y, z], k * 3); tgt.set([tx, ty, tz], k * 3); col.set([color.r, color.g, color.b], k * 3);
    size[k] = s; rnd[k] = r(); pet[k] = petal; k++;
  };
  // Ядро: спираль подсолнуха, золото
  for (let i = 0; i < coreN; i++) {
    const rr = DAISY.core * Math.sqrt((i + 0.5) / coreN), a = i * 2.39996;
    c.set('#f2c14e').lerp(c2.set('#e08a2a'), Math.pow(rr / DAISY.core, 1.5) * 0.8);
    const big = r() < 0.18;
    put(gauss() * 55, gauss() * 38 + 10, gauss() * 50, Math.cos(a) * rr, Math.sin(a) * rr, Math.sqrt(Math.max(DAISY.core * DAISY.core - rr * rr, 0)) * 0.35, c, big ? 26 + r() * 30 : 3 + r() * 5, -1);
  }
  // Лепестки: сужаются к концам, цвет светлеет к краю
  petals.forEach((pt, i) => {
    const ang = Math.PI / 2 - (i / P) * Math.PI * 2, dx = Math.cos(ang), dy = Math.sin(ang);
    const [lx, ly, lz] = lobes[i];
    for (let q = 0; q < perPetal; q++) {
      const t = Math.pow(r(), 0.85), s = (r() * 2 - 1) * Math.pow(r(), 0.35);
      // Лепесток вытянутый и скруглённый на конце, как у ромашки
      const e = (t - 0.47) / 0.53, hw = DAISY.width * Math.sqrt(Math.max(0, 1 - e * e)) * (0.82 + 0.18 * t) + 3;
      const R = DAISY.r0 + t * (DAISY.r1 - DAISY.r0);
      const tx = dx * R - dy * s * hw, ty = dy * R + dx * s * hw, tz = Math.sin(t * Math.PI) * 18 - t * 30 + (r() - 0.5) * 6;
      c.set(pt.color).lerp(c2.set(pt.tint), t * 0.85 + (r() - 0.5) * 0.25);
      const big = r() < 0.16;
      put(lx + gauss() * 62, ly + gauss() * 40, lz + gauss() * 55, tx, ty, tz, c, big ? 30 + r() * 46 : 2.6 + r() * 5.5, i);
    }
  });

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aTarget', new THREE.BufferAttribute(tgt, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  g.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
  g.setAttribute('aPetal', new THREE.BufferAttribute(pet, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 600);

  const uniforms = {
    uTime: { value: 0 }, uMorph: { value: 0 }, uPixel: { value: 600 }, uScale: { value: 1 }, uHover: { value: -9 }, uFocus: { value: -9 }, uGlow: { value: 0 }, uDim: { value: 0 }, uNight: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: `
      attribute vec3 aTarget; attribute vec3 aColor; attribute float aSize; attribute float aRand; attribute float aPetal;
      uniform float uTime, uMorph, uPixel, uHover, uFocus, uGlow, uDim, uNight, uScale;
      varying vec3 vColor; varying float vAlpha;
      void main(){
        float t = clamp((uMorph - aRand * .38) / .62, 0., 1.);
        t = t * t * (3. - 2. * t);
        vec3 a = position + vec3(sin(uTime * .23 + aRand * 31.) * 9., cos(uTime * .19 + aRand * 17.) * 6., sin(uTime * .21 + aRand * 11.) * 9.) * (1. - t);
        vec3 b = aTarget + vec3(sin(uTime * .7 + aRand * 30.), cos(uTime * .6 + aRand * 20.), 0.) * 1.6;
        vec3 p = mix(a, b, t);
        float sw = sin(t * 3.14159) * (1.1 + aRand) * (aRand > .5 ? 1. : -1.);
        p.xz = mat2(cos(sw), -sin(sw), sin(sw), cos(sw)) * p.xz * (1. + sin(t * 3.14159) * .25);
        float hov = 1. - step(.5, abs(aPetal - uHover));
        float foc = uFocus < -5. ? 1. : 1. - step(.5, abs(aPetal - uFocus));
        p *= 1. + hov * .05 * t;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        float big = step(15., aSize);
        float s = aSize * uScale * mix(1., mix(1., .42, big), t) * (1. + hov * .35 + uGlow * .25);
        gl_PointSize = clamp(s * uPixel / -mv.z, 1.2, 160.);
        vColor = mix(aColor, vec3(1.), hov * .25 + uGlow * .15);
        float al = mix(.95, mix(.34, .16, t), big) * mix(1., .55, big * t);
        al *= mix(1., .16, (1. - foc) * t) * (1. - uDim * .75);
        vAlpha = al * (.85 + .15 * sin(uTime * 2. + aRand * 40.));
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha; uniform float uNight;
      void main(){
        float d = length(gl_PointCoord - .5) * 2.;
        float a = smoothstep(1., 0., d); a *= a;
        a *= vAlpha;
        gl_FragColor = vec4(vColor * a, a * mix(.65, .35, uNight));
      }`,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  points.renderOrder = 6;
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  // Невидимая сфера для клика по облаку на земле
  const hit = new THREE.Mesh(new THREE.SphereGeometry(230, 16, 12), new THREE.MeshBasicMaterial({ visible: false }));
  hit.scale.set(1.2, 0.75, 1);
  group.add(hit);

  const plane = new THREE.Plane(), local = new THREE.Vector3(), tmp = new THREE.Vector3();
  return {
    group, points, uniforms, hit,
    // Точка на ромашке в мировых координатах
    anchor(i, rr = 0.62) {
      if (i < 0) return group.localToWorld(new THREE.Vector3(0, 0, 40));
      const ang = Math.PI / 2 - (i / P) * Math.PI * 2, R = DAISY.r0 + rr * (DAISY.r1 - DAISY.r0);
      return group.localToWorld(new THREE.Vector3(Math.cos(ang) * R, Math.sin(ang) * R, 10));
    },
    // Какой лепесток под лучом: -1 ядро, null мимо
    pick(ray) {
      group.updateMatrixWorld();
      const n = new THREE.Vector3(0, 0, 1).transformDirection(group.matrixWorld);
      plane.setFromNormalAndCoplanarPoint(n, group.getWorldPosition(tmp));
      if (!ray.intersectPlane(plane, local)) return null;
      group.worldToLocal(local);
      const R = Math.hypot(local.x, local.y);
      if (R < DAISY.core * 1.15) return -1;
      if (R > DAISY.r1 * 1.08) return null;
      let a = Math.PI / 2 - Math.atan2(local.y, local.x);
      a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      return Math.round(a / ((Math.PI * 2) / P)) % P;
    },
  };
}
