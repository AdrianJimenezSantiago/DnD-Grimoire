// Gestión de personajes y asistente de creación paso a paso (clase, origen, características, equipo, conjuros).
// Es el módulo más pesado: se carga aparte (app/asistentes.js).
import { clamp, clone, esc, joinY, norm, uid } from '../../core/util.js';
import { ABILS, ABIL_NAME, CLASES, modOf, perfil, sgn, clasesDe, dotesDe, requisitosMulticlase, nivelTotal } from '../../domain/reglas/reglas2024.js';
import { reglas } from '../../domain/clases/rasgos.js';
import { levelDiff, conjurosPendientes, anadirPendientes } from '../../domain/clases/progresion.js';
import { blankChar, normChar, THEO, SCHEMA } from '../../domain/personaje/modelo.js';
import { $, on } from '../componentes/dom.js';
import { icon } from '../componentes/icons.js';
import { claseLinea, origenLinea } from '../../domain/personaje/descripcion.js';
import { openSheet, closeSheet } from '../componentes/dialog.js';
import { toast, undoBtn } from '../componentes/toast.js';
import { viewTransition, reducedMotion, burstFrom, pop } from '../animaciones/fx.js';
import { confirmar } from '../componentes/modal.js';
import { avatarHtml } from '../componentes/avatar.js';
import { temaDe, gi } from '../componentes/tema.js';
import { estiloPaleta, paleta } from '../../domain/presentacion/paleta.js';
import { subclasesDe, biblioteca, allSpellItems, itemToSid, itemMeta, listFilter, compendio } from '../../domain/conjuros/catalogo.js';
import { openRetrato } from './retrato.js';
import { campoSubclase, campoClase, initSubclases, lineaClase } from '../selectores/subclases.js';
import { fileStore, shareJson } from '../../platform/native.js';
import { pgMaximoCalculado } from '../../domain/combate/vida.js';
import { campoElegible, ponerValor, elegirDote, elegirEspecie, elegirTrasfondo, elegirEstilo, ESPECIE_BASE } from '../selectores/elecciones.js';
import { HABILIDADES, AB_CORTA, HAB_CLASE, NOMBRE_HAB, habilidadesTrasfondo, bonoHabilidad, salvacionesCompetentes } from '../../domain/reglas/habilidades.js';
import { CLASES_INFO, TEMAS } from '../../domain/clases/clases2024.js';
import { METODOS, COSTE, PUNTOS, costeCompra, tirarSeis, prioridad, repartoSugerido, caracteristicasTrasfondo, limpiarBonos, estadoBonos, bonosSugeridos, conBonos, repartoHabilidades, completarHabilidades, doteRepetida, mejorasHasta, versatilPendiente, fuentesExtra } from '../../domain/personaje/creacion.js';
import { LISTAS_HERRAMIENTA, IDIOMAS, IDIOMAS_RAROS, extraTrasfondo, extraClase, eleccionesHerramienta, herramientasDe, equipoInicial, tirarOro, datosObjeto, entrenamientoDe } from '../../domain/origen/origen.js';
import { anadirComun, equipoDe } from '../../domain/equipo/equipo.js';
import { previewSpell } from './conjuro.js';
import { estadoEstilo, trucosAlternativa, estiloDe, esAlternativa } from '../../domain/clases/estilos.js';
import { ORDENES, ordenesPendientes } from '../../domain/clases/ordenes.js';
import { dotesConConjuros, filtroEleccion } from '../../domain/origen/conjurosDote.js';
import { cupoMaestrias } from '../../domain/combate/maestria.js';
import { maestriasHtml, alternar as alternarMaes } from '../selectores/maestrias.js';
import { preguntarHabilidades, preguntarOpcion, aplicarFuente, faltanDe } from '../selectores/habilidadesElegir.js';
import { VARIANTES, variantesPendientes } from '../../domain/clases/variantes.js';
import { opcionesPendientes } from '../../domain/clases/opcionesRasgo.js';
import { cupoManiobras, alternarManiobra } from '../../domain/clases/maniobras.js';
import { maniobrasHtml } from '../selectores/maniobras.js';

let S, onCreated;
let MC = [], DOTES = [], HAB = {}, SALV = [], ORD = {}, VAR = {}, MAN = [], FVISTAS = new Set(), VVISTAS = new Set();
const charsDlg = () => $('#charsDlg'), charDlg = () => $('#charDlg');

export function openCharacter(id) {
  if (!S.db.chars.some(c => c.id === id)) return;
  viewTransition(() => { S.editing = false; S.edit(db => { db.activeId = id; }); window.scrollTo({ top: 0 }); document.dispatchEvent(new CustomEvent('grimorio:abierto')); });
}

function renderList() {
  const n = Object.keys(S.db.catalog).length;
  $('#charList').innerHTML = (S.db.chars.length ? S.db.chars.map(c => {
    const nb = c.book.length;
    return `<div class="ccard ${c.id === S.db.activeId ? 'active' : ''}"><span class="ccard-av paleta-local" style="${estiloPaleta(temaDe(c))}">${avatarHtml(c, 'md')}</span>
      <button type="button" class="cmain" data-openc="${c.id}"><span class="cname">${esc(c.nombre || 'Sin nombre')}</span>
        <span class="cline">${esc(claseLinea(c))}${origenLinea(c) ? '. ' + esc(origenLinea(c)) : ''}. ${nb === 1 ? '1 conjuro' : nb + ' conjuros'} en el libro</span></button>
      <div class="cacts"><button type="button" data-editc="${c.id}">Editar</button><button type="button" data-dupc="${c.id}">Duplicar</button><button type="button" data-expc="${c.id}" aria-label="Exportar a ${esc(c.nombre || "este personaje")}" title="Exportar">${gi("exportar")}<span class="cacts-t">Exportar</span></button><button type="button" class="warn" data-delc="${c.id}">Borrar</button></div>
    </div>`; }).join('') : '<p class="pempty">Todavía no hay personajes.</p>')
    + `<p class="credit">El catálogo compartido tiene ${n === 1 ? '1 conjuro' : n + ' conjuros'}. Lo que añadas a un personaje queda disponible para los demás.</p>`;
}
export function openChars() { renderList(); openSheet(charsDlg()); }

function duplicate(id) {
  const src = S.db.chars.find(c => c.id === id); if (!src) return;
  const h = S.edit(db => {
    const c = clone(src); c.id = uid('c'); c.nombre = `${src.nombre} (copia)`;
    c.play = { used: {}, conc: '', rec: {}, log: [], onlyPrep: src.play.onlyPrep }; c.book.forEach(e => { e.used = false; }); c.diario = { sesiones: [] };
    db.chars.splice(db.chars.findIndex(x => x.id === id) + 1, 0, c);
  });
  renderList(); toast(`Creada «${esc(src.nombre)} (copia)».`, [undoBtn(S, h)]);
}
export function paqueteDe(db, c) {
  const conjuros = Object.fromEntries(c.book.map(e => [e.sid, db.catalog[e.sid]]).filter(([, x]) => x));
  return { tipo: 'grimorio-personaje', version: 1, schema: SCHEMA, fecha: new Date().toISOString(), personaje: clone(c), conjuros };
}
async function exportar(id) {
  const c = S.db.chars.find(x => x.id === id); if (!c) return;
  const nombre = `${(c.nombre || 'personaje').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'personaje'}.grimorio.json`;
  try { await shareJson(nombre, JSON.stringify(paqueteDe(S.db, c), null, 1)); toast(`<b>${esc(c.nombre)}</b> exportado. Se abre desde «Cargar copia» en cualquier grimorio.`); }
  catch (e) { if (!/cancel/i.test(String(e?.message))) toast('No se pudo exportar el personaje.'); }
}
async function remove(id) {
  const c = S.db.chars.find(x => x.id === id); if (!c) return;
  if (!(await confirmar({ titulo: `¿Borrar a ${c.nombre || 'este personaje'}?`, texto: 'Se borran su ficha, su libro y su historial. Los conjuros siguen en el catálogo para los demás personajes.', ok: 'Borrar personaje', peligro: true }))) return;
  const h = S.edit(db => { db.chars = db.chars.filter(x => x.id !== id); if (db.activeId === id) db.activeId = db.chars[0]?.id ?? null; });
  fileStore.remove(`retrato-${id}.txt`);
  renderList(); toast(`${esc(c.nombre || 'Personaje')} borrado.`, [undoBtn(S, h)]);
}


// Creación y edición: un asistente por pasos en el orden del Manual del Jugador (clase, origen, características…)
const PASOS = [['clase', 'Clase'], ['origen', 'Origen'], ['car', 'Características'], ['comp', 'Competencias'], ['dotes', 'Dotes'], ['conj', 'Conjuros'], ['fin', 'Detalles']];
const ICO_PASO = { origen: 'trasfondo', car: 'd20', comp: 'eficaz', dotes: 'dote', conj: 'libro', fin: 'md_pluma' };
let formId = null, conjAbierto = false, CREANDO = false, PASO = 0, VISTOS = new Set(), CAR = null, TEMA = '';
let MAES = [], ELEC = {}, EQ = { clase: 'A', trasfondo: 'A', oro: null }, HERR = [], IDI = [], CONJ = { trucos: [], prep: [], libro: [], estilo: [] }, CQ = {};
const lib = () => biblioteca();

