const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
export const reducedMotion = () => mq.matches;

let cv = null, ctx = null, parts = [], raf = 0, dpr = 1;
function ensure() {
  if (cv) return;
  cv = document.createElement('canvas'); cv.className = 'fxcanvas'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv); ctx = cv.getContext('2d');
  const size = () => { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; };
  size(); addEventListener('resize', size);
}
function loop(t) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.globalCompositeOperation = 'lighter';
  parts = parts.filter(p => (p.life -= 16) > 0);
  for (const p of parts) {
    p.vx *= p.drag; p.vy = p.vy * p.drag + p.g; p.x += p.vx; p.y += p.vy;
    const k = p.life / p.max, r = p.r * (0.4 + 0.6 * k);
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
    g.addColorStop(0, `hsla(${p.h},${p.s}%,${p.l + 20}%,${k})`); g.addColorStop(.35, `hsla(${p.h},${p.s}%,${p.l}%,${k * .55})`); g.addColorStop(1, `hsla(${p.h},${p.s}%,${p.l}%,0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r * 3, 0, 6.283); ctx.fill();
  }
  raf = parts.length ? requestAnimationFrame(loop) : 0;
  if (!raf) ctx.clearRect(0, 0, innerWidth, innerHeight);
}
function hslOf(color) {
  const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(String(color).trim());
  if (!m) return [40, 80, 60];
  let [r, g, b] = m.slice(1).map(x => parseInt(x, 16) / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return [h, s * 100, l * 100];
}
export function burst(x, y, { color = '#E7B85F', n = 22, speed = 3.2, up = 1.6, spread = 1, life = 900, size = 2.2, gravity = -0.02 } = {}) {
  if (reducedMotion()) return;
  ensure(); const [h, s, l] = hslOf(color);
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * speed;
    parts.push({ x, y, vx: Math.cos(a) * v * spread, vy: Math.sin(a) * v * 0.6 - up * Math.random() * 2, drag: 0.94, g: gravity,
      r: size * (0.6 + Math.random()), life: life * (0.6 + Math.random() * 0.4), max: life, h: h + (Math.random() * 16 - 8), s, l });
  }
  if (!raf) raf = requestAnimationFrame(loop);
}
const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r]; };
export function burstFrom(el, opts) { if (!el) return; const [x, y] = center(el); burst(x, y, opts); }
export function castFx(row, color) {
  if (!row || reducedMotion()) return;
  row.classList.remove('fx-cast'); void row.offsetWidth; row.classList.add('fx-cast');
  setTimeout(() => row.classList.remove('fx-cast'), 1400);
  const nm = row.querySelector('.nm'); if (!nm) return;
  const r = nm.getBoundingClientRect();
  document.dispatchEvent(new CustomEvent('grimorio:fx', { detail: { tipo: 'lanzar', x: r.left + Math.min(40, r.width / 2), y: r.top + r.height / 2, color } }));
  for (let i = 0; i < 4; i++) setTimeout(() => burst(r.left + r.width * (0.15 + 0.7 * Math.random()), r.top + r.height / 2, { color, n: 9, speed: 2.2, up: 2.4, life: 1000, size: 1.8 }), i * 70);
}
export function slotFx(level, index, kind) {
  const btn = document.querySelector(`#sbar [data-slotbtn="${level}:${index}"]`) || document.querySelector(`[data-slotbtn="${level}:${index}"]`);
  if (!btn) return;
  btn.classList.add(kind === 'ignite' ? 'fx-ignite' : 'fx-snuff');
  setTimeout(() => btn.classList.remove('fx-ignite', 'fx-snuff'), 700);
  if (kind !== 'ignite') burstFrom(btn, { color: '#9aa0b3', n: 8, speed: 0.8, up: 2.6, life: 900, size: 2.4, gravity: -0.03 });
  else burstFrom(btn, { color: '#F4C567', n: 10, speed: 1.6, up: 1.2, life: 600, size: 1.6 });
}
export function dawn() {
  if (reducedMotion()) return;
  const d = document.createElement('div'); d.className = 'dawn'; document.body.appendChild(d);
  document.dispatchEvent(new CustomEvent('grimorio:fx', { detail: { tipo: 'amanecer' } }));
  setTimeout(() => d.remove(), 1400);
  document.querySelectorAll('.slotbtn').forEach((b, i) => { b.style.setProperty('--i', i % 12); b.classList.add('fx-ignite'); setTimeout(() => b.classList.remove('fx-ignite'), 1300); });
}
export function ascend(el) {
  if (!el || reducedMotion()) return;
  const [x, y, r] = center(el);
  document.dispatchEvent(new CustomEvent('grimorio:fx', { detail: { tipo: 'ascender', x, y } }));
  burst(x, y, { n: 60, speed: 5.5, up: 1, life: 1400, size: 2.4, gravity: 0.02 });
  for (let i = 0; i < 6; i++) setTimeout(() => burst(r.left + Math.random() * r.width, r.bottom, { n: 10, speed: 1.4, up: 3.4, life: 1500, size: 1.8 }), 120 + i * 90);
}
export function pop(el, cls) { if (!el || reducedMotion()) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
export function viewTransition(fn) {
  if (reducedMotion() || !document.startViewTransition) { fn(); return; }
  document.startViewTransition(fn);
}
export const schoolColor = key => getComputedStyle(document.documentElement).getPropertyValue(`--sc-${key || 'adi'}`).trim() || '#E7B85F';
