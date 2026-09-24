/**
 * Objetos mágicos del personaje: sintonización (tres huecos), cargas (van a la hoja como recurso) y notas.
 */
import { esc } from '../../core/util.js';
import { equipoDe, sintonizados, MAX_SINTONIA, alternarSintonia, quitarObjeto } from '../../domain/equipo.js';
import { reglas, usosGastados } from '../../domain/rasgos.js';
import { biblioteca } from '../../domain/catalogo.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { icon } from '../icons.js';
import { avatarHtml } from '../avatar.js';
import { openSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { haptic } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';
import { RAR_K, TIPO_I, abrirObjeto, openBiblioteca } from './biblioteca.js';

let S;
const dlg = () => $('#equipoDlg');
function render() {
  const ch = S.cur(); if (!ch) return;
  const eq = equipoDe(ch), sin = sintonizados(ch), R = reglas(ch);
  $('#eqHead').innerHTML = `${avatarHtml(ch, 'md')}<div><h2 id="eqTitle">Objetos de ${esc(ch.nombre)}</h2><div class="dsub">${eq.objetos.length ? `${eq.objetos.length} ${eq.objetos.length === 1 ? 'objeto mágico' : 'objetos mágicos'}` : 'Lo que lleva encima, sintonizado o no'}</div></div>`;
  const huecos = Array.from({ length: MAX_SINTONIA }, (_, i) => { const o = sin[i];
    return `<div class="sig ${o ? 'on' : ''}" title="${o ? esc(o.nombre) : 'Hueco libre'}"><span class="sig-ring">${gi(o ? TIPO_I[o.tipo] || 'o_maravilloso' : 'sintonia')}</span><small>${o ? esc(o.nombre) : 'Libre'}</small></div>`; }).join('');
  let h = `<section class="sig-row" aria-label="Sintonización">${huecos}</section>`;
  if (!eq.objetos.length) h += `<div class="bib-empty">${gi('cofre')}<p>Aún no lleva objetos mágicos.</p><p class="note">Búscalos en la biblioteca y pulsa «Añadir a ${esc(ch.nombre)}». Si tienen cargas, aparecen en la hoja como un recurso más y se recuperan solas al amanecer.</p>
    <button type="button" class="gold" data-eq="bib">${gi('biblioteca')}Abrir objetos mágicos</button></div>`;
  else h += `<ul class="eq-list">${eq.objetos.map(o => {
    const r = o.rasgo && R.find(x => x.id === o.rasgo), libres = r ? r.max - usosGastados(ch, r) : 0, conTexto = biblioteca().objetos.some(x => x.clave === o.clave);
    return `<li class="eq r-${RAR_K[o.rareza] || 'varia'} ${o.sintonizado ? 'sint' : ''}">
      <button type="button" class="eq-main" ${conTexto ? `data-eqver="${esc(o.clave)}"` : 'disabled'}><span class="obj-ico">${gi(TIPO_I[o.tipo] || 'o_maravilloso')}</span>
        <span class="obj-t"><b>${esc(o.nombre)}</b><small>${esc(o.tipo || 'Objeto')} · <span class="rar-txt">${esc(o.rareza || '')}</span>${r ? ` · ${libres} de ${r.max} cargas` : ''}</small></span></button>
      <span class="eq-acts">${o.sintonia ? `<button type="button" class="chip ${o.sintonizado ? 'gold' : ''}" data-eqsin="${o.id}" aria-pressed="${o.sintonizado}">${gi('sintonia')}${o.sintonizado ? 'Sintonizado' : 'Sintonizar'}</button>` : '<span class="eq-nosin">Sin sintonía</span>'}
        <button type="button" class="iconbtn sm" data-eqdel="${o.id}" aria-label="Quitar ${esc(o.nombre)}">×</button></span></li>`; }).join('')}</ul>`;
  $('#eqBody').innerHTML = h;
  $('#eqFoot').innerHTML = `<button type="button" data-eq="bib">${gi('biblioteca')}Buscar objetos</button><span class="spacer"></span><button type="button" class="primary" data-close>Cerrar</button>`;
}
export function openEquipo() { if (!S.cur()) return; render(); openSheet(dlg()); }
export function init(store) {
  S = store;
  const d = dlg();
  on(d, 'click', '[data-eq="bib"]', () => openBiblioteca('objetos'));
  on(d, 'click', '[data-eqver]', (e, b) => abrirObjeto(b.dataset.eqver));
  on(d, 'click', '[data-eqsin]', (e, b) => {
    let ok = true; S.edit((db, ch) => { ok = alternarSintonia(ch, b.dataset.eqsin); });
    if (!ok) toast(`Ya hay ${MAX_SINTONIA} objetos sintonizados. Deja de sintonizar uno antes (lleva un descanso corto).`); else haptic();
    render();
  });
  on(d, 'click', '[data-eqdel]', (e, b) => {
    let o; const h = S.edit((db, ch) => { o = quitarObjeto(ch, b.dataset.eqdel); });
    render(); toast(`<b>${esc(o?.nombre || 'Objeto')}</b> quitado.`, [undoBtn(S, h)]);
  });
  S.subscribe?.(() => { if (d.open) render(); });
}
