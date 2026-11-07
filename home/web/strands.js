// RevenuForge hero animation — "strands". Abstract, no words or numbers.
// Loose strands drift, pull together through one seam point on the right, run out as one clean line,
// then loosen again (12s loop). One strand is Signal; the rest are the heading colour at low opacity.
// Usage: <div class="rw-hero-fx" data-strands><canvas></canvas></div>  (auto-starts)
//        or RFStrands(el, { count, focusX, heading, signal })
(function () {
  function RFStrands(host, opt = {}) {
    const cv = host.querySelector('canvas') || host.appendChild(document.createElement('canvas'));
    const ctx = cv.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const cs = getComputedStyle(host);
    const C = {
      hd: opt.heading || cs.getPropertyValue('--web-heading').trim() || '#E7E3DA',
      sg: opt.signal || cs.getPropertyValue('--web-signal').trim() || '#D9553B',
    };
    const N = opt.count || 64, FX = opt.focusX || 0.86, LOOP = 12;
    let W = 0, H = 0, dpr = 1;
    function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = host.clientWidth; H = host.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
    new ResizeObserver(size).observe(host); size();
    const lines = [];
    for (let i = 0; i < N; i++) lines.push({ y0: (i + .5) / N, ph: Math.random() * 6.28, f1: .8 + Math.random() * 1.6, f2: 2 + Math.random() * 3, sp: .25 + Math.random() * .5, sig: i === Math.floor(N * .36), dots: [Math.random(), Math.random()] });
    const sm = t => t * t * (3 - 2 * t);
    const order = t => t < 2 ? 0 : t < 5.5 ? sm((t - 2) / 3.5) : t < 9.5 ? 1 : 1 - sm((t - 9.5) / 2.5);
    function yAt(L, u, o, time) {
      const fy = H * .5, amp = H * (.16 * (1 - o) + .012);
      const n = Math.sin(u * 6.28 * L.f1 + L.ph + time * L.sp) * .6 + Math.sin(u * 6.28 * L.f2 - L.ph * 1.7 + time * L.sp * 1.6) * .4;
      const base = H * (.08 + .84 * L.y0), pull = o * sm(Math.min(1, u / FX)), after = u > FX ? o : 0;
      return base * (1 - pull) + fy * pull + n * amp * (1 - after * .95);
    }
    const t0 = performance.now();
    function frame(now) {
      const time = (now - t0) / 1000, t = reduce ? 7 : time % LOOP, o = order(t);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      lines.forEach(L => {
        ctx.beginPath();
        for (let s = 0; s <= 96; s++) { const u = s / 96, y = yAt(L, u, o, reduce ? 0 : time); s ? ctx.lineTo(u * W, y) : ctx.moveTo(u * W, y); }
        ctx.strokeStyle = L.sig ? C.sg : C.hd;
        ctx.globalAlpha = L.sig ? .55 + .35 * o : .08 + .18 * o;
        ctx.lineWidth = L.sig ? 1.8 : 1.1;
        ctx.stroke();
        if (!reduce) L.dots.forEach((d0, j) => {
          const u = (d0 + time * (.06 + .05 * o) * (1 + j * .3)) % 1;
          ctx.globalAlpha = (L.sig ? .9 : .35 + .4 * o) * Math.sin(u * Math.PI);
          ctx.fillStyle = L.sig ? C.sg : C.hd;
          ctx.beginPath(); ctx.arc(u * W, yAt(L, u, o, time), L.sig ? 3.2 : 2.2, 0, 6.283); ctx.fill();
        });
      });
      const fx = W * FX, fy = H * .5, pulse = .5 + .5 * Math.sin(time * 2.2);
      ctx.globalAlpha = .12 * o + .05; ctx.fillStyle = C.sg;
      ctx.beginPath(); ctx.arc(fx, fy, 26 + 22 * o + 6 * pulse * o, 0, 6.283); ctx.fill();
      ctx.globalAlpha = .5 + .5 * o; ctx.strokeStyle = C.hd; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(fx, fy, 14 + 4 * o, 0, 6.283); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = C.sg;
      ctx.beginPath(); ctx.arc(fx, fy, 4 + 3 * o, 0, 6.283); ctx.fill();
      if (!reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  window.RFStrands = RFStrands;
  const auto = () => document.querySelectorAll('[data-strands]').forEach(el => RFStrands(el));
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', auto) : auto();
})();
