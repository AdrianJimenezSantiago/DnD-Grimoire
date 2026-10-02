// Adornos mágicos de la interfaz: runas y sellos en SVG, ondas al tocar botones y portales al abrir diálogos.
import { movimientoReducido, chispas } from './fx.js';

const RUNAS = [
  'M0 0v14M0 3l7-3M0 7l7-3', 'M5 0v14M0 4l5 3 5-3', 'M0 0v14M10 0v14M0 7h10', 'M0 0l5 7-5 7M5 7h5',
  'M5 0v14M5 7l5-4M5 7l-5 4', 'M0 14l5-14 5 14M2 8h6', 'M0 0h10L0 14h10', 'M5 0v14M0 0l5 5 5-5',
  'M0 0v14l10-7L0 0', 'M0 3q5-6 10 0M5 0v14', 'M0 7h10M5 0l5 7-5 7-5-7Z', 'M0 0l10 14M10 0L0 14M5 0v4',
];
let semilla = 7;
const azar = () => (semilla = (semilla * 9301 + 49297) % 233280) / 233280;
export function runaSvg({ n = 16, lados = 6, cls = '', semillaInicial = 7 } = {}) {
  semilla = semillaInicial;
  let g = '';
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360, r = RUNAS[(azar() * RUNAS.length) | 0];
    g += `<path d="${r}" transform="rotate(${a}) translate(-3.5 -97) scale(.7)"/>`;
  }
  const poli = k => Array.from({ length: lados }, (_, i) => { const a = (i * k / lados) * 2 * Math.PI - Math.PI / 2; return `${(Math.cos(a) * 66).toFixed(1)},${(Math.sin(a) * 66).toFixed(1)}`; }).join(' ');
  const estrella = lados % 2 === 0
    ? `<polygon class="r-geo" points="${poli(1)}" pathLength="1"/><polygon class="r-geo" points="${poli(1)}" transform="rotate(${180 / lados})" pathLength="1"/>`
    : `<polygon class="r-geo" points="${poli(2)}" pathLength="1"/>`;
  return `<svg class="runa ${cls}" viewBox="-110 -110 220 220" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <circle class="r-anillo" r="106" stroke-width="1.4" pathLength="1"/><circle class="r-anillo" r="86" stroke-width=".8" pathLength="1"/>
    <g class="r-runas" stroke-width="1.6">${g}</g>${estrella}
    <circle class="r-anillo" r="38" stroke-width="1" pathLength="1"/><circle r="4" fill="currentColor" stroke="none"/></g></svg>`;
}

