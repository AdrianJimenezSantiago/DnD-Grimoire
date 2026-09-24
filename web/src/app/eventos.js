/**
 * Controlador: traduce gestos y botones en casos de uso.
 * Un único despachador de órdenes (data-cmd) sirve al dock del móvil, a la barra de escritorio y a los menús.
 */
import { esc } from '../core/util.js';
import { SCHOOLS, perfil, clasesTexto } from '../domain/reglas2024.js';
import { campo } from '../domain/validar.js';
import { schoolKey } from '../ui/sheet.js';
import { hasShortRest } from '../domain/rasgos.js';
import { REL_FIELDS, emptyDb } from '../domain/modelo.js';
import { invalidateItems, linkCatalog } from '../domain/catalogo.js';
import { $, on } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { toast, hideToast, toastOpen } from '../ui/toast.js';
import { closeSheet, openSheet, topSheet } from '../ui/dialog.js';
import { pop, viewTransition, reducedMotion } from '../ui/fx.js';
import { NATIVE, haptic, keepAwake, minimize, setBars, storage } from '../platform/native.js';
import * as A from './acciones.js';
import { confirmar } from '../ui/modal.js';
import { openChars, openCharForm } from '../ui/dialogs/personajes.js';
import { openPicker } from '../ui/dialogs/buscador.js';
import { openSpell } from '../ui/dialogs/conjuro.js';
import { openLevelUp } from '../ui/dialogs/nivel.js';
import { openRules, openRecovery } from '../ui/dialogs/rasgos.js';
import { openHistory } from '../ui/dialogs/historial.js';
import { openBackup } from '../ui/dialogs/copia.js';
import { openManual } from '../ui/dialogs/manual.js';
import { openBiblioteca, abrirRasgoJuego } from '../ui/dialogs/biblioteca.js';
import { openEquipo } from '../ui/dialogs/equipo.js';
import { openFormas } from '../ui/dialogs/formas.js';
import { openBestiario } from '../ui/dialogs/diario.js';
import { openRetrato } from '../ui/dialogs/retrato.js';
import { openTrasfondo } from '../ui/dialogs/trasfondo.js';
import { openDiario, accionNota } from '../ui/dialogs/diario.js';
import { showLanding, landingVisible } from '../ui/landing.js';
import { enTour, cerrarTour } from '../ui/tour.js';
import { gi } from '../ui/tema.js';
import { avatarHtml } from '../ui/avatar.js';

const PREF = 'theo-grimorio-v1';
let S, awake = false;

