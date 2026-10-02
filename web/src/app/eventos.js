// Controlador de la hoja: conecta los botones (data-cmd, data-slotbtn…) con las acciones y los diálogos,
// y gestiona el modo edición, el modo combate, el menú y el botón atrás.
import { esc } from '../core/util.js';
import { perfil, clasesTexto } from '../domain/reglas/reglas2024.js';
import { prepCount } from '../domain/conjuros/espacios.js';
import { hasShortRest } from '../domain/clases/rasgos.js';
import { emptyDb } from '../domain/personaje/modelo.js';
import { invalidateItems } from '../domain/conjuros/catalogo.js';
import { $, on } from '../ui/componentes/dom.js';
import { icon } from '../ui/componentes/icons.js';
import { toast, hideToast, toastOpen, undoBtn } from '../ui/componentes/toast.js';
import { closeSheet, openSheet, topSheet } from '../ui/componentes/dialog.js';
import { pop, viewTransition, reducedMotion, burst } from '../ui/animaciones/fx.js';
import { NATIVE, haptic, keepAwake, minimize, setBars, storage } from '../platform/native.js';
import * as A from './acciones.js';
import { initCombate, alternarCombate, iniciativaManual, nuevoTurno, tirarDesde, atacar, danoCon, accionComun, pgRapido } from './combate.js';
import { showMenu, closeMenu, menuAbierto, initMenus } from '../ui/componentes/menu.js';
import { enlazarEdicion } from './edicionConjuros.js';
import { confirmar } from '../ui/componentes/modal.js';
import { openChars, openCharForm, openLevelUp } from './asistentes.js';
import { openPicker } from '../ui/dialogs/buscador.js';
import { openSpell } from '../ui/dialogs/conjuro.js';
import { openRules, openRecovery } from '../ui/dialogs/rasgos.js';
import { openHistory } from '../ui/dialogs/historial.js';
import { openBackup } from '../ui/dialogs/copia.js';
import { openManual } from '../ui/dialogs/manual.js';
import { openBiblioteca, abrirRasgoJuego } from '../ui/dialogs/biblioteca.js';
import { openEquipo } from '../ui/dialogs/equipo.js';
import { openFormas } from '../ui/dialogs/formas.js';
import { openBestiario, openDiario, accionNota } from '../ui/dialogs/diario.js';
import { openRetrato } from '../ui/dialogs/retrato.js';
import { openTrasfondo } from '../ui/dialogs/trasfondo.js';
import { showLanding, landingVisible } from '../ui/pantallas/landing.js';
import { enTour, cerrarTour } from '../ui/componentes/tour.js';
import { gi } from '../ui/componentes/tema.js';
import { avatarHtml } from '../ui/componentes/avatar.js';
import { openEfectos } from '../ui/dialogs/efectos.js';
import { openVida, openEstados, pedirConcentracion, tirarSalvacionMuerte, estabilizar, revivir } from '../ui/dialogs/vida.js';
import { openDados } from '../ui/dialogs/dados.js';
import { openBuscar } from '../ui/dialogs/buscar.js';
import { estaMuerto, ordenPermitida, resucitar } from '../ui/pantallas/luto.js';
import { mostrarCaracteristica, abrirPruebas } from '../ui/pantallas/vitales.js';
import { leer, initLeer } from '../ui/pantallas/leer.js';
import { combateDe, alternarEconomia } from '../domain/combate/combate.js';
import { vidaDe } from '../domain/combate/vida.js';

const PREF = 'theo-grimorio-v1';
let S, awake = false;

