import { esc } from '../../core/util.js';
import { $, on } from '../componentes/dom.js';
import { openSheet } from '../componentes/dialog.js';
import { toast } from '../componentes/toast.js';
import { confirmar } from '../componentes/modal.js';

let S;
const fmtDay = t => new Date(t).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtT = t => new Date(t).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

function render() {
  const ch = S.cur(), log = ch?.play.log || [];
  $('#histSub').textContent = ch ? `${ch.nombre}. Lo más reciente, arriba.` : '';
  if (!log.length) { $('#histBody').innerHTML = '<p class="pempty">Aún no hay nada en el historial. Aquí aparecerá cada conjuro que lances, cada espacio y recurso que gastes y cada descanso.</p>'; return; }
  let day = '', h = '';
  [...log].reverse().forEach(e => {
    const d = fmtDay(e.t); if (d !== day) { day = d; h += `<h3 class="hday">${esc(d)}</h3>`; }
    h += `<div class="hrow ${/^Descanso/.test(e.x) ? 'rest' : ''}"><time>${fmtT(e.t)}</time><span class="hx">${esc(e.x)}</span>${S.undoable(e.id) ? `<button type="button" data-hundo="${e.id}">Deshacer</button>` : ''}</div>`;
  });
  $('#histBody').innerHTML = h + '<p class="note" style="margin-top:14px">«Deshacer» devuelve la hoja a como estaba justo antes de esa acción, así que también deshace todo lo posterior. Solo se puede mientras la app sigue abierta.</p>';
}
export function openHistory() { render(); openSheet($('#histDlg')); }
export function init(store) {
  S = store;
  S.subscribe(() => { if ($('#histDlg').open) render(); });
  on($('#histBody'), 'click', '[data-hundo]', async (ev, b) => {
    const hist = S.history(), i = hist.findIndex(h => h.id === b.dataset.hundo); if (i < 0) return;
    const n = hist.length - i;
    if (n > 1 && !(await confirmar({ titulo: `¿Deshacer ${n} acciones?`, texto: `La hoja vuelve a como estaba justo antes de esta acción, así que también se deshace${n - 1 === 1 ? ' la posterior' : 'n las ' + (n - 1) + ' posteriores'}.`, ok: 'Deshacer', icono: 'hourglass' }))) return;
    S.undo(hist[i]); toast(n > 1 ? `Deshechas ${n} acciones.` : 'Acción deshecha.');
  });
  $('#histClear').addEventListener('click', async () => { const ch = S.cur(); if (!ch || !(await confirmar({ titulo: '¿Borrar el historial?', texto: `Se borra lo anotado de ${ch.nombre}. La hoja no cambia.`, ok: 'Borrar', peligro: true }))) return; S.edit((db, c) => { c.play.log = []; }); });
}
