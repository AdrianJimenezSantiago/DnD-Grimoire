/**
 * Formas de bestia: Forma salvaje del druida (formas conocidas y posibles según su nivel y el Círculo de la luna),
 * Polimorfar (bestias hasta un VD) y Polimorfar verdadero o Cambiar de forma (cualquier criatura hasta un VD).
 * Los perfiles vienen de los libros importados; cada forma abre su perfil completo.
 */
import { esc, norm } from '../../core/util.js';
import { biblioteca } from '../../domain/catalogo.js';
import { formasPosibles, limiteFormaSalvaje, vdTexto } from '../../domain/monstruos.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { openSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { abrirCriatura } from './biblioteca.js';

let S, F = { modo: 'salvaje', vd: 1, q: '', solo: false };
const dlg = () => $('#formasDlg');
const VDS = [0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const TIT = { salvaje: 'Forma salvaje', polimorfar: 'Polimorfar', verdadero: 'Polimorfar verdadero' };

/** Abre el selector. modo: 'salvaje' (del personaje), 'polimorfar' (bestias) o 'verdadero' (cualquier criatura). */
export function openFormas(modo = 'salvaje') {
  const ch = S.cur(); if (!ch) return;
  F = { modo, q: '', solo: modo === 'salvaje' && (ch.formas || []).length > 0, vd: modo === 'salvaje' ? limiteFormaSalvaje(ch).vd : Math.min(20, parseInt(ch.nivel, 10) || 1) };
  pintar(); openSheet(dlg());
}
function pintar() {
  const ch = S.cur(), todas = biblioteca().criaturas, conocidas = new Set(ch.formas || []);
  const lim = F.modo === 'salvaje' ? limiteFormaSalvaje(ch) : null;
  $('#fmTitle').textContent = TIT[F.modo];
  $('#fmSub').textContent = lim
    ? `${ch.nombre}, druida de nivel ${ch.nivel}${lim.luna ? ' (Círculo de la luna)' : ''}: VD ${vdTexto(lim.vd)} como máximo${lim.vuelo ? '' : ', sin velocidad volando'}. Conoces ${conocidas.size} de ${lim.conocidas} formas.`
    : F.modo === 'polimorfar' ? 'Una bestia con un VD igual o inferior al del objetivo (o a su nivel).' : 'Cualquier criatura con un VD igual o inferior al nivel del objetivo.';
  $('#fmTools').innerHTML = `<input type="search" id="fmQ" value="${esc(F.q)}" placeholder="Buscar una forma" aria-label="Buscar" autocomplete="off">
    <div class="bib-sel una">${lim ? '' : `<select id="fmVd" aria-label="VD máximo">${VDS.map(v => `<option value="${v}" ${v === F.vd ? 'selected' : ''}>VD ${vdTexto(v)} o menos</option>`).join('')}</select>`}
      ${lim ? `<button type="button" class="chip" id="fmSolo" aria-pressed="${F.solo}">${gi('dote')}Solo las que conozco</button>` : ''}</div>`;
  if (!todas.length) {
    $('#fmBody').innerHTML = `<div class="bib-empty">${gi('criatura')}<p>Las formas salen de los perfiles de criaturas de tus libros.</p><p class="note">Importa el Manual de Monstruos (con texto) o el Manual del Jugador en Libros y manuales. Se leen en este dispositivo.</p></div>`;
    return;
  }
  const q = norm(F.q.trim());
  let lista = formasPosibles(todas, lim ? { vd: lim.vd, vuelo: lim.vuelo } : { vd: F.vd, soloBestias: F.modo === 'polimorfar' });
  if (lim && F.solo) lista = lista.filter(c => conocidas.has(c.clave));
  if (q) lista = lista.filter(c => norm(c.nombre + ' ' + c.tipo).includes(q));
  if (lim) lista.sort((a, b) => (conocidas.has(b.clave) - conocidas.has(a.clave)) || a.vdNum - b.vdNum || a.nombre.localeCompare(b.nombre, 'es'));
  const fila = c => `<li class="fm-it ${conocidas.has(c.clave) ? 'conocida' : ''}"><button type="button" class="bib-it" data-fmver="${esc(c.clave)}"><b>${esc(c.nombre)}</b>
      <small>VD ${vdTexto(c.vdNum)} · CA ${c.ca ?? '—'} · PG ${c.pgMedia ?? '—'} · ${esc(c.vel || '')}</small></button>
      ${lim ? `<button type="button" class="fm-star" data-fmcon="${esc(c.clave)}" aria-pressed="${conocidas.has(c.clave)}" aria-label="${conocidas.has(c.clave) ? 'Olvidar' : 'Marcar como conocida'} ${esc(c.nombre)}" title="${conocidas.has(c.clave) ? 'Forma conocida' : 'Marcar como conocida'}">★</button>` : ''}</li>`;
  $('#fmBody').innerHTML = lista.length ? `<ul class="bib-list fm-list">${lista.slice(0, 300).map(fila).join('')}</ul>${lista.length > 300 ? `<p class="note">Y ${lista.length - 300} más: busca por nombre.</p>` : ''}`
    : `<p class="pempty">${F.solo ? 'Aún no has marcado formas conocidas: quita el filtro y márcalas con ★.' : 'Ninguna criatura de tus libros encaja con este límite.'}</p>`;
}

export function init(store) {
  S = store;
  const d = dlg();
  d.addEventListener('input', e => { if (e.target.id === 'fmQ') { F.q = e.target.value; const pos = e.target.selectionStart; pintar(); const i = $('#fmQ'); i.focus(); i.setSelectionRange(pos, pos); } });
  d.addEventListener('change', e => { if (e.target.id === 'fmVd') { F.vd = +e.target.value; pintar(); } });
  on(d, 'click', '#fmSolo', () => { F.solo = !F.solo; pintar(); });
  on(d, 'click', '[data-fmver]', (e, b) => abrirCriatura(b.dataset.fmver));
  on(d, 'click', '[data-fmcon]', (e, b) => {
    const ch = S.cur(), k = b.dataset.fmcon, lim = limiteFormaSalvaje(ch), ya = (ch.formas || []).includes(k);
    if (!ya && (ch.formas || []).length >= lim.conocidas) return toast(`A nivel ${ch.nivel} conoces ${lim.conocidas} formas: olvida una antes de aprender otra (tras un descanso largo).`);
    S.edit((db, c) => { c.formas = ya ? (c.formas || []).filter(x => x !== k) : [...(c.formas || []), k]; });
    const y = $('#fmBody').scrollTop; pintar(); $('#fmBody').scrollTop = y;
  });
}
