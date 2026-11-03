// Небо: золотой вечер на земле и тёмный космос для облака смыслов.
import * as THREE from 'three';

export function buildSky(scene, sunDir) {
  const uniforms = {
    uSun: { value: sunDir.clone() },
    uNight: { value: 0 },
    uTime: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }`,
    fragmentShader: `
      varying vec3 vDir; uniform vec3 uSun; uniform float uNight; uniform float uTime;
      float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5; } return s; }
      void main(){
        vec3 d = normalize(vDir);
        float y = d.y;
        // Вечер: тёплый горизонт, голубой верх, дымка внизу
        vec3 zen = vec3(.33,.52,.78), mid = vec3(.66,.79,.9), hor = vec3(1.,.83,.62), low = vec3(.86,.74,.7);
        vec3 day = y > 0. ? mix(mix(hor, mid, smoothstep(0., .22, y)), zen, smoothstep(.2, .85, y)) : mix(hor, low, smoothstep(0., -.35, y));
        float sd = max(dot(d, normalize(uSun)), 0.);
        day += vec3(1., .72, .42) * (pow(sd, 6.) * .45 + pow(sd, 300.) * 4.);
        vec2 cp = d.xz / max(y + .18, .05) * 1.4;
        float cl = smoothstep(.55, .9, fbm(cp * .6 + vec2(uTime * .004, 0.)));
        day = mix(day, mix(vec3(1., .9, .8), vec3(1., .78, .6), pow(sd, 2.)), cl * smoothstep(.02, .25, y) * .55);
        // Ночь: синяя глубина и звёзды
        vec3 night = mix(vec3(.075,.065,.19), vec3(.012,.018,.06), smoothstep(-.25, .6, y));
        night += vec3(.16,.09,.3) * pow(1. - abs(y), 8.) * .35;
        vec2 sp = vec2(atan(d.z, d.x) * 120., asin(clamp(d.y, -1., 1.)) * 120.);
        float st = step(.9965, h(floor(sp))) * (.6 + .4 * sin(uTime * 2. + h(floor(sp)) * 40.));
        night += vec3(st);
        gl_FragColor = vec4(mix(day, night, uNight), 1.);
        #include <colorspace_fragment>
      }`,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), mat);
  sky.scale.setScalar(30000);
  sky.frustumCulled = false;
  sky.renderOrder = -10;
  scene.add(sky);
  return { sky, uniforms };
}
