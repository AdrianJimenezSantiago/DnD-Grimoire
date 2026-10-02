// Gestión de personajes: la lista para abrir, editar, duplicar, exportar y borrar cada uno.
// Se carga aparte (app/asistentes.js) junto con el asistente de creación, que inicia y del que reexporta abrirCreacion.
import { clone, esc, uid } from '../../core/util.js';
import { ESQUEMA } from '../../domain/personaje/modelo.js';
import { $, on } from '../componentes/dom.js';
import { claseLinea, origenLinea } from '../../domain/personaje/descripcion.js';
import { abrirDialogo, cerrarDialogo } from '../componentes/dialog.js';
import { toast, botonDeshacer } from '../componentes/toast.js';
import { transicionVista } from '../animaciones/fx.js';
import { confirmar } from '../componentes/modal.js';
import { avatarHtml } from '../componentes/avatar.js';
import { temaDe, gi } from '../componentes/tema.js';
import { estiloPaleta } from '../../domain/presentacion/paleta.js';
import { archivos, compartirJson } from '../../platform/native.js';
import { initCreacion, abrirCreacion } from './creacionPersonaje.js';

export { abrirCreacion };
let S;
const charsDlg = () => $('#charsDlg');

export function abrirPersonaje(id) {
  if (!S.db.chars.some(c => c.id === id)) return;
  transicionVista(() => { S.editing = false; S.edit(db => { db.activeId = id; }); window.scrollTo({ top: 0 }); document.dispatchEvent(new CustomEvent('grimorio:abierto')); });
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
export function abrirPersonajes() { renderList(); abrirDialogo(charsDlg()); }

function duplicate(id) {
  const src = S.db.chars.find(c => c.id === id); if (!src) return;
  const h = S.edit(db => {
    const c = clone(src); c.id = uid('c'); c.nombre = `${src.nombre} (copia)`;
    c.play = { used: {}, conc: '', rec: {}, log: [], onlyPrep: src.play.onlyPrep }; c.book.forEach(e => { e.used = false; }); c.diario = { sesiones: [] };
    db.chars.splice(db.chars.findIndex(x => x.id === id) + 1, 0, c);
  });
  renderList(); toast(`Creada «${esc(src.nombre)} (copia)».`, [botonDeshacer(S, h)]);
}
export function paqueteDe(db, c) {
  const conjuros = Object.fromEntries(c.book.map(e => [e.sid, db.catalog[e.sid]]).filter(([, x]) => x));
  return { tipo: 'grimorio-personaje', version: 1, schema: ESQUEMA, fecha: new Date().toISOString(), personaje: clone(c), conjuros };
}
async function exportar(id) {
  const c = S.db.chars.find(x => x.id === id); if (!c) return;
  const nombre = `${(c.nombre || 'personaje').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'personaje'}.grimorio.json`;
  try { await compartirJson(nombre, JSON.stringify(paqueteDe(S.db, c), null, 1)); toast(`<b>${esc(c.nombre)}</b> exportado. Se abre desde «Cargar copia» en cualquier grimorio.`); }
  catch (e) { if (!/cancel/i.test(String(e?.message))) toast('No se pudo exportar el personaje.'); }
}
async function remove(id) {
  const c = S.db.chars.find(x => x.id === id); if (!c) return;
  if (!(await confirmar({ titulo: `¿Borrar a ${c.nombre || 'este personaje'}?`, texto: 'Se borran su ficha, su libro y su historial. Los conjuros siguen en el catálogo para los demás personajes.', ok: 'Borrar personaje', peligro: true }))) return;
  const h = S.edit(db => { db.chars = db.chars.filter(x => x.id !== id); if (db.activeId === id) db.activeId = db.chars[0]?.id ?? null; });
  archivos.remove(`retrato-${id}.txt`);
  renderList(); toast(`${esc(c.nombre || 'Personaje')} borrado.`, [botonDeshacer(S, h)]);
}

export function init(store, opciones) {
  S = store; initCreacion(store, opciones);
  S.subscribe(() => { if (charsDlg().open) renderList(); });
  document.addEventListener('grimorio:creado', () => { if (charsDlg().open) cerrarDialogo(charsDlg()); });
  $('#charNew').addEventListener('click', () => abrirCreacion(null));
  on($('#charList'), 'click', '[data-openc],[data-editc],[data-dupc],[data-delc],[data-expc]', (e, t) => {
    if (t.dataset.openc) { cerrarDialogo(charsDlg()); abrirPersonaje(t.dataset.openc); return; }
    if (t.dataset.editc) return abrirCreacion(t.dataset.editc);
    if (t.dataset.dupc) return duplicate(t.dataset.dupc);
    if (t.dataset.delc) return remove(t.dataset.delc);
    if (t.dataset.expc) return exportar(t.dataset.expc);
  });
}
