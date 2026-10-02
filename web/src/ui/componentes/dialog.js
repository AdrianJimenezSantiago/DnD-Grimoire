import { reducedMotion } from '../animaciones/fx.js';
const stack = [];
export function openSheet(d) {
  if (d.open) return;
  d.style.transform = '';
  d.showModal(); stack.push(d);
  d.addEventListener('close', () => { const i = stack.indexOf(d); if (i >= 0) stack.splice(i, 1); d.style.transform = ''; }, { once: true });
  d.querySelector('.dbody')?.scrollTo?.(0, 0);
}
export function closeSheet(d) {
  if (!d.open || d.classList.contains('closing')) return;
  if (reducedMotion()) { d.close(); return; }
  d.classList.add('closing');
  setTimeout(() => { d.classList.remove('closing'); d.close(); }, 190);
}
export const topSheet = () => stack[stack.length - 1] || null;

const comoHoja = typeof matchMedia === 'function' ? matchMedia('(max-width: 700px)') : { matches: false };
const NO_ARRASTRA = 'button, input, select, textarea, a, label, [contenteditable], [role="tab"], [role="radio"], .seg, .tr-toc, .bib-tabs';
let drag = null;
document.addEventListener('pointerdown', e => {
  if (!comoHoja.matches || e.pointerType === 'mouse' || e.button) return;
  const d = e.target.closest?.('dialog[open]:not(.modal)'); if (!d || d !== topSheet() || d.classList.contains('closing')) return;
  if (!e.target.closest('.grip, .dhead') || e.target.closest(NO_ARRASTRA)) return;
  drag = { d, y0: e.clientY, t0: performance.now(), dy: 0, id: e.pointerId };
});
document.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  drag.dy = Math.max(0, e.clientY - drag.y0);
  if (drag.dy > 4) { drag.d.style.transition = 'none'; drag.d.style.transform = `translateY(${drag.dy}px)`; }
}, { passive: true });
const soltar = e => {
  if (!drag || e.pointerId !== drag.id) return;
  const { d, dy, t0 } = drag; drag = null;
  const rapido = dy / Math.max(1, performance.now() - t0) > 0.6;
  if (dy > Math.min(140, d.offsetHeight * 0.25) || (rapido && dy > 30)) { d.style.transition = ''; closeSheet(d); return; }
  d.style.transition = 'transform .28s cubic-bezier(.2,.9,.3,1.2)'; d.style.transform = '';
  setTimeout(() => { d.style.transition = ''; }, 300);
};
document.addEventListener('pointerup', soltar);
document.addEventListener('pointercancel', soltar);

const VISTA = '[role="tab"], [data-abrir], [data-bx], [data-di="volver"], [data-di="lista"], [data-di="bestiario"], [data-di="nueva"], [data-di="nuevacr"]';
document.addEventListener('click', e => {
  const t = e.target.closest?.(VISTA), d = t?.closest('dialog[open]'); if (!d || reducedMotion() || t.getAttribute('aria-selected') === 'true') return;
  const body = d.querySelector('.dbody'); if (!body) return;
  requestAnimationFrame(() => {
    body.classList.remove('fx-vista'); void body.offsetWidth; body.classList.add('fx-vista');
    clearTimeout(body.__fxT); body.__fxT = setTimeout(() => body.classList.remove('fx-vista'), 400);
  });
}, true);
