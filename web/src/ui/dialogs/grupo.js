// Vista de grupo: una tarjeta por personaje con CA, PG, pasivas, salvaciones, CD y estados, para el DJ o para quien lleve varios.
import { esc } from '../../core/util.js';
import { resumenGrupo } from '../../domain/presentacion/grupo.js';
import { $, on } from '../componentes/dom.js';
import { abrirDialogo, cerrarDialogo } from '../componentes/dialog.js';

let S;
const dlg = () => $('#grupoDlg');
function tarjeta(f, mejores) {
  const pas = (k, t) => `<span class="gr-pas${f.pasivas[k] === mejores[k] ? ' mejor' : ''}"${f.pasivas[k] === mejores[k] ? ' title="La más alta del grupo"' : ''}><small>${t}</small><b>${f.pasivas[k]}</b></span>`;
  return `<article class="gr-card ${f.vital}">
    <header><div><h3>${esc(f.nombre)}</h3><small>${esc([f.clase, f.especie].filter(Boolean).join(' · '))}</small></div>
      <button type="button" data-grabrir="${esc(f.id)}">Abrir hoja</button></header>
    <div class="gr-vit"><span><small>CA</small><b>${f.ca}</b></span><span class="gr-pg"><small>PG</small><b>${f.pg}<i>/${f.pgMax}</i></b>${f.temp ? `<em>+${f.temp}</em>` : ''}</span>
      <span><small>Inic.</small><b>${esc(f.iniciativa)}</b></span><span><small>Vel.</small><b>${esc(f.velocidad)}</b></span>${f.cd ? `<span><small>CD</small><b>${esc(f.cd)}</b></span>` : ''}</div>
    <div class="gr-pasivas">${pas('percepcion', 'Percepción')}${pas('investigacion', 'Investigación')}${pas('perspicacia', 'Perspicacia')}</div>
    <div class="gr-salv" aria-label="Salvaciones">${f.salvaciones.map(x => `<span class="${x.competente ? 'comp' : ''}"><small>${x.corto}</small>${esc(x.bono)}</span>`).join('')}</div>
    ${f.estados.length || f.concentracion || f.inspiracion ? `<p class="gr-est">${[...f.estados.map(e => `<span class="chip sm mal">${esc(e)}</span>`), f.concentracion ? `<span class="chip sm">Concentrado: ${esc(f.concentracion)}</span>` : '', f.inspiracion ? '<span class="chip sm bien">Inspiración</span>' : ''].join('')}</p>` : ''}
  </article>`;
}
function render() {
  const { filas, mejores } = resumenGrupo(S.db);
  $('#grBody').innerHTML = filas.length ? `<div class="gr-lista">${filas.map(f => tarjeta(f, mejores)).join('')}</div>`
    : '<p class="pempty">Aún no hay personajes en este dispositivo.</p>';
}
export function abrirGrupo() { render(); abrirDialogo(dlg()); }
export function init(store) {
  S = store;
  S.subscribe(() => { if (dlg().open) render(); });
  on($('#grBody'), 'click', '[data-grabrir]', (e, b) => {
    const id = b.dataset.grabrir; if (!S.db.chars.some(c => c.id === id)) return;
    cerrarDialogo(dlg());
    S.edit(db => { db.activeId = id; });
    document.dispatchEvent(new CustomEvent('grimorio:abierto'));
  });
}
