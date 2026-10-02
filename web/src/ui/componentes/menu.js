// Menús desplegables (más opciones, descansos, escuela de magia): se colocan junto al botón que los abre
// y se cierran al tocar fuera, al pulsar Escape, al cambiar el tamaño de la ventana o al desplazarse.
import { esc } from '../../core/util.js';
import { $ } from './dom.js';
import { icon } from './icons.js';
import { gi } from './tema.js';
import { reducedMotion } from '../animaciones/fx.js';

let openMenu = null, menuY = 0;
export function showMenu(menu, anchor, items) {
  closeMenu(); menu.classList.remove('closing');
  menu.innerHTML = typeof items === 'string' ? items : items.filter(Boolean).map(it => it === '-' ? '<hr>' : `<button type="button" role="menuitem" data-mcmd="${it.cmd}" ${it.chk != null ? `class="chk" role="menuitemcheckbox" aria-checked="${it.chk}"` : ''}>${it.gi ? gi(it.gi, 'icon') : icon(it.icon)}${esc(it.label)}</button>`).join('');
  menu.hidden = false; openMenu = menu; menuY = scrollY;
  if (menu.id === 'moreMenu') anchor.setAttribute('aria-expanded', 'true');
  const r = anchor.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
  const below = r.bottom + 8 + mh < innerHeight;
  menu.style.left = `${Math.max(8, Math.min(innerWidth - mw - 8, r.right - mw))}px`;
  menu.style.top = `${below ? r.bottom + 8 : Math.max(8, r.top - mh - 8)}px`;
  menu.style.transformOrigin = below ? `${Math.min(mw - 22, r.left + r.width / 2 - parseFloat(menu.style.left))}px top` : 'bottom center';
  menu.querySelector('button')?.focus({ preventScroll: true });
}
export function closeMenu() {
  if (!openMenu) return;
  const m = openMenu; openMenu = null;
  if (m.id === 'moreMenu') $('#btnMore')?.setAttribute('aria-expanded', 'false');
  if (reducedMotion()) { m.hidden = true; return; }
  m.classList.add('closing');
  setTimeout(() => { if (openMenu !== m) m.hidden = true; m.classList.remove('closing'); }, 150);
}
export const menuAbierto = () => openMenu;

export function initMenus() {
  document.addEventListener('click', e => { if (openMenu && !e.target.closest('.menu') && !e.target.closest('[data-cmd="more"],[data-cmd="rest"]')) closeMenu(); }, true);
  addEventListener('resize', closeMenu); addEventListener('scroll', () => { if (openMenu && Math.abs(scrollY - menuY) > 60) closeMenu(); }, { passive: true });
}