/* ---------------- tema ---------------- */
export const isDark = () => { const r = document.documentElement; return r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
function toggleTheme() {
  // el tema nuevo se decide antes: la transición aplica el cambio más tarde y se guardaba el anterior
  const nuevo = isDark() ? 'light' : 'dark';
  viewTransition(() => { document.documentElement.dataset.theme = nuevo; setBars(nuevo === 'dark'); });
  storage.set(PREF + '-tema', nuevo);
}

/* ---------------- menús emergentes ---------------- */
let openMenu = null, menuY = 0;
function showMenu(menu, anchor, items) {
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
function closeMenu() {
  if (!openMenu) return;
  const m = openMenu; openMenu = null;
  if (m.id === 'moreMenu') $('#btnMore')?.setAttribute('aria-expanded', 'false');
  if (reducedMotion()) { m.hidden = true; return; }
  m.classList.add('closing');
  setTimeout(() => { if (openMenu !== m) m.hidden = true; m.classList.remove('closing'); }, 150);
}
/** Menú «Más» compacto: cabecera con el personaje y el tema, rejilla de secciones y utilidades en pequeño. */
function moreMenuHtml() {
  const ch = S.cur(), dark = isDark();
  const tile = (cmd, ico, label, full, i) => `<button type="button" role="menuitem" class="mm-tile" data-mcmd="${cmd}" style="--i:${i}" aria-label="${esc(full || label)}"><span class="mm-ico">${ico}</span><span class="mm-lbl">${esc(label)}</span></button>`;
  const fila = (cmd, ico, label, extra = '') => `<button type="button" role="menuitem" class="mm-row" data-mcmd="${cmd}" ${extra}>${ico}<span>${esc(label)}</span></button>`;
  let i = 0;
  const personaje = ch ? [
    tile('rules', icon('sliders'), 'Rasgos', 'Rasgos y recursos', i++), tile('equipo', gi('cofre', 'icon'), 'Inventario', 'Inventario: objetos, monedas y carga', i++),
    tile('historia', gi('libro', 'icon'), 'Historia', '', i++), tile('diario', icon('quill'), 'Diario', 'Diario de sesión', i++),
    tile('bestiario', gi('bestia', 'icon'), 'Bestiario', '', i++), tile('chars', icon('users'), 'Personajes', '', i++),
  ].join('') : tile('chars', icon('users'), 'Personajes', '', i++);
  const saber = [tile('biblioteca', gi('biblioteca', 'icon'), 'Biblioteca', '', i++), tile('manual', gi('libro', 'icon'), 'Libros', 'Libros y manuales', i++), tile('hist', icon('hourglass'), 'Historial', 'Historial de la sesión', i++)].join('');
  const util = [
    fila('backup', icon('save'), 'Copia de seguridad'),
    NATIVE ? fila('awake', icon('eye'), 'Pantalla encendida', `role="menuitemcheckbox" aria-checked="${awake}"`) : fila('print', icon('print'), 'Imprimir'),
    fila('tutorial', icon('star'), 'Ver tutorial'), fila('about', icon('info'), 'Acerca de'),
  ].join('');
  return `<div class="mm-head">${ch ? avatarHtml(ch, 'md') : `<span class="avatar md">${gi('libro')}</span>`}
      <span class="mm-who"><b>${esc(ch?.nombre || 'Grimorio')}</b><small>${ch ? esc(clasesTexto(ch)) : 'Sin personaje abierto'}</small></span>
      <button type="button" role="menuitem" class="mm-theme" data-mcmd="theme" aria-label="${dark ? 'Cambiar a tema de día' : 'Cambiar a tema de noche'}" title="${dark ? 'Tema de día' : 'Tema de noche'}"><span class="mm-sol">${icon('sun')}</span><span class="mm-luna">${icon('moon')}</span></button></div>
    <div class="mm-grid">${personaje}</div><div class="mm-orla" aria-hidden="true"></div><div class="mm-grid">${saber}</div>
    <div class="mm-util">${util}</div>
    <button type="button" role="menuitem" class="mm-danger" data-mcmd="reset">${icon('reset')}Borrar todos los datos</button>`;
}
function restItems() {
  const ch = S.cur(); if (!ch) return [];
  return [hasShortRest(ch, perfil(ch)) && { cmd: 'short', icon: 'candle', label: 'Descanso corto' }, { cmd: 'long', icon: 'moon', label: 'Descanso largo' }];
}

/* ---------------- órdenes ---------------- */
function setEditing(v) { S.editing = v; S.emit('ui'); }
const COMMANDS = {
  chars: () => openChars(),
  home: () => { setEditing(false); showLanding(); },
  glosario: () => openBiblioteca('reglas'),
  biblioteca: () => openBiblioteca(),
  equipo: () => S.cur() && openEquipo(),
  bestiario: () => S.cur() && openBestiario(),
  retrato: () => S.cur() && openRetrato(S.cur().id),
  historia: () => S.cur() && openTrasfondo(),
  diario: () => S.cur() && openDiario(),
  tutorial: () => COMMANDS._tutorial?.(),
  newchar: () => openCharForm(null),
  editchar: () => S.cur() && openCharForm(S.cur().id),
  rules: () => S.cur() && openRules(),
  levelup: () => openLevelUp(),
  hist: () => openHistory(),
  add: () => S.cur() && openPicker(''),
  edit: () => S.cur() && setEditing(!S.editing),
  filter: () => { if (!S.cur()) return; S.edit((db, ch) => { ch.play.onlyPrep = !ch.play.onlyPrep; }); },
  rest: (el) => S.cur() && showMenu($('#restMenu'), el, restItems()),
  more: (el) => showMenu($('#moreMenu'), el, moreMenuHtml()),
  long: () => A.longRest(S),
  short: () => A.shortRest(S, openRecovery),
  endconc: () => A.endConc(S),
  objetivos: () => A.enfocarObjetivos('conc'),
  formas: () => S.cur() && openFormas('salvaje'),
  verConjuros: () => S.cur() && S.edit((db, ch) => { ch.enJuego ||= {}; ch.enJuego.conjuros = !ch.enJuego.conjuros; }),
  backup: () => openBackup(),
  manual: () => openManual(),
  print: () => { setEditing(false); setTimeout(() => print(), 80); },
  theme: () => toggleTheme(),
  awake: () => { awake = !awake; storage.set(PREF + '-awake', awake ? '1' : '0'); keepAwake(awake); toast(awake ? 'La pantalla no se apagará mientras la hoja esté abierta.' : 'La pantalla se apagará como de costumbre.'); },
  about: () => openSheet($('#aboutDlg')),
  reset: async () => {
    if (!(await confirmar({ titulo: '¿Borrar todos los datos?', texto: 'Se borran todos los personajes, el catálogo y el historial de este dispositivo. Justo después podrás deshacerlo.', ok: 'Borrar todo', peligro: true }))) return;
    const db = emptyDb(); invalidateItems(); S.editing = false;
    const h = S.replace(db); toast('Datos borrados.', [A.undoBtn(S, h)]);
  },
};
function run(cmd, el) {
  const abierto = openMenu?.id;
  closeMenu();
  if ((cmd === 'more' && abierto === 'moreMenu') || (cmd === 'rest' && abierto === 'restMenu')) return;   // el mismo botón lo cierra
  COMMANDS[cmd]?.(el);
}

/* ---------------- botón Atrás (Android) ---------------- */
function back() {
  if (enTour()) return cerrarTour();
  if (openMenu) return closeMenu();
  const d = topSheet(); if (d) return closeSheet(d);
  if (toastOpen()) return hideToast();
  if (S.editing) return setEditing(false);
  if (!landingVisible()) return showLanding();
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

  on(bar, 'click', '[data-jump]', (e, t) => document.querySelector(`[data-key="L${t.dataset.jump}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  // «En juego»: plegar, fijar arriba y leer el rasgo entero
  on(sheet, 'click', '[data-ej="toggle"]', () => S.edit((db, ch) => { const lanza = !!perfil(ch).c; ch.enJuego ||= {};
    const abierto = lanza ? !!ch.enJuego.abierto : ch.enJuego.abierto !== false; ch.enJuego.abierto = !abierto; }));
  on(sheet, 'click', '[data-ejfijar]', (e, b) => { const k = b.dataset.ejfijar; S.edit((db, ch) => { ch.enJuego ||= {}; const f = ch.enJuego.fijados || [];
    ch.enJuego.fijados = f.includes(k) ? f.filter(x => x !== k) : [...f, k]; }); haptic(); });
  on(sheet, 'click', '[data-ejver]', (e, b) => abrirRasgoJuego(b.dataset.ejver));
  on(sheet, 'click', '[data-ejfiltro]', (e, b) => S.edit((db, ch) => { ch.enJuego ||= {}; ch.enJuego.filtro = b.dataset.ejfiltro; }));
  on(sheet, 'click', '#res [data-ntact]', (e, b) => { const li = b.closest('[data-nt]'); accionNota(S, li.dataset.ses, li.dataset.nt, b.dataset.ntact); });
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
  // Al salir de un campo editable: se valida y se deja coherente (0 no es un uso gratis, el alcance mínimo es Toque…)
  let previo = null;
  sheet.addEventListener('focusin', e => { const k = e.target.dataset?.k; if (!k) return; const e2 = S.cur()?.book[+e.target.dataset.bi]; if (!e2) return;
    previo = REL_FIELDS.includes(k) ? e2[k] : S.db.catalog[e2.sid][k]; });
  sheet.addEventListener('focusout', e => {
    const t = e.target, k = t.dataset?.k; if (!k || t.dataset.bi == null) return;
    const ch = S.cur(), e2 = ch?.book[+t.dataset.bi]; if (!e2) return;
    const { valor, aviso } = campo(k, t.textContent), rel = REL_FIELDS.includes(k);
    const final = valor == null ? (previo ?? '') : valor;
    if (rel) { e2[k] = final; if (k === 'gratis' && !final) e2.used = false; } else { S.db.catalog[e2.sid][k] = final; invalidateItems(); }
    if (t.textContent !== final) t.textContent = final;
    S.touch(); S.emit('edit'); previo = null;
    if (aviso) toast(esc(aviso));
  });
  // Escuela: selector con las ocho escuelas y su color
  let escuelaBi = null;
  on(sheet, 'click', '[data-schoolpick]', (e, b) => {
    escuelaBi = +b.dataset.schoolpick; const actual = S.db.catalog[S.cur().book[escuelaBi].sid].escuela;
    showMenu($('#schoolMenu'), b, `<p class="sch-menu-h">Escuela de magia</p>` + SCHOOLS.map(sc => `<button type="button" role="menuitemradio" aria-checked="${sc === actual}" data-school="${sc}" style="--sc:var(--sc-${schoolKey(sc)})"><i class="sch-dot" aria-hidden="true"></i>${sc}</button>`).join(''));
  });
  on(document, 'click', '[data-school]', (e, b) => {
    closeMenu(); const ch = S.cur(); if (escuelaBi == null || !ch) return;
    const sid = ch.book[escuelaBi].sid, s = S.db.catalog[sid], antes = s.escuela, nueva = b.dataset.school; if (antes === nueva) return;
    const otros = S.db.chars.filter(c => c !== ch && c.book.some(x => x.sid === sid)).length;
    const h = S.edit(db => { db.catalog[sid].escuela = nueva; }); invalidateItems();
    toast(`<b>${esc(s.es)}</b>: ${esc(nueva.toLowerCase())}.${otros ? ` También cambia en ${otros === 1 ? 'otro personaje' : otros + ' personajes'}.` : ''}`, [A.undoBtn(S, h)]);
  });
  // Componentes: V, S y M se marcan; siempre queda al menos uno
  on(sheet, 'click', '[data-comp]', (e, b) => {
    const [bi, c] = b.dataset.comp.split('|'), sid = S.cur().book[+bi].sid, act = (S.db.catalog[sid].comp || '').split(' ').filter(Boolean);
    const sig = act.includes(c) ? act.filter(x => x !== c) : [...act, c], { valor } = campo('comp', sig.join(' '));
    if (!valor) return toast('Todo conjuro tiene al menos un componente: verbal (V), somático (S) o material (M).');
    S.edit(db => { db.catalog[sid].comp = valor; if (!valor.includes('M')) db.catalog[sid].coste = ''; }); haptic('light');
  });
  // Efectos activos: objetivos de la concentración y de los rasgos
  sheet.addEventListener('keydown', e => {
    const t = e.target; if (!t.dataset?.objin || e.key !== 'Enter') return;
    e.preventDefault(); const clave = t.dataset.objin;
    if (A.anadirObjetivos(S, clave, t.value)) { haptic('light'); setTimeout(() => document.querySelector(`[data-objin="${clave}"]`)?.focus({ preventScroll: true }), 30); }
    else t.value = '';
  });
  sheet.addEventListener('focusout', e => { const t = e.target; if (t.dataset?.objin && t.value.trim()) A.anadirObjetivos(S, t.dataset.objin, t.value); });
  on(sheet, 'click', '[data-objdel],[data-efnuevo],[data-eferm]', (e, b) => {
    if (b.dataset.objdel) { const [clave, i] = b.dataset.objdel.split('|'); return A.quitarObjetivo(S, clave, +i); }
    if (b.dataset.efnuevo) return A.marcarEfecto(S, b.dataset.efnuevo);
    if (b.dataset.eferm) return A.terminarEfecto(S, b.dataset.eferm);
  });
  sheet.addEventListener('change', e => {
    const t = e.target;
    if (t.hasAttribute('data-pedirobj')) { S.edit((db, ch) => { ch.play.pedirObjetivos = t.checked; }); return; }
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
  // el menú se cierra al desplazar de verdad la página, no con los pequeños saltos de foco al cerrar una hoja
  addEventListener('resize', closeMenu); addEventListener('scroll', () => { if (openMenu && Math.abs(scrollY - menuY) > 60) closeMenu(); }, { passive: true });
  // cerrar hojas tocando el fondo
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) closeSheet(d); }));
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setBars(isDark())); } catch { /* navegadores antiguos */ }
  if (NATIVE) { awake = (await storage.get(PREF + '-awake')) === '1'; keepAwake(awake); }
  return { back, run, COMMANDS, resume: () => { keepAwake(awake); setBars(isDark()); } };
}
