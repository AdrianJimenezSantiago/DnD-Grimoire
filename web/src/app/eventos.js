/**
 * Controlador: traduce gestos y botones en casos de uso.
 * Un único despachador de órdenes (data-cmd) sirve al dock del móvil, a la barra de escritorio y a los menús.
 */
import { esc } from '../core/util.js';
import { perfil } from '../domain/reglas2024.js';
import { hasShortRest } from '../domain/rasgos.js';
import { REL_FIELDS, seedDb } from '../domain/modelo.js';
import { invalidateItems, linkCatalog } from '../domain/catalogo.js';
import { $, on } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { toast, hideToast, toastOpen } from '../ui/toast.js';
import { closeSheet, openSheet, topSheet } from '../ui/dialog.js';
import { pop, viewTransition } from '../ui/fx.js';
import { NATIVE, haptic, keepAwake, minimize, setBars, storage } from '../platform/native.js';
import * as A from './acciones.js';
import { openChars, openCharForm } from '../ui/dialogs/personajes.js';
import { openPicker } from '../ui/dialogs/buscador.js';
import { openSpell } from '../ui/dialogs/conjuro.js';
import { openLevelUp } from '../ui/dialogs/nivel.js';
import { openRules, openRecovery } from '../ui/dialogs/rasgos.js';
import { openHistory } from '../ui/dialogs/historial.js';
import { openBackup } from '../ui/dialogs/copia.js';
import { openManual } from '../ui/dialogs/manual.js';

const PREF = 'theo-grimorio-v1';
let S, awake = false;

