/** Hojas modales con animación de entrada y salida, y pila para el botón Atrás. */
import { reducedMotion } from './fx.js';
const stack = [];
export function openSheet(d) {
  if (d.open) return;
  d.showModal(); stack.push(d);
  d.addEventListener('close', () => { const i = stack.indexOf(d); if (i >= 0) stack.splice(i, 1); }, { once: true });
  d.querySelector('.dbody')?.scrollTo?.(0, 0);
}
export function closeSheet(d) {
  if (!d.open || d.classList.contains('closing')) return;
  if (reducedMotion()) { d.close(); return; }
  d.classList.add('closing');
  setTimeout(() => { d.classList.remove('closing'); d.close(); }, 190);
}
export const topSheet = () => stack[stack.length - 1] || null;
