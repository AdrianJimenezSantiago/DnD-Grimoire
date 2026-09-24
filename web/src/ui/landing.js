/** Portada: selección de personaje, animada y con el color de cada clase. */
import { esc } from '../core/util.js';
import { $, on, patch } from './dom.js';
import { gi, temaDe, aplicarTema } from './tema.js';
import { icon, ASTROLABE } from './icons.js';
import { claseLinea } from './sheet.js';
import { avatarHtml } from './avatar.js';
import { viewTransition } from './fx.js';
import { runaSvg, portalDesde, selloEn } from './magia.js';

let S, cbs, verPruebas = false;
export const landingVisible = () => document.body.classList.contains('on-landing');

function render() {
  const chars = S.db.chars, ult = S.db.activeId;
  const orden = [...chars].sort((a, b) => (b.id === ult) - (a.id === ult));
  const propios = orden.filter(c => !c.prueba), pruebas = orden.filter(c => c.prueba);
  const card = (c, i) => {
    const t = temaDe(c), n = c.book.length;
    return `<button type="button" class="lcard ${c.id === ult ? 'last' : ''}" data-lopen="${c.id}" style="--acc-h:${t.h};--acc-s:${t.s}%;--acc-k:1;--i:${i}">
      ${c.retrato ? `<span class="lc-av">${avatarHtml(c, 'lg')}<span class="lc-badge">${gi(t.icono)}</span></span>` : `<span class="lc-emb">${gi(t.icono)}</span>`}
      <span class="lc-txt"><span class="lc-name">${esc(c.nombre || 'Sin nombre')}</span><span class="lc-cls">${esc(claseLinea(c))}</span>
      <span class="lc-meta">${[c.especie, n === 1 ? '1 conjuro' : n + ' conjuros'].filter(Boolean).map(esc).join(' · ')}</span></span>
      <span class="lc-marca" aria-hidden="true">${gi(t.icono)}</span>
      ${c.id === ult ? '<span class="lc-cont">Continuar</span>' : ''}</button>`;
  };
  patch($('#landing'), `<div class="l-sky" aria-hidden="true">${ASTROLABE}</div>
    <header class="l-head"><span class="l-mark">${runaSvg({ n: 22, lados: 7, cls: 'l-runa', semillaInicial: 42 })}${gi('libro')}</span><h1>Grimorio</h1><p>Libro de conjuros para D&amp;D 2024</p></header>
    ${propios.length ? `<h2 class="l-h2">Elige personaje</h2><div class="l-grid">${propios.map(card).join('')}</div>` : ''}
    ${pruebas.length && verPruebas ? `<h2 class="l-h2">Clases de prueba <small>(${pruebas.length}, nivel ${pruebas[0].nivel})</small></h2>
      <p class="l-pruebas-nota">Un personaje por subclase, montado solo con las reglas. Sirven para revisar colores, emblemas, recursos y progresión.
        <button type="button" class="ghost" data-lcmd="pruebas">${gi('dados')}Regenerar</button><button type="button" class="ghost" data-lcmd="quitarPruebas">${icon('reset')}Quitar</button></p>
      <div class="l-grid">${pruebas.map((c, i) => card(c, propios.length + i)).join('')}</div>` : ''}
    ${propios.length || (pruebas.length && verPruebas) ? '' : `<div class="l-empty"><p>Aún no hay ningún personaje en este dispositivo.</p><p class="note">Crea el primero, o carga una copia de seguridad si ya tienes uno en otro sitio.</p></div>`}
    <div class="l-actions">
      <button type="button" class="${chars.length ? '' : 'gold'}" data-lcmd="nuevo">${icon('plus')}Nuevo personaje</button>
      <button type="button" data-lcmd="copia">${icon('save')}Cargar copia</button>
      <button type="button" data-lcmd="biblioteca">${gi('biblioteca')}Biblioteca</button>
      <button type="button" data-lcmd="manual">${gi('libro')}Libros y manuales</button>
      ${chars.length ? `<button type="button" data-lcmd="gestionar">${icon('users')}Gestionar personajes</button>` : ''}
    </div>
    <footer class="l-foot"><button type="button" class="ghost" data-lcmd="tutorial">${icon('info')}Ver tutorial</button>
      <button type="button" class="ghost" data-lcmd="revisarPruebas" aria-pressed="${!!(pruebas.length && verPruebas)}">${gi('dados')}${pruebas.length && verPruebas ? 'Ocultar clases de prueba' : 'Revisar clases de prueba'}</button></footer>`);
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
  S = store; cbs = callbacks; verPruebas = !!callbacks.pruebasAuto;
  S.subscribe(() => { if (landingVisible()) render(); });
  on($('#landing'), 'click', '[data-lopen]', (e, b) => {
    const r = b.getBoundingClientRect();
    selloEn(b.querySelector('.lc-emb, .lc-av'), { size: 150, dur: 700 });
    portalDesde(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2);
    setTimeout(() => abrir(b), 120);
  });
  const abrir = b => viewTransition(() => { S.editing = false; S.edit(db => { db.activeId = b.dataset.lopen; }); hideLanding(); window.scrollTo({ top: 0 }); cbs.onOpen?.(); });
  on($('#landing'), 'click', '[data-lcmd]', (e, b) => {
    const c = b.dataset.lcmd;
    if (c !== 'revisarPruebas') return cbs.cmd(c);
    // «Revisar clases de prueba»: la primera vez los crea; luego muestra u oculta su sección
    if (!S.db.chars.some(x => x.prueba)) { verPruebas = true; cbs.cmd('pruebas'); } else { verPruebas = !verPruebas; render(); }
    if (verPruebas) setTimeout(() => $('#landing .l-pruebas-nota')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  });
}
