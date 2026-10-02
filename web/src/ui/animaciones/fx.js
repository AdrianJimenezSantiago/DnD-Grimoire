// Efectos visuales cortos: chispas, destellos al lanzar conjuros y gastar espacios, pulsos y transiciones de vista.
// Respetan «reducir movimiento».
const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
export const reducedMotion = () => mq.matches;

let cv = null, ctx = null, parts = [], raf = 0, dpr = 1, vw = 0, vh = 0;
function ensure() {
  if (cv) return;
  cv = document.createElement('canvas'); cv.className = 'fxcanvas'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv); ctx = cv.getContext('2d');
  const size = () => { dpr = Math.min(1.5, window.devicePixelRatio || 1); vw = innerWidth; vh = innerHeight; cv.width = vw * dpr; cv.height = vh * dpr; };
  size(); addEventListener('resize', size);
}
// Cada chispa es un degradado radial; en vez de crearlo en cada fotograma para cada partícula se pinta una vez
// por color en un lienzo pequeño y se estampa con drawImage. La transparencia de la vida va en globalAlpha.
const sprites = new Map();
function sprite(h, s, l) {
  const k = `${h}|${s}|${l}`;
  let c = sprites.get(k); if (c) return c;
  c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `hsla(${h},${s}%,${l + 20}%,1)`); gr.addColorStop(.35, `hsla(${h},${s}%,${l}%,.55)`); gr.addColorStop(1, `hsla(${h},${s}%,${l}%,0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  if (sprites.size > 80) sprites.clear();
  sprites.set(k, c); return c;
}
const MAX_PARTS = 500;
let prev = 0;
export function alFrente(el) {
  if (!el?.showPopover) return;
  if (!el.hasAttribute('popover')) el.setAttribute('popover', 'manual');
  try { if (el.matches(':popover-open')) el.hidePopover(); el.showPopover(); } catch { /* sin top layer */ }
}
// Se borra con el tamaño guardado: leer innerWidth dentro del fotograma puede forzar un layout.
// La física está pensada a 60 fps: con pantallas de 90/120 Hz o un móvil que va justo, se escala por el tiempo real
// del fotograma para que las chispas duren y vuelen lo mismo en cualquier dispositivo.
function loop(t) {
  const f = prev ? Math.min(3, (t - prev) / 16.67) : 1; prev = t;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, vw, vh);
  ctx.globalCompositeOperation = 'lighter';
  parts = parts.filter(p => (p.life -= 16 * f) > 0);
  for (const p of parts) {
    const d = Math.pow(p.drag, f);
    p.vx *= d; p.vy = p.vy * d + p.g * f; p.x += p.vx * f; p.y += p.vy * f;
    const k = p.life / p.max, r = p.r * (0.4 + 0.6 * k) * 3;
    ctx.globalAlpha = k; ctx.drawImage(p.spr, p.x - r, p.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
  raf = parts.length ? requestAnimationFrame(loop) : 0;
  if (!raf) { ctx.clearRect(0, 0, vw, vh); prev = 0; }
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
  ensure(); if (document.querySelector('dialog[open]') || cv.matches?.(':popover-open')) alFrente(cv);
  const [h, s, l] = hslOf(color), S = Math.round(s), L = Math.round(l);
  for (let i = 0; i < n && parts.length < MAX_PARTS; i++) {
    const a = Math.random() * Math.PI * 2, v = (0.4 + Math.random()) * speed;
    parts.push({ x, y, vx: Math.cos(a) * v * spread, vy: Math.sin(a) * v * 0.6 - up * Math.random() * 2, drag: 0.94, g: gravity,
      r: size * (0.6 + Math.random()), life: life * (0.6 + Math.random() * 0.4), max: life, spr: sprite(Math.round((h + Math.random() * 16 - 8) / 4) * 4, S, L) });
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