function cargarCar(c) {
  const cr = c.creacion;
  if (cr && ABILS.every(([k]) => conBonos(cr.base, cr.bonos)[k] === c.stats[k]))
    return { metodo: cr.metodo, base: { ...cr.base }, bonos: { ...cr.bonos }, tiradas: [...cr.tiradas], dados: null, modo: Object.values(cr.bonos).includes(2) || !Object.keys(cr.bonos).length ? '21' : '111', sel: null, auto: false };
  if (!formId) return { metodo: 'matriz', base: repartoSugerido(c.clase), bonos: {}, tiradas: [], dados: null, modo: '21', sel: null, auto: true };
  return { metodo: 'libre', base: { ...c.stats }, bonos: {}, tiradas: [], dados: null, modo: '21', sel: null, auto: false, heredado: true };
}
const permitidas = d => caracteristicasTrasfondo(d.trasfondo, lib().trasfondos);
const hex = (h, s, l) => { s /= 100; l /= 100; const a = s * Math.min(l, 1 - l), f = n => { const k = (n + h / 30) % 12; return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0'); }; return `#${f(0)}${f(8)}${f(4)}`; };

export function openCharForm(id, { clase = '' } = {}) {
  formId = id || null; conjAbierto = false; CREANDO = !id; PASO = 0; VISTOS = new Set([0]); TEMA = '';
  const c = id ? S.db.chars.find(x => x.id === id) : blankChar({ campana: S.cur()?.campana || THEO.campana });
  $('#charTitle').textContent = id ? `Editar a ${c.nombre || 'personaje'}` : 'Nuevo personaje';
  $('#charErr').textContent = '';
  const slots = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(L => `<label class="f">Nv. ${L}<input type="number" inputmode="numeric" min="0" max="9" id="f_e${L}" value="${(c.espacios || {})[L] || ''}" placeholder="0"></label>`).join('');
  const paso = (k, intro, html) => `<div class="cc-paso" data-paso="${k}" role="tabpanel" hidden><p class="cc-intro">${intro}</p>${html}</div>`;
  $('#charForm').innerHTML =
  paso('clase', 'Empieza por la clase: marca tus dados de golpe, tus salvaciones y qué habilidades puedes aprender.', `
    <input type="hidden" id="f_clase" value="${esc(c.clase)}">
    <div class="cc-clases" id="f_clases" role="radiogroup" aria-label="Clase"></div>
    <section class="fsec"><div class="frow">
      <div class="f">Subclase<span class="cc-subbloq" id="f_subLock">Se elige al llegar a nivel 3</span><span id="f_subWrap">${campoSubclase(c.clase, c.subclase, 'id="f_subclase" aria-label="Subclase"')}</span><span class="hint" id="h_sub"></span></div>
      <div class="f">Nivel<div class="stepper"><button type="button" data-step="-1" aria-label="Bajar nivel">−</button><input id="f_nivel" type="number" inputmode="numeric" min="1" max="20" value="${c.nivel}" aria-label="Nivel"><button type="button" data-step="1" aria-label="Subir nivel">+</button></div></div></div>
      <div id="f_mc" class="mc-list"></div>
      <button type="button" class="ghost mc-add" id="f_mcAdd">${icon('plus')}Añadir otra clase (multiclase)</button>
      <p class="hint" id="h_mc" aria-live="polite"></p></section>
    <section class="fsec"><h3>Lo que te da la clase</h3><div id="f_claseExtra"></div></section>`)
  + paso('origen', 'Tu origen: quién eras antes de aventurar. El trasfondo te da tres características para mejorar, una dote de origen y dos habilidades.', `
    ${id ? `<div class="f-ret">${avatarHtml(c, 'lg')}<div><b>Retrato</b><p class="note">${c.retrato ? 'Puedes reencuadrarlo o cambiarlo cuando quieras.' : 'Añade una imagen de tu personaje: aparece en la portada, la hoja y la barra superior.'}</p><button type="button" data-retrato>${c.retrato ? 'Editar retrato' : 'Añadir retrato'}</button></div></div>` : ''}
    <label class="f cc-nombre" id="w_nombre">Nombre<input id="f_nombre" value="${esc(c.nombre)}" autocomplete="off" required placeholder="¿Cómo se llama?"></label>
    <div class="frow cc-origen">
      <div class="f"><span>Especie</span>${campoElegible('id="f_especie" aria-label="Especie"', c.especie, 'especie', 'criatura', 'Elige o escribe')}<div class="cc-info" id="i_especie"></div></div>
      <div class="f"><span>Trasfondo</span>${campoElegible('id="f_trasfondo" aria-label="Trasfondo"', c.trasfondo, 'trasfondo', 'trasfondo', 'Elige o escribe')}<div class="cc-info" id="i_trasfondo"></div></div></div>
    <div id="f_origenExtra"></div>`)
  + paso('car', 'Elige cómo generas tus puntuaciones y después suma los aumentos de tu trasfondo.', '<div id="f_car"></div>')
  + paso('comp', 'Las de tu trasfondo ya están marcadas. Elige las de tu clase entre las resaltadas.', `
    <div id="h_comp" class="cc-avisos" aria-live="polite"></div>
    <div class="cc-grupos" id="f_comp" role="group" aria-label="Salvaciones y habilidades por característica"></div>
    <p class="hint">Toca una habilidad para pasar de nada a competencia (●) y a pericia (◆◆).</p>
    <div class="cc-acciones"><button type="button" class="ghost" id="f_compAuto">${icon('sparkles')}Elegir por mí las que faltan</button><button type="button" class="ghost" id="f_compReset">Volver a empezar</button></div>`)
  + paso('dotes', 'La dote de origen sale de tu trasfondo. Añade aquí las que ganes por especie o al subir de nivel.', `
    <div id="h_dotes" class="cc-avisos" aria-live="polite"></div>
    <div class="dote-chips" id="f_dotes"></div>
    <button type="button" class="elg-add" id="f_doteAdd">${gi('dote')}<span><b>Añadir una dote</b><small>Elige de la lista, con su texto, o escribe cualquiera</small></span>${icon('plus')}</button>
    <p class="hint">Las que elijas aparecen en «En juego» con su texto si has importado el libro.</p>`)
  + paso('conj', 'Los conjuros que conoces al empezar: tus trucos y los que preparas cada día.', '<div id="f_conj"></div>')
  + paso('fin', 'Últimos toques. Todo esto puedes cambiarlo más adelante.', `
    <section class="fsec"><h3>Puntos de golpe</h3><div class="frow"><label class="f">PG máximos<input id="f_pgmax" type="number" inputmode="numeric" min="1" value="${c.vida?.maxManual ?? ''}" placeholder=""><span class="hint" id="h_pgmax"></span></label></div></section>
    <button type="button" class="ghost conj-toggle" id="f_conjOpen" hidden>${icon('plus')}Opciones de conjuros (dotes, especie o multiclase)</button>
    <section class="fsec" id="f_secConj"><h3>Conjuros</h3><div class="frow">
      <label class="f">Característica para conjuros<select id="f_aptitud"></select><span class="hint">Cámbiala solo si la da una dote o especie.</span></label>
      <label class="f">Bonificador extra a la CD<input id="f_extraCD" type="number" inputmode="numeric" value="${c.extraCD || 0}"><span class="hint">Objetos como un grimorio +1.</span></label>
      <label class="f">Bonificador extra al ataque<input id="f_extraAtaque" type="number" inputmode="numeric" value="${c.extraAtaque || 0}"></label></div>
      <label class="chk-line"><input type="checkbox" id="f_manual" ${c.espaciosManuales ? 'checked' : ''}> Espacios de conjuro a mano (multiclase o reglas de la mesa)</label>
      <div class="slotgrid" id="f_slots" ${c.espaciosManuales ? '' : 'hidden'}>${slots}</div></section>
    <section class="fsec"><h3>En la hoja</h3><div class="frow">
      <label class="f wide">Lema<textarea id="f_lema" class="serif" rows="2" placeholder="Una frase que acompañe al nombre">${esc(c.lema)}</textarea><span class="hint">Lo que escribas entre _guiones bajos_ aparece subrayado en dorado.</span></label>
      <label class="f wide">Campaña<input id="f_campana" value="${esc(c.campana)}" autocomplete="off"></label>
      <label class="f wide">Notas<textarea id="f_notas" rows="3" placeholder="Rasgos de especie, idiomas, lo que quieras recordar">${esc(c.notas || '')}</textarea><span class="hint">Las subidas de nivel guiadas anotan aquí lo que eliges.</span></label></div></section>
    <section class="fsec"><h3>Resumen</h3><div id="f_pend"></div><div class="fsum" id="f_sum" aria-live="polite"></div></section>`);
  MC = clone(c.multiclase || []); DOTES = [...(c.dotes || [])]; ORD = { ...(c.ordenes || {}) }; HAB = { ...(c.habilidades || {}) }; SALV = [...(c.salvacionesExtra || [])]; CAR = cargarCar(c);
  VAR = { ...(c.variantes || {}) }; MAN = [...(c.maniobras || [])];
  MAES = [...(c.maestrias || [])]; ELEC = {}; EQ = { clase: 'A', trasfondo: 'A', oro: null }; HERR = [...(c.herramientas || [])]; IDI = (c.idiomas || []).filter(x => norm(x) !== 'comun'); CONJ = { trucos: [], prep: [], libro: [], estilo: [] }; CQ = {};
  $('#f_trasfondo').dataset.antes = c.trasfondo || ''; $('#f_trasfondo').dataset.sync = c.trasfondo || ''; $('#f_especie').dataset.sync = c.especie || '';
  pintarMulticlase(); irA(0, true);
  sync(true); FVISTAS = new Set(fuentesConClave(readForm()).map(f => f.clave)); VVISTAS = new Set(CREANDO ? [] : variantesPendientes(readForm()));
  if (!id && CLASES[clase]) cambiarClase(clase);
  openSheet(charDlg());
}

function irA(i, primera = false) {
  const antes = PASO; PASO = clamp(i, 0, PASOS.length - 1); VISTOS.add(PASO);
  document.querySelectorAll('#charForm .cc-paso').forEach((p, k) => {
    p.hidden = k !== PASO;
    if (k === PASO && !primera && !reducedMotion()) { p.classList.remove('fx-der', 'fx-izq'); void p.offsetWidth; p.classList.add(PASO >= antes ? 'fx-der' : 'fx-izq'); }
  });
  if (!primera) { $('#charForm').scrollTo?.({ top: 0 }); pintarPasos(readForm()); }
  if (PASOS[PASO][0] === 'origen' && CREANDO && !$('#f_nombre').value) requestAnimationFrame(() => { if (!charDlg().querySelector('.cc-paso:not([hidden]) :is(input, textarea):focus')) $('#f_nombre')?.focus(); });
}

function pendientes(d) {
  const P = { clase: [], origen: [], car: [], comp: [], dotes: [], conj: [], fin: [] };
  const exceso = d.nivel + MC.reduce((n, m) => n + (parseInt(m.nivel, 10) || 1), 0) > 20;
  if (exceso) P.clase.push('El nivel total pasa de 20.');
  for (const r of requisitosMulticlase(d)) P.clase.push(`${r.clase} pide ${r.falta}.`);
  if (!d.nombre) P.origen.push('Falta el nombre.');
  if (!d.especie) P.origen.push('Elige una especie.');
  if (!d.trasfondo) P.origen.push('Elige un trasfondo.');
  if (CAR.metodo === 'tiradas' && !CAR.tiradas.length) P.car.push('Tira los dados.');
  if (CAR.metodo === 'compra') { const r = PUNTOS - costeCompra(CAR.base); if (r > 0) P.car.push(`Te quedan ${r} ${r === 1 ? 'punto' : 'puntos'}.`); if (r < 0) P.car.push(`Te pasas en ${-r} ${r === -1 ? 'punto' : 'puntos'}.`); }
  if (d.trasfondo && !CAR.heredado && !estadoBonos(CAR.bonos, permitidas(d)).completo) P.car.push('Reparte los aumentos del trasfondo.');
  const r = repartoHabilidades(d);
  if (r.faltanTrasfondo.length) P.comp.push(`Tu trasfondo da ${joinY(r.faltanTrasfondo.map(k => NOMBRE_HAB[k]))}.`);
  if (r.clase.faltan) P.comp.push(`${r.clase.faltan} de ${d.clase}.`);
  if (r.extra.faltan) P.comp.push(`${r.extra.faltan} de ${joinY(r.extra.fuentes.map(f => f.nombre))}.`);
  if (r.pericia.faltan) P.comp.push(`${r.pericia.faltan} ${r.pericia.faltan === 1 ? 'pericia' : 'pericias'}.`);
  if (versatilPendiente(d, lib().dotes)) P.dotes.push('Humano: una dote de origen (Versátil).');
  const est = estadoEstilo(d, lib().dotes); if (est.faltan) P.dotes.push(`Estilo de combate de ${joinY(est.fuentes)}.`);
  for (const k of ordenesPendientes(d, clasesDe(d).map(c => c.clase))) P.clase.push(`${k}: elige tu ${ORDENES[k].rasgo.toLowerCase()} (en Dotes).`);
  { const cupo = cupoMaestrias(d); if (MAES.length < cupo) P.clase.push(`Maestría con armas: elige ${cupo - MAES.length} ${cupo - MAES.length === 1 ? 'arma' : 'armas'}.`); }
  { const cupo = cupoManiobras(d); if (MAN.length < cupo) P.clase.push(`Maniobras: elige ${cupo - MAN.length} ${cupo - MAN.length === 1 ? 'maniobra' : 'maniobras'} más.`); }
  for (const k of variantesPendientes(d)) P.dotes.push(`${k}: elige la variante de ${VARIANTES[k].rasgo}.`);
  for (const o of opcionesPendientes(d)) P.dotes.push(`${o.clase || d.especie}: elige una opción de ${o.rasgo} (tócalo en «En juego»).`);
  for (const e of eleccionesHerramienta(d)) { const n = (ELEC[e.id] || []).length; if (n < e.n) P[e.id === 't' ? 'origen' : 'clase'].push(`${e.de}: elige ${e.n === 1 ? LISTAS_HERRAMIENTA[e.lista][0] : `${e.n} (${LISTAS_HERRAMIENTA[e.lista][0]})`}.`); }
  if (CREANDO) {
    if (IDI.length < 2) P.origen.push(`Elige ${2 - IDI.length} ${IDI.length === 1 ? 'idioma' : 'idiomas'} más.`);
    if (EQ.clase === 'oro' && !EQ.oro) P.clase.push('Tira tu oro inicial.');
    const c = cupoConjuros(d);
    if (c.trucos > CONJ.trucos.length) P.conj.push(`${c.trucos - CONJ.trucos.length} ${c.trucos - CONJ.trucos.length === 1 ? 'truco' : 'trucos'}.`);
    if (c.libro > CONJ.libro.length) P.conj.push(`${c.libro - CONJ.libro.length} para el libro de conjuros.`);
    if (c.estilo > CONJ.estilo.length) P.conj.push(`${c.estilo - CONJ.estilo.length} ${c.estilo - CONJ.estilo.length === 1 ? 'truco' : 'trucos'} de ${joinY(trucosAlternativa(d).map(a => a.nombre))}.`);
    if (c.prep > CONJ.prep.length) P.conj.push(`${c.prep - CONJ.prep.length} ${c.prep - CONJ.prep.length === 1 ? 'conjuro preparado' : 'conjuros preparados'}.`);
    for (const dc of dotesConConjuros(d, lib().trasfondos)) for (const e of dc.elegir) { const k = `dote:${dc.clave}:${e.k}`, n = e.n - (CONJ[k] || []).length; if (n > 0) P.conj.push(`${n} de ${dc.fuente}.`); }
  }
  return P;
}

function cupoConjuros(d) {
  const P = perfil(d), estilo = 2 * trucosAlternativa(d).length; if (!P.c) return { P, trucos: 0, prep: 0, libro: 0, estilo };
  const mago = clasesDe(d).find(c => c.clase === 'Mago');
  return { P, estilo, trucos: P.maxCant, libro: mago ? 6 + 2 * (mago.nivel - 1) : 0, prep: mago && P.lista === 'Mago' ? 0 : P.maxPrep };
}
const pill = (attr, v, on, extra = '') => `<button type="button" class="cc-pill ${on ? 'on' : ''}" ${attr}="${esc(v)}" aria-pressed="${on}" ${extra}>${esc(v.split('|').pop())}</button>`;
function eleccionHtml(e) {
  const [txt, lista] = LISTAS_HERRAMIENTA[e.lista], sel = ELEC[e.id] || [], lleno = sel.length >= e.n;
  return `<div class="cc-elige ${lleno ? 'ok' : 'falta'}"><p>${lleno ? icon('sparkles') : `<b class="cc-num">${e.n - sel.length}</b>`}<b>${esc(e.de)}</b>: ${e.soloEquipo ? 'tu equipo incluye' : 'competencia con'} ${e.n === 1 ? esc(txt) : `${e.n} (${esc(txt)})`}. ${lleno ? '' : 'Elige:'}</p>
    <div class="cc-pills">${lista.map(v => pill('data-herr', `${e.id}|${v}`, sel.includes(v), !sel.includes(v) && lleno && e.n > 1 ? 'disabled' : '')).join('')}</div></div>`;
}
function opcionesHtml(ops, actual, attr, extra = '') {
  const txt = o => { const it = o.objetos.map(x => typeof x === 'string' ? x : Array.isArray(x) ? `${x[1]} × ${x[0]}` : `${LISTAS_HERRAMIENTA[x.elige][0]} (el que elijas)`); return it.length ? `${joinY(it)} y ${o.po} po` : `${o.po} po para comprar tu equipo`; };
  return `<div class="cc-opciones" role="radiogroup">${ops.map(o => `<button type="button" role="radio" class="cc-opcion ${actual === o.k ? 'on' : ''}" aria-checked="${actual === o.k}" ${attr}="${o.k}"><b>Opción ${o.k}</b><span>${esc(txt(o))}</span></button>`).join('')}${extra}</div>`;
}
function pintarClaseExtra(d) {
  const c = extraClase(d.clase), e = entrenamientoDe(d), elecs = eleccionesHerramienta(d).filter(x => x.id !== 't');
  let h = `<dl class="cc-dl cc-entreno"><div><dt>Entrenamiento</dt><dd>${esc([e.armas, e.armaduras].filter(Boolean).join('. '))}.</dd></div>
    ${c?.herramientas.some(x => typeof x === 'string') ? `<div><dt>Herramientas</dt><dd>${esc(c.herramientas.filter(x => typeof x === 'string').join(', '))}</dd></div>` : ''}</dl>`;
  h += elecs.map(eleccionHtml).join('');
  const cupo = cupoMaestrias(d);
  if (cupo) { const lleva = CREANDO ? equipoInicial(d, { claseOpcion: EQ.clase, trasfondoOpcion: EQ.trasfondo, elecciones: ELEC }).items.map(([n]) => n) : (d.equipo?.objetos || []).filter(o => o.arma).map(o => o.nombre);
    h += maestriasHtml(d, MAES, { cupo, destacar: lleva }); }
  const cupoMan = cupoManiobras(d);
  if (cupoMan) h += `<h4 class="cc-sub">Maestro del combate</h4>${maniobrasHtml(MAN, { attr: 'data-man', cupo: cupoMan })}`;
  if (CREANDO && c) {
    const t = c.tirada, oro = `<button type="button" role="radio" class="cc-opcion ${EQ.clase === 'oro' ? 'on' : ''}" aria-checked="${EQ.clase === 'oro'}" data-eqclase="oro"><b>Tirar el oro</b><span>${t[0]}d${t[1]}${t[2] > 1 ? ` × ${t[2]}` : ''} po (variante de 2014)${EQ.oro ? `: <strong>${EQ.oro.total} po</strong> (${EQ.oro.dados.join(' + ')})` : ''}</span></button>`;
    h += `<h4 class="cc-sub">Equipo inicial de ${esc(d.clase)}</h4>${opcionesHtml(c.opciones, EQ.clase, 'data-eqclase', oro)}
      ${EQ.clase === 'oro' ? `<button type="button" class="${EQ.oro ? 'ghost' : 'primary'} cc-tirar" data-tiraroro>${gi('dados')}${EQ.oro ? 'Volver a tirar' : 'Tirar oro inicial'}</button>` : ''}`;
  } else if (!CREANDO) h += '<p class="hint">El equipo inicial se reparte al crear el personaje. Ahora lo llevas en el Inventario.</p>';
  $('#f_claseExtra').innerHTML = h;
}
function pintarOrigenExtra(d) {
  const t = extraTrasfondo(d.trasfondo), e = eleccionesHerramienta(d).find(x => x.id === 't');
  let h = '';
  if (d.trasfondo) {
    h += `<section class="fsec"><h3>Herramientas e idiomas</h3>`;
    if (e) h += eleccionHtml(e);
    const auto = herramientasDe(d, ELEC), extra = HERR.filter(x => !auto.includes(x));
    h += `<p class="hint">Herramientas: ${auto.length || extra.length ? esc(joinY([...auto, ...extra])) : 'ninguna'}.${extra.length ? ' <button type="button" class="linkish" data-herrlimpia>Quitar las que no vienen de tu clase ni trasfondo</button>' : ''}</p>`;
    const lleno = IDI.length >= 2;
    h += `<div class="cc-elige ${lleno || !CREANDO ? 'ok' : 'falta'}"><p>${lleno || !CREANDO ? icon('sparkles') : `<b class="cc-num">${2 - IDI.length}</b>`}<b>Idiomas</b>: común y dos más de la lista estándar.</p>
      <div class="cc-pills"><span class="cc-pill on fija">Común</span>${IDIOMAS.filter(x => x !== 'Común').map(v => pill('data-idioma', v, IDI.includes(v))).join('')}</div>
      <details class="cc-raros" ${IDI.some(x => IDIOMAS_RAROS.includes(x)) ? 'open' : ''}><summary>Idiomas raros (si tu DJ lo permite)</summary><div class="cc-pills">${IDIOMAS_RAROS.map(v => pill('data-idioma', v, IDI.includes(v))).join('')}</div></details></div></section>`;
    if (CREANDO && t) h += `<section class="fsec"><h3>Equipo de ${esc(d.trasfondo)}</h3>${opcionesHtml(t.opciones, EQ.trasfondo, 'data-eqtras')}</section>`;
  }
  $('#f_origenExtra').innerHTML = h;
}
function chooser(key, n, filtro, titulo) {
  const all = allSpellItems(S.db), sel = CONJ[key] ||= [], otros = new Set(Object.entries(CONJ).filter(([k]) => k !== key).flatMap(([, v]) => v)), q = norm(CQ[key] || ''), lleno = sel.length >= n;
  const items = all.filter(it => !otros.has(it.id) && filtro(it) && (!q || norm(it.es).includes(q) || norm(it.en || '').includes(q)))
    .sort((a, b) => (sel.includes(b.id) - sel.includes(a.id)) || a.l - b.l || a.es.localeCompare(b.es, 'es'));
  return `<section class="fsec cc-conj"><div class="ch-head"><h3>${titulo}</h3><b class="ch-count ${lleno ? 'ok' : ''}">${sel.length} de ${n}</b></div>
    <input type="search" data-ccq="${key}" placeholder="Buscar" value="${esc(CQ[key] || '')}" aria-label="Buscar conjuro">
    <div class="cc-lista">${items.length ? items.map(it => { const on = sel.includes(it.id);
      return `<div class="pitem ${on ? 'on' : ''}"><label class="pmain"><input type="checkbox" data-ccchk="${key}" value="${esc(it.id)}" ${on ? 'checked' : ''} ${!on && lleno ? 'disabled' : ''}>
        <span class="pl">${it.l || 'T'}</span><span><span class="pn">${esc(it.es)}</span><span class="pm">${itemMeta(it)}</span></span></label>
        <button type="button" class="pview" data-ccver="${esc(it.id)}">Ver</button></div>`; }).join('') : '<p class="pempty">No hay conjuros que encajen.</p>'}</div></section>`;
}
// Conjuros de las dotes (Iniciado en la magia, Influencia feérica…): los fijos se añaden solos y el resto se eligen aquí
function conjurosDotesHtml(d) {
  let h = '';
  for (const dc of dotesConConjuros(d, lib().trasfondos)) {
    for (const e of dc.elegir) h += chooser(`dote:${dc.clave}:${e.k}`, e.n, filtroEleccion(e), `${dc.fuente}: ${e.nivel ? `conjuro de nivel ${e.nivel}` : 'trucos'} (${e.n})`);
    if (dc.fijos.length) h += `<p class="hint">${esc(dc.fuente)} te da siempre preparado: ${esc(joinY(dc.fijos))}.</p>`;
  }
  return h ? `<h4 class="cc-sub">Conjuros de tus dotes</h4>${h}<p class="hint">Quedan siempre preparados; el de nivel 1 lo lanzas una vez sin espacio por descanso largo.</p>` : '';
}
function pintarConj(d) {
  const c = cupoConjuros(d), P = c.P;
  if (!CREANDO) { $('#f_conj').innerHTML = `<div class="cc-aviso">Tus conjuros se gestionan en el libro de la hoja, con «Editar conjuros». ${P.c ? `Preparas ${P.maxPrep} y sabes ${P.maxCant} trucos.` : ''}</div>`; return; }
  if (!P.c) { $('#f_conj').innerHTML = `<div class="cc-aviso">${esc(d.clase)} no lanza conjuros a nivel ${d.nivel}. Si tu especie te da alguno, añádelo desde la hoja: se marca como siempre preparado.</div>${conjurosDotesHtml(d)}`; return; }
  const lista = P.lista;
  let h = `<div class="cc-aviso ok">Lanzas conjuros de ${esc(lista.toLowerCase())} con ${esc(ABIL_NAME[P.apKey])}: CD ${P.cd}, ataque ${sgn(P.atk)}. Espacios hasta nivel ${P.maxSlot}.</div>`;
  if (c.trucos) h += chooser('trucos', c.trucos, it => it.l === 0 && listFilter(it, lista), `Trucos (${c.trucos})`);
  if (c.libro) h += chooser('libro', c.libro, it => it.l > 0 && it.l <= P.maxSlot && listFilter(it, 'Mago'), `Libro de conjuros (${c.libro})`)
    + `<p class="hint">De ellos preparas ${P.maxPrep}: los primeros que elijas quedan preparados, y los cambias en la hoja tras un descanso largo.</p>`;
  for (const a of trucosAlternativa(d)) h += chooser('estilo', c.estilo, it => it.l === 0 && listFilter(it, a.lista), `Trucos de ${a.nombre} (${c.estilo})`)
    + `<p class="hint">Cuentan como conjuros de ${esc(d.clase.toLowerCase())} y no ocupan preparados.</p>`;
  if (c.prep) h += chooser('prep', c.prep, it => it.l > 0 && it.l <= P.maxSlot && listFilter(it, lista), `Conjuros preparados (${c.prep})`);
  const auto = conjurosPendientes(S.db, d, compendio()).map(x => x.x.es);
  if (auto.length) h += `<p class="hint">Siempre preparados por tu clase o subclase: ${esc(joinY(auto))}.</p>`;
  h += conjurosDotesHtml(d);
  $('#f_conj').innerHTML = h;
}

function pintarPasos(d) {
  const P = pendientes(d), t = temaDe(d);
  $('#charPasos').innerHTML = PASOS.map(([k, n], i) => {
    const pend = P[k].length, visto = VISTOS.has(i) || !CREANDO, on = i === PASO;
    return `<button type="button" role="tab" data-irpaso="${i}" aria-selected="${on}" class="${visto && !pend && !on ? 'hecho' : ''} ${visto && pend ? 'pend' : ''}" title="${esc(P[k].join(' ') || n)}">
      <span class="cc-n">${gi(k === 'clase' ? t.clase || 'libro' : ICO_PASO[k])}</span><span class="cc-l">${n}</span>${visto && pend ? `<b class="cc-badge" aria-label="${pend} por revisar">${pend}</b>` : ''}</button>`;
  }).join('') + `<i class="cc-prog" style="--p:${PASO / (PASOS.length - 1)}" aria-hidden="true"></i>`;
  const ultimo = PASO === PASOS.length - 1;
  $('#charBack').hidden = !CREANDO || PASO === 0;
  $('#charNext').hidden = !CREANDO || ultimo;
  $('#charNext').innerHTML = CREANDO && !ultimo ? `${esc(PASOS[PASO + 1][1])}${icon('chevron', 'cc-sig')}` : '';
  $('#charSave').hidden = CREANDO && !ultimo;
  $('#charSave').textContent = CREANDO ? 'Crear personaje' : 'Guardar';
  const todos = Object.entries(P).flatMap(([k, v]) => v.map(x => [k, x]));
  $('#f_pend').innerHTML = todos.length ? `<div class="cc-aviso warn"><b>Por revisar</b><ul>${todos.map(([k, x]) => `<li><button type="button" class="linkish" data-irpaso="${PASOS.findIndex(p => p[0] === k)}">${esc(PASOS.find(p => p[0] === k)[1])}</button>: ${esc(x)}</li>`).join('')}</ul></div>` : '<div class="cc-aviso ok"><b>Todo en orden.</b> Tu personaje cumple las reglas de creación.</div>';
}

function pintarClases(d) {
  $('#f_clases').innerHTML = Object.keys(CLASES).map(n => {
    const [h, s, ico] = TEMAS.clase[n] || [40, 50, 'libro'], on = n === d.clase;
    return `<button type="button" class="cc-clase ${on ? 'on' : ''}" role="radio" aria-checked="${on}" data-clase="${esc(n)}" style="--sh:${h};--ss:${s}%">
      <span class="cc-emb">${gi(ico)}</span><b>${esc(n)}</b><small>${esc(lineaClase(n))}</small></button>`;
  }).join('') + `<p class="hint cc-verclase"><button type="button" class="linkish" data-verclase="#f_clase">Ver qué aprende ${esc(d.clase)} nivel a nivel</button></p>`;
}

function pintarOrigen(d) {
  const e = norm(d.especie || ''), le = lib().especies.find(x => norm(x.nombre) === e), be = Object.entries(ESPECIE_BASE).find(([k]) => norm(k) === e.split(/[\s(]/)[0]);
  const rasgos = le ? le.rasgos.map(r => r.nombre).join(' · ') : be?.[1];
  $('#i_especie').innerHTML = d.especie ? (rasgos ? `<p>${esc(rasgos)}</p>` : '<p>Especie propia: anota sus rasgos en Detalles.</p>') + '<p class="cc-nota">En 2024 la especie no suma a las características: los aumentos vienen del trasfondo.</p>' : '';
  const perm = permitidas(d), tras = habilidadesTrasfondo(d), dote = dotesDe({ ...d, dotes: [] }, lib().trasfondos)[0];
  $('#i_trasfondo').innerHTML = d.trasfondo ? `<dl class="cc-dl">
    <div><dt>Características</dt><dd>${perm.length ? esc(perm.map(k => ABIL_NAME[k]).join(', ')) : 'Tres a tu elección'}</dd></div>
    <div><dt>Dote de origen</dt><dd>${dote ? esc(dote.detalle ? `${dote.nombre} (${dote.detalle})` : dote.nombre) : 'Anótala en Dotes'}</dd></div>
    <div><dt>Habilidades</dt><dd>${tras.length ? esc(joinY(tras.map(k => NOMBRE_HAB[k]))) : 'Márcalas en Competencias'}</dd></div>
    ${(x => x ? `<div><dt>Herramienta</dt><dd>${esc(typeof x.herramienta === 'string' ? x.herramienta : `${LISTAS_HERRAMIENTA[x.herramienta.elige][0]} (elígelo abajo)`)}</dd></div>` : '')(extraTrasfondo(d.trasfondo))}</dl>` : '';
}

function pintarCar(d) {
  const perm = permitidas(d), bonos = limpiarBonos(CAR.bonos, perm), fin = conBonos(CAR.base, bonos), P = perfil(d), prio = prioridad(d.clase)[0];
  const sinTirar = CAR.metodo === 'tiradas' && !CAR.tiradas.length, cambia = CAR.metodo === 'matriz' || CAR.metodo === 'tiradas';
  const resta = PUNTOS - costeCompra(CAR.base);
  let h = `<div class="seg cc-metodos" role="radiogroup" aria-label="Cómo generar las puntuaciones">${METODOS.map(([k, n]) => `<button type="button" role="radio" aria-checked="${CAR.metodo === k}" data-metodo="${k}">${n}</button>`).join('')}</div>
    <p class="hint">${esc(METODOS.find(m => m[0] === CAR.metodo)[2])}${CAR.heredado && CAR.metodo === 'libre' ? ' Son las puntuaciones que ya tiene tu personaje.' : ''}</p>`;
  if (CAR.metodo === 'tiradas') h += `<div class="cc-tiradas">${CAR.dados ? CAR.dados.map((t, i) => `<span class="cc-tirada" style="--i:${i}">${t.dados.map((v, j) => `<i class="${j === t.quitado ? 'fuera' : ''}">${v}</i>`).join('')}<b>${t.total}</b></span>`).join('') : CAR.tiradas.map((t, i) => `<span class="cc-tirada" style="--i:${i}"><b>${t}</b></span>`).join('')}
    <button type="button" class="${sinTirar ? 'primary' : 'ghost'} cc-tirar" data-cctirar>${gi('dados')}${sinTirar ? 'Tirar 4d6 seis veces' : 'Volver a tirar'}</button></div>`;
  if (CAR.metodo === 'compra') h += `<div class="cc-puntos ${resta < 0 ? 'mal' : resta === 0 ? 'ok' : ''}"><span>${resta < 0 ? `Te pasas en <b>${-resta}</b>` : `Quedan <b>${resta}</b> de ${PUNTOS}`} puntos</span><i style="--p:${clamp((PUNTOS - resta) / PUNTOS, 0, 1)}"></i></div>`;
  h += `<div class="cc-abil">${ABILS.map(([k, n]) => {
    const b = CAR.base[k], mod = modOf(fin[k]);
    const val = CAR.metodo === 'compra' ? `<div class="cc-pm"><button type="button" data-pm="${k}|-1" aria-label="Bajar ${n}" ${b <= 8 ? 'disabled' : ''}>−</button><b>${b}</b><button type="button" data-pm="${k}|1" aria-label="Subir ${n}" ${b >= 15 || (COSTE[b + 1] - COSTE[b]) > resta ? 'disabled' : ''}>+</button></div><small class="cc-coste">coste ${COSTE[b] ?? '—'}</small>`
      : CAR.metodo === 'libre' ? `<input type="number" inputmode="numeric" min="1" max="30" data-libre="${k}" value="${b}" aria-label="${n}">`
      : `<button type="button" class="cc-val" data-swap="${k}" aria-pressed="${CAR.sel === k}" aria-label="${n}: ${sinTirar ? 'sin tirar' : b}. Toca para intercambiar" ${sinTirar ? 'disabled' : ''}>${sinTirar ? '?' : b}</button>`;
    return `<div class="cc-ab ${k === P.apKey || k === prio ? 'key' : ''} ${CAR.sel === k ? 'sel' : ''}" data-ab="${k}"><span class="cc-abn">${n}</span>${val}
      <span class="cc-fin">${bonos[k] ? `<em class="cc-bono">+${bonos[k]}</em>` : ''}<b id="t_${k}">${sinTirar ? '—' : fin[k]}</b><small id="m_${k}">${sinTirar ? '' : sgn(mod)}</small></span></div>`;
  }).join('')}</div>`;
  if (cambia && !sinTirar) h += `<p class="hint">Toca dos características para intercambiar sus valores. <button type="button" class="linkish" data-ordenar>Ordenar según ${esc(d.clase)}</button></p>`;
  if (!d.trasfondo) h += `<div class="cc-bonos"><h4>Aumentos del trasfondo</h4><p class="hint">Elige un trasfondo en <button type="button" class="linkish" data-irpaso="1">Origen</button> para repartir +2 y +1, o +1 a tres características.</p></div>`;
  else {
    const opts = perm.length ? perm : ABILS.map(([k]) => k), st = estadoBonos(CAR.bonos, perm), dos = Object.keys(bonos).find(k => bonos[k] === 2);
    const fila = (valor, sel, extra = '') => opts.map(k => `<button type="button" class="cc-pill ${sel(k) ? 'on' : ''}" data-bono="${k}|${valor}" aria-pressed="${sel(k)}" ${extra && extra(k) ? 'disabled' : ''}>${AB_CORTA[k]}${fin[k] >= 20 && sel(k) ? ' (máx.)' : ''}</button>`).join('');
    h += `<div class="cc-bonos ${st.completo ? 'ok' : CAR.heredado ? '' : 'falta'}"><h4>Aumentos de ${esc(d.trasfondo)}${perm.length ? `: ${esc(perm.map(k => ABIL_NAME[k]).join(', '))}` : ''}</h4>
      <div class="seg sm" role="radiogroup" aria-label="Reparto"><button type="button" role="radio" aria-checked="${CAR.modo === '21'}" data-ccmodo="21">+2 y +1</button><button type="button" role="radio" aria-checked="${CAR.modo === '111'}" data-ccmodo="111">+1, +1 y +1</button></div>
      ${CAR.modo === '21' ? `<div class="cc-fila"><span>+2</span>${fila(2, k => bonos[k] === 2)}</div><div class="cc-fila"><span>+1</span>${fila(1, k => bonos[k] === 1, k => k === dos)}</div>`
        : `<div class="cc-fila"><span>+1</span>${fila(1, k => bonos[k] === 1)}</div>`}
      <p class="hint">${st.completo ? `${icon('sparkles')} Listo. Ninguna puntuación puede pasar de 20.` : CAR.heredado ? 'Si tus puntuaciones ya incluyen estos aumentos, déjalo así.' : `Te ${st.faltan === 1 ? 'queda' : 'quedan'} ${st.faltan} ${st.faltan === 1 ? 'punto' : 'puntos'} por repartir.`}
        <button type="button" class="linkish" data-bonosug>Sugerir para ${esc(d.clase)}</button></p></div>`;
  }
  $('#f_car').innerHTML = h;
}

function pintarComp(draft) {
  const base = new Set(CLASES_INFO[draft.clase]?.salv || []), comp = salvacionesCompetentes(draft), r = repartoHabilidades(draft);
  const claseLista = new Set(r.clase.faltan ? r.clase.lista : []), extraLista = new Set(r.extra.faltan && !r.clase.faltan ? r.extra.fuentes.flatMap(f => f.lista) : []);
  const ETQ = { trasfondo: 'trasfondo', clase: draft.clase, extra: r.extra.fuentes.length ? 'especie o dote' : 'extra' };
  const boton = ([k, n]) => {
    const nv = HAB[k] || 0, f = r.fuente[k], elegible = !nv && (claseLista.has(k) || extraLista.has(k)), enLista = r.clase.lista.includes(k);
    const etq = nv === 2 ? `pericia · ${ETQ[f] || ''}` : f ? ETQ[f] : enLista ? `de ${draft.clase}` : '';
    return `<button type="button" class="comp-h n${nv} ${f ? 'src-' + f : ''} ${elegible ? 'elegible' : ''}" data-hab="${k}" aria-label="${esc(n)}: ${['sin competencia', 'competencia', 'pericia'][nv]}${f === 'trasfondo' ? ', de tu trasfondo' : ''}"><i class="cr-m n${nv}" aria-hidden="true"></i><span>${esc(n)}${etq ? `<small>${esc(etq)}</small>` : ''}</span><b>${sgn(bonoHabilidad(draft, k))}</b></button>`;
  };
  $('#f_comp').innerHTML = ABILS.map(([ab, nombre]) => {
    const on = comp.has(ab), salv = base.has(ab) ? `<span class="comp-s fija" title="De tu clase">Salvación</span>`
      : `<button type="button" class="comp-s ${on ? 'on' : ''}" data-salv="${ab}" aria-pressed="${on}" title="Competencia extra (dote o rasgo)">Salvación</button>`;
    const habs = HABILIDADES.filter(h => h[2] === ab);
    return `<section class="cc-grupo ${base.has(ab) ? 'salv' : ''}"><header><b>${nombre}</b><em>${draft.stats[ab]} · ${sgn(modOf(draft.stats[ab]))}</em>${salv}</header>${habs.map(boton).join('') || '<p class="cc-sinhab">Sin habilidades: solo su salvación.</p>'}</section>`;
  }).join('');
  const av = [];
  if (r.trasfondo.length) av.push(['ok', `<b>${esc(draft.trasfondo)}</b> te da ${esc(joinY(r.trasfondo.map(k => NOMBRE_HAB[k])))}.${r.faltanTrasfondo.length ? ' Márcalas: vienen con tu trasfondo.' : ''}`]);
  else if (!draft.trasfondo) av.push(['', `Sin trasfondo todavía: elígelo en <button type="button" class="linkish" data-irpaso="1">Origen</button> y sus dos habilidades se marcan solas.`]);
  if (r.clase.n) av.push([r.clase.faltan ? 'falta' : 'ok', r.clase.faltan ? `<b class="cc-num">${r.clase.faltan}</b> Te ${r.clase.faltan === 1 ? 'queda' : 'quedan'} ${r.clase.faltan} ${r.clase.faltan === 1 ? 'habilidad' : 'habilidades'} de <b>${esc(draft.clase)}</b> por elegir entre las resaltadas.` : `<b>${esc(draft.clase)}</b>: ${r.clase.n} de ${r.clase.n} elegidas.`]);
  if (r.extra.n) av.push([r.extra.faltan ? 'falta' : 'ok', `${r.extra.faltan ? `<b class="cc-num">${r.extra.faltan}</b>` : ''}${r.extra.fuentes.map((f, i) => `<b>${esc(f.nombre)}</b>: ${f.fijas ? `${f.lista.length === HABILIDADES.length ? 'todas' : esc(f.lista.map(k => NOMBRE_HAB[k]).join(' y '))}` : `${f.n} ${f.n === 1 ? 'habilidad' : 'habilidades'}${f.lista.length < HABILIDADES.length ? ` (${esc(f.lista.map(k => NOMBRE_HAB[k]).join(', '))})` : ' a tu elección'}`}${f.pericia ? ', con pericia' : ''}.${r.extra.faltan && !f.fijas && faltanDe(f, HAB) ? ` <button type="button" class="linkish" data-elegirhab="${i}">Elegir</button>` : ''}`).join(' ')}${r.extra.faltan ? ` Te ${r.extra.faltan === 1 ? 'queda' : 'quedan'} ${r.extra.faltan}.` : ''}`]);
  if (r.pericia.n) av.push([r.pericia.faltan ? 'falta' : r.pericia.sobran ? 'warn' : 'ok', r.pericia.faltan ? `<b class="cc-num">${r.pericia.faltan}</b> Pericia: toca otra vez ${r.pericia.faltan === 1 ? 'una habilidad' : `${r.pericia.faltan} habilidades`} en las que ya seas competente.` : `Pericias de tu clase: ${r.pericia.llevas} de ${r.pericia.n}.`]);
  else if (r.pericia.sobran) av.push(['warn', `Llevas ${r.pericia.sobran} ${r.pericia.sobran === 1 ? 'pericia' : 'pericias'} que no da tu clase a este nivel. Déjalas si vienen de una dote o rasgo.`]);
  if (r.extra.sobran) av.push(['warn', `Llevas ${r.extra.sobran} ${r.extra.sobran === 1 ? 'competencia' : 'competencias'} de más para tu clase y trasfondo. Déjalas si vienen de una dote o rasgo.`]);
  $('#h_comp').innerHTML = av.map(([c, t]) => `<div class="cc-aviso ${c}">${t}</div>`).join('');
}

function pintarDotes(d) {
  const origen = dotesDe({ ...d, dotes: [] }, lib().trasfondos)[0];
  $('#f_dotes').innerHTML = (origen ? `<span class="dote-chip fija" title="Dote de origen de tu trasfondo">${esc(origen.detalle ? `${origen.nombre} (${origen.detalle})` : origen.nombre)}<small>${esc(d.trasfondo)}</small></span>` : '')
    + DOTES.map((n, i) => `<button type="button" class="dote-chip ${estiloDe(n, lib().dotes) || esAlternativa(n) ? 'estilo' : ''}" data-dotedel="${i}" aria-label="Quitar la dote ${esc(n)}">${esc(n)}${estiloDe(n, lib().dotes) || esAlternativa(n) ? '<small>estilo</small>' : ''}<span aria-hidden="true">×</span></button>`).join('')
    || '<span class="hint">Sin dotes todavía.</span>';
  const av = [], m = mejorasHasta(d);
  if (!d.trasfondo) av.push(['', 'Tu dote de origen depende del trasfondo: elígelo en <button type="button" class="linkish" data-irpaso="1">Origen</button>.']);
  else if (origen) av.push(['ok', `<b>${esc(d.trasfondo)}</b> te da <b>${esc(origen.nombre)}</b>. No hace falta añadirla.`]);
  const est = estadoEstilo(d, lib().dotes);
  if (est.puede) av.push([est.faltan ? 'falta' : 'ok', `${est.faltan ? `<b class="cc-num">${est.faltan}</b> ` : ''}<b>${esc(joinY(est.fuentes))}</b> ${est.total > 1 ? `te dan ${est.total} estilos de combate` : 'tiene el rasgo Estilo de combate'}: ${est.faltan ? `elige ${est.faltan === 1 ? 'una dote' : `${est.faltan} dotes`} de estilo de combate.` : 'ya lo tienes elegido.'} <button type="button" class="linkish" data-elegirestilo>${est.faltan ? 'Elegir estilo' : 'Cambiar de estilo'}</button>`]);
  for (const c of clasesDe(d).filter(c => ORDENES[c.clase])) {
    const def = ORDENES[c.clase], sel = d.ordenes?.[c.clase];
    av.push([sel ? 'ok' : 'falta', `${sel ? '' : '<b class="cc-num">1</b> '}<b>${esc(c.clase)}</b> · ${esc(def.rasgo)}: ${def.opciones.map(o => `<button type="button" class="cc-pill ${sel === o.nombre ? 'on' : ''}" data-orden="${esc(c.clase)}|${esc(o.nombre)}" aria-pressed="${sel === o.nombre}" title="${esc(o.texto)}">${esc(o.nombre)}</button>`).join(' ')}${sel ? ` <small>${esc(def.opciones.find(o => o.nombre === sel).texto)}</small>` : ''}`]);
  }
  for (const c of clasesDe(d).filter(c => VARIANTES[c.clase] && c.nivel >= VARIANTES[c.clase].nivel)) {
    const def = VARIANTES[c.clase], sel = d.variantes?.[c.clase];
    av.push([sel ? 'ok' : 'falta', `${sel ? '' : '<b class="cc-num">1</b> '}<b>${esc(c.clase)}</b> · ${esc(def.rasgo)}: ${def.opciones.map(o => `<button type="button" class="cc-pill ${sel === o.nombre ? 'on' : ''}" data-variante="${esc(c.clase)}|${esc(o.nombre)}" aria-pressed="${sel === o.nombre}" title="${esc(o.texto)}">${esc(o.nombre)}</button>`).join(' ')}${sel ? ` <small>${esc(def.opciones.find(o => o.nombre === sel).texto)}</small>` : ''}`]);
  }
  if (versatilPendiente(d, lib().dotes)) av.push(['falta', '<b class="cc-num">1</b> <b>Humano</b> (Versátil): elige una dote de origen más. No puede repetir la de tu trasfondo.']);
  if (m.asi) av.push(['', `A nivel ${m.nivel} tu clase te ha dado ${m.asi} ${m.asi === 1 ? 'mejora' : 'mejoras'} de característica${m.epico ? ` y ${m.epico === 1 ? 'un don épico' : `${m.epico} dones épicos`}` : ''}. En cada una eliges una dote general o subir características (+2 o +1 y +1): si subiste características, súmalas en <button type="button" class="linkish" data-irpaso="2">Características</button> con «A mano».`]);
  $('#h_dotes').innerHTML = av.map(([c, t]) => `<div class="cc-aviso ${c}">${t}</div>`).join('');
}

function pintarHero(d, first) {
  const t = temaDe(d), sub = [d.subclase ? `${d.clase} · ${d.subclase}` : d.clase, `nivel ${nivelTotal(d)}`, d.especie, d.trasfondo].filter(Boolean).join(' · ');
  $('#charSub').textContent = d.nombre && CREANDO ? `${d.nombre}: ${sub}` : sub;
  const clave = `${t.h}|${t.s}|${t.icono}`, dlg = charDlg();
  for (const [k, v] of Object.entries({ '--h': t.h, '--s': t.s + '%', ...paleta(t) })) dlg.style.setProperty('--cc' + k.slice(1), v);
  if (clave === TEMA) return;
  const sello = $('#charSello'); sello.innerHTML = `<span class="cc-anillo" aria-hidden="true"></span><span class="cc-anillo b" aria-hidden="true"></span>${gi(t.icono)}`;
  if (!first && TEMA && !reducedMotion()) { sello.classList.remove('fx-sello'); void sello.offsetWidth; sello.classList.add('fx-sello');
    requestAnimationFrame(() => burstFrom(sello, { color: hex(t.h, Math.min(90, t.s + 10), 62), n: 26, speed: 2.6, up: 1.2, life: 900, size: 2 })); }
  TEMA = clave;
}

function readForm() {
  const base = formId ? clone(S.db.chars.find(x => x.id === formId)) : blankChar();
  const v = id => $(id).value.trim();
  Object.assign(base, { nombre: v('#f_nombre'), especie: v('#f_especie'), trasfondo: v('#f_trasfondo'), clase: v('#f_clase'), subclase: (parseInt(v('#f_nivel'), 10) || 1) >= 3 ? v('#f_subclase') : '',
    nivel: clamp(parseInt(v('#f_nivel'), 10) || 1, 1, 20), aptitud: v('#f_aptitud'), extraCD: parseInt(v('#f_extraCD'), 10) || 0, extraAtaque: parseInt(v('#f_extraAtaque'), 10) || 0,
    espaciosManuales: $('#f_manual').checked, lema: $('#f_lema').value.trim(), campana: v('#f_campana'), notas: $('#f_notas').value.trim(),
    multiclase: MC.map(m => ({ ...m, subclase: (parseInt(m.nivel, 10) || 1) >= 3 ? m.subclase : '' })), dotes: [...DOTES], ordenes: { ...ORD }, variantes: { ...VAR }, maniobras: [...MAN], habilidades: { ...HAB }, salvacionesExtra: [...SALV] });
  base.herramientas = [...new Set([...herramientasDe(base, ELEC), ...HERR])];
  base.idiomas = ['Común', ...IDI]; base.maestrias = [...MAES];
  const pgm = parseInt($('#f_pgmax')?.value, 10); base.vida = { ...(base.vida || {}), maxManual: pgm > 0 ? pgm : null };
  const bonos = limpiarBonos(CAR.bonos, permitidas(base)), sinTirar = CAR.metodo === 'tiradas' && !CAR.tiradas.length;
  base.stats = conBonos(sinTirar ? {} : CAR.base, bonos);
  base.creacion = sinTirar ? null : { metodo: CAR.metodo, base: { ...CAR.base }, bonos, tiradas: [...CAR.tiradas] };
  base.espacios = {}; for (let L = 1; L <= 9; L++) { const n = clamp(parseInt(v('#f_e' + L), 10) || 0, 0, 9); if (n) base.espacios[L] = n; }
  return base;
}
function pintarMulticlase() {
  const principal = $('#f_clase').value;
  $('#f_mc').innerHTML = MC.map((m, i) => {
    const opts = Object.keys(CLASES).filter(k => k !== principal && (k === m.clase || !MC.some(x => x.clase === k)));
    return `<div class="frow mc-row"><div class="f"><span>Clase ${i + 2}</span>${campoClase(`data-mc="${i}|clase" aria-label="Clase ${i + 2}"`, m.clase, opts)}<span class="hint"><button type="button" class="linkish" data-verclase="${esc(m.clase)}">Ver qué aprende</button></span></div>
      <div class="f">Subclase<span class="cc-subbloq" data-mcsublock="${i}">Se elige al llegar a nivel 3</span><span data-mcsub="${i}">${campoSubclase(m.clase, m.subclase || '', `data-mc="${i}|subclase" aria-label="Subclase de ${esc(m.clase)}"`)}</span></div>
      <div class="f">Nivel<div class="stepper"><button type="button" data-mcstep="${i}|-1" aria-label="Bajar nivel de ${esc(m.clase)}">−</button><input data-mc="${i}|nivel" type="number" inputmode="numeric" min="1" max="19" value="${m.nivel}" aria-label="Nivel de ${esc(m.clase)}"><button type="button" data-mcstep="${i}|1" aria-label="Subir nivel de ${esc(m.clase)}">+</button></div></div>
      <button type="button" class="iconbtn mc-del" data-mcdel="${i}" aria-label="Quitar ${esc(m.clase)}">×</button></div>`;
  }).join('');
  $('#f_mcAdd').hidden = MC.length >= 3;
}
async function anadirDote() {
  const d = readForm(), n = await elegirDote(d, { titulo: 'Añadir una dote', grupoInicial: versatilPendiente(d, lib().dotes) ? 'Dotes de origen' : '' }); if (!n) return;
  if (doteRepetida(d, n, lib().dotes, lib().trasfondos)) { toast(`Ya tienes <b>${esc(n)}</b>. Esa dote no se puede elegir dos veces.`); return; }
  DOTES.push(n); sync(false);
}
function slotText(P) {
  if (P.pact && !Object.keys(P.slots).some(L => +L !== P.pact.level)) return `${P.pact.n} ${P.pact.n > 1 ? 'espacios' : 'espacio'} de pacto de nivel ${P.pact.level}, que vuelven con un descanso corto.`;
  const parts = Object.keys(P.slots).map(Number).sort((a, b) => a - b).map(L => `${P.slots[L]} de nivel ${L}`);
  return parts.length ? `Espacios: ${joinY(parts)}.` : 'Sin espacios de conjuro.';
}
const FOCO = ['data-maes', 'data-man', 'data-variante', 'data-herr', 'data-idioma', 'data-eqclase', 'data-eqtras', 'data-ccchk', 'data-hab', 'data-swap', 'data-pm', 'data-metodo', 'data-bono', 'data-ccmodo', 'data-salv', 'data-clase', 'data-irpaso'];
function sync(first, { sinCar = false } = {}) {
  const a = document.activeElement, attr = a && charDlg().contains(a) ? FOCO.find(k => a.hasAttribute(k)) : null, val = attr && a.getAttribute(attr);
  const clase = $('#f_clase').value, cls = CLASES[clase] || {};
  const sel = $('#f_aptitud'), keep = first ? (formId ? (S.db.chars.find(x => x.id === formId).aptitud || '') : '') : sel.value;
  const draft0 = readForm(), P0 = perfil({ ...draft0, aptitud: '' }), autoAp = P0.c ? P0.c.ap : '';
  sel.innerHTML = `<option value="">${autoAp ? `Según la clase (${ABIL_NAME[autoAp]})` : 'Ninguna'}</option>` + ['int', 'sab', 'car'].map(k => `<option value="${k}">${ABIL_NAME[k]}</option>`).join('');
  sel.value = keep;
  const draft = readForm(), P = perfil(draft);
  const sinSub = draft.nivel < 3; $('#f_subWrap').hidden = sinSub; $('#f_subLock').hidden = !sinSub;
  MC.forEach((m, i) => { const bajo = (parseInt(m.nivel, 10) || 1) < 3, w = $(`[data-mcsub="${i}"]`), l = $(`[data-mcsublock="${i}"]`); if (w) w.hidden = bajo; if (l) l.hidden = !bajo; });
  $('#h_sub').textContent = !sinSub && cls.subCast && !P.viaSub ? `Solo ${cls.subCast.nombre} lanza conjuros.` : '';
  $('#f_slots').hidden = !$('#f_manual').checked;
  const lanza = !!cls.cast || !!(cls.subCast && cls.subCast.re.test(draft.subclase || ''));
  const enUso = draft.espaciosManuales || !!draft.aptitud || !!draft.extraCD || !!draft.extraAtaque;
  const verConj = lanza || enUso || conjAbierto;
  $('#f_secConj').hidden = !verConj; $('#f_conjOpen').hidden = verConj;
  const cs = clasesDe(draft), total = cs.reduce((n, c) => n + c.nivel, 0), exceso = draft.nivel + MC.reduce((n, m) => n + (parseInt(m.nivel, 10) || 1), 0) > 20;
  const req = requisitosMulticlase(draft);
  $('#h_mc').textContent = MC.length ? `Nivel de personaje ${total}: ${cs.map(c => `${c.clase} ${c.nivel}`).join(', ')}.${exceso ? ' El total no puede pasar de 20.' : ''}${req.length ? ` Para esta multiclase el manual pide ${req.map(r => `${r.falta} (${r.clase})`).join(', ')}.` : ''}` : '';
  $('#h_mc').classList.toggle('warn', exceso || req.length > 0);
  const L = [`Competencia ${sgn(P.pb)}.${P.apKey ? ` ${ABIL_NAME[P.apKey]} ${sgn(P.mod)}: CD ${P.cd}, ataque de conjuro ${sgn(P.atk)}.` : ''}`];
  L.push(`Características: ${ABILS.map(([k]) => `${AB_CORTA[k]} ${draft.stats[k]}`).join(', ')}.`);
  if (P.c || draft.espaciosManuales) L.push(slotText(P));
  if (P.c) L.push(`Prepara ${P.maxPrep} ${P.maxPrep === 1 ? 'conjuro' : 'conjuros'} de nivel 1+${P.c.cant ? ` y sabe ${P.maxCant} trucos` : ''}.`);
  const ras = reglas(draft).map(r => r.nombre); if (P.ritualLibro) ras.unshift('Adepto en rituales');
  if (ras.length) L.push(`La hoja lleva la cuenta de: ${joinY(ras)}.`);
  const notes = [];
  if (!P.c && !draft.espaciosManuales) {
    notes.push(cls.subCast ? `Un ${clase.toLowerCase()} lanza conjuros como ${cls.subCast.nombre}, desde nivel ${cls.subCast.desde}.` : `${clase} no lanza conjuros por su clase.`);
    notes.push('Puedes añadir conjuros de dotes o de especie: se marcan como siempre preparados.');
  }
  if (formId) { const oc = S.db.chars.find(x => x.id === formId), diff = levelDiff(perfil(oc), P, oc, draft); if (diff) notes.push(diff); }
  $('#f_sum').innerHTML = L.map(t => `<p>${esc(t)}</p>`).join('') + notes.map(t => `<p class="note">${esc(t)}</p>`).join('');
  pintarClases(draft); pintarOrigen(draft); pintarClaseExtra(draft); pintarOrigenExtra(draft); pintarComp(draft); pintarDotes(draft); pintarConj(draft); pintarPasos(draft); pintarHero(draft, first);
  if (!sinCar) pintarCar(draft);
  else ABILS.forEach(([k]) => { const t = $('#t_' + k), m = $('#m_' + k); if (t) t.textContent = draft.stats[k]; if (m) m.textContent = sgn(modOf(draft.stats[k])); });
  $('#f_pgmax').placeholder = String(pgMaximoCalculado({ ...draft, vida: { ...draft.vida, maxManual: null } }));
  $('#h_pgmax').textContent = `Vacío: la media de cada nivel con tu Constitución (${pgMaximoCalculado(draft)}). Escribe otro si tiras los PG al subir de nivel.`;
  if (attr && !charDlg().contains(a)) charDlg().querySelector(`[${attr}="${CSS.escape(val)}"]`)?.focus({ preventScroll: true });
  if (!first) revisarFuentes(draft);
}
// Competencias que da algo recién elegido (dote Habilidoso del trasfondo, subclase, multiclase…): se preguntan al momento
const fuentesConClave = d => { const m = new Map(); return fuentesExtra(d).map(f => { const k = (m.get(f.nombre) || 0) + 1; m.set(f.nombre, k); return { ...f, clave: `${f.nombre}#${k}` }; }); };
function revisarFuentes(d) {
  // Al llegar a nivel 7 (clérigo o druida) se pregunta la variante de su rasgo
  const vars = variantesPendientes(d).filter(k => !VVISTAS.has(k));
  if (vars.length) { vars.forEach(k => VVISTAS.add(k)); setTimeout(async () => {
    for (const k of vars) { const def = VARIANTES[k], v = await preguntarOpcion({ titulo: `${def.rasgo} (${k.toLowerCase()} ${def.nivel})`, texto: 'Elige cómo funciona este rasgo. Podrás cambiarlo desde Dotes.', opciones: def.opciones }); if (v) VAR = { ...VAR, [k]: v }; }
    sync(false); }, 0); }
  const nuevas = fuentesConClave(d).filter(f => !FVISTAS.has(f.clave)); if (!nuevas.length) return;
  nuevas.forEach(f => FVISTAS.add(f.clave));
  setTimeout(async () => {
    const fijas = nuevas.filter(f => f.fijas), elegir = nuevas.filter(f => !f.fijas && faltanDe(f, HAB) > 0);
    for (const f of fijas) HAB = aplicarFuente(HAB, f, []);
    if (fijas.length) toast(`${esc(joinY(fijas.map(f => f.nombre)))}: competencias marcadas.`);
    if (elegir.length) { const hab = await preguntarHabilidades(elegir, HAB, { titulo: elegir.length === 1 ? `${elegir[0].nombre.replace(/ \(dote\)$/, '')}: elige habilidades` : 'Elige tus habilidades' }); if (hab) HAB = hab; }
    if (fijas.length || elegir.length) sync(false);
  }, 0);
}
async function save() {
  const draft = readForm();
  if (!draft.nombre) { irA(1); $('#charErr').textContent = 'Falta el nombre.'; $('#w_nombre').classList.add('bad'); $('#f_nombre').focus(); return; }
  if (draft.nivel + (draft.multiclase || []).reduce((n, m) => n + (parseInt(m.nivel, 10) || 1), 0) > 20) { irA(0); $('#charErr').textContent = 'El nivel de personaje (la suma de las clases) no puede pasar de 20.'; return; }
  if (formId) {
    const oc = clone(S.db.chars.find(x => x.id === formId));
    const h = S.edit(db => { const i = db.chars.findIndex(x => x.id === formId); db.chars[i] = normChar(draft); });
    const nc = S.db.chars.find(x => x.id === formId), diff = levelDiff(perfil(oc), perfil(nc), oc, nc);
    closeSheet(charDlg()); if (charsDlg().open) renderList();
    toast(`${esc(draft.nombre)} actualizado.${diff ? ' ' + esc(diff) : ''}`, [undoBtn(S, h)]);
  } else {
    const faltan = Object.values(pendientes(draft)).flat();
    if (faltan.length && !(await confirmar({ titulo: 'Quedan cosas por elegir', texto: `${faltan.join(' ')} Puedes crearlo igualmente y completarlo luego desde «Editar».`, ok: 'Crear igualmente', cancelar: 'Seguir eligiendo' }))) return;
    const c = normChar(draft), all = allSpellItems(S.db), P = perfil(c), dotesC = dotesConConjuros(c, lib().trasfondos);
    const { items, po } = equipoInicial(c, { claseOpcion: EQ.clase, trasfondoOpcion: EQ.trasfondo, elecciones: ELEC, oroTirado: EQ.oro?.total });
    const h = S.edit(db => {
      const add = (ids, rel) => ids.forEach(id => { const it = all.find(x => x.id === id); if (!it) return; const sid = itemToSid(db, it);
        if (!c.book.some(e => e.sid === sid)) c.book.push({ sid, prep: false, always: false, gratis: '', used: false, fuente: P.listaNombre || c.clase, ...rel }); });
      add(CONJ.trucos, {}); add(CONJ.libro.slice(0, P.maxPrep), { fuente: 'Libro', prep: true }); add(CONJ.libro.slice(P.maxPrep), { fuente: 'Libro' }); add(CONJ.prep, { prep: true });
      add(CONJ.estilo, { fuente: trucosAlternativa(c)[0]?.nombre || 'Estilo de combate', always: true, prep: true });
      for (const dc of dotesC) {
        for (const e of dc.elegir) add(CONJ[`dote:${dc.clave}:${e.k}`] || [], { fuente: dc.fuente, always: true, prep: true });
        for (const nombre of dc.fijos) { const it = all.find(x => norm(x.es) === norm(nombre)); if (it) add([it.id], { fuente: dc.fuente, always: true, prep: true }); }
      }
      anadirPendientes(db, c, conjurosPendientes(db, c, compendio()));
      for (const [n, q] of items) anadirComun(c, datosObjeto(n, q));
      equipoDe(c).monedas.po += po;
      db.chars.push(c); db.activeId = c.id;
    });
    document.dispatchEvent(new CustomEvent('grimorio:creado'));
    closeSheet(charDlg()); if (charsDlg().open) closeSheet(charsDlg());
    window.scrollTo({ top: 0 });
    toast(`Grimorio de ${esc(c.nombre)} creado.`, [{ label: 'Añadir conjuros', hl: true, fn: () => onCreated?.() }, undoBtn(S, h)]);
  }
}

function cambiarClase(nueva) {
  const antes = readForm(); if (antes.clase === nueva) return;
  const r = repartoHabilidades(antes), lista = (HAB_CLASE[nueva] || [0, []])[1];
  if (CREANDO) for (const [k, f] of Object.entries(r.fuente)) if (f === 'clase' && HAB[k] === 1 && !lista.includes(k)) delete HAB[k];
  $('#f_clase').value = nueva; MC = MC.filter(m => m.clase !== nueva); pintarMulticlase();
  CONJ = { trucos: [], prep: [], libro: [], estilo: [] }; for (const k of Object.keys(ELEC)) if (k !== 't') delete ELEC[k]; EQ.clase = 'A'; EQ.oro = null; if (CREANDO) MAES = [];
  const v = $('#f_subclase').value, vale = subclasesDe(nueva).includes(v); $('#f_subWrap').innerHTML = campoSubclase(nueva, vale ? v : '', 'id="f_subclase" aria-label="Subclase"');
  if (CAR.auto && CAR.metodo !== 'libre' && !(CAR.metodo === 'tiradas' && !CAR.tiradas.length)) CAR.base = repartoSugerido(nueva, ABILS.map(([k]) => CAR.base[k]));
  sync(false);
}
function tirar() {
  CAR.dados = tirarSeis(); CAR.tiradas = CAR.dados.map(t => t.total); CAR.base = repartoSugerido(readForm().clase, CAR.tiradas); CAR.auto = true; CAR.sel = null;
  sync(false);
  const t = $('#f_car .cc-tirar'); if (t) burstFrom(t, { color: hex(temaDe(readForm()).h, 70, 62), n: 18, speed: 2.2, up: 1.4, life: 800, size: 1.8 });
}
function cambiarMetodo(m) {
  if (m === CAR.metodo) return;
  const clase = readForm().clase; CAR.metodo = m; CAR.sel = null; CAR.heredado = false;
  if (m === 'matriz' || m === 'compra') { CAR.base = repartoSugerido(clase); CAR.auto = true; }
  if (m === 'tiradas') { CAR.base = CAR.tiradas.length ? repartoSugerido(clase, CAR.tiradas) : { ...CAR.base }; CAR.auto = true; }
  sync(false);
}
function ponerBono(k, n) {
  const perm = permitidas(readForm()), b = limpiarBonos(CAR.bonos, perm); CAR.heredado = false;
  if (CAR.modo === '111') { if (b[k]) delete b[k]; else if (Object.keys(b).length < 3) b[k] = 1; else return; }
  else if (n === 2) { for (const x of Object.keys(b)) if (b[x] === 2) delete b[x]; b[k] = 2; }
  else { if (b[k] === 1) delete b[k]; else { for (const x of Object.keys(b)) if (b[x] === 1) delete b[x]; b[k] = 1; } }
  CAR.bonos = b; sync(false);
}

export function init(store, { onNewCharacterAddSpells }) {
  S = store; onCreated = onNewCharacterAddSpells; initSubclases();
  const form = $('#charForm');
  const leerMc = t => { if (!t.dataset.mc) return false; const [i, k] = t.dataset.mc.split('|'); MC[+i][k] = k === 'nivel' ? clamp(parseInt(t.value, 10) || 1, 1, 19) : t.value.trim();
    if (k === 'clase') { MC[+i].subclase = ''; pintarMulticlase(); } return true; };
  form.addEventListener('input', e => {
    leerMc(e.target);
    if (e.target.id === 'f_nombre') { $('#w_nombre').classList.remove('bad'); $('#charErr').textContent = ''; }
    if (e.target.dataset.ccchk) return;
    if (e.target.dataset.ccq) { const k = e.target.dataset.ccq, pos = e.target.selectionStart; CQ[k] = e.target.value; pintarConj(readForm()); const n = form.querySelector(`[data-ccq="${k}"]`); n?.focus(); n?.setSelectionRange(pos, pos); return; }
    if (e.target.dataset.libre) { CAR.base[e.target.dataset.libre] = clamp(parseInt(e.target.value, 10) || 10, 1, 30); return sync(false, { sinCar: true }); }
    sync(false, { sinCar: e.target.matches('input[type="text"], input:not([type]), textarea') });
  });
  form.addEventListener('change', e => {
    const t = e.target;
    if (t.matches('textarea, input:not([type="checkbox"]):not([type="radio"])') && t.id !== 'f_trasfondo' && t.id !== 'f_especie' && !t.dataset.ccchk) return;
    if (e.target.dataset.mc?.endsWith('|clase')) leerMc(e.target);
    if (e.target.dataset.ccchk) { const k = e.target.dataset.ccchk, v = e.target.value; CONJ[k] ||= []; CONJ[k] = e.target.checked ? [...new Set([...CONJ[k], v])] : CONJ[k].filter(x => x !== v);
      const y = $('#charForm').scrollTop; sync(false); $('#charForm').scrollTop = y; return; }
    if (e.target.dataset.ccq) return;
    if ((e.target.id === 'f_trasfondo' || e.target.id === 'f_especie') && e.target.dataset.sync === e.target.value) return;
    if (e.target.id === 'f_trasfondo' || e.target.id === 'f_especie') e.target.dataset.sync = e.target.value;
    if (e.target.id === 'f_trasfondo') {
      for (const k of habilidadesTrasfondo({ trasfondo: e.target.dataset.antes || '' })) if (HAB[k] === 1) delete HAB[k];
      for (const k of habilidadesTrasfondo({ trasfondo: e.target.value })) HAB[k] ||= 1;
      if (norm(e.target.dataset.antes || '') !== norm(e.target.value)) { CAR.bonos = {}; CAR.heredado = false; delete ELEC.t; EQ.trasfondo = 'A'; }
      e.target.dataset.antes = e.target.value;
    }
    if (e.target.id === 'f_manual' && e.target.checked) {
      const P = perfil({ ...readForm(), espaciosManuales: false });
      for (let L = 1; L <= 9; L++) { const i = $('#f_e' + L); if (!i.value) i.value = P.slots[L] || ''; }
    }
    sync(false);
  });
  on(form, 'click', '[data-retrato]', () => openRetrato(formId));
  on(form, 'click', '[data-herr]', (e, b) => { const [id, v] = b.dataset.herr.split('|'), el = eleccionesHerramienta(readForm()).find(x => x.id === id); if (!el) return;
    const cur = ELEC[id] || []; ELEC[id] = cur.includes(v) ? cur.filter(x => x !== v) : el.n === 1 ? [v] : cur.length < el.n ? [...cur, v] : cur; sync(false); });
  on(form, 'click', '[data-man]', (e, b) => { MAN = alternarManiobra(MAN, b.dataset.man, cupoManiobras(readForm())); sync(false); });
  on(form, 'click', '[data-variante]', (e, b) => { const [k, v] = b.dataset.variante.split('|'); VAR = { ...VAR, [k]: VAR[k] === v ? undefined : v }; if (!VAR[k]) delete VAR[k]; sync(false); });
  on(form, 'click', '[data-elegirhab]', async (e, b) => {
    const f = repartoHabilidades(readForm()).extra.fuentes[+b.dataset.elegirhab]; if (!f) return;
    const hab = await preguntarHabilidades([f], HAB, { titulo: `${f.nombre.replace(/ \(dote\)$/, '')}: elige habilidades` }); if (hab) { HAB = hab; sync(false); }
  });
  on(form, 'click', '[data-maes]', (e, b) => { MAES = alternarMaes(MAES, b.dataset.maes, cupoMaestrias(readForm())); sync(false); });
  on(form, 'click', '[data-herrlimpia]', () => { HERR = []; sync(false); });
  on(form, 'click', '[data-idioma]', (e, b) => { const v = b.dataset.idioma; IDI = IDI.includes(v) ? IDI.filter(x => x !== v) : [...IDI, v]; sync(false); });
  on(form, 'click', '[data-eqclase]', (e, b) => { EQ.clase = b.dataset.eqclase; sync(false); });
  on(form, 'click', '[data-eqtras]', (e, b) => { EQ.trasfondo = b.dataset.eqtras; sync(false); });
  on(form, 'click', '[data-tiraroro]', (e, b) => { EQ.oro = tirarOro(readForm().clase); sync(false); burstFrom(form.querySelector('[data-tiraroro]'), { color: '#F4C567', n: 20, speed: 2.4, up: 1.6, life: 800, size: 1.8 }); });
  on(form, 'click', '[data-ccver]', (e, b) => { const it = allSpellItems(S.db).find(x => x.id === b.dataset.ccver); if (it) previewSpell(it); });
  on(form, 'click', '[data-clase]', (e, b) => cambiarClase(b.dataset.clase));
  on(form, 'click', '[data-metodo]', (e, b) => cambiarMetodo(b.dataset.metodo));
  on(form, 'click', '[data-cctirar]', tirar);
  on(form, 'click', '[data-ordenar]', () => { CAR.base = repartoSugerido(readForm().clase, ABILS.map(([k]) => CAR.base[k])); CAR.auto = true; CAR.sel = null; sync(false); });
  on(form, 'click', '[data-swap]', (e, b) => {
    const k = b.dataset.swap;
    if (!CAR.sel || CAR.sel === k) { CAR.sel = CAR.sel === k ? null : k; return sync(false); }
    const s = CAR.sel; [CAR.base[s], CAR.base[k]] = [CAR.base[k], CAR.base[s]]; CAR.sel = null; CAR.auto = false; sync(false);
    for (const x of [s, k]) pop(form.querySelector(`.cc-ab[data-ab="${x}"]`), 'fx-cambio');
  });
  on(form, 'click', '[data-pm]', (e, b) => { const [k, d] = b.dataset.pm.split('|'); CAR.base[k] = clamp(CAR.base[k] + +d, 8, 15); CAR.auto = false; sync(false); });
  on(form, 'click', '[data-ccmodo]', (e, b) => { const perm = permitidas(readForm()); CAR.modo = b.dataset.ccmodo; CAR.bonos = CAR.modo === '111' && perm.length === 3 ? Object.fromEntries(perm.map(k => [k, 1])) : {}; CAR.heredado = false; sync(false); });
  on(form, 'click', '[data-bono]', (e, b) => { const [k, n] = b.dataset.bono.split('|'); ponerBono(k, +n); });
  on(form, 'click', '[data-bonosug]', () => { CAR.bonos = bonosSugeridos(readForm().clase, permitidas(readForm()), CAR.modo); CAR.heredado = false; sync(false); });
  on(charDlg(), 'click', '[data-irpaso]', (e, b) => irA(+b.dataset.irpaso));
  on(form, 'click', '[data-hab]', (e, b) => {
    const k = b.dataset.hab, fija = habilidadesTrasfondo(readForm()).includes(k), n = ((HAB[k] || 0) + 1) % 3;
    if (n) HAB[k] = n; else if (fija) HAB[k] = 1; else delete HAB[k];
    sync(false); if (HAB[k]) pop(form.querySelector(`[data-hab="${k}"]`), 'fx-marca');
  });
  on(form, 'click', '[data-salv]', (e, b) => { const k = b.dataset.salv; SALV = SALV.includes(k) ? SALV.filter(x => x !== k) : [...SALV, k]; sync(false); });
  on(form, 'click', '#f_compAuto', () => { HAB = completarHabilidades(readForm()); sync(false); });
  on(form, 'click', '#f_compReset', () => { HAB = Object.fromEntries(habilidadesTrasfondo(readForm()).map(k => [k, 1])); sync(false); });
  on(form, 'click', '#f_mcAdd', () => { const libre = Object.keys(CLASES).find(k => k !== $('#f_clase').value && !MC.some(m => m.clase === k)); if (!libre) return;
    MC.push({ clase: libre, subclase: '', nivel: 1 }); pintarMulticlase(); sync(false); form.querySelector(`[data-mc="${MC.length - 1}|clase"]`)?.focus(); });
  on(form, 'click', '[data-mcdel]', (e, b) => { MC.splice(+b.dataset.mcdel, 1); pintarMulticlase(); sync(false); });
  on(form, 'click', '[data-mcstep]', (e, b) => { const [i, d] = b.dataset.mcstep.split('|').map(Number); MC[i].nivel = clamp((parseInt(MC[i].nivel, 10) || 1) + d, 1, 19); pintarMulticlase(); sync(false); });
  on(form, 'click', '#f_doteAdd', anadirDote);
  on(form, 'click', '[data-orden]', (e, b) => { const [k, v] = b.dataset.orden.split('|'); ORD = { ...ORD, [k]: ORD[k] === v ? undefined : v }; if (!ORD[k]) delete ORD[k]; CONJ.trucos = CONJ.trucos.slice(0, cupoConjuros(readForm()).trucos); sync(false); });
  on(form, 'click', '[data-elegirestilo]', async () => {
    // Si falta alguno (varias clases con el rasgo, o el Campeón a nivel 7) se añade; si no, se cambia el último
    const d = readForm(), est = estadoEstilo(d, lib().dotes), esEst = x => estiloDe(x, lib().dotes) || esAlternativa(x);
    const suyos = DOTES.filter(esEst), quedan = est.faltan ? suyos : suyos.slice(0, -1);
    const n = await elegirEstilo({ ...d, dotes: [...DOTES.filter(x => !esEst(x)), ...quedan] }, est.fuentes[0]); if (!n) return;
    DOTES = [...DOTES.filter(x => !esEst(x)), ...quedan, n]; CONJ.estilo = []; sync(false);
  });
  on(form, 'click', '[data-elegir]', async (e, b) => {
    const inp = b.closest('.elg').querySelector('input'), v = await (b.dataset.elegir === 'especie' ? elegirEspecie(inp.value) : elegirTrasfondo(inp.value));
    if (v != null) ponerValor(inp, v);
  });
  on(form, 'click', '[data-dotedel]', (e, b) => { DOTES.splice(+b.dataset.dotedel, 1); if (!trucosAlternativa({ dotes: DOTES }).length) CONJ.estilo = []; sync(false); });
  on(form, 'click', '#f_conjOpen', () => { conjAbierto = true; sync(false); $('#f_aptitud').focus(); });
  on(form, 'click', '[data-step]', (e, b) => { const i = $('#f_nivel'); i.value = clamp((parseInt(i.value, 10) || 1) + (+b.dataset.step), 1, 20); sync(false); });
  $('#charSave').addEventListener('click', save);
  $('#charNext').addEventListener('click', () => irA(PASO + 1));
  $('#charBack').addEventListener('click', () => irA(PASO - 1));
  $('#charPasos').addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault(); irA(PASO + (e.key === 'ArrowRight' ? 1 : -1)); $('#charPasos [aria-selected="true"]')?.focus();
  });
  $('#charNew').addEventListener('click', () => openCharForm(null));
  on($('#charList'), 'click', '[data-openc],[data-editc],[data-dupc],[data-delc],[data-expc]', (e, t) => {
    if (t.dataset.openc) { closeSheet(charsDlg()); openCharacter(t.dataset.openc); return; }
    if (t.dataset.editc) return openCharForm(t.dataset.editc);
    if (t.dataset.dupc) return duplicate(t.dataset.dupc);
    if (t.dataset.delc) return remove(t.dataset.delc);
    if (t.dataset.expc) return exportar(t.dataset.expc);
  });
}
