// Selector genérico de una opción de una lista, con búsqueda y grupos. Devuelve una promesa con la elección.
import { esc, norm } from '../../core/util.js';
import { $, on } from '../componentes/dom.js';
import { gi } from '../componentes/tema.js';
import { icon } from '../componentes/icons.js';
import { openSheet, closeSheet } from '../componentes/dialog.js';

let E = null;
const dlg = () => $('#elegirDlg');

export function elegir({ titulo, sub = '', items, grupos = null, actual = '', libre = true, placeholder = 'Buscar', vacio = '', ico = 'dote', grupoInicial = '' }) {
  // Si la elección anterior aún se está cerrando, se espera a que termine: si no, su cierre se llevaría también esta
  const libreYa = dlg().open ? new Promise(r => dlg().addEventListener('close', r, { once: true })) : Promise.resolve();
  return libreYa.then(() => new Promise(resolve => {
    const orden = grupos || [...new Set(items.map(i => i.grupo || ''))];
    E = { items, orden, actual, libre, resolve, q: '', grupo: orden.includes(grupoInicial) ? grupoInicial : '', abierto: null, hecho: false, vacio, ico };
    $('#elTitle').innerHTML = `${gi(ico, 'el-tit-ico')}<span>${esc(titulo)}</span>`;
    $('#elSub').textContent = sub;
    $('#elQ').value = ''; $('#elQ').placeholder = placeholder;
    pintarGrupos(); pintar();
    openSheet(dlg());
    const sel = dlg().querySelector('.el-card.on'); if (sel) setTimeout(() => sel.scrollIntoView({ block: 'center' }), 80);
    dlg().addEventListener('close', () => { if (!E?.hecho) E?.resolve(null); E = null; }, { once: true });
  }));
}

function pintarGrupos() {
  const hay = E.orden.filter(g => E.items.some(i => (i.grupo || '') === g));
  $('#elGrupos').innerHTML = hay.length > 1 ? [['', 'Todo'], ...hay.map(g => [g, g || 'Otros'])].map(([k, t]) =>
    `<button type="button" role="tab" aria-selected="${E.grupo === k}" data-elg="${esc(k)}">${esc(t)}${k ? `<small>${E.items.filter(i => (i.grupo || '') === k).length}</small>` : ''}</button>`).join('') : '';
  $('#elGrupos').hidden = hay.length < 2;
}
const coincide = (i, q) => !q || norm(i.nombre).includes(q) || norm(i.sub || '').includes(q) || norm(i.buscar || '').includes(q);

function tarjeta(i, k) {
  const on = norm(i.valor ?? i.nombre) === norm(E.actual), ab = E.abierto === k;
  return `<div class="el-item ${ab ? 'abierto' : ''}" ${i.tono ? `style="--el-h:${i.tono}"` : ''}>
    <button type="button" class="el-card ${on ? 'on' : ''} ${i.aviso ? 'aviso' : ''}" data-elk="${k}" aria-expanded="${ab}" ${i.bloqueado ? 'aria-disabled="true"' : ''}>
      <span class="el-ico">${gi(i.ico || E.ico)}</span>
      <span class="el-t"><b>${esc(i.nombre)}</b>${i.sub ? `<small>${esc(i.sub)}</small>` : ''}</span>
      ${i.tag ? `<span class="el-tag">${esc(i.tag)}</span>` : ''}${on ? '<span class="el-ok" aria-hidden="true">✓</span>' : i.detalle ? `<span class="el-mas">${icon('chevron')}</span>` : ''}</button>
    ${ab ? `<div class="el-det">${i.aviso ? `<p class="el-aviso">${esc(i.aviso)}</p>` : ''}${i.detalle || ''}
      <div class="el-det-acc">${i.bloqueado ? `<span class="el-bloq">${esc(i.bloqueado)}</span>` : `<button type="button" class="gold" data-elsel="${k}">Elegir ${esc(i.nombre)}</button>`}</div></div>` : ''}</div>`;
}
function pintar() {
  const q = norm(E.q.trim()), lista = E.items.map((i, k) => [i, k]).filter(([i]) => (!E.grupo || (i.grupo || '') === E.grupo) && coincide(i, q));
  const exacto = E.items.some(i => norm(i.nombre) === q);
  let h = '';
  if (E.libre && q && !exacto) h += `<button type="button" class="el-libre" data-ellibre>${icon('quill')}<span>Usar «<b>${esc(E.q.trim())}</b>» tal cual</span></button>`;
  const porGrupo = E.orden.map(g => [g, lista.filter(([i]) => (i.grupo || '') === g)]).filter(([, v]) => v.length);
  h += porGrupo.map(([g, v]) => `<section class="el-g">${porGrupo.length > 1 || g ? `<h3>${esc(g || 'Otros')}<small>${v.length}</small></h3>` : ''}<div class="el-grid">${v.map(([i, k]) => tarjeta(i, k)).join('')}</div></section>`).join('');
  if (!lista.length && !(E.libre && q)) h += `<p class="el-vacio">${esc(E.vacio || 'Nada coincide con la búsqueda.')}</p>`;
  $('#elBody').innerHTML = h;
}
function fin(valor) { if (!E) return; E.hecho = true; const r = E.resolve; closeSheet(dlg()); r(valor); }

export function init() {
  $('#elQ').addEventListener('input', e => { E.q = e.target.value; E.abierto = null; pintar(); });
  $('#elQ').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return; e.preventDefault();
    const q = norm(E.q.trim()), ex = E.items.find(i => norm(i.nombre) === q && !i.bloqueado);
    if (ex) return fin(ex.valor ?? ex.nombre);
    if (E.libre && q) fin(E.q.trim());
  });
  on($('#elGrupos'), 'click', '[data-elg]', (e, b) => { E.grupo = b.dataset.elg; E.abierto = null; pintarGrupos(); pintar(); $('#elBody').scrollTop = 0; });
  on($('#elBody'), 'click', '[data-elk]', (e, b) => {
    const k = +b.dataset.elk, i = E.items[k];
    if (!i.detalle && !i.aviso && !i.bloqueado) return fin(i.valor ?? i.nombre);
    E.abierto = E.abierto === k ? null : k; pintar();
    $('#elBody').querySelector('.el-item.abierto')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  on($('#elBody'), 'click', '[data-elsel]', (e, b) => { const i = E.items[+b.dataset.elsel]; fin(i.valor ?? i.nombre); });
  on($('#elBody'), 'click', '[data-ellibre]', () => fin(E.q.trim()));
}
