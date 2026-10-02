// Rejilla para elegir las armas con maestría.
import { esc, norm } from '../../core/util.js';
import { PREDEFINIDOS } from '../../domain/equipo/equipo.js';
import { armaElegible, cupoMaestrias } from '../../domain/combate/maestria.js';
import { esSencilla } from '../../domain/reglas/competencias.js';
import { textoMaestria } from '../../domain/reglas/referencia.js';
import { gi } from '../componentes/tema.js';
import { icon } from '../componentes/icons.js';

// Rejilla para elegir las armas cuya maestría usas. `destacar`: armas que ya llevas.
export function maestriasHtml(ch, sel, { attr = 'data-maes', cupo = cupoMaestrias(ch), destacar = [] } = {}) {
  const armas = PREDEFINIDOS.filter(p => p.arma?.maestria && armaElegible(ch, p)), lleno = sel.length >= cupo, lleva = new Set(destacar.map(norm));
  const grupo = (t, xs) => xs.length ? `<h5 class="mz-g">${t}</h5><div class="mz-grid">${xs.map(p => { const on = sel.some(x => norm(x) === norm(p.nombre));
    return `<button type="button" class="mz-arma ${on ? 'on' : ''} ${lleva.has(norm(p.nombre)) ? 'lleva' : ''}" ${attr}="${esc(p.nombre)}" aria-pressed="${on}" ${!on && lleno ? 'disabled' : ''} title="${esc(textoMaestria(p.arma.maestria))}">
      <b>${esc(p.nombre)}</b>${lleva.has(norm(p.nombre)) ? '<em class="mz-lleva">la llevas</em>' : ''}<small>${gi('dote')}${esc(p.arma.maestria)} · ${esc(p.arma.dano)}</small></button>`; }).join('')}</div>` : '';
  return `<div class="mz ${lleno ? 'ok' : 'falta'}"><p class="mz-cab">${lleno ? icon('sparkles') : `<b class="cc-num">${cupo - sel.length}</b>`}<span><b>Maestría con armas</b>: eliges ${cupo} ${cupo === 1 ? 'tipo de arma' : 'tipos de arma'} cuya propiedad de maestría puedes usar (${sel.length} de ${cupo}). Puedes cambiar una tras cada descanso largo.</span></p>
    ${grupo('Sencillas', armas.filter(p => esSencilla(p)))}${grupo('Marciales', armas.filter(p => !esSencilla(p)))}</div>`;
}
export function alternar(sel, nombre, cupo) {
  const ya = sel.some(x => norm(x) === norm(nombre));
  return ya ? sel.filter(x => norm(x) !== norm(nombre)) : sel.length < cupo ? [...sel, nombre] : sel;
}
