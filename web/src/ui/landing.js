/** Portada: selección de personaje, animada y con el color de cada clase. */
import { esc } from '../core/util.js';
import { $, on, patch } from './dom.js';
import { gi, temaDe, aplicarTema } from './tema.js';
import { icon, ASTROLABE } from './icons.js';
import { claseLinea } from './sheet.js';
import { avatarHtml } from './avatar.js';
import { viewTransition } from './fx.js';

let S, cbs;
export const landingVisible = () => document.body.classList.contains('on-landing');

function render() {
  const chars = S.db.chars, ult = S.db.activeId;
  const orden = [...chars].sort((a, b) => (b.id === ult) - (a.id === ult));
  const card = (c, i) => {
    const t = temaDe(c), n = c.book.length;
    return `<button type="button" class="lcard ${c.id === ult ? 'last' : ''}" data-lopen="${c.id}" style="--acc-h:${t.h};--acc-s:${t.s}%;--i:${i}">
      ${c.retrato ? `<span class="lc-av">${avatarHtml(c, 'lg')}<span class="lc-badge">${gi(t.icono)}</span></span>` : `<span class="lc-emb">${gi(t.icono)}</span>`}
      <span class="lc-txt"><span class="lc-name">${esc(c.nombre || 'Sin nombre')}</span><span class="lc-cls">${esc(claseLinea(c))}</span>
      <span class="lc-meta">${[c.especie, n === 1 ? '1 conjuro' : n + ' conjuros'].filter(Boolean).map(esc).join(' · ')}</span></span>
      ${c.id === ult ? '<span class="lc-cont">Continuar</span>' : ''}</button>`;
  };
  patch($('#landing'), `<div class="l-sky" aria-hidden="true">${ASTROLABE}</div>
    <header class="l-head"><span class="l-mark">${gi('libro')}</span><h1>Grimorio</h1><p>Libro de conjuros para D&amp;D 2024</p></header>
    ${chars.length ? `<h2 class="l-h2">Elige personaje</h2><div class="l-grid">${orden.map(card).join('')}</div>`
      : `<div class="l-empty"><p>Aún no hay ningún personaje en este dispositivo.</p><p class="note">Crea el primero, o carga una copia de seguridad si ya tienes uno en otro sitio.</p></div>`}
    <div class="l-actions">
      <button type="button" class="${chars.length ? '' : 'gold'}" data-lcmd="nuevo">${icon('plus')}Nuevo personaje</button>
      <button type="button" data-lcmd="copia">${icon('save')}Cargar copia</button>
      <button type="button" data-lcmd="biblioteca">${gi('biblioteca')}Biblioteca</button>
      <button type="button" data-lcmd="manual">${gi('libro')}Libros y manuales</button>
      ${chars.length ? `<button type="button" data-lcmd="gestionar">${icon('users')}Gestionar personajes</button>` : ''}
    </div>
    <footer class="l-foot"><button type="button" class="ghost" data-lcmd="tutorial">${icon('info')}Ver tutorial</button></footer>`);
}
export function showLanding() {
  render(); aplicarTema(null);
  document.body.classList.add('on-landing'); $('#landing').hidden = false; $('#landing').scrollTop = 0;
  document.body.classList.remove('landing-in'); void document.body.offsetWidth; document.body.classList.add('landing-in');
  cbs.onShow?.();
}
export function hideLanding() {
  document.body.classList.remove('on-landing'); $('#landing').hidden = true;
  aplicarTema(S.cur()); S.emit('ui');
}
export function init(store, callbacks) {
  S = store; cbs = callbacks;
  S.subscribe(() => { if (landingVisible()) render(); });
  on($('#landing'), 'click', '[data-lopen]', (e, b) => viewTransition(() => { S.editing = false; S.edit(db => { db.activeId = b.dataset.lopen; }); hideLanding(); window.scrollTo({ top: 0 }); cbs.onOpen?.(); }));
  on($('#landing'), 'click', '[data-lcmd]', (e, b) => cbs.cmd(b.dataset.lcmd));
}