export function sello(x, y, { color = 'var(--gold)', size = 160, dur = 900, lados = 6, giro = 40 } = {}) {
  if (movimientoReducido()) return;
  const el = document.createElement('div');
  el.className = 'sello-fx'; el.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;color:${color}`;
  el.innerHTML = runaSvg({ lados, semillaInicial: (Math.random() * 1000) | 0 });
  document.body.appendChild(el);
  el.animate([
    { transform: 'translate(-50%,-50%) scale(.25) rotate(-40deg)', opacity: 0 },
    { opacity: 1, offset: .28 },
    { transform: `translate(-50%,-50%) scale(1.05) rotate(${giro}deg)`, opacity: 0 },
  ], { duration: dur, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = () => el.remove();
}
export function selloEn(el, opts) { if (!el) return; const r = el.getBoundingClientRect(); sello(r.left + r.width / 2, r.top + r.height / 2, opts); }

const SIN_ONDA = '.slotbtn,.prep,.tick,.rtick,.term,.nt-b,.hero-av,.switch,.sb-l b,[data-no-onda]';
function pintarOnda(b, x, y) {
  if (!b.isConnected) return;
  const r = b.getBoundingClientRect(), d = Math.hypot(r.width, r.height) * 2;
  const caja = document.createElement('span'); caja.className = 'onda'; caja.setAttribute('aria-hidden', 'true');
  const i = document.createElement('i');
  i.style.cssText = `left:${x - r.left}px;top:${y - r.top}px;width:${d}px;height:${d}px`;
  caja.appendChild(i); b.appendChild(caja);
  setTimeout(() => caja.remove(), 650);
}
// Con el dedo, la onda espera un instante: si el gesto resulta ser un desplazamiento no se crea nada y el scroll
// arranca sin tocar el DOM ni medir. Si es un toque, aparece igual (al soltar o a los 70 ms, lo que llegue antes).
function onda(e) {
  if (movimientoReducido() || e.button > 0) return;
  const b = e.target.closest('button, .castzone, .ses, [role="button"]');
  if (!b || b.disabled || b.matches(SIN_ONDA)) return;
  const x = e.clientX, y = e.clientY, id = e.pointerId;
  if (e.pointerType !== 'touch') { pintarOnda(b, x, y); return; }
  const fin = pinta => { clearTimeout(t); removeEventListener('pointermove', mueve, true); removeEventListener('pointerup', suelta, true); removeEventListener('pointercancel', cancela, true); if (pinta) pintarOnda(b, x, y); };
  const mueve = ev => { if (ev.pointerId === id && Math.hypot(ev.clientX - x, ev.clientY - y) > 10) fin(false); };
  const suelta = ev => { if (ev.pointerId === id) fin(true); };
  const cancela = ev => { if (ev.pointerId === id) fin(false); };
  const t = setTimeout(() => fin(true), 70);
  addEventListener('pointermove', mueve, { capture: true, passive: true });
  addEventListener('pointerup', suelta, { capture: true, passive: true });
  addEventListener('pointercancel', cancela, { capture: true, passive: true });
}

function inclinar(e) {
  if (e.pointerType !== 'mouse' || movimientoReducido()) return;
  const c = e.target.closest?.('.lcard'); if (!c) return;
  const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  c.style.setProperty('--rx', `${(0.5 - y) * 8}deg`); c.style.setProperty('--ry', `${(x - 0.5) * 10}deg`);
  c.style.setProperty('--mx', `${x * 100}%`); c.style.setProperty('--my', `${y * 100}%`);
}
function soltar(e) { const c = e.target.closest?.('.lcard'); if (c && !c.contains(e.relatedTarget)) ['--rx', '--ry', '--mx', '--my'].forEach(p => c.style.removeProperty(p)); }

export function portalDesde(x, y) {
  const r = document.documentElement;
  r.style.setProperty('--vt-x', `${x}px`); r.style.setProperty('--vt-y', `${y}px`);
  r.classList.add('vt-portal'); setTimeout(() => r.classList.remove('vt-portal'), 1100);
}

export function marcarNota(id, efecto) {
  if (movimientoReducido()) return;
  requestAnimationFrame(() => document.querySelectorAll(`[data-nt="${CSS.escape(id)}"]`).forEach(li => {
    li.classList.add(`fx-${efecto}`); setTimeout(() => li.classList.remove(`fx-${efecto}`), 1100);
    if (efecto === 'nueva') { const ic = li.querySelector('.nt-ico'); if (ic) { const r = ic.getBoundingClientRect(); chispas(r.left + r.width / 2, r.top + r.height / 2, { color: tinta(), n: 14, speed: 1.8, up: .6, life: 700, size: 1.6, gravity: .05 }); } }
  }));
}
export function quemar(li) {
  if (!li || movimientoReducido()) return Promise.resolve();
  li.classList.add('fx-arde');
  const r = li.getBoundingClientRect();
  for (let i = 0; i < 5; i++) setTimeout(() => chispas(r.left + r.width * (i / 5 + .1), r.top + r.height / 2, { color: '#FF8A3D', n: 8, speed: 1.4, up: 2.2, life: 800, size: 1.8, gravity: -.04 }), i * 50);
  return new Promise(res => setTimeout(res, 420));
}
export function acentoHex(l = 64) {
  const cs = getComputedStyle(document.documentElement), h = parseFloat(cs.getPropertyValue('--acc-h')) || 40, s = (parseFloat(cs.getPropertyValue('--acc-s')) || 78) / 100, L = l / 100;
  const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(L, 1 - L); return Math.round(255 * (L - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); };
  return `#${f(0)}${f(8)}${f(4)}`;
}
const tinta = () => acentoHex(66);

function efecto({ detail: d }) {
  if (d.tipo === 'lanzar') sello(d.x, d.y, { color: d.color, size: 130, dur: 850, lados: 5 });
  if (d.tipo === 'ascender') { sello(d.x, d.y, { size: Math.min(innerWidth * .9, 420), dur: 1500, giro: 90 }); setTimeout(() => sello(d.x, d.y, { size: 180, dur: 1100, lados: 8, giro: -60 }), 180); }
}
export function initMagia() {
  document.addEventListener('grimorio:fx', efecto);
  document.addEventListener('pointerdown', onda, { capture: true, passive: true });
  document.addEventListener('pointermove', inclinar, { passive: true });
  document.addEventListener('pointerout', soltar, { passive: true });
}
