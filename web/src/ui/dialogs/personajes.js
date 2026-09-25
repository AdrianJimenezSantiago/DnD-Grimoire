import { clamp, clone, esc, joinY, uid } from '../../core/util.js';
import { ABILS, ABIL_NAME, CLASES, modOf, perfil, sgn, clasesDe, dotesDe, requisitosMulticlase } from '../../domain/reglas2024.js';
import { reglas } from '../../domain/rasgos.js';
import { levelDiff } from '../../domain/progresion.js';
import { blankChar, normChar, THEO } from '../../domain/modelo.js';
import { $, on } from '../dom.js';
import { icon } from '../icons.js';
import { claseLinea, origenLinea } from '../sheet.js';
import { openSheet, closeSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { viewTransition } from '../fx.js';
import { undoBtn } from '../../app/acciones.js';
import { confirmar } from '../modal.js';
import { avatarHtml } from '../avatar.js';
import { temaDe } from '../tema.js';
import { estiloPaleta } from '../../domain/paleta.js';
import { subclasesDe, biblioteca } from '../../domain/catalogo.js';
import { openRetrato } from './retrato.js';
import { campoSubclase, campoClase, initSubclases } from '../subclases.js';
import { fileStore, shareJson } from '../../platform/native.js';
import { pgMaximoCalculado } from '../../domain/vida.js';
import { campoElegible, ponerValor, elegirDote, elegirEspecie, elegirTrasfondo } from '../elecciones.js';
import { gi } from '../tema.js';
import { SCHEMA } from '../../domain/modelo.js';
import { HABILIDADES, AB_CORTA, HAB_CLASE, NOMBRE_HAB, habilidadesTrasfondo, competenciasIniciales, periciasDisponibles, bonoHabilidad, salvacionesCompetentes } from '../../domain/habilidades.js';
import { CLASES_INFO } from '../../domain/clases2024.js';

let S, onCreated;
let MC = [], DOTES = [], HAB = {}, SALV = [];
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

let formId = null, conjAbierto = false;
export function openCharForm(id) {
  formId = id || null; conjAbierto = false;
  const c = id ? S.db.chars.find(x => x.id === id) : blankChar({ campana: S.cur()?.campana || THEO.campana });
  $('#charTitle').textContent = id ? `Editar a ${c.nombre || 'personaje'}` : 'Nuevo personaje';
  $('#charErr').textContent = '';
  const abil = ABILS.map(([k, n]) => `<div class="ab" data-ab="${k}"><span>${n}</span><input type="number" inputmode="numeric" min="1" max="30" id="f_${k}" value="${c.stats[k]}" aria-label="${n}"><b id="m_${k}">${sgn(modOf(c.stats[k]))}</b></div>`).join('');
  const slots = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(L => `<label class="f">Nv. ${L}<input type="number" inputmode="numeric" min="0" max="9" id="f_e${L}" value="${(c.espacios || {})[L] || ''}" placeholder="0"></label>`).join('');
  $('#charForm').innerHTML = `
  <section class="fsec"><h3>Quién es</h3>${id ? `<div class="f-ret">${avatarHtml(c, 'lg')}<div><b>Retrato</b><p class="note">${c.retrato ? 'Puedes reencuadrarlo o cambiarlo cuando quieras.' : 'Añade una imagen de tu personaje: aparece en la portada, la hoja y la barra superior.'}</p><button type="button" data-retrato>${c.retrato ? 'Editar retrato' : 'Añadir retrato'}</button></div></div>` : '<p class="note">Podrás añadir un retrato, su historia y su diario en cuanto lo crees.</p>'}<div class="frow">
    <label class="f" id="w_nombre">Nombre<input id="f_nombre" value="${esc(c.nombre)}" autocomplete="off" required></label>
    <div class="f"><span>Especie</span>${campoElegible('id="f_especie" aria-label="Especie"', c.especie, 'especie', 'criatura', 'Elige o escribe')}</div>
    <div class="f"><span>Trasfondo</span>${campoElegible('id="f_trasfondo" aria-label="Trasfondo"', c.trasfondo, 'trasfondo', 'trasfondo', 'Elige o escribe')}</div></div></section>
  <section class="fsec"><h3>Clase y nivel</h3><div class="frow">
    <div class="f"><span>Clase</span>${campoClase('id="f_clase" aria-label="Clase"', c.clase, Object.keys(CLASES))}<span class="hint"><button type="button" class="linkish" data-verclase="#f_clase">Ver qué aprende</button></span></div>
    <div class="f">Subclase<span id="f_subWrap">${campoSubclase(c.clase, c.subclase, 'id="f_subclase" aria-label="Subclase"')}</span><span class="hint" id="h_sub"></span></div>
    <div class="f">Nivel<div class="stepper"><button type="button" data-step="-1" aria-label="Bajar nivel">−</button><input id="f_nivel" type="number" inputmode="numeric" min="1" max="20" value="${c.nivel}" aria-label="Nivel"><button type="button" data-step="1" aria-label="Subir nivel">+</button></div></div></div>
    <div id="f_mc" class="mc-list"></div>
    <button type="button" class="ghost mc-add" id="f_mcAdd">${icon('plus')}Añadir otra clase (multiclase)</button>
    <p class="hint" id="h_mc" aria-live="polite"></p></section>
  <section class="fsec"><h3>Dotes</h3>
    <div class="dote-chips" id="f_dotes"></div>
    <button type="button" class="elg-add" id="f_doteAdd">${gi('dote')}<span><b>Añadir una dote</b><small>Elige de la lista, con su texto, o escribe cualquiera</small></span>${icon('plus')}</button>
    <p class="hint">La de origen sale de tu trasfondo. Las que elijas aparecen en «En juego» con su texto si has importado el libro.</p></section>
  <section class="fsec"><h3>Características</h3><div class="abil">${abil}</div></section>
  <section class="fsec"><h3>Puntos de golpe</h3><div class="frow"><label class="f">PG máximos<input id="f_pgmax" type="number" inputmode="numeric" min="1" value="${c.vida?.maxManual ?? ''}" placeholder=""><span class="hint" id="h_pgmax"></span></label></div></section>
  <section class="fsec"><h3>Competencias</h3><p class="hint comp-hint" id="h_comp" aria-live="polite"></p>
    <div class="comp-salv" id="f_salv" role="group" aria-label="Tiradas de salvación"></div>
    <div class="comp-grid" id="f_comp" role="group" aria-label="Habilidades"></div>
    <p class="hint">Toca una habilidad para pasar de nada a competencia (●) y a pericia (◆◆). <button type="button" class="linkish" id="f_compAuto">Rellenar con las de mi trasfondo y clase</button></p></section>
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
    <label class="f wide">Dotes y notas<textarea id="f_notas" rows="3" placeholder="Dotes, rasgos de especie, lo que quieras recordar">${esc(c.notas || '')}</textarea><span class="hint">Las subidas de nivel guiadas anotan aquí lo que eliges.</span></label></div></section>
  <section class="fsec"><h3>Resumen</h3><div class="fsum" id="f_sum" aria-live="polite"></div></section>`;
  MC = clone(c.multiclase || []); DOTES = [...(c.dotes || [])]; HAB = { ...(c.habilidades || {}) }; SALV = [...(c.salvacionesExtra || [])];
  pintarMulticlase(); pintarDotes();
  sync(true); openSheet(charDlg());
  if (!id) setTimeout(() => $('#f_nombre').focus(), 60);
}
function readForm() {
  const base = formId ? clone(S.db.chars.find(x => x.id === formId)) : blankChar();
  const v = id => $(id).value.trim();
  Object.assign(base, { nombre: v('#f_nombre'), especie: v('#f_especie'), trasfondo: v('#f_trasfondo'), clase: v('#f_clase'), subclase: v('#f_subclase'),
    nivel: clamp(parseInt(v('#f_nivel'), 10) || 1, 1, 20), aptitud: v('#f_aptitud'), extraCD: parseInt(v('#f_extraCD'), 10) || 0, extraAtaque: parseInt(v('#f_extraAtaque'), 10) || 0,
    espaciosManuales: $('#f_manual').checked, lema: $('#f_lema').value.trim(), campana: v('#f_campana'), notas: $('#f_notas').value.trim(),
    multiclase: clone(MC), dotes: [...DOTES], habilidades: { ...HAB }, salvacionesExtra: [...SALV] });
  const pgm = parseInt($('#f_pgmax')?.value, 10); base.vida = { ...(base.vida || {}), maxManual: pgm > 0 ? pgm : null };
  ABILS.forEach(([k]) => { base.stats[k] = clamp(parseInt(v('#f_' + k), 10) || 10, 1, 30); });
  base.espacios = {}; for (let L = 1; L <= 9; L++) { const n = clamp(parseInt(v('#f_e' + L), 10) || 0, 0, 9); if (n) base.espacios[L] = n; }
  return base;
}
function pintarMulticlase() {
  const principal = $('#f_clase').value;
  $('#f_mc').innerHTML = MC.map((m, i) => {
    const opts = Object.keys(CLASES).filter(k => k !== principal && (k === m.clase || !MC.some(x => x.clase === k)));
    return `<div class="frow mc-row"><div class="f"><span>Clase ${i + 2}</span>${campoClase(`data-mc="${i}|clase" aria-label="Clase ${i + 2}"`, m.clase, opts)}<span class="hint"><button type="button" class="linkish" data-verclase="${esc(m.clase)}">Ver qué aprende</button></span></div>
      <div class="f">Subclase${campoSubclase(m.clase, m.subclase || '', `data-mc="${i}|subclase" aria-label="Subclase de ${esc(m.clase)}"`)}</div>
      <div class="f">Nivel<div class="stepper"><button type="button" data-mcstep="${i}|-1" aria-label="Bajar nivel de ${esc(m.clase)}">−</button><input data-mc="${i}|nivel" type="number" inputmode="numeric" min="1" max="19" value="${m.nivel}" aria-label="Nivel de ${esc(m.clase)}"><button type="button" data-mcstep="${i}|1" aria-label="Subir nivel de ${esc(m.clase)}">+</button></div></div>
      <button type="button" class="iconbtn mc-del" data-mcdel="${i}" aria-label="Quitar ${esc(m.clase)}">×</button></div>`;
  }).join('');
  $('#f_mcAdd').hidden = MC.length >= 3;
}
function pintarComp(draft) {
  const base = new Set(CLASES_INFO[draft.clase]?.salv || []), comp = salvacionesCompetentes(draft);
  $('#f_salv').innerHTML = '<span class="comp-lbl">Salvaciones</span>' + ['fue', 'des', 'con', 'int', 'sab', 'car'].map(k => base.has(k)
    ? `<span class="comp-s fija" title="De tu clase">${AB_CORTA[k]}</span>`
    : `<button type="button" class="comp-s ${comp.has(k) ? 'on' : ''}" data-salv="${k}" aria-pressed="${comp.has(k)}" title="Competencia extra (dote o rasgo)">${AB_CORTA[k]}</button>`).join('');
  const tras = new Set(habilidadesTrasfondo(draft));
  $('#f_comp').innerHTML = HABILIDADES.map(([k, n, ab]) => { const nv = HAB[k] || 0;
    return `<button type="button" class="comp-h n${nv}" data-hab="${k}" aria-label="${esc(n)}: ${['sin competencia', 'competencia', 'pericia'][nv]}"><i class="cr-m n${nv}" aria-hidden="true"></i><span>${esc(n)}<small>${AB_CORTA[ab]}${tras.has(k) ? ' · trasfondo' : ''}</small></span><b>${sgn(bonoHabilidad(draft, k))}</b></button>`; }).join('');
  const [nClase, lista] = HAB_CLASE[draft.clase] || [0, []], deClase = lista.filter(k => HAB[k] && !tras.has(k)).length, per = periciasDisponibles(draft), usadas = Object.values(HAB).filter(n => n === 2).length;
  const bits = [];
  if (tras.size) bits.push(`${draft.trasfondo}: ${[...tras].map(k => NOMBRE_HAB[k]).join(' y ')}.`);
  if (nClase) bits.push(`${draft.clase} elige ${nClase} de: ${lista.length === HABILIDADES.length ? 'cualquiera' : lista.map(k => NOMBRE_HAB[k]).join(', ')}${deClase < nClase ? ` (llevas ${deClase})` : ''}.`);
  if (per) bits.push(`Pericias de tu clase: ${per}${usadas !== per ? ` (llevas ${usadas})` : ''}.`);
  $('#h_comp').textContent = bits.join(' ');
}
function pintarDotes() {
  const d = readForm(), origen = dotesDe({ ...d, dotes: [] }, biblioteca().trasfondos)[0];
  $('#f_dotes').innerHTML = (origen ? `<span class="dote-chip fija" title="Dote de origen de tu trasfondo">${esc(origen.detalle ? `${origen.nombre} (${origen.detalle})` : origen.nombre)}<small>trasfondo</small></span>` : '')
    + DOTES.map((n, i) => `<button type="button" class="dote-chip" data-dotedel="${i}" aria-label="Quitar la dote ${esc(n)}">${esc(n)}<span aria-hidden="true">×</span></button>`).join('')
    || '<span class="hint">Sin dotes todavía.</span>';
}
async function anadirDote() {
  const n = await elegirDote({ ...readForm(), dotes: DOTES }, { titulo: 'Añadir una dote' }); if (!n) return;
  if (!DOTES.some(x => x.toLowerCase() === n.toLowerCase())) DOTES.push(n);
  pintarDotes(); sync(false);
}
function slotText(P) {
  if (P.pact && !Object.keys(P.slots).some(L => +L !== P.pact.level)) return `${P.pact.n} ${P.pact.n > 1 ? 'espacios' : 'espacio'} de pacto de nivel ${P.pact.level}, que vuelven con un descanso corto.`;
  const parts = Object.keys(P.slots).map(Number).sort((a, b) => a - b).map(L => `${P.slots[L]} de nivel ${L}`);
  return parts.length ? `Espacios: ${joinY(parts)}.` : 'Sin espacios de conjuro.';
}
function sync(first) {
  const clase = $('#f_clase').value, cls = CLASES[clase] || {};
  const sel = $('#f_aptitud'), keep = first ? (formId ? (S.db.chars.find(x => x.id === formId).aptitud || '') : '') : sel.value;
  const draft0 = readForm(), P0 = perfil({ ...draft0, aptitud: '' }), autoAp = P0.c ? P0.c.ap : '';
  sel.innerHTML = `<option value="">${autoAp ? `Según la clase (${ABIL_NAME[autoAp]})` : 'Ninguna'}</option>` + ['int', 'sab', 'car'].map(k => `<option value="${k}">${ABIL_NAME[k]}</option>`).join('');
  sel.value = keep;
  const draft = readForm(), P = perfil(draft), ap = P.apKey;
  document.querySelectorAll('.ab').forEach(b => b.classList.toggle('key', b.dataset.ab === ap));
  ABILS.forEach(([k]) => { $('#m_' + k).textContent = sgn(modOf($('#f_' + k).value)); });
  $('#h_sub').textContent = draft.nivel < 3 ? 'Se elige al llegar a nivel 3.' : (cls.subCast && !P.viaSub ? `Solo ${cls.subCast.nombre} lanza conjuros.` : '');
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
  pintarComp(draft);
  $('#f_pgmax').placeholder = String(pgMaximoCalculado({ ...draft, vida: { ...draft.vida, maxManual: null } }));
  $('#h_pgmax').textContent = `Vacío: la media de cada nivel con tu Constitución (${pgMaximoCalculado(draft)}). Escribe otro si tiras los PG al subir de nivel.`;
}
function save() {
  const draft = readForm();
  if (!draft.nombre) { $('#charErr').textContent = 'Falta el nombre.'; $('#w_nombre').classList.add('bad'); $('#f_nombre').focus(); return; }
  if (draft.nivel + (draft.multiclase || []).reduce((n, m) => n + (parseInt(m.nivel, 10) || 1), 0) > 20) { $('#charErr').textContent = 'El nivel de personaje (la suma de las clases) no puede pasar de 20.'; return; }
  if (formId) {
    const oc = clone(S.db.chars.find(x => x.id === formId));
    const h = S.edit(db => { const i = db.chars.findIndex(x => x.id === formId); db.chars[i] = normChar(draft); });
    const nc = S.db.chars.find(x => x.id === formId), diff = levelDiff(perfil(oc), perfil(nc), oc, nc);
    closeSheet(charDlg()); if (charsDlg().open) renderList();
    toast(`${esc(draft.nombre)} actualizado.${diff ? ' ' + esc(diff) : ''}`, [undoBtn(S, h)]);
  } else {
    const c = normChar(draft);
    const h = S.edit(db => { db.chars.push(c); db.activeId = c.id; });
    document.dispatchEvent(new CustomEvent('grimorio:creado'));
    closeSheet(charDlg()); if (charsDlg().open) closeSheet(charsDlg());
    window.scrollTo({ top: 0 });
    toast(`Grimorio de ${esc(c.nombre)} creado.`, [{ label: 'Añadir conjuros', hl: true, fn: () => onCreated?.() }, undoBtn(S, h)]);
  }
}

export function init(store, { onNewCharacterAddSpells }) {
  S = store; onCreated = onNewCharacterAddSpells; initSubclases();
  const form = $('#charForm');
  const leerMc = t => { if (!t.dataset.mc) return false; const [i, k] = t.dataset.mc.split('|'); MC[+i][k] = k === 'nivel' ? clamp(parseInt(t.value, 10) || 1, 1, 19) : t.value.trim();
    if (k === 'clase') { MC[+i].subclase = ''; pintarMulticlase(); } return true; };
  form.addEventListener('input', e => { leerMc(e.target); if (e.target.id === 'f_nombre') { $('#w_nombre').classList.remove('bad'); $('#charErr').textContent = ''; } sync(false); });
  form.addEventListener('change', e => {
    if (e.target.dataset.mc?.endsWith('|clase')) leerMc(e.target);
    if (e.target.id === 'f_clase') { MC = MC.filter(m => m.clase !== e.target.value); pintarMulticlase();
      const v = $('#f_subclase').value, vale = subclasesDe(e.target.value).includes(v); $('#f_subWrap').innerHTML = campoSubclase(e.target.value, vale ? v : '', 'id="f_subclase" aria-label="Subclase"'); }
    if (e.target.id === 'f_trasfondo') {
      for (const k of habilidadesTrasfondo({ trasfondo: e.target.dataset.antes || '' })) if (HAB[k] === 1) delete HAB[k];
      for (const k of habilidadesTrasfondo({ trasfondo: e.target.value })) HAB[k] ||= 1;
      e.target.dataset.antes = e.target.value; pintarDotes();
    }
    if (e.target.id === 'f_manual' && e.target.checked) {
      const P = perfil({ ...readForm(), espaciosManuales: false });
      for (let L = 1; L <= 9; L++) { const i = $('#f_e' + L); if (!i.value) i.value = P.slots[L] || ''; }
    }
    sync(false);
  });
  on(form, 'click', '[data-retrato]', () => openRetrato(formId));
  form.addEventListener('focusin', e => { if (e.target.id === 'f_trasfondo') e.target.dataset.antes = e.target.value; });
  on(form, 'click', '[data-hab]', (e, b) => { const k = b.dataset.hab, n = ((HAB[k] || 0) + 1) % 3; if (n) HAB[k] = n; else delete HAB[k]; sync(false); });
  on(form, 'click', '[data-salv]', (e, b) => { const k = b.dataset.salv; SALV = SALV.includes(k) ? SALV.filter(x => x !== k) : [...SALV, k]; sync(false); });
  on(form, 'click', '#f_compAuto', () => { const d = readForm(), ini = competenciasIniciales(d); for (const [k, n] of Object.entries(ini)) if (!HAB[k]) HAB[k] = n; sync(false); });
  on(form, 'click', '#f_mcAdd', () => { const libre = Object.keys(CLASES).find(k => k !== $('#f_clase').value && !MC.some(m => m.clase === k)); if (!libre) return;
    MC.push({ clase: libre, subclase: '', nivel: 1 }); pintarMulticlase(); sync(false); form.querySelector(`[data-mc="${MC.length - 1}|clase"]`)?.focus(); });
  on(form, 'click', '[data-mcdel]', (e, b) => { MC.splice(+b.dataset.mcdel, 1); pintarMulticlase(); sync(false); });
  on(form, 'click', '[data-mcstep]', (e, b) => { const [i, d] = b.dataset.mcstep.split('|').map(Number); MC[i].nivel = clamp((parseInt(MC[i].nivel, 10) || 1) + d, 1, 19); pintarMulticlase(); sync(false); });
  on(form, 'click', '#f_doteAdd', anadirDote);
  on(form, 'click', '[data-elegir]', async (e, b) => {
    const inp = b.closest('.elg').querySelector('input'), v = await (b.dataset.elegir === 'especie' ? elegirEspecie(inp.value) : elegirTrasfondo(inp.value));
    if (v != null) ponerValor(inp, v);
  });
  on(form, 'click', '[data-dotedel]', (e, b) => { DOTES.splice(+b.dataset.dotedel, 1); pintarDotes(); sync(false); });
  on(form, 'click', '#f_conjOpen', () => { conjAbierto = true; sync(false); $('#f_aptitud').focus(); });
  on(form, 'click', '[data-step]', (e, b) => { const i = $('#f_nivel'); i.value = clamp((parseInt(i.value, 10) || 1) + (+b.dataset.step), 1, 20); sync(false); });
  $('#charSave').addEventListener('click', save);
  $('#charNew').addEventListener('click', () => openCharForm(null));
  on($('#charList'), 'click', '[data-openc],[data-editc],[data-dupc],[data-delc]', (e, t) => {
    if (t.dataset.openc) { closeSheet(charsDlg()); openCharacter(t.dataset.openc); return; }
    if (t.dataset.editc) return openCharForm(t.dataset.editc);
    if (t.dataset.dupc) return duplicate(t.dataset.dupc);
    if (t.dataset.delc) return remove(t.dataset.delc);
    if (t.dataset.expc) return exportar(t.dataset.expc);
  });
}
