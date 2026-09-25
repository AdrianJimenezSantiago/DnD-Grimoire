import { esc, numLibre } from '../core/util.js';
import { SCHOOLS, perfil, clasesTexto, ABIL_NAME, modOf } from '../domain/reglas2024.js';
import { campo } from '../domain/validar.js';
import { schoolKey } from '../ui/sheet.js';
import { hasShortRest } from '../domain/rasgos.js';
import { REL_FIELDS, emptyDb } from '../domain/modelo.js';
import { invalidateItems } from '../domain/catalogo.js';
import { $, on } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { toast, hideToast, toastOpen } from '../ui/toast.js';
import { closeSheet, openSheet, topSheet } from '../ui/dialog.js';
import { pop, viewTransition, reducedMotion, burst } from '../ui/fx.js';
import { NATIVE, haptic, keepAwake, minimize, setBars, storage } from '../platform/native.js';
import * as A from './acciones.js';
import { confirmar, pedir } from '../ui/modal.js';
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
import { openVida, openEstados, danar, sanar, tirarSalvacionMuerte, estabilizar, revivir } from '../ui/dialogs/vida.js';
import { openDados, tirarPrueba, tirarDano } from '../ui/dialogs/dados.js';
import { openBuscar } from '../ui/dialogs/buscar.js';
import { transicion } from '../ui/combate.js';
import { estaMuerto, ordenPermitida, resucitar } from '../ui/luto.js';
import { mostrarCaracteristica, abrirPruebas } from '../ui/vitales.js';
import { leer, initLeer } from '../ui/leer.js';
import { combateDe, empezarCombate, terminarCombate, siguienteTurno, alternarEconomia } from '../domain/combate.js';
import { bonoHabilidad, bonoSalvacion, iniciativa, NOMBRE_HAB, abDe } from '../domain/habilidades.js';
import { equipoDe, ataqueArma } from '../domain/equipo.js';
import { efectosDe, caEfectiva, velocidadEfectiva, EFECTO, fmtRondas } from '../domain/efectos.js';
import { pasarRonda, vidaDe } from '../domain/vida.js';
import { avisar } from '../ui/dialogs/aviso.js';

const PREF = 'theo-grimorio-v1';
let S, awake = false;

export const isDark = () => { const r = document.documentElement; return r.dataset.theme ? r.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches; };
function toggleTheme() {
  const nuevo = isDark() ? 'light' : 'dark';
  viewTransition(() => { document.documentElement.dataset.theme = nuevo; setBars(nuevo === 'dark'); });
  storage.set(PREF + '-tema', nuevo);
}

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
  objetivos: () => A.enfocarObjetivos('conc'),
  formas: () => S.cur() && openFormas('salvaje'),
  verConjuros: () => S.cur() && S.edit((db, ch) => { ch.enJuego ||= {}; ch.enJuego.conjuros = !ch.enJuego.conjuros; }),
  backup: () => openBackup(),
  vida: () => S.cur() && openVida(),
  inspiracion: () => alternarInspiracion(),
  estados: () => S.cur() && openEstados(),
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
    const h = S.replace(db); toast('Datos borrados.', [A.undoBtn(S, h)]);
  },
};
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
  const abierto = openMenu?.id;
  closeMenu();
  if (estaMuerto(S.cur()) && !ordenPermitida(cmd)) { toast(`<b>${esc(S.cur().nombre)}</b> ha caído: su hoja queda sellada hasta que alguien lo traiga de vuelta.`, [{ label: 'He sido revivido', hl: true, fn: () => run('revivido', document.querySelector('.mm-revivir')) }]); return; }
  if ((cmd === 'more' && abierto === 'moreMenu') || (cmd === 'rest' && abierto === 'restMenu')) return;
  COMMANDS[cmd]?.(el);
}

