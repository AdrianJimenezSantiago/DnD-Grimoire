// Forma salvaje, familiares e invocaciones: perfiles de criatura que el personaje puede adoptar o convocar.
import { esc, norm, uid } from '../../core/util.js';
import { biblioteca } from '../../domain/libros/biblioteca.js';
import { formasPosibles, limiteFormaSalvaje, vdTexto } from '../../domain/criaturas/monstruos.js';
import { $, on } from '../componentes/dom.js';
import { gi } from '../componentes/tema.js';
import { icon } from '../componentes/icons.js';
import { openSheet } from '../componentes/dialog.js';
import { toast } from '../componentes/toast.js';
import { abrirCriatura } from './biblioteca.js';

let S, F = { modo: 'salvaje', vd: 1, q: '', solo: false, abrirMano: false };
const dlg = () => $('#formasDlg');
const VDS = [0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const TIT = { salvaje: 'Forma salvaje', polimorfar: 'Polimorfar', verdadero: 'Polimorfar verdadero' };

export function openFormas(modo = 'salvaje') {
  const ch = S.cur(); if (!ch) return;
  F = { modo, q: '', abrirMano: false, solo: modo === 'salvaje' && (ch.formas || []).length > 0, vd: modo === 'salvaje' ? limiteFormaSalvaje(ch).vd : Math.min(20, parseInt(ch.nivel, 10) || 1) };
  pintar(); openSheet(dlg());
}
const mano = ch => ch.formasMano || [];
const numConocidas = ch => (ch.formas || []).length + mano(ch).length;
function manoHtml(lim) {
  return `<details class="fm-mano" ${F.abrirMano ? 'open' : ''}><summary>${icon('quill')}Añadir una forma a mano</summary>
    <div class="frow"><label class="f">Nombre<input id="fmmNom" placeholder="Por ejemplo: lobo" autocomplete="off"></label>
      <label class="f" style="max-width:120px">VD<select id="fmmVd">${VDS.filter(v => v <= lim.vd).map(v => `<option value="${v}">${vdTexto(v)}</option>`).join('')}</select></label></div>
    <div class="frow"><label class="f">CA<input id="fmmCa" inputmode="numeric" autocomplete="off"></label><label class="f">PG<input id="fmmPg" inputmode="numeric" autocomplete="off"></label>
      <label class="f">Velocidad<input id="fmmVel" placeholder="12 m" autocomplete="off"></label></div>
    <button type="button" class="gold" id="fmmAdd">Añadir a mis formas</button></details>`;
}
function pintar() {
  const ch = S.cur(), todas = biblioteca().criaturas, conocidas = new Set(ch.formas || []);
  const lim = F.modo === 'salvaje' ? limiteFormaSalvaje(ch) : null;
  $('#fmTitle').textContent = TIT[F.modo];
  $('#fmSub').textContent = lim
    ? `${ch.nombre}, druida de nivel ${ch.nivel}${lim.luna ? ' (Círculo de la luna)' : ''}: VD ${vdTexto(lim.vd)} como máximo${lim.vuelo ? '' : ', sin velocidad volando'}. Conoces ${numConocidas(ch)} de ${lim.conocidas} formas.`
    : F.modo === 'polimorfar' ? 'Una bestia con un VD igual o inferior al del objetivo (o a su nivel).' : 'Cualquier criatura con un VD igual o inferior al nivel del objetivo.';
  $('#fmTools').innerHTML = `<input type="search" id="fmQ" value="${esc(F.q)}" placeholder="Buscar una forma" aria-label="Buscar" autocomplete="off">
    <div class="bib-sel una">${lim ? '' : `<select id="fmVd" aria-label="VD máximo">${VDS.map(v => `<option value="${v}" ${v === F.vd ? 'selected' : ''}>VD ${vdTexto(v)} o menos</option>`).join('')}</select>`}
      ${lim && todas.length ? `<button type="button" class="chip" id="fmSolo" aria-pressed="${F.solo}">${gi('dote')}Solo las que conozco</button>` : ''}</div>`;
  const q = norm(F.q.trim());
  const propias = lim ? mano(ch).filter(m => !q || norm(m.nombre).includes(q)) : [];
  const filaMano = m => `<li class="fm-it conocida"><div class="bib-it"><b>${esc(m.nombre)}</b><small>VD ${vdTexto(m.vd)} · CA ${esc(m.ca || '—')} · PG ${esc(m.pg || '—')}${m.vel ? ' · ' + esc(m.vel) : ''} · anotada a mano</small></div>
      <button type="button" class="fm-star" data-fmquitar="${esc(m.id)}" aria-pressed="true" aria-label="Olvidar ${esc(m.nombre)}" title="Olvidar">★</button></li>`;
  const cabeza = (lim ? manoHtml(lim) : '') + (propias.length ? `<ul class="bib-list fm-list">${propias.map(filaMano).join('')}</ul>` : '');
  if (!todas.length) {
    $('#fmBody').innerHTML = cabeza + `<div class="bib-empty">${gi('criatura')}<p>Las formas salen de los perfiles de criaturas de tus libros.</p><p class="note">Importa el Manual del Jugador en Libros y manuales (su apéndice trae las bestias más habituales)${lim ? ' o añade tus formas a mano' : ''}.</p></div>`;
    return;
  }
  let lista = formasPosibles(todas, lim ? { vd: lim.vd, vuelo: lim.vuelo } : { vd: F.vd, soloBestias: F.modo === 'polimorfar' });
  if (lim && F.solo) lista = lista.filter(c => conocidas.has(c.clave));
  if (q) lista = lista.filter(c => norm(c.nombre + ' ' + c.tipo).includes(q));
  if (lim) lista.sort((a, b) => (conocidas.has(b.clave) - conocidas.has(a.clave)) || a.vdNum - b.vdNum || a.nombre.localeCompare(b.nombre, 'es'));
  const fila = c => `<li class="fm-it ${conocidas.has(c.clave) ? 'conocida' : ''}"><button type="button" class="bib-it" data-fmver="${esc(c.clave)}"><b>${esc(c.nombre)}</b>
      <small>VD ${vdTexto(c.vdNum)} · CA ${c.ca ?? '—'} · PG ${c.pgMedia ?? '—'} · ${esc(c.vel || '')}</small></button>
      ${lim ? `<button type="button" class="fm-star" data-fmcon="${esc(c.clave)}" aria-pressed="${conocidas.has(c.clave)}" aria-label="${conocidas.has(c.clave) ? 'Olvidar' : 'Marcar como conocida'} ${esc(c.nombre)}" title="${conocidas.has(c.clave) ? 'Forma conocida' : 'Marcar como conocida'}">★</button>` : ''}</li>`;
  $('#fmBody').innerHTML = cabeza + (lista.length ? `<ul class="bib-list fm-list">${lista.slice(0, 300).map(fila).join('')}</ul>${lista.length > 300 ? `<p class="note">Y ${lista.length - 300} más: busca por nombre.</p>` : ''}`
    : propias.length ? '' : `<p class="pempty">${F.solo ? 'Aún no has marcado formas conocidas: quita el filtro y márcalas con ★.' : 'Ninguna criatura de tus libros encaja con este límite.'}</p>`);
}
const repintar = () => { const y = $('#fmBody').scrollTop; pintar(); $('#fmBody').scrollTop = y; };

export function init(store) {
  S = store;
  const d = dlg();
  d.addEventListener('input', e => { if (e.target.id === 'fmQ') { F.q = e.target.value; const pos = e.target.selectionStart; pintar(); const i = $('#fmQ'); i.focus(); i.setSelectionRange(pos, pos); } });
  d.addEventListener('change', e => { if (e.target.id === 'fmVd') { F.vd = +e.target.value; pintar(); } });
  d.addEventListener('toggle', e => { if (e.target.classList?.contains('fm-mano')) F.abrirMano = e.target.open; }, true);
  on(d, 'click', '#fmSolo', () => { F.solo = !F.solo; pintar(); });
  on(d, 'click', '[data-fmver]', (e, b) => abrirCriatura(b.dataset.fmver));
  on(d, 'click', '[data-fmcon]', (e, b) => {
    const ch = S.cur(), k = b.dataset.fmcon, lim = limiteFormaSalvaje(ch), ya = (ch.formas || []).includes(k);
    if (!ya && numConocidas(ch) >= lim.conocidas) return toast(`A nivel ${ch.nivel} conoces ${lim.conocidas} formas: olvida una antes de aprender otra (tras un descanso largo).`);
    S.edit((db, c) => { c.formas = ya ? (c.formas || []).filter(x => x !== k) : [...(c.formas || []), k]; });
    repintar();
  });
  on(d, 'click', '[data-fmquitar]', (e, b) => { S.edit((db, c) => { c.formasMano = mano(c).filter(m => m.id !== b.dataset.fmquitar); }); repintar(); });
  on(d, 'click', '#fmmAdd', () => {
    const ch = S.cur(), lim = limiteFormaSalvaje(ch), nom = $('#fmmNom').value.trim();
    if (!nom) { $('#fmmNom').focus(); return; }
    if (numConocidas(ch) >= lim.conocidas) return toast(`A nivel ${ch.nivel} conoces ${lim.conocidas} formas: olvida una antes de aprender otra (tras un descanso largo).`);
    if (mano(ch).some(m => norm(m.nombre) === norm(nom))) return toast(`${esc(nom)} ya está entre tus formas.`);
    const ca = parseInt($('#fmmCa').value, 10), pg = parseInt($('#fmmPg').value, 10);
    const m = { id: uid('fm'), nombre: nom, vd: +$('#fmmVd').value, ca: ca > 0 ? String(ca) : '', pg: pg > 0 ? String(pg) : '', vel: $('#fmmVel').value.trim() };
    S.edit((db, c) => { c.formasMano = [...mano(c), m]; });
    F.abrirMano = false; repintar(); toast(`${esc(nom)} añadida a tus formas.`);
  });
}
