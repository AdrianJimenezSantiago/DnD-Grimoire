// «¿Sobre quién?»: al lanzar un conjuro que ayuda, marca a quién afecta; si te incluyes, el efecto se te aplica solo
import { esc } from '../../core/util.js';
import { efectoDeConjuro, fmtRondas } from '../../domain/combate/efectos.js';
import { esYo, listaObjetivos } from '../../domain/combate/vida.js';
import { claveEscuela } from '../../domain/conjuros/espacios.js';
import { $, on } from '../componentes/dom.js';
import { gi } from '../componentes/tema.js';
import { avatarHtml } from '../componentes/avatar.js';
import { abrirDialogo, cerrarDialogo } from '../componentes/dialog.js';
import { anadirObjetivos, quitarObjetivo, alternarYo, claveObjetivos } from '../../app/acciones.js';

let S, O = null;
const dlg = () => $('#objDlg');

export function abrirObjetivos({ clave, conjuro, L }) {
  O = { clave, conjuro, L }; render(); abrirDialogo(dlg());
}
function render() {
  const ch = S.cur(); if (!ch || !O) return;
  const ef = efectoDeConjuro(O.conjuro), s = Object.values(S.db.catalog).find(x => x.es === O.conjuro);
  const lista = O.clave ? listaObjetivos(ch.play, O.clave) || [] : [], yo = lista.some(o => esYo(ch, o)), nombre = ch.nombre || 'Tu personaje';
  dlg().style.setProperty('--esc', s?.escuela ? `var(--sc-${claveEscuela(s.escuela) || 'none'})` : 'var(--gold)');
  $('#objTitle').textContent = '¿Sobre quién?';
  $('#objSub').innerHTML = `<b>${esc(O.conjuro)}</b>${ef ? ` · ${esc(ef.texto)}` : ''}`;
  const otros = lista.map((o, i) => [o, i]).filter(([o]) => !esYo(ch, o));
  $('#objBody').innerHTML = `
    <button type="button" class="oy-yo ${yo ? 'on' : ''}" data-oyyo aria-pressed="${yo}">
      <span class="oy-aura" aria-hidden="true"></span>${avatarHtml(ch, 'oy-av')}
      <span class="oy-t"><small>${yo ? 'Te afecta' : 'Tú'}</small><b>${esc(nombre)}</b>
        <em>${yo ? `${ef?.tiraObjetivo ? 'Tus tiradas llevan el dado extra solas' : 'La hoja ya lo tiene en cuenta'}${ef?.dur ? ` · ${esc(fmtRondas(ch.play.conc === O.conjuro && ch.play.concRondas != null ? ch.play.concRondas : ef.dur))}` : ''}` : 'Tócalo si te incluyes entre los objetivos'}</em></span>
      <span class="oy-sello" aria-hidden="true">${gi(ef?.ico || 'inspiracion')}</span></button>
    <p class="oy-lbl">${gi('criatura')}Otros objetivos <small>opcional</small></p>
    <div class="objt-list oy-lista">${otros.map(([o, i]) => `<button type="button" class="obj-chip" data-oydel="${i}" aria-label="Quitar ${esc(o)}">${esc(o)}<span aria-hidden="true">×</span></button>`).join('')}
      <input class="obj-in" maxlength="60" id="oyIn" placeholder="${otros.length ? 'Añadir otro…' : 'Nombre y pulsa Intro'}" autocomplete="off" enterkeyhint="done" aria-label="Añadir objetivo"></div>
    <p class="hint">Si escribes «${esc(nombre.split(' ')[0])}» o «yo» también cuenta como tú. Puedes cambiarlo luego en «Efectos activos» de la hoja.</p>`;
}
const clave = () => { if (!O.clave) O.clave = claveObjetivos(S, O.conjuro); return O.clave; };

export function init(store) {
  S = store;
  const body = $('#objBody');
  on(body, 'click', '[data-oyyo]', () => { alternarYo(S, clave(), { L: O.L }); });
  on(body, 'click', '[data-oydel]', (e, b) => quitarObjetivo(S, O.clave, +b.dataset.oydel));
  const anotar = inp => { const t = inp.value; inp.value = ''; if (t.trim() && anadirObjetivos(S, clave(), t, { L: O.L })) setTimeout(() => $('#oyIn')?.focus({ preventScroll: true }), 30); };
  body.addEventListener('keydown', e => { if (e.target.id === 'oyIn' && e.key === 'Enter') { e.preventDefault(); anotar(e.target); } });
  body.addEventListener('focusout', e => { if (e.target.id === 'oyIn' && e.target.value.trim()) anotar(e.target); });
  S.subscribe(() => {
    if (!dlg().open || !O) return;
    // Si se pierde la concentración mientras está abierto, ya no hay objetivos que marcar
    if (O.clave === 'conc' && S.cur()?.play.conc !== O.conjuro) return cerrarDialogo(dlg());
    const f = document.activeElement?.id === 'oyIn'; render(); if (f) $('#oyIn')?.focus({ preventScroll: true });
  });
}
