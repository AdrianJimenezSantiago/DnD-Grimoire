// Rejilla para elegir las maniobras del Maestro del combate.
import { esc, norm } from '../../core/util.js';
import { MANIOBRAS } from '../../domain/clases/maniobras.js';
import { gi } from '../componentes/tema.js';
import { icon } from '../componentes/icons.js';

const ICO = { accion: 'o_arma', adicional: 'velocidad', reaccion: 'esc_abj', pasivo: 'ca', fuera: 'ojo' };
const CUANDO = { accion: 'acción', adicional: 'acción adicional', reaccion: 'reacción', pasivo: 'al atacar o moverte', fuera: 'pruebas' };
// Rejilla para elegir las maniobras del Maestro del combate
export function maniobrasHtml(sel, { attr = 'data-man', cupo, nota = '' } = {}) {
  const lleno = sel.length >= cupo, tiene = new Set(sel.map(norm));
  const cards = MANIOBRAS.map(m => { const on = tiene.has(norm(m.nombre));
    return `<button type="button" class="lv-estilo ${on ? 'on' : ''}" ${attr}="${esc(m.nombre)}" aria-pressed="${on}" ${!on && lleno ? 'disabled' : ''}>
      <span class="lv-estilo-ico">${gi(ICO[m.grupo] || 'ca')}</span><b>${esc(m.nombre)}<small>${esc(CUANDO[m.grupo])}</small></b><span class="sp-text">${esc(m.texto)}</span></button>`; }).join('');
  // Las escritas a mano (de otro manual) se muestran para poder quitarlas
  const otras = sel.filter(n => !MANIOBRAS.some(m => norm(m.nombre) === norm(n)));
  return `<div class="cc-elige ${lleno ? 'ok' : 'falta'}"><p>${lleno ? icon('sparkles') : `<b class="cc-num">${cupo - sel.length}</b>`}<b>Maniobras</b>: conoces ${cupo} (${sel.length} de ${cupo}). Cada una gasta un dado de supremacía.${nota ? ` ${esc(nota)}` : ''}</p>
    ${otras.length ? `<div class="cc-pills">${otras.map(n => `<button type="button" class="cc-pill on" ${attr}="${esc(n)}" aria-pressed="true">${esc(n)} ×</button>`).join('')}</div>` : ''}</div>
    <div class="lv-estilos man-grid">${cards}</div>`;
}