export const isDark = () => { const r = document.documentElement; return r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
function toggleTheme() {
  const nuevo = isDark() ? 'light' : 'dark';
  viewTransition(() => { document.documentElement.dataset.theme = nuevo; setBars(nuevo === 'dark'); });
  storage.set(PREF + '-tema', nuevo);
}

function moreMenuHtml() {
  const ch = S.cur(), dark = isDark();
  const tile = (cmd, ico, label, full, i) => `<button type="button" role="menuitem" class="mm-tile" data-mcmd="${cmd}" style="--i:${i}" aria-label="${esc(full || label)}"><span class="mm-ico">${ico}</span><span class="mm-lbl">${esc(label)}</span></button>`;
  const fila = (cmd, ico, label, extra = '') => `<button type="button" role="menuitem" class="mm-row" data-mcmd="${cmd}" ${extra}>${ico}<span>${esc(label)}</span></button>`;
  let i = 0;
  const personaje = ch && estaMuerto(ch) ? tile('home', icon('users'), 'Personajes', 'Cambiar de personaje', i++) : ch ? [
    tile('rules', icon('sliders'), 'Rasgos', 'Rasgos: progresión y recursos', i++), tile('equipo', gi('cofre', 'icon'), 'Inventario', 'Inventario: objetos, monedas y carga', i++),
    tile('historia', gi('libro', 'icon'), 'Historia', '', i++), tile('diario', icon('quill'), 'Diario', 'Diario de sesión', i++),
    tile('bestiario', gi('bestia', 'icon'), 'Bestiario', '', i++), tile('home', icon('users'), 'Personajes', 'Cambiar de personaje', i++),
  ].join('') : tile('home', icon('users'), 'Personajes', 'Cambiar de personaje', i++);
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
  return [{ cmd: 'short', icon: 'candle', label: hasShortRest(ch, perfil(ch)) ? 'Descanso corto' : 'Descanso corto (dados de golpe)' }, { cmd: 'long', icon: 'moon', label: 'Descanso largo' }];
}

function setEditing(v) { S.editing = v; S.emit('ui'); }
const COMMANDS = {
  chars: () => openChars(),
  home: () => { if (landingVisible()) return; viewTransition(() => { S.editing = false; showLanding(); }); },
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
  short: () => A.shortRest(S, openRecovery, openVida),
  endconc: () => A.endConc(S),
  tiraconc: () => S.cur() && pedirConcentracion(S),
  objetivos: () => A.enfocarObjetivos('conc'),
  formas: () => S.cur() && openFormas('salvaje'),
  verConjuros: () => S.cur() && S.edit((db, ch) => { ch.enJuego ||= {}; ch.enJuego.conjuros = !ch.enJuego.conjuros; }),
  backup: () => openBackup(),
  vida: () => S.cur() && openVida(),
  inspiracion: () => alternarInspiracion(),
  estados: () => S.cur() && openEstados(),
  beneficios: () => S.cur() && openEfectos('bueno'),
  perjuicios: () => S.cur() && openEfectos('malo'),
  dados: () => openDados(),
  dadoslibres: () => openDados(),
  buscar: () => openBuscar(),
  salvmuerte: () => S.cur() && tirarSalvacionMuerte(S),
  estabilizar: () => S.cur() && estabilizar(S),
  revivir: () => S.cur() && revivir(S),
  combate: el => alternarCombate(el),
  revivido: el => S.cur() && resucitar(el, () => revivir(S)),
  turno: () => nuevoTurno(),
  manual: () => openManual(),
  print: () => { setEditing(false); setTimeout(() => print(), 80); },
  theme: () => toggleTheme(),
  awake: () => { awake = !awake; storage.set(PREF + '-awake', awake ? '1' : '0'); keepAwake(awake); toast(awake ? 'La pantalla no se apagará mientras la hoja esté abierta.' : 'La pantalla se apagará como de costumbre.'); },
  about: () => openSheet($('#aboutDlg')),
  reset: async () => {
    if (!(await confirmar({ titulo: '¿Borrar todos los datos?', texto: 'Se borran todos los personajes, el catálogo y el historial de este dispositivo. Justo después podrás deshacerlo.', ok: 'Borrar todo', peligro: true }))) return;
    const db = emptyDb(); invalidateItems(); S.editing = false;
    const h = S.replace(db); toast('Datos borrados.', [undoBtn(S, h)]);
  },
};
function lanzadoFx(el) {
  if (!el || reducedMotion()) return;
  el.classList.remove('hz-lanza'); void el.offsetWidth; el.classList.add('hz-lanza');
  setTimeout(() => el.classList.remove('hz-lanza'), 900);
  const r = el.getBoundingClientRect(), c = getComputedStyle(el).getPropertyValue('--sc').trim() || '#F4D27A';
  burst(r.left + 28, r.top + r.height / 2, { color: /^#/.test(c) ? c : '#F4D27A', n: 22, speed: 3, up: 1.6, life: 900, size: 2 });
}
function alternarInspiracion() {
  const ch = S.cur(); if (!ch) return;
  const gana = !vidaDe(ch).inspiracion;
  S.act(gana ? 'Gana inspiración heroica' : 'Gasta la inspiración heroica', (db, x) => { vidaDe(x).inspiracion = gana; });
  haptic(gana ? 'medium' : 'light');
  requestAnimationFrame(() => {
    const b = document.querySelector('.hero-insp'); if (!b || reducedMotion()) return;
    b.classList.add(gana ? 'gana' : 'gasta'); setTimeout(() => b.classList.remove('gana', 'gasta'), 900);
    const r = b.getBoundingClientRect();
    if (gana) burst(r.left + r.width / 2, r.top + r.height / 2, { color: '#F4D27A', n: 26, speed: 3.2, up: 1.2, life: 1000, size: 2, gravity: -.02 });
  });
  if (!gana) toast('Inspiración heroica gastada: repite un d20 y quédate con la nueva tirada.');
}
function run(cmd, el) {
  const abierto = menuAbierto()?.id;
  closeMenu();
  if (estaMuerto(S.cur()) && !ordenPermitida(cmd)) { toast(`<b>${esc(S.cur().nombre)}</b> ha caído: su hoja queda sellada hasta que alguien lo traiga de vuelta.`, [{ label: 'He sido revivido', hl: true, fn: () => run('revivido', document.querySelector('.mm-revivir')) }]); return; }
  if ((cmd === 'more' && abierto === 'moreMenu') || (cmd === 'rest' && abierto === 'restMenu')) return;
  COMMANDS[cmd]?.(el);
}

function back() {
  if (enTour()) return cerrarTour();
  if (menuAbierto()) return closeMenu();
  const d = topSheet(); if (d) return closeSheet(d);
  if (toastOpen()) return hideToast();
  if (S.editing) return setEditing(false);
  if (!landingVisible()) return showLanding();
  S.flush(); minimize();
}

let ejT = 0;
function animarEnJuego() { const el = $('#enjuego'); pop(el, 'fx-abre'); clearTimeout(ejT); ejT = setTimeout(() => el.classList.remove('fx-abre'), 650); }

function bindSheet() {
  const sheet = $('#sheet'), bar = $('#sbar');
  let lpTimer = 0, lpFired = false, lpStart = null;
  let lpEl = null, lpVis = 0;
  const soltar = () => { clearTimeout(lpTimer); clearTimeout(lpVis); lpEl?.classList.remove('lp-carga'); lpEl = null; };
  sheet.addEventListener('pointerdown', e => {
    if (S.editing || e.button > 0) return;
    const L = e.target.closest('[data-leer]'), z = L ? null : e.target.closest('.castzone'); if (!L && !z) return;
    soltar(); lpFired = false; lpStart = [e.clientX, e.clientY];
    if (L) { lpEl = L; lpVis = setTimeout(() => L.classList.add('lp-carga'), 110); }
    lpTimer = setTimeout(() => { lpFired = true; haptic('medium'); const k = L?.dataset.leer; soltar(); if (k) leer(k); else openSpell(+z.dataset.cast); }, 460);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => sheet.addEventListener(t, soltar));
  sheet.addEventListener('pointermove', e => { if (lpStart && Math.hypot(e.clientX - lpStart[0], e.clientY - lpStart[1]) > 10) soltar(); });
  sheet.addEventListener('click', e => { if (lpFired && e.target.closest('[data-leer], .castzone')) { lpFired = false; e.stopPropagation(); e.preventDefault(); } }, true);
  sheet.addEventListener('contextmenu', e => {
    if (S.editing) return;
    const L = e.target.closest('[data-leer]');
    if (L) { e.preventDefault(); if (!lpFired) { soltar(); lpFired = e.pointerType !== 'mouse' && matchMedia('(pointer: coarse)').matches; leer(L.dataset.leer); } return; }
    if (e.target.closest('.castzone')) e.preventDefault();
  });

  on(bar, 'click', '[data-jump]', (e, t) => document.querySelector(`[data-key="L${t.dataset.jump}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  on(sheet, 'click', '[data-ej="toggle"]', () => { S.edit((db, ch) => { const lanza = !!perfil(ch).c; ch.enJuego ||= {};
    const abierto = lanza ? !!ch.enJuego.abierto : ch.enJuego.abierto !== false; ch.enJuego.abierto = !abierto; }); animarEnJuego(); });
  on(sheet, 'click', '[data-ejfijar]', (e, b) => { const k = b.dataset.ejfijar; S.edit((db, ch) => { ch.enJuego ||= {}; const f = ch.enJuego.fijados || [];
    ch.enJuego.fijados = f.includes(k) ? f.filter(x => x !== k) : [...f, k]; }); haptic(); });
  on(sheet, 'click', '[data-ejver]', (e, b) => abrirRasgoJuego(b.dataset.ejver));
  on(sheet, 'click', '[data-tirar]', (e, b) => tirarDesde(b.dataset.tirar));
  on(sheet, 'click', '[data-cbini]', () => iniciativaManual());
  sheet.addEventListener('toggle', e => { if (e.target.classList?.contains('cb-pruebas')) abrirPruebas(e.target.open); }, true);
  on(sheet, 'click', '[data-crab]', (e, b) => { const k = b.dataset.crab; if (matchMedia('(max-width: 899px)').matches) { mostrarCaracteristica(k); S.emit('ui'); } haptic('light'); tirarDesde(`car:${k}`); });
  on(sheet, 'click', '[data-eco]', (e, b) => { const k = b.dataset.eco; S.edit((db, x) => { alternarEconomia(x, k); }); haptic('light'); });
  on(sheet, 'click', '[data-cbataque]', (e, b) => atacar(b.dataset.cbataque));
  on(sheet, 'click', '[data-cbdano]', (e, b) => danoCon(b.dataset.cbdano));
  on(sheet, 'click', '[data-accom]', (e, b) => { const [k, via] = b.dataset.accom.split('|'); accionComun(k, via); });
  on(sheet, 'click', '[data-cbpg]', (e, b) => pgRapido(b.dataset.cbpg));
  sheet.addEventListener('keydown', e => { if (e.target.id === 'cbCant' && e.key === 'Enter') { e.preventDefault(); pgRapido('dano'); } });
  on(sheet, 'click', '[data-irrec]', (e, b) => {
    const card = [...sheet.querySelectorAll('[data-resid]')].find(x => x.dataset.resid === b.dataset.irrec); if (!card) return;
    card.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
    pop(card, 'fx-senala'); setTimeout(() => card.classList.remove('fx-senala'), 1600);
  });
  on(sheet, 'click', '[data-ejfiltro]', (e, b) => { S.edit((db, ch) => { ch.enJuego ||= {}; ch.enJuego.filtro = b.dataset.ejfiltro; }); animarEnJuego(); });
  on(sheet, 'click', '#res [data-ntact]', (e, b) => { const li = b.closest('[data-nt]'); accionNota(S, li.dataset.ses, li.dataset.nt, b.dataset.ntact); });
  const click = (root) => on(root, 'click', '[data-slotbtn],[data-prep],[data-used],[data-flag],[data-add],[data-del],[data-text],[data-cast],[data-rtick],[data-rstep],[data-rset],[data-recuse],[data-dused]', (e, t) => {
    const d = t.dataset;
    if (d.slotbtn) { const [L, i] = d.slotbtn.split(':').map(Number); return A.toggleSlot(S, L, i); }
    if (d.prep) { const bi = +d.prep, ch0 = S.cur(), P0 = perfil(ch0);
      // No se puede preparar más de lo que permite la clase (los «siempre preparados» no cuentan)
      if (!ch0.book[bi].prep && P0.c && prepCount(S.db, ch0) >= P0.maxPrep) {
        haptic('medium');
        return toast(`Ya tienes <b>${P0.maxPrep} de ${P0.maxPrep}</b> conjuros preparados. Quita otro antes de preparar <b>${esc(S.db.catalog[ch0.book[bi].sid]?.es || 'este')}</b>.`); }
      S.edit((db, ch) => { ch.book[bi].prep = !ch.book[bi].prep; }); pop(document.querySelector(`[data-prep="${bi}"]`), 'fx-pop'); haptic(); return; }
    if (d.used) { const bi = +d.used, x = S.cur().book[bi], s = S.db.catalog[x.sid];
      S.act(`${s.es}: uso gratis ${x.used ? 'recuperado' : 'gastado'} a mano`, (db, ch) => { ch.book[bi].used = !ch.book[bi].used; }); return; }
    if (d.flag) { if (!S.editing) return; const sid = S.cur().book[+d.bi].sid; S.edit(db => { db.catalog[sid][d.flag] = !db.catalog[sid][d.flag]; }); return; }
    if (d.add !== undefined) return openPicker(d.add);
    if (d.del) { const bi = +d.del, s = S.db.catalog[S.cur().book[bi].sid]; const h = S.edit((db, ch) => { ch.book.splice(bi, 1); });
      return toast(`<b>${esc(s.es)}</b> quitado del libro. Sigue en el catálogo.`, [undoBtn(S, h)]); }
    if (d.text !== undefined) return openSpell(+d.text, { edit: true });
    if (d.cast !== undefined) {
      if (S.editing) return; if (lpFired) { lpFired = false; return; }
      const grupo = t.closest('.cb-grupo'), k = grupo && ['accion', 'adicional', 'reaccion'].find(x => grupo.classList.contains(`g-${x}`));
      const ok = A.quickCast(S, +d.cast);
      if (ok && k) {
        if (!combateDe(S.cur()).turno[k]) S.edit((db, x) => { combateDe(x).turno[k] = true; });
        requestAnimationFrame(() => lanzadoFx(document.querySelector(`.cb-vista .cb-hz[data-cast="${d.cast}"]`)));
      }
      return;
    }
    if (d.rtick) { const [id, i] = d.rtick.split('|'); return A.tickResource(S, id, +i); }
    if (d.rstep) { const [id, n] = d.rstep.split('|'); return A.stepResource(S, id, +n); }
    if (d.rset) return A.setResource(S, d.rset);
    if (d.recuse) return openRecovery(d.recuse);
    if (d.dused) { const [id, i] = d.dused.split('|'); return A.useDie(S, id, +i); }
  });
  click(sheet); click(bar);

  enlazarEdicion(S, sheet);
  sheet.addEventListener('keydown', e => {
    const t = e.target; if (!t.dataset?.objin || e.key !== 'Enter') return;
    e.preventDefault(); const clave = t.dataset.objin;
    if (A.anadirObjetivos(S, clave, t.value)) { haptic('light'); setTimeout(() => document.querySelector(`[data-objin="${clave}"]`)?.focus({ preventScroll: true }), 30); }
    else t.value = '';
  });
  sheet.addEventListener('focusout', e => { const t = e.target; if (t.dataset?.objin && t.value.trim()) A.anadirObjetivos(S, t.dataset.objin, t.value); });
  on(sheet, 'click', '[data-objyo]', (e, b) => A.alternarYo(S, b.dataset.objyo));
  on(sheet, 'click', '[data-objdel],[data-efnuevo],[data-eferm]', (e, b) => {
    if (b.dataset.objdel) { const [clave, i] = b.dataset.objdel.split('|'); return A.quitarObjetivo(S, clave, +i); }
    if (b.dataset.efnuevo) return A.marcarEfecto(S, b.dataset.efnuevo);
    if (b.dataset.eferm) return A.terminarEfecto(S, b.dataset.eferm);
  });
  sheet.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList?.contains('castzone') && !S.editing) { e.preventDefault(); e.target.click(); } });
}

export async function init(store) {
  S = store; initLeer(store);
  initCombate(store);
  bindSheet();
  on(document, 'click', '[data-cmd]', (e, b) => run(b.dataset.cmd, b));
  on(document, 'click', '[data-mcmd]', (e, b) => run(b.dataset.mcmd, b));
  on(document, 'click', 'dialog [data-close]', (e, b) => closeSheet(b.closest('dialog')));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); hideToast(); } });
  initMenus();
  let sbT = 0; addEventListener('scroll', () => { if (sbT) return; sbT = requestAnimationFrame(() => { sbT = 0; document.body.classList.toggle('sb-compacta', scrollY > 320); }); }, { passive: true });
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) closeSheet(d); }));
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setBars(isDark())); } catch {}
  if (NATIVE) { awake = (await storage.get(PREF + '-awake')) === '1'; keepAwake(awake); }
  return { back, run, COMMANDS, resume: () => { keepAwake(awake); setBars(isDark()); } };
}
