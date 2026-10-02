import { esc, norm, uid } from '../../core/util.js';
import { LISTAS, SCHOOLS, perfil } from '../../domain/reglas/reglas2024.js';
import { allSpellItems, itemMeta, itemTag, itemToSid, listFilter, invalidateItems } from '../../domain/conjuros/catalogo.js';
import { $, on } from '../componentes/dom.js';
import { prepCount } from '../pantallas/sheet.js';
import { openSheet, closeSheet } from '../componentes/dialog.js';
import { toast } from '../componentes/toast.js';
import { undoBtn } from '../../app/acciones.js';
import { previewSpell } from './conjuro.js';

let S;
const dlg = () => $('#pickDlg');
const pressed = id => $(id).getAttribute('aria-pressed') === 'true';

export function defaultRel(ch, s) {
  const P = perfil(ch), sinClase = !P.c;
  const autoPrep = !!P.c && ch.clase !== 'Mago' && s.level > 0 && prepCount(S.db, ch) < P.maxPrep;
  return { prep: autoPrep, always: sinClase, fuente: ch.clase === 'Mago' ? 'Libro' : (sinClase ? '' : P.listaNombre), gratis: sinClase && s.level > 0 ? '1/DL' : '', used: false };
}
export function addToBook(sidOrItem) {
  let bi = -1, name = '';
  const h = S.edit((db, ch) => {
    const sid = typeof sidOrItem === 'string' ? sidOrItem : itemToSid(db, sidOrItem);
    const s = db.catalog[sid]; name = s.es;
    ch.book.push({ sid, ...defaultRel(ch, s) }); bi = ch.book.length - 1;
  });
  if (dlg().open) render();
  toast(`<b>${esc(name)}</b> añadido al libro.`, [undoBtn(S, h)]);
  requestAnimationFrame(() => document.getElementById('sp-' + bi)?.classList.add('fx-cast'));
  return bi;
}
export function openPicker(level) {
  const ch = S.cur(); if (!ch) return; const P = perfil(ch);
  $('#pickSub').textContent = `Al libro de ${ch.nombre}. Aparecen tu catálogo y el compendio SRD 5.2.`;
  $('#pickCls').innerHTML = `<option value="">Todas las listas</option>` + LISTAS.map(c => `<option value="${c}">Lista de ${c.toLowerCase()}</option>`).join('');
  $('#pickCls').value = P.lista || '';
  $('#pickEsc').innerHTML = `<option value="">Todas las escuelas</option>` + SCHOOLS.map(s => `<option>${s}</option>`).join('');
  $('#pickLvl').value = level === '' || level == null ? '' : String(level);
  $('#pickQ').value = ''; $('#pickRit').setAttribute('aria-pressed', 'false'); $('#pickNoConc').setAttribute('aria-pressed', 'false');
  render(); openSheet(dlg());
}
function render() {
  const ch = S.cur(), have = new Set(ch.book.map(e => 'c:' + e.sid)), q = norm($('#pickQ').value.trim()), lv = $('#pickLvl').value, cls = $('#pickCls').value;
  const escF = $('#pickEsc').value, rit = pressed('#pickRit'), noc = pressed('#pickNoConc');
  const list = allSpellItems(S.db).filter(it => !have.has(it.id) && (lv === '' || it.l === +lv) && listFilter(it, cls) && (!escF || norm(it.esc || '') === norm(escF))
    && (!rit || it.ri) && (!noc || !it.c) && (!q || norm(it.es).includes(q) || norm(it.en).includes(q)))
    .sort((a, b) => a.l - b.l || a.es.localeCompare(b.es, 'es'));
  $('#pickNew').textContent = q ? `Crear «${$('#pickQ').value.trim()}»` : 'Crear conjuro nuevo';
  if (!list.length) { $('#pickList').innerHTML = `<p class="pempty">No hay conjuros que encajen y no estén ya en este libro. ${cls ? 'Prueba con «Todas las listas» o crea' : 'Crea'} uno nuevo: quedará en el catálogo para los demás personajes.</p>`; return; }
  const shown = list.slice(0, 150);
  $('#pickList').innerHTML = shown.map(it => `<div class="pitem"><button type="button" class="pmain" data-pick="${esc(it.id)}"><span class="pl">${it.l}</span>
      <span><span class="pn">${esc(it.es)}</span><span class="pm">${itemMeta(it)}${itemTag(it) ? ` <span class="ptag">${itemTag(it)}</span>` : ''}</span></span><span class="padd">Añadir</span></button>
      <button type="button" class="pview" data-pview="${esc(it.id)}">Ver</button></div>`).join('')
    + (list.length > shown.length ? `<p class="pempty">Y ${list.length - shown.length} más: afina la búsqueda o los filtros.</p>` : '')
    + `<p class="credit">Compendio con los 391 conjuros del Manual del Jugador 2024 (nombres y datos oficiales). Los marcados SRD traen texto en inglés del System Reference Document 5.2 (CC-BY 4.0); el texto completo en español aparece al importar tu manual.</p>`;
}
export function init(store, { startEditing }) {
  S = store;
  $('#pickQ').addEventListener('input', render);
  ['#pickLvl', '#pickCls', '#pickEsc'].forEach(id => $(id).addEventListener('change', render));
  ['#pickRit', '#pickNoConc'].forEach(id => $(id).addEventListener('click', () => { $(id).setAttribute('aria-pressed', !pressed(id)); render(); }));
  on($('#pickList'), 'click', '[data-pview],[data-pick]', (e, b) => {
    const id = b.dataset.pview || b.dataset.pick, it = allSpellItems(S.db).find(x => x.id === id); if (!it) return;
    if (b.dataset.pview) previewSpell(it, { onAdd: () => addToBook(it) }); else addToBook(it);
  });
  $('#pickNew').addEventListener('click', () => {
    const lv = $('#pickLvl').value, name = $('#pickQ').value.trim(), id = uid('s');
    S.db.catalog[id] = { id, level: lv === '' ? 1 : +lv, ritual: false, conc: false, es: name || 'Nuevo conjuro', en: '', escuela: '', tiempo: 'Acción', alcance: '', duracion: '', comp: 'V S', coste: '', efecto: '', desc: '', sup: '' };
    invalidateItems();
    const bi = addToBook(id);
    closeSheet(dlg()); startEditing();
    setTimeout(() => { const n = document.querySelector(`#sp-${bi} [data-k="es"]`); if (n) { n.scrollIntoView({ block: 'center' }); n.focus(); document.getSelection().selectAllChildren(n); } }, 260);
  });
}
