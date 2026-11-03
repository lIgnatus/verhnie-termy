// Граф связей, как в Obsidian: узлы, нити, подсветка соседей, перетаскивание.
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); parent?.appendChild(e); return e; };

export function createGraph(svg, { nodes, links, petals, core, onSelect }) {
  const petalIndex = Object.fromEntries(petals.map((p, i) => [p.id, i]));
  const byId = new Map([[core.id, { ...core, p: null }], ...nodes.map((n) => [n.id, n])]);
  const adj = new Map([...byId.keys()].map((id) => [id, new Set()]));
  for (const [a, b] of links) { if (!byId.has(a) || !byId.has(b)) continue; adj.get(a).add(b); adj.get(b).add(a); }

  const gLinks = el('g', { class: 'g-links' }, svg), gNodes = el('g', { class: 'g-nodes' }, svg);
  let sim = [], simLinks = [], focus = null, selected = null, hover = null, drag = null, raf = 0, alpha = 0, open = false;
  let W = 800, H = 600, cx = 400, cy = 300, box = [0, 0, 800, 600];

  const colorOf = (n) => (n.p ? petals[petalIndex[n.p]].color : '#f2c14e');
  const dirOf = (n) => { if (!n.p) return [0, 0]; const a = Math.PI / 2 - (petalIndex[n.p] / petals.length) * Math.PI * 2; return [Math.cos(a), -Math.sin(a)]; };

  function measure() {
    const r = svg.getBoundingClientRect();
    W = r.width; H = r.height;
    const panel = document.body.classList.contains('panel-open') && W > 760 ? 400 : 0;
    cx = (W - panel) / 2; cy = W > 760 ? (110 + H - 130) / 2 : (90 + H * 0.42) / 2 + 20;
    box = W > 760 ? [24, 110, W - panel - 24, H - 130] : [16, 90, W - 16, H * 0.42 + 40];
  }

  function build(petalId) {
    gLinks.replaceChildren(); gNodes.replaceChildren();
    focus = petalId;
    svg.classList.toggle('g-all', !petalId);
    measure();
    const R = Math.min(box[2] - box[0], box[3] - box[1]) * (petalId ? 0.46 : 0.5);
    const inner = petalId ? nodes.filter((n) => n.p === petalId).map((n) => n.id) : nodes.map((n) => n.id);
    const set = new Set(inner);
    set.add(core.id);
    if (petalId) for (const id of inner) for (const nb of adj.get(id)) set.add(nb);
    sim = [...set].map((id) => {
      const n = byId.get(id), own = !petalId || n.p === petalId, isCore = id === core.id;
      const [dx, dy] = dirOf(n), jitter = () => (Math.random() - 0.5) * 40;
      let x, y;
      if (isCore) { x = petalId ? cx - dirOf({ p: petalId })[0] * R * 0.62 : cx; y = petalId ? cy - dirOf({ p: petalId })[1] * R * 0.62 : cy; }
      else if (petalId && own) { x = cx + jitter() * 3; y = cy + jitter() * 3; }
      else { x = cx + dx * R * (petalId ? 1 : 0.7) + jitter(); y = cy + dy * R * (petalId ? 1 : 0.7) + jitter(); }
      const deg = adj.get(id).size;
      const rad = isCore ? 15 : own ? 6 + Math.min(deg, 8) * 0.9 + (n.big ? 2 : 0) : 5;
      return { id, n, own, isCore, x, y, vx: 0, vy: 0, rad, deg };
    });
    const idx = new Map(sim.map((s, i) => [s.id, i]));
    simLinks = [];
    for (const [a, b] of links) if (idx.has(a) && idx.has(b)) simLinks.push({ a: idx.get(a), b: idx.get(b) });
    for (const l of simLinks) {
      const A = sim[l.a], B = sim[l.b];
      const cross = A.n.p && B.n.p && A.n.p !== B.n.p;
      l.el = el('line', { class: 'g-link' + (cross ? ' cross' : ''), stroke: A.own && B.own ? colorOf(A.n.p ? A.n : B.n) : '#c9c6e8' }, gLinks);
    }
    for (const s of sim) {
      const g = el('g', { class: `g-node st-${s.n.status || 'idea'}${s.own ? '' : ' outer'}${s.isCore ? ' core' : ''}${s.n.big ? ' big' : ''}`, tabindex: 0, role: 'button', 'aria-label': s.n.title }, gNodes);
      el('circle', { class: 'halo', r: s.rad + 7 }, g);
      el('circle', { class: 'dot', r: s.rad, fill: colorOf(s.n) }, g);
      el('circle', { class: 'ring', r: s.rad + 3, stroke: colorOf(s.n) }, g);
      const t = el('text', { class: 'g-label', y: s.rad + 15, 'text-anchor': 'middle' }, g);
      t.textContent = s.isCore ? core.short : s.n.title;
      s.el = g;
      g.addEventListener('pointerenter', () => { hover = s.id; paint(); });
      g.addEventListener('pointerleave', () => { if (hover === s.id) hover = null; paint(); });
      g.addEventListener('pointerdown', (e) => { drag = { s, moved: false, x: e.clientX, y: e.clientY }; g.setPointerCapture(e.pointerId); e.stopPropagation(); });
      g.addEventListener('pointermove', (e) => {
        if (!drag || drag.s !== s) return;
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 3) drag.moved = true;
        const r = svg.getBoundingClientRect();
        s.x = e.clientX - r.left; s.y = e.clientY - r.top; s.vx = s.vy = 0;
        kick(0.3);
      });
      g.addEventListener('pointerup', () => { if (drag?.s === s && !drag.moved) select(s.id); drag = null; });
      g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(s.id); } });
    }
    kick(1);
    paint();
  }

  function kick(a) { alpha = Math.max(alpha, a); if (!raf) raf = requestAnimationFrame(step); }

  function step() {
    raf = 0;
    if (!open) return;
    measure();
    const n = sim.length, R = Math.min(box[2] - box[0], box[3] - box[1]) * (focus ? 0.46 : 0.5);
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      const A = sim[i], B = sim[j];
      let dx = B.x - A.x, dy = B.y - A.y, d2 = dx * dx + dy * dy;
      if (d2 < 1) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; d2 = 1; }
      const d = Math.sqrt(d2), f = (focus ? 4600 : 1700) / d2, min = A.rad + B.rad + (focus ? 52 : 30);
      let push = f;
      if (d < min) push += (min - d) * 0.12;
      const fx = (dx / d) * push, fy = (dy / d) * push;
      A.vx -= fx; A.vy -= fy; B.vx += fx; B.vy += fy;
    }
    for (const l of simLinks) {
      const A = sim[l.a], B = sim[l.b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
      const len = A.own && B.own ? (focus ? 118 : 70) : 160, k = A.own && B.own ? 0.025 : 0.01;
      const f = (d - len) * k, fx = (dx / d) * f, fy = (dy / d) * f;
      A.vx += fx; A.vy += fy; B.vx -= fx; B.vy -= fy;
    }
    for (const s of sim) {
      if (drag?.s === s) continue;
      const [dx, dy] = dirOf(s.n);
      let tx = cx, ty = cy, k = 0.012;
      if (s.isCore) { tx = focus ? cx - dirOf({ p: focus })[0] * R * 0.7 : cx; ty = focus ? cy - dirOf({ p: focus })[1] * R * 0.7 : cy; k = 0.08; }
      else if (!focus) { tx = cx + dx * R * 0.62; ty = cy + dy * R * 0.62; k = 0.01; }
      else if (!s.own) { tx = cx + dx * R * 1.05; ty = cy + dy * R * 1.05; k = 0.02; }
      s.vx += (tx - s.x) * k; s.vy += (ty - s.y) * k;
      s.vx *= 0.82; s.vy *= 0.82;
      s.x += s.vx * alpha; s.y += s.vy * alpha;
      s.x = Math.max(box[0] + 10, Math.min(box[2] - 10, s.x)); s.y = Math.max(box[1], Math.min(box[3] - 20, s.y));
    }
    for (const l of simLinks) { const A = sim[l.a], B = sim[l.b]; l.el.setAttribute('x1', A.x); l.el.setAttribute('y1', A.y); l.el.setAttribute('x2', B.x); l.el.setAttribute('y2', B.y); }
    for (const s of sim) s.el.setAttribute('transform', `translate(${s.x.toFixed(1)},${s.y.toFixed(1)})`);
    alpha *= 0.985;
    if (alpha > 0.02 || drag) raf = requestAnimationFrame(step);
    else { alpha = 0.02; raf = requestAnimationFrame(idle); }
  }
  // Лёгкое дыхание графа после остановки
  let t0 = performance.now();
  function idle(now) {
    raf = 0;
    if (!open) return;
    const t = (now - t0) / 1000;
    for (const s of sim) s.el.setAttribute('transform', `translate(${(s.x + Math.sin(t * 0.7 + s.rad * 3) * 1.6).toFixed(1)},${(s.y + Math.cos(t * 0.6 + s.x) * 1.6).toFixed(1)})`);
    raf = requestAnimationFrame(idle);
  }

  function paint() {
    const focusId = hover || selected;
    const near = focusId ? adj.get(focusId) : null;
    for (const s of sim) {
      const on = !focusId || s.id === focusId || near?.has(s.id);
      s.el.classList.toggle('dim', !on);
      s.el.classList.toggle('sel', s.id === selected);
      s.el.classList.toggle('lit', !!focusId && on);
    }
    for (const l of simLinks) {
      const a = sim[l.a].id, b = sim[l.b].id, on = focusId && (a === focusId || b === focusId);
      l.el.classList.toggle('on', !!on);
      l.el.classList.toggle('dim', !!focusId && !on);
    }
  }

  function select(id) {
    selected = id;
    paint();
    onSelect?.(byId.get(id), id === core.id);
  }

  return {
    open(petalId) { open = true; svg.classList.add('show'); selected = null; hover = null; build(petalId); },
    close() { open = false; svg.classList.remove('show'); cancelAnimationFrame(raf); raf = 0; },
    select(id) { if (open) select(id); },
    neighbors: (id) => [...(adj.get(id) || [])].map((x) => byId.get(x)).filter(Boolean),
    get: (id) => byId.get(id),
    relayout() { if (open) { measure(); kick(0.6); } },
    get focus() { return focus; },
    debugSteps(n) { for (let i = 0; i < n && open; i++) { cancelAnimationFrame(raf); raf = 0; alpha = Math.max(alpha, 0.05); step(); } },
    get isOpen() { return open; },
  };
}