/* ---------------- tema ---------------- */
export const isDark = () => { const r = document.documentElement; return r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
function toggleTheme() {
  viewTransition(() => { document.documentElement.dataset.theme = isDark() ? 'light' : 'dark'; setBars(isDark()); });
  storage.set(PREF + '-theme', document.documentElement.dataset.theme);
}

/* ---------------- menús emergentes ---------------- */
let openMenu = null;
function showMenu(menu, anchor, items) {
  closeMenu();
  menu.innerHTML = items.filter(Boolean).map(it => it === '-' ? '<hr>' : `<button type="button" role="menuitem" data-mcmd="${it.cmd}" ${it.chk != null ? `class="chk" role="menuitemcheckbox" aria-checked="${it.chk}"` : ''}>${icon(it.icon)}${esc(it.label)}</button>`).join('');
  menu.hidden = false; openMenu = menu;
  const r = anchor.getBoundingClientRect(), mw = menu.offsetWidth, mh = menu.offsetHeight;
  const below = r.bottom + 8 + mh < innerHeight;
  menu.style.left = `${Math.max(8, Math.min(innerWidth - mw - 8, r.right - mw))}px`;
  menu.style.top = `${below ? r.bottom + 8 : Math.max(8, r.top - mh - 8)}px`;
  menu.style.transformOrigin = below ? 'top right' : 'bottom center';
  menu.querySelector('button')?.focus({ preventScroll: true });
}
function closeMenu() { if (openMenu) { openMenu.hidden = true; openMenu = null; } }
function moreItems() {
  return [
    { cmd: 'chars', icon: 'users', label: 'Personajes' },
    { cmd: 'rules', icon: 'sliders', label: 'Rasgos y recursos' },
    { cmd: 'hist', icon: 'hourglass', label: 'Historial de la sesión' },
    '-',
    { cmd: 'manual', icon: 'book', label: 'Manual del jugador' },
    { cmd: 'backup', icon: 'save', label: 'Copia de seguridad' },
    !NATIVE && { cmd: 'print', icon: 'print', label: 'Imprimir' },
    { cmd: 'theme', icon: 'contrast', label: isDark() ? 'Tema de día' : 'Tema de noche' },
    NATIVE && { cmd: 'awake', icon: 'eye', label: 'Pantalla siempre encendida', chk: awake },
    '-',
    { cmd: 'about', icon: 'info', label: 'Acerca de y licencias' },
    { cmd: 'reset', icon: 'reset', label: 'Restablecer los datos de ejemplo' },
  ];
}
function restItems() {
  const ch = S.cur(); if (!ch) return [];
  return [hasShortRest(ch, perfil(ch)) && { cmd: 'short', icon: 'candle', label: 'Descanso corto' }, { cmd: 'long', icon: 'moon', label: 'Descanso largo' }];
}

/* ---------------- órdenes ---------------- */
function setEditing(v) { S.editing = v; S.emit('ui'); }
const COMMANDS = {
  chars: () => openChars(),
  newchar: () => openCharForm(null),
  editchar: () => S.cur() && openCharForm(S.cur().id),
  rules: () => S.cur() && openRules(),
  levelup: () => openLevelUp(),
  hist: () => openHistory(),
  add: () => S.cur() && openPicker(''),
  edit: () => S.cur() && setEditing(!S.editing),
  filter: () => { if (!S.cur()) return; S.edit((db, ch) => { ch.play.onlyPrep = !ch.play.onlyPrep; }); },
  rest: (el) => S.cur() && showMenu($('#restMenu'), el, restItems()),
  more: (el) => showMenu($('#moreMenu'), el, moreItems()),
  long: () => A.longRest(S),
  short: () => A.shortRest(S, openRecovery),
  endconc: () => A.endConc(S),
  backup: () => openBackup(),
  manual: () => openManual(),
  print: () => { setEditing(false); setTimeout(() => print(), 80); },
  theme: () => toggleTheme(),
  awake: () => { awake = !awake; storage.set(PREF + '-awake', awake ? '1' : '0'); keepAwake(awake); toast(awake ? 'La pantalla no se apagará mientras la hoja esté abierta.' : 'La pantalla se apagará como de costumbre.'); },
  about: () => openSheet($('#aboutDlg')),
  reset: () => {
    if (!confirm('Esto borra todos los personajes y el catálogo, y deja solo la hoja original de Theo de nivel 6. ¿Seguir?')) return;
    const db = seedDb(); linkCatalog(db); invalidateItems(); S.editing = false;
    const h = S.replace(db); toast('Datos de ejemplo restablecidos.', [A.undoBtn(S, h)]);
  },
};
function run(cmd, el) { closeMenu(); COMMANDS[cmd]?.(el); }

/* ---------------- botón Atrás (Android) ---------------- */
function back() {
  if (openMenu) return closeMenu();
  const d = topSheet(); if (d) return closeSheet(d);
  if (toastOpen()) return hideToast();
  if (S.editing) return setEditing(false);
  S.flush(); minimize();
}

/* ---------------- hoja ---------------- */
function bindSheet() {
  const sheet = $('#sheet'), bar = $('#sbar');
  // pulsación larga: ficha del conjuro
  let lpTimer = 0, lpFired = false, lpStart = null;
  sheet.addEventListener('pointerdown', e => {
    const z = e.target.closest('.castzone'); if (!z || S.editing) return;
    lpFired = false; lpStart = [e.clientX, e.clientY];
    lpTimer = setTimeout(() => { lpFired = true; haptic('medium'); openSpell(+z.dataset.cast); }, 460);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => sheet.addEventListener(t, () => clearTimeout(lpTimer)));
  sheet.addEventListener('pointermove', e => { if (lpStart && Math.hypot(e.clientX - lpStart[0], e.clientY - lpStart[1]) > 10) clearTimeout(lpTimer); });
  sheet.addEventListener('contextmenu', e => { if (e.target.closest('.castzone') && !S.editing) e.preventDefault(); });

  const click = (root) => on(root, 'click', '[data-slotbtn],[data-prep],[data-used],[data-flag],[data-add],[data-del],[data-text],[data-cast],[data-rtick],[data-rstep],[data-rset],[data-recuse],[data-dused]', (e, t) => {
    const d = t.dataset;
    if (d.slotbtn) { const [L, i] = d.slotbtn.split(':').map(Number); return A.toggleSlot(S, L, i); }
    if (d.prep) { const bi = +d.prep; S.edit((db, ch) => { ch.book[bi].prep = !ch.book[bi].prep; }); pop(document.querySelector(`[data-prep="${bi}"]`), 'fx-pop'); haptic(); return; }
    if (d.used) { const bi = +d.used, x = S.cur().book[bi], s = S.db.catalog[x.sid];
      S.act(`${s.es}: uso gratis ${x.used ? 'recuperado' : 'gastado'} a mano`, (db, ch) => { ch.book[bi].used = !ch.book[bi].used; }); return; }
    if (d.flag) { if (!S.editing) return; const sid = S.cur().book[+d.bi].sid; S.edit(db => { db.catalog[sid][d.flag] = !db.catalog[sid][d.flag]; }); return; }
    if (d.add !== undefined) return openPicker(d.add);
    if (d.del) { const bi = +d.del, s = S.db.catalog[S.cur().book[bi].sid]; const h = S.edit((db, ch) => { ch.book.splice(bi, 1); });
      return toast(`<b>${esc(s.es)}</b> quitado del libro. Sigue en el catálogo.`, [A.undoBtn(S, h)]); }
    if (d.text !== undefined) return openSpell(+d.text, { edit: true });
    if (d.cast !== undefined) { if (S.editing) return; if (lpFired) { lpFired = false; return; } return A.quickCast(S, +d.cast); }
    if (d.rtick) { const [id, i] = d.rtick.split('|'); return A.tickResource(S, id, +i); }
    if (d.rstep) { const [id, n] = d.rstep.split('|'); return A.stepResource(S, id, +n); }
    if (d.rset) return A.setResource(S, d.rset);
    if (d.recuse) return openRecovery(d.recuse);
    if (d.dused) { const [id, i] = d.dused.split('|'); return A.useDie(S, id, +i); }
  });
  click(sheet); click(bar);

  sheet.addEventListener('input', e => {
    const t = e.target, ch = S.cur(); if (!ch) return;
    if (t.dataset.dv !== undefined) {
      const [id, i, sides] = t.dataset.dv.split('|'), max = +sides;
      const v = t.value.replace(/\D/g, '').slice(0, String(max).length), n = parseInt(v, 10);
      t.value = v && (n < 1 || n > max) ? String(Math.min(max, Math.max(1, n))) : v;
      t.closest('.pdie')?.classList.remove('fresh');
      return A.setDie(S, id, +i, t.value);
    }
    if (t.dataset.k) {
      const e2 = ch.book[+t.dataset.bi], val = t.textContent.trim();
      if (REL_FIELDS.includes(t.dataset.k)) e2[t.dataset.k] = val; else { S.db.catalog[e2.sid][t.dataset.k] = val; invalidateItems(); }
      S.touch();
    }
  });
  sheet.addEventListener('focusout', e => { if (['gratis', 'escuela', 'coste', 'es'].includes(e.target.dataset?.k)) S.emit('edit'); });
  sheet.addEventListener('change', e => {
    const t = e.target;
    if (t.hasAttribute('data-always')) { const bi = +t.dataset.bi; S.edit((db, ch) => { ch.book[bi].always = t.checked; if (t.checked) ch.book[bi].prep = false; }); return; }
    if (t.dataset.lvl !== undefined) {
      const ch = S.cur(), sid = ch.book[+t.dataset.lvl].sid, s = S.db.catalog[sid], others = S.db.chars.filter(c => c !== ch && c.book.some(b => b.sid === sid)).length;
      S.edit(db => { db.catalog[sid].level = +t.value; }); invalidateItems();
      toast(`<b>${esc(s.es)}</b> ahora es ${+t.value === 0 ? 'un truco' : 'de nivel ' + t.value}.${others ? ` También cambia en ${others === 1 ? 'otro personaje' : others + ' personajes'}.` : ''}`);
    }
  });
  sheet.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList?.contains('castzone') && !S.editing) { e.preventDefault(); e.target.click(); } });
}

export async function init(store) {
  S = store;
  bindSheet();
  on(document, 'click', '[data-cmd]', (e, b) => run(b.dataset.cmd, b));
  on(document, 'click', '[data-mcmd]', (e, b) => run(b.dataset.mcmd, b));
  on(document, 'click', 'dialog [data-close]', (e, b) => closeSheet(b.closest('dialog')));
  document.addEventListener('click', e => { if (openMenu && !e.target.closest('.menu') && !e.target.closest('[data-cmd="more"],[data-cmd="rest"]')) closeMenu(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); hideToast(); } });
  addEventListener('resize', closeMenu); addEventListener('scroll', closeMenu, { passive: true });
  // cerrar hojas tocando el fondo
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) closeSheet(d); }));
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setBars(isDark())); } catch { /* navegadores antiguos */ }
  if (NATIVE) { awake = (await storage.get(PREF + '-awake')) === '1'; keepAwake(awake); }
  return { back, resume: () => { keepAwake(awake); setBars(isDark()); } };
}
