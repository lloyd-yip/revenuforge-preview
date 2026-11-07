// RevenuForge web kit behaviour — headline word build, scroll reveals, step lines, greeked counters.
// Markup hooks: .rw-word (headline words), .rw-rv (reveal), .rw-steps (lines draw), [data-roll="XX"] (counter lands on greeked value).
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function roll(el) {
    const tgt = el.querySelector('[data-roll-digits]') || el;
    if (reduce) { tgt.textContent = el.dataset.roll; return; }
    let n = 0;
    const t = setInterval(() => {
      tgt.textContent = String(Math.floor(Math.random() * 100)).padStart(2, '0');
      if (++n > 26) { clearInterval(t); tgt.textContent = el.dataset.roll; }
    }, 45);
  }
  // Flowchart: connectors draw on, then one Signal pulse travels Diagnose → Build → Maintain → back, lighting each node.
  function flow(root) {
    const NS = 'http://www.w3.org/2000/svg';
    const nodes = [...root.querySelectorAll('.rw-node')];
    const svg = document.createElementNS(NS, 'svg'); svg.setAttribute('class', 'rw-flow-svg'); root.prepend(svg);
    let segs = [], dot, glow, started = false, raf;
    const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; };
    function build() {
      svg.innerHTML = ''; segs = [];
      // layout boxes (offset*), so reveal/lift transforms never skew the connectors
      const pos = n => { let x = 0, y = 0, e = n; while (e && e !== root) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return [x, y]; };
      const r = nodes.map(n => { const [x, y] = pos(n), w = n.offsetWidth, h = n.offsetHeight; return { l: x, t: y, r: x + w, b: y + h, cx: x + w / 2, cy: y + h / 2 }; });
      const horiz = r[1].l > r[0].r;
      const paths = [];
      for (let i = 0; i < r.length - 1; i++) {
        const a = r[i], c = r[i + 1];
        paths.push({ d: horiz ? `M${a.r} ${a.cy} L${c.l - 10} ${c.cy}` : `M${a.cx} ${a.b} L${c.cx} ${c.t - 10}`, to: i + 1, head: horiz ? [c.l - 2, c.cy, 0] : [c.cx, c.t - 2, 90] });
      }
      const f = r[0], z = r[r.length - 1], rad = 22;
      if (horiz) { const y = Math.max(...r.map(x => x.b)) + 56; paths.push({ loop: 1, d: `M${z.cx} ${z.b} L${z.cx} ${y - rad} Q${z.cx} ${y} ${z.cx - rad} ${y} L${f.cx + rad} ${y} Q${f.cx} ${y} ${f.cx} ${y - rad} L${f.cx} ${f.b + 10}`, to: 0, head: [f.cx, f.b + 2, -90] }); }
      else { const x = Math.max(...r.map(q => q.r)) + 28; paths.push({ loop: 1, d: `M${z.r} ${z.cy} L${x - rad} ${z.cy} Q${x} ${z.cy} ${x} ${z.cy - rad} L${x} ${f.cy + rad} Q${x} ${f.cy} ${x - rad} ${f.cy} L${f.r + 10} ${f.cy}`, to: 0, head: [f.r + 2, f.cy, 180] }); }
      paths.forEach(p => {
        const el = mk('path', { d: p.d, class: 'ln' + (p.loop ? ' loop' : '') });
        const L = el.getTotalLength();
        if (!p.loop) { el.style.strokeDasharray = L; el.style.strokeDashoffset = started ? 0 : L; }
        else el.style.opacity = started ? 1 : 0;
        const [hx, hy, ang] = p.head;
        const hd = mk('path', { d: 'M-9 -6 L0 0 L-9 6 Z', class: 'hd', transform: `translate(${hx} ${hy}) rotate(${ang})` });
        hd.style.opacity = started ? 1 : 0;
        segs.push({ el, L, to: p.to, hd, loop: p.loop });
      });
      glow = mk('circle', { r: 14, fill: 'var(--web-signal)', opacity: 0 }); glow.style.filter = 'blur(6px)';
      dot = mk('circle', { r: 5, fill: 'var(--web-signal)', opacity: 0 });
    }
    function start() {
      if (started) return; started = true;
      segs.forEach((s, i) => {
        const d = reduce ? 0 : 0.5 + i * 0.35;
        if (!s.loop) { s.el.style.transition = `stroke-dashoffset .7s cubic-bezier(.16,1,.3,1) ${d}s`; s.el.style.strokeDashoffset = 0; }
        else { s.el.style.transition = `opacity .6s ${d}s`; s.el.style.opacity = 1; }
        s.hd.style.transition = `opacity .3s ${d + .5}s`; s.hd.style.opacity = 1;
      });
      if (reduce) { nodes[0].classList.add('live'); return; }
      setTimeout(() => { nodes[0].classList.add('live'); let t0 = performance.now(); run(t0); }, 1800);
    }
    // timeline per hop: hold on node 1.1s, travel .9s (loop hop 1.6s)
    function run(t0) {
      const HOLD = 1.1, dur = s => s.loop ? 1.6 : .9;
      function tick(now) {
        const hops = segs; // re-read every frame: build() replaces the paths on resize
        const total = hops.reduce((a, h) => a + HOLD + dur(h), 0);
        let t = ((now - t0) / 1000) % total, i = 0;
        for (; i < hops.length; i++) { const span = HOLD + dur(hops[i]); if (t < span) break; t -= span; }
        const h = hops[i], from = (h.to + nodes.length - 1) % nodes.length;
        if (t < HOLD) { nodes.forEach((n, k) => n.classList.toggle('live', k === from)); dot.setAttribute('opacity', 0); glow.setAttribute('opacity', 0); }
        else {
          nodes.forEach(n => n.classList.remove('live'));
          const u = (t - HOLD) / dur(h), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          const p = h.el.getPointAtLength(e * h.L);
          dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); glow.setAttribute('cx', p.x); glow.setAttribute('cy', p.y);
          dot.setAttribute('opacity', 1); glow.setAttribute('opacity', .6);
        }
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }
    build();
    new ResizeObserver(() => build()).observe(root);
    return { start };
  }
  function init() {
    document.querySelectorAll('.rw-word').forEach((w, i) => {
      if (reduce) return;
      w.style.cssText += ';opacity:0;transform:translateY(14px) scale(.96);filter:blur(10px)';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        w.style.transition = 'opacity .5s cubic-bezier(.16,1,.3,1),transform .6s cubic-bezier(.16,1,.3,1),filter .5s cubic-bezier(.16,1,.3,1)';
        w.style.transitionDelay = i * 0.07 + 's';
        w.style.opacity = 1; w.style.transform = 'none'; w.style.filter = 'none';
      }));
    });
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('on');
      if (el.matches('.rw-flow') && el._flow) el._flow.start();
      if (el.dataset.roll) roll(el);
      io.unobserve(el);
    }), { threshold: 0.2 });
    document.querySelectorAll('.rw-rv').forEach(el => {
      const grp = el.parentElement.closest('.rw-cards,.rw-flow-row');
      if (grp) el.style.transitionDelay = [...el.parentElement.children].indexOf(el) * 0.15 + 's';
      io.observe(el);
    });
    document.querySelectorAll('.rw-flow').forEach(el => { el._flow = flow(el); io.observe(el); });
    document.querySelectorAll('[data-roll]').forEach(el => io.observe(el));
    setTimeout(() => {
      document.querySelectorAll('.rw-rv:not(.on)').forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('on'); });
      document.querySelectorAll('.rw-word').forEach(w => { w.style.opacity = 1; w.style.transform = 'none'; w.style.filter = 'none'; });
    }, 1500);
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
