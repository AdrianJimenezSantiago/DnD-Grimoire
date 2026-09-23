/** Personajes: lista (abrir, editar, duplicar, borrar) y ficha de creación/edición. */
import { clamp, clone, esc, joinY, uid } from '../../core/util.js';
import { ABILS, ABIL_NAME, CLASES, ESPECIES, TRASFONDOS, modOf, perfil, sgn } from '../../domain/reglas2024.js';
import { reglas } from '../../domain/rasgos.js';
import { levelDiff } from '../../domain/progresion.js';
import { blankChar, normChar, THEO } from '../../domain/modelo.js';
import { $, on } from '../dom.js';
import { claseLinea, origenLinea } from '../sheet.js';
import { openSheet, closeSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { viewTransition } from '../fx.js';
import { undoBtn } from '../../app/acciones.js';
import { confirmar } from '../modal.js';
import { avatarHtml } from '../avatar.js';
import { openRetrato } from './retrato.js';
import { fileStore } from '../../platform/native.js';

let S, onCreated;
const charsDlg = () => $('#charsDlg'), charDlg = () => $('#charDlg');
const fill = (id, arr) => { $(id).innerHTML = arr.map(v => `<option value="${esc(v)}"></option>`).join(''); };

export function openCharacter(id) {
  if (!S.db.chars.some(c => c.id === id)) return;
  viewTransition(() => { S.editing = false; S.edit(db => { db.activeId = id; }); window.scrollTo({ top: 0 }); document.dispatchEvent(new CustomEvent('grimorio:abierto')); });
}

function renderList() {
  const n = Object.keys(S.db.catalog).length;
  $('#charList').innerHTML = (S.db.chars.length ? S.db.chars.map(c => {
    const nb = c.book.length, ini = esc((c.nombre || '?').trim().charAt(0).toUpperCase());
    return `<div class="ccard ${c.id === S.db.activeId ? 'active' : ''}">${c.retrato ? avatarHtml(c, 'md') : `<span class="monogram">${ini}</span>`}
      <button type="button" class="cmain" data-openc="${c.id}"><span class="cname">${esc(c.nombre || 'Sin nombre')}</span>
        <span class="cline">${esc(claseLinea(c))}${origenLinea(c) ? '. ' + esc(origenLinea(c)) : ''}. ${nb === 1 ? '1 conjuro' : nb + ' conjuros'} en el libro</span></button>
      <div class="cacts"><button type="button" data-editc="${c.id}">Editar</button><button type="button" data-dupc="${c.id}">Duplicar</button><button type="button" class="warn" data-delc="${c.id}">Borrar</button></div>
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
async function remove(id) {
  const c = S.db.chars.find(x => x.id === id); if (!c) return;
  if (!(await confirmar({ titulo: `¿Borrar a ${c.nombre || 'este personaje'}?`, texto: 'Se borran su ficha, su libro y su historial. Los conjuros siguen en el catálogo para los demás personajes.', ok: 'Borrar personaje', peligro: true }))) return;
  const h = S.edit(db => { db.chars = db.chars.filter(x => x.id !== id); if (db.activeId === id) db.activeId = db.chars[0]?.id ?? null; });
  fileStore.remove(`retrato-${id}.txt`);   // el original del retrato; la miniatura vuelve con Deshacer
  renderList(); toast(`${esc(c.nombre || 'Personaje')} borrado.`, [undoBtn(S, h)]);
}

/* ---------------- ficha ---------------- */
let formId = null;
export function openCharForm(id) {
  formId = id || null;
  const c = id ? S.db.chars.find(x => x.id === id) : blankChar({ campana: S.cur()?.campana || THEO.campana });
  $('#charTitle').textContent = id ? `Editar a ${c.nombre || 'personaje'}` : 'Nuevo personaje';
  $('#charErr').textContent = '';
  const clsOpts = Object.keys(CLASES).map(k => `<option ${k === c.clase ? 'selected' : ''}>${k}</option>`).join('');
  const abil = ABILS.map(([k, n]) => `<div class="ab" data-ab="${k}"><span>${n}</span><input type="number" inputmode="numeric" min="1" max="30" id="f_${k}" value="${c.stats[k]}" aria-label="${n}"><b id="m_${k}">${sgn(modOf(c.stats[k]))}</b></div>`).join('');
  const slots = [1, 2, 3, 4, 5, 6, 7, 8, 9].map(L => `<label class="f">Nv. ${L}<input type="number" inputmode="numeric" min="0" max="9" id="f_e${L}" value="${(c.espacios || {})[L] || ''}" placeholder="0"></label>`).join('');
  $('#charForm').innerHTML = `
  <section class="fsec"><h3>Quién es</h3>${id ? `<div class="f-ret">${avatarHtml(c, 'lg')}<div><b>Retrato</b><p class="note">${c.retrato ? 'Puedes reencuadrarlo o cambiarlo cuando quieras.' : 'Añade una imagen de tu personaje: aparece en la portada, la hoja y la barra superior.'}</p><button type="button" data-retrato>${c.retrato ? 'Editar retrato' : 'Añadir retrato'}</button></div></div>` : '<p class="note">Podrás añadir un retrato, su historia y su diario en cuanto lo crees.</p>'}<div class="frow">
    <label class="f" id="w_nombre">Nombre<input id="f_nombre" value="${esc(c.nombre)}" autocomplete="off" required></label>
    <label class="f">Especie<input id="f_especie" list="dl_especie" value="${esc(c.especie)}" autocomplete="off"></label>
    <label class="f">Trasfondo<input id="f_trasfondo" list="dl_trasfondo" value="${esc(c.trasfondo)}" autocomplete="off"></label></div></section>
  <section class="fsec"><h3>Clase y nivel</h3><div class="frow">
    <label class="f">Clase<select id="f_clase">${clsOpts}</select></label>
    <label class="f">Subclase<input id="f_subclase" list="dl_sub" value="${esc(c.subclase)}" autocomplete="off"><span class="hint" id="h_sub"></span></label>
    <div class="f">Nivel<div class="stepper"><button type="button" data-step="-1" aria-label="Bajar nivel">−</button><input id="f_nivel" type="number" inputmode="numeric" min="1" max="20" value="${c.nivel}" aria-label="Nivel"><button type="button" data-step="1" aria-label="Subir nivel">+</button></div></div></div></section>
  <section class="fsec"><h3>Características</h3><div class="abil">${abil}</div></section>
  <section class="fsec"><h3>Conjuros</h3><div class="frow">
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
  sync(true); openSheet(charDlg());
  if (!id) setTimeout(() => $('#f_nombre').focus(), 60);
}
function readForm() {
  const base = formId ? clone(S.db.chars.find(x => x.id === formId)) : blankChar();
  const v = id => $(id).value.trim();
  Object.assign(base, { nombre: v('#f_nombre'), especie: v('#f_especie'), trasfondo: v('#f_trasfondo'), clase: v('#f_clase'), subclase: v('#f_subclase'),
    nivel: clamp(parseInt(v('#f_nivel'), 10) || 1, 1, 20), aptitud: v('#f_aptitud'), extraCD: parseInt(v('#f_extraCD'), 10) || 0, extraAtaque: parseInt(v('#f_extraAtaque'), 10) || 0,
    espaciosManuales: $('#f_manual').checked, lema: $('#f_lema').value.trim(), campana: v('#f_campana'), notas: $('#f_notas').value.trim() });
  ABILS.forEach(([k]) => { base.stats[k] = clamp(parseInt(v('#f_' + k), 10) || 10, 1, 30); });
  base.espacios = {}; for (let L = 1; L <= 9; L++) { const n = clamp(parseInt(v('#f_e' + L), 10) || 0, 0, 9); if (n) base.espacios[L] = n; }
  return base;
}
function slotText(P) {
  if (P.pact && !Object.keys(P.slots).some(L => +L !== P.pact.level)) return `${P.pact.n} ${P.pact.n > 1 ? 'espacios' : 'espacio'} de pacto de nivel ${P.pact.level}, que vuelven con un descanso corto.`;
  const parts = Object.keys(P.slots).map(Number).sort((a, b) => a - b).map(L => `${P.slots[L]} de nivel ${L}`);
  return parts.length ? `Espacios: ${joinY(parts)}.` : 'Sin espacios de conjuro.';
}
function sync(first) {
  const clase = $('#f_clase').value, cls = CLASES[clase] || {};
  fill('#dl_sub', cls.subs || []);
  const sel = $('#f_aptitud'), keep = first ? (formId ? (S.db.chars.find(x => x.id === formId).aptitud || '') : '') : sel.value;
  const draft0 = readForm(), P0 = perfil({ ...draft0, aptitud: '' }), autoAp = P0.c ? P0.c.ap : '';
  sel.innerHTML = `<option value="">${autoAp ? `Según la clase (${ABIL_NAME[autoAp]})` : 'Ninguna'}</option>` + ['int', 'sab', 'car'].map(k => `<option value="${k}">${ABIL_NAME[k]}</option>`).join('');
  sel.value = keep;
  const draft = readForm(), P = perfil(draft), ap = P.apKey;
  document.querySelectorAll('.ab').forEach(b => b.classList.toggle('key', b.dataset.ab === ap));
  ABILS.forEach(([k]) => { $('#m_' + k).textContent = sgn(modOf($('#f_' + k).value)); });
  $('#h_sub').textContent = draft.nivel < 3 ? 'Se elige al llegar a nivel 3.' : (cls.subCast && !P.viaSub ? `Solo ${cls.subCast.nombre} lanza conjuros.` : '');
  $('#f_slots').hidden = !$('#f_manual').checked;
  const L = [`Competencia ${sgn(P.pb)}.${P.apKey ? ` ${ABIL_NAME[P.apKey]} ${sgn(P.mod)}: CD ${P.cd}, ataque de conjuro ${sgn(P.atk)}.` : ''}`];
  if (P.c || draft.espaciosManuales) L.push(slotText(P));
  if (P.c) L.push(`Prepara ${P.maxPrep} ${P.maxPrep === 1 ? 'conjuro' : 'conjuros'} de nivel 1+${P.c.cant ? ` y sabe ${P.maxCant} trucos` : ''}.`);
  const ras = reglas(draft).map(r => r.nombre); if (P.ritualLibro) ras.unshift('Adepto de los rituales');
  if (ras.length) L.push(`La hoja lleva la cuenta de: ${joinY(ras)}.`);
  const notes = [];
  if (!P.c && !draft.espaciosManuales) {
    notes.push(cls.subCast ? `Un ${clase.toLowerCase()} lanza conjuros como ${cls.subCast.nombre}, desde nivel ${cls.subCast.desde}.` : `${clase} no lanza conjuros por su clase.`);
    notes.push('Puedes añadir conjuros de dotes o de especie: se marcan como siempre preparados.');
  }
  if (formId) { const oc = S.db.chars.find(x => x.id === formId), diff = levelDiff(perfil(oc), P, oc, draft); if (diff) notes.push(diff); }
  $('#f_sum').innerHTML = L.map(t => `<p>${esc(t)}</p>`).join('') + notes.map(t => `<p class="note">${esc(t)}</p>`).join('');
}
function save() {
  const draft = readForm();
  if (!draft.nombre) { $('#charErr').textContent = 'Falta el nombre.'; $('#w_nombre').classList.add('bad'); $('#f_nombre').focus(); return; }
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
  S = store; onCreated = onNewCharacterAddSpells;
  fill('#dl_especie', ESPECIES); fill('#dl_trasfondo', TRASFONDOS);
  const form = $('#charForm');
  form.addEventListener('input', e => { if (e.target.id === 'f_nombre') { $('#w_nombre').classList.remove('bad'); $('#charErr').textContent = ''; } sync(false); });
  form.addEventListener('change', e => {
    if (e.target.id === 'f_manual' && e.target.checked) {
      const P = perfil({ ...readForm(), espaciosManuales: false });
      for (let L = 1; L <= 9; L++) { const i = $('#f_e' + L); if (!i.value) i.value = P.slots[L] || ''; }
    }
    sync(false);
  });
  on(form, 'click', '[data-retrato]', () => openRetrato(formId));
  on(form, 'click', '[data-step]', (e, b) => { const i = $('#f_nivel'); i.value = clamp((parseInt(i.value, 10) || 1) + (+b.dataset.step), 1, 20); sync(false); });
  $('#charSave').addEventListener('click', save);
  $('#charNew').addEventListener('click', () => openCharForm(null));
  on($('#charList'), 'click', '[data-openc],[data-editc],[data-dupc],[data-delc]', (e, t) => {
    if (t.dataset.openc) { closeSheet(charsDlg()); openCharacter(t.dataset.openc); return; }
    if (t.dataset.editc) return openCharForm(t.dataset.editc);
    if (t.dataset.dupc) return duplicate(t.dataset.dupc);
    if (t.dataset.delc) return remove(t.dataset.delc);
  });
}