function alternarCombate(el) {
  const ch = S.cur(); if (!ch) return;
  const c = combateDe(ch), activo = c.activo, ronda = c.ronda;
  transicion(activo ? 'salir' : 'entrar', el, () => {
    S.editing = false;
    S.act(activo ? `Fin del combate tras ${ronda} ${ronda === 1 ? 'ronda' : 'rondas'}` : 'Empieza el combate', (db, x) => { if (activo) terminarCombate(x); else empezarCombate(x); });
    const el2 = activo ? $('#sheet') : $('#combate'), cls = activo ? 'fx-paz' : 'fx-entra';
    if (!reducedMotion()) { el2.classList.add(cls); setTimeout(() => el2.classList.remove(cls), 1300); }
  }, { ronda });
  haptic(activo ? 'light' : 'heavy');
  if (!activo) setTimeout(() => { const x = S.cur(); if (x && combateDe(x).activo && combateDe(x).iniciativa == null && !topSheet()) tirarDesde('iniciativa'); }, reducedMotion() ? 200 : 1900);
}
async function iniciativaManual() {
  const ch = S.cur(); if (!ch) return;
  const c = combateDe(ch), alerta = (ch.dotes || []).some(d => /^alerta/i.test(d)) || /alerta/i.test(JSON.stringify(ch.trasfondo || ''));
  const r = await pedir({ titulo: 'Iniciativa a mano', texto: `Escribe tu iniciativa para este combate.${alerta ? ' Con la dote Alerta puedes intercambiarla con un aliado dispuesto: pon aquí la suya.' : ' Útil si la intercambias con un aliado o tu DJ la ajusta.'}`,
    valor: c.iniciativa != null ? String(c.iniciativa) : '', tipo: 'number', min: -10, max: 60, ok: 'Guardar' });
  if (r == null || r === '') return;
  const n = parseInt(r, 10); if (!Number.isFinite(n)) return;
  const antes = c.iniciativa;
  const h = S.act(`Iniciativa a mano: ${n}${antes != null ? ` (antes ${antes})` : ''}`, (db, x) => { combateDe(x).iniciativa = n; combateDe(x).iniManual = true; });
  pop(document.querySelector('.cb-ini-v'), 'fx-pop'); haptic('light');
  toast(`Iniciativa: <b>${n}</b>${antes != null ? ` (antes ${antes})` : ''}.`, [A.undoBtn(S, h)]);
}
function nuevoTurno() {
  const ch = S.cur(); if (!ch) return;
  if (combateDe(ch).iniciativa == null) { toast('Antes de pasar de ronda, tira tu iniciativa (o escríbela con el lápiz).'); tirarDesde('iniciativa'); return; }
  let fuera = [];
  const ronda = combateDe(ch).ronda + 1;
  const h = S.act(`Ronda ${ronda}`, (db, x) => { siguienteTurno(x); fuera = pasarRonda(x); });
  if (fuera.length) {
    S.note(`Terminan: ${fuera.map(e => e.nombre).join(', ')}`);
    setTimeout(() => avisoFinEfectos(fuera, ronda, h), 380);
  }
  pop(document.querySelector('.cb-ronda'), 'fx-ronda'); pop(document.querySelector('.cb-eco'), 'fx-renueva'); haptic('medium');
}
function avisoFinEfectos(fuera, ronda, h) {
  const buenos = fuera.filter(e => e.bueno), malos = fuera.filter(e => !e.bueno);
  const ca = caEfectiva(S.cur()), vel = velocidadEfectiva(S.cur());
  const cierra = e => ({ ico: e.ico, titulo: e.nombre, texto: e.k === 'escudo' ? `Tu CA vuelve a ${ca.ca}.` : EFECTO[e.k]?.ca ? `Tu CA queda en ${ca.ca}.` : EFECTO[e.k]?.vel || EFECTO[e.k]?.velX ? `Tu velocidad queda en ${String(vel.m).replace('.', ',')} m.` : EFECTO[e.k]?.maxPg ? 'Tus PG máximos vuelven a su valor.' : 'Su duración se ha agotado.', tono: `fin ${e.bueno ? 'buena' : 'mala'}` });
  avisar({ ico: 'md_tiempo', tono: malos.length && !buenos.length ? 'verde' : 'azul', titulo: fuera.length === 1 ? `Termina ${fuera[0].nombre}` : 'Terminan tus efectos',
    sub: `Empieza la ronda ${ronda}: ${fuera.length === 1 ? 'se agota la duración de un efecto' : `se agota la duración de ${fuera.length} efectos`}.`,
    secciones: [{ titulo: 'Ya no te ayuda', ico: 'inspiracion', items: buenos.map(cierra) }, { titulo: 'Te libras de', ico: 'estados', items: malos.map(cierra) },
      { titulo: 'Sigue activo', ico: 'md_tiempo', items: efectosDe(S.cur()).map(e => ({ ico: e.ico, titulo: e.nombre, texto: e.rondas != null ? `Quedan ${fmtRondas(e.rondas)}.` : 'Hasta que lo quites o descanses.' })) }],
    botones: [{ ...A.undoBtn(S, h), label: 'Deshacer la ronda', cls: 'ghost' }] });
  haptic('light');
}
function tirarDesde(clave) {
  const ch = S.cur(); if (!ch) return;
  if (clave === 'iniciativa') return tirarPrueba({ titulo: 'Iniciativa', sub: 'Prueba de Destreza', bono: iniciativa(ch), tipo: 'iniciativa',
    alTirar: total => { if (!combateDe(S.cur()).activo) return ''; S.act(`Iniciativa: ${total}`, (db, x) => { combateDe(x).iniciativa = total; combateDe(x).iniManual = false; }); return 'Guardada como tu iniciativa en este combate. Puedes cambiarla a mano con el lápiz junto a ella.'; } });
  const [tipo, k] = clave.split(':');
  if (tipo === 'car') return tirarPrueba({ titulo: `Prueba de ${ABIL_NAME[k]}`, sub: 'Prueba de característica', bono: modOf(ch.stats?.[k]), tipo: 'prueba', ab: k });
  if (tipo === 'salv') return tirarPrueba({ titulo: `Salvación de ${ABIL_NAME[k]}`, sub: 'Tirada de salvación', bono: bonoSalvacion(ch, k), tipo: 'salvacion', ab: k });
  if (tipo === 'hab') return tirarPrueba({ titulo: NOMBRE_HAB[k], sub: `Prueba de ${ABIL_NAME[abDe(k)]}`, bono: bonoHabilidad(ch, k), tipo: 'prueba', hab: k });
}

