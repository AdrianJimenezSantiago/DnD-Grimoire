/** Glosario de reglas importado: lista con búsqueda y ficha de cada término (estados enlazados desde los textos). */
import { esc, norm } from '../../core/util.js';
import { glosario, termino, setGlosario } from '../../domain/catalogo.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { openSheet } from '../dialog.js';
import { md } from './conjuro.js';
import { fileStore } from '../../platform/native.js';
import { openBiblioteca, abrirTermino } from './biblioteca.js';

export const ARCHIVO_GLOS = 'manual-glosario.json';
export async function cargarGlosarioGuardado() {
  try { const raw = await fileStore.get(ARCHIVO_GLOS); if (raw) { setGlosario(JSON.parse(raw)); return true; } } catch { /* sin datos */ }
  return false;
}
const ORDEN = ['Estado', 'Acción', 'Área de efecto', 'Peligro', 'Actitud', ''];
function lista() {
  const q = norm($('#glQ').value.trim()), todo = glosario();
  if (!todo.length) { $('#glList').innerHTML = `<p class="pempty">Aún no has importado el glosario. En Más → Manual del jugador, elige tu PDF: se leen a la vez los conjuros y el glosario de reglas.</p>`; return; }
  const f = todo.filter(e => !q || norm(e.nombre).includes(q) || norm(e.texto).includes(q));
  const grupos = ORDEN.map(c => [c, f.filter(e => e.cat === c).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))]).filter(([, v]) => v.length);
  $('#glList').innerHTML = grupos.map(([c, v]) => `<h3 class="hday">${c ? esc(c) + (c === 'Estado' ? 's' : c === 'Acción' ? 'es' : 's') : 'Reglas'}</h3>
    <div class="gl-grid">${v.map(e => `<button type="button" class="gl-item ${e.cat === 'Estado' ? 'estado' : ''}" data-term="${e.clave}">${esc(e.nombre)}</button>`).join('')}</div>`).join('')
    || '<p class="pempty">Nada coincide con la búsqueda.</p>';
}
export function openGlosario() { openBiblioteca('reglas'); }
export function openTerm(clave) { abrirTermino(clave); }
export function openTermViejo(clave) {
  const e = termino(clave); if (!e) return;
  $('#tmTitle').textContent = e.nombre;
  $('#tmSub').innerHTML = e.cat ? `<span class="tm-cat">${esc(e.cat)}</span>` : '';
  $('#tmBody').innerHTML = `<section class="sp-text">${md(e.texto)}</section><p class="srcnote">${gi('glosario')} Glosario de reglas del Manual del Jugador (importado de tu PDF)</p>`;
  openSheet($('#termDlg'));
}
export function init() {
  on(document, 'click', '[data-term]', (e, b) => { e.preventDefault(); e.stopPropagation(); abrirTermino(b.dataset.term); });
}