function back() {
  if (enTour()) return cerrarTour();
  if (openMenu) return closeMenu();
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
  const arma = id => { const ch = S.cur(), o = equipoDe(ch).objetos.find(x => x.id === id); return o ? { o, a: ataqueArma(ch, o) } : null; };
  on(sheet, 'click', '[data-cbataque]', (e, b) => { const x = arma(b.dataset.cbataque); if (x) tirarPrueba({ titulo: x.o.nombre, sub: 'Tirada de ataque', bono: parseInt(x.a.ataque, 10) || 0, tipo: 'ataque' }); });
  on(sheet, 'click', '[data-cbdano]', (e, b) => { const x = arma(b.dataset.cbdano); if (x) tirarDano({ titulo: x.o.nombre, sub: `de daño ${x.a.tipo}`.trim(), expr: x.a.expr, extras: efectosDe(S.cur()).filter(e => e.danoArma).map(e => ({ fuente: e.nombre, valor: e.danoArma })) }); });
  const pgRapido = tipo => { const i = document.getElementById('cbCant'), n = numLibre(i?.value); if (!(n > 0)) { i?.focus(); toast('Escribe primero cuántos puntos de golpe.'); return; }
    if (tipo === 'dano') danar(S, n); else sanar(S, n); const j = document.getElementById('cbCant'); if (j) j.value = ''; };
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
  on(sheet, 'click', '[data-comp]', (e, b) => {
    const [bi, c] = b.dataset.comp.split('|'), sid = S.cur().book[+bi].sid, act = (S.db.catalog[sid].comp || '').split(' ').filter(Boolean);
    const sig = act.includes(c) ? act.filter(x => x !== c) : [...act, c], { valor } = campo('comp', sig.join(' '));
    if (!valor) return toast('Todo conjuro tiene al menos un componente: verbal (V), somático (S) o material (M).');
    S.edit(db => { db.catalog[sid].comp = valor; if (!valor.includes('M')) db.catalog[sid].coste = ''; }); haptic('light');
  });
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
  S = store; initLeer(store);
  bindSheet();
  on(document, 'click', '[data-cmd]', (e, b) => run(b.dataset.cmd, b));
  on(document, 'click', '[data-mcmd]', (e, b) => run(b.dataset.mcmd, b));
  on(document, 'click', 'dialog [data-close]', (e, b) => closeSheet(b.closest('dialog')));
  document.addEventListener('click', e => { if (openMenu && !e.target.closest('.menu') && !e.target.closest('[data-cmd="more"],[data-cmd="rest"]')) closeMenu(); }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); hideToast(); } });
  addEventListener('resize', closeMenu); addEventListener('scroll', () => { if (openMenu && Math.abs(scrollY - menuY) > 60) closeMenu(); }, { passive: true });
  let sbT = 0; addEventListener('scroll', () => { if (sbT) return; sbT = requestAnimationFrame(() => { sbT = 0; document.body.classList.toggle('sb-compacta', scrollY > 320); }); }, { passive: true });
  document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d) closeSheet(d); }));
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setBars(isDark())); } catch {}
  if (NATIVE) { awake = (await storage.get(PREF + '-awake')) === '1'; keepAwake(awake); }
  return { back, run, COMMANDS, resume: () => { keepAwake(awake); setBars(isDark()); } };
}
