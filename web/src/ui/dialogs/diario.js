/**
 * Diario de sesión del personaje. Lista de sesiones con «Para recordar» arriba y editor de cada sesión:
 * notas rápidas (nombre, suceso, pendiente, nota) que se tachan al cumplirse o se subrayan para destacarlas,
 * y una crónica libre. Los textos se guardan mientras escribes.
 */
import { esc } from '../../core/util.js';
import { TIPOS, diarioDe, nuevaSesion, nuevaNota, paraRecordar, buscarDiario, fechaLarga } from '../../domain/diario.js';
import { $, on } from '../dom.js';
import { avatarHtml } from '../avatar.js';
import { icon } from '../icons.js';
import { openSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { confirmar } from '../modal.js';
import { haptic } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';

let S, V = { vista: 'lista', sid: null, tipo: 'nombre', q: '' };
const dlg = () => $('#diaDlg');
const ch = () => S.cur();
const ses = () => diarioDe(ch()).sesiones.find(s => s.id === V.sid);
const ICONO = { nombre: 'user', suceso: 'star', pendiente: 'hourglass', nota: 'quill' };
const corta = iso => { try { return new Date(iso + 'T12:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }); } catch { return iso; } };

export function notaHtml(nt, conSesion = false) {
  return `<li class="nt ${nt.hecho ? 'hecho' : ''} ${nt.fijada ? 'fijada' : ''}" data-nt="${nt.id}" data-ses="${nt.sesion?.id || V.sid}">
    <span class="nt-ico" title="${TIPOS[nt.tipo]}">${icon(ICONO[nt.tipo] || 'quill')}</span>
    <span class="nt-txt"><span class="nt-main">${esc(nt.texto)}</span>${conSesion ? `<small>Sesión ${nt.sesion.n}${nt.sesion.titulo ? ' · ' + esc(nt.sesion.titulo) : ''}</small>` : ''}</span>
    <span class="nt-acts"><button type="button" class="nt-b" data-ntact="subrayar" aria-pressed="${nt.fijada}" title="Subrayar: destacar para la próxima sesión" aria-label="Subrayar">S</button>
    <button type="button" class="nt-b" data-ntact="tachar" aria-pressed="${nt.hecho}" title="Tachar: ya está cumplido o resuelto" aria-label="Tachar">T</button>
    ${conSesion ? '' : `<button type="button" class="nt-b" data-ntact="borrar" title="Borrar" aria-label="Borrar nota">×</button>`}</span></li>`;
}
function lista() {
  const c = ch(), d = diarioDe(c), rec = paraRecordar(c), res = buscarDiario(c, V.q), sesiones = res || d.sesiones;
  $('#diHead').innerHTML = `${avatarHtml(c, 'md')}<div><h2 id="diTitle">Diario de ${esc(c.nombre)}</h2><div class="dsub">${d.sesiones.length ? `${d.sesiones.length} ${d.sesiones.length === 1 ? 'sesión' : 'sesiones'}` : 'Nombres, sucesos y pendientes de cada partida'}</div></div>`;
  let h = '';
  if (rec.length && !V.q) h += `<section class="rec"><h3>${icon('star')} Para recordar</h3><ul class="nts">${rec.map(n => notaHtml(n, true)).join('')}</ul></section>`;
  h += `<div class="di-bar"><input type="search" id="diQ" placeholder="Buscar en el diario" value="${esc(V.q)}" aria-label="Buscar en el diario"><button type="button" class="gold" data-di="nueva">${icon('plus')}Nueva sesión</button></div>`;
  h += sesiones.length ? `<div class="ses-list">${sesiones.map(s => {
    const pend = s.notas.filter(n => !n.hecho && (n.tipo === 'pendiente' || n.fijada)).length;
    return `<button type="button" class="ses" data-abrir="${s.id}"><span class="ses-n">${s.n}</span><span class="ses-t"><b>${esc(s.titulo || 'Sesión ' + s.n)}</b>
      <small>${esc(corta(s.fecha))}${s.notas.length ? ` · ${s.notas.length} ${s.notas.length === 1 ? 'nota' : 'notas'}` : ''}${pend ? ` · ${pend} por recordar` : ''}</small>
      ${s.texto ? `<span class="ses-x">${esc(s.texto.slice(0, 120))}${s.texto.length > 120 ? '…' : ''}</span>` : ''}</span></button>`; }).join('')}</div>`
    : `<p class="pempty">${V.q ? 'Nada coincide con la búsqueda.' : 'Aún no hay sesiones. Crea la primera al empezar la partida y ve apuntando nombres, sucesos y pendientes.'}</p>`;
  $('#diBody').innerHTML = h;
  $('#diFoot').innerHTML = '<span class="spacer"></span><button type="button" class="primary" data-close>Cerrar</button>';
}
function sesion() {
  const s = ses(); if (!s) { V.vista = 'lista'; return lista(); }
  const c = ch();
  $('#diHead').innerHTML = `<button type="button" class="iconbtn" data-di="volver" aria-label="Volver a las sesiones">‹</button><div><h2 id="diTitle">Sesión ${s.n}</h2><div class="dsub">${esc(fechaLarga(s.fecha))} · ${esc(c.nombre)}</div></div>`;
  $('#diBody').innerHTML = `<div class="frow">
      <label class="f">Título<input id="diTit" value="${esc(s.titulo)}" placeholder="Por ejemplo: La subasta del mercado nuevo" autocomplete="off"></label>
      <label class="f" style="max-width:190px">Fecha<input id="diFecha" type="date" value="${esc(s.fecha)}"></label></div>
    <section class="compose"><div class="tipos" role="radiogroup" aria-label="Tipo de nota">${Object.entries(TIPOS).map(([k, t]) => `<button type="button" role="radio" aria-checked="${V.tipo === k}" data-tipo="${k}">${icon(ICONO[k])}${t}</button>`).join('')}</div>
      <div class="add"><input id="diNota" placeholder="${{ nombre: 'Maese Orrin, prestamista del puerto', suceso: 'Nos emboscaron en el camino del norte', pendiente: 'Preguntar a Magna por el sello', nota: 'Lo que quieras apuntar' }[V.tipo]}" autocomplete="off" aria-label="Texto de la nota"><button type="button" class="primary" data-di="anadir">Añadir</button></div></section>
    ${s.notas.length ? `<ul class="nts">${s.notas.map(n => notaHtml(n)).join('')}</ul>` : '<p class="note">Las notas aparecen aquí. Subraya (S) lo que no quieras olvidar y tacha (T) lo que ya esté resuelto.</p>'}
    <label class="f wide" style="margin-top:14px">Crónica de la sesión<textarea id="diTxt" rows="9" placeholder="Qué pasó, quién apareció, qué dijo el DJ…">${esc(s.texto)}</textarea></label>`;
  $('#diFoot').innerHTML = '<button type="button" class="warn" data-di="borrar">Borrar sesión</button><span class="spacer"></span><button type="button" data-di="volver">Sesiones</button><button type="button" class="primary" data-close>Cerrar</button>';
}
const render = () => (V.vista === 'sesion' ? sesion() : lista());
export function openDiario(sid) { if (!ch()) return; V = { ...V, vista: sid ? 'sesion' : 'lista', sid: sid || null, q: '' }; render(); openSheet(dlg()); }

function anadir() {
  const inp = $('#diNota'), t = inp.value.trim(); if (!t) { inp.focus(); return; }
  S.edit(() => { ses().notas.unshift(nuevaNota(V.tipo, t)); }); haptic();
  sesion(); $('#diNota').focus();
}
/** Tachar / subrayar desde la tarjeta «Para recordar» de la hoja. */
export function accionNota(store, sid, nid, act) {
  store.edit((db, c) => { const s = diarioDe(c).sesiones.find(x => x.id === sid), n = s?.notas.find(x => x.id === nid); if (!n) return;
    if (act === 'tachar') n.hecho = !n.hecho; if (act === 'subrayar') n.fijada = !n.fijada; });
  haptic();
}
export function init(store) {
  S = store;
  const root = dlg();
  on(root, 'click', '[data-di]', async (e, b) => {
    const a = b.dataset.di;
    if (a === 'nueva') { let s; S.edit((db, c) => { s = nuevaSesion(c); }); V.vista = 'sesion'; V.sid = s.id; sesion(); $('#diTit')?.focus(); }
    if (a === 'volver') { V.vista = 'lista'; lista(); }
    if (a === 'anadir') anadir();
    if (a === 'borrar') { const s = ses(); if (!(await confirmar({ titulo: `¿Borrar la sesión ${s.n}?`, texto: 'Se borran su crónica y sus notas. Podrás deshacerlo justo después.', ok: 'Borrar', peligro: true }))) return;
      const h = S.edit((db, c) => { const d = diarioDe(c); d.sesiones = d.sesiones.filter(x => x.id !== s.id); }); V.vista = 'lista'; lista(); toast(`Sesión ${s.n} borrada.`, [undoBtn(S, h)]); }
  });
  on(root, 'click', '[data-abrir]', (e, b) => { V.vista = 'sesion'; V.sid = b.dataset.abrir; sesion(); root.querySelector('.dbody').scrollTop = 0; });
  on(root, 'click', '[data-tipo]', (e, b) => { V.tipo = b.dataset.tipo; const t = $('#diNota').value; sesion(); $('#diNota').value = t; $('#diNota').focus(); });
  on(root, 'click', '[data-ntact]', (e, b) => {
    const li = b.closest('[data-nt]'), a = b.dataset.ntact;
    S.edit((db, c) => {
      const s = diarioDe(c).sesiones.find(x => x.id === li.dataset.ses), n = s?.notas.find(x => x.id === li.dataset.nt); if (!n) return;
      if (a === 'tachar') n.hecho = !n.hecho;
      if (a === 'subrayar') n.fijada = !n.fijada;
      if (a === 'borrar') s.notas = s.notas.filter(x => x !== n);
    });
    haptic(); render();
  });
  root.addEventListener('keydown', e => { if (e.target.id === 'diNota' && e.key === 'Enter') { e.preventDefault(); anadir(); } });
  root.addEventListener('input', e => {
    const t = e.target, s = ses();
    if (t.id === 'diQ') { V.q = t.value; const pos = t.selectionStart; lista(); const q = $('#diQ'); q.focus(); q.setSelectionRange(pos, pos); return; }
    if (!s) return;
    if (t.id === 'diTit') { s.titulo = t.value; S.touch(); }
    if (t.id === 'diTxt') { s.texto = t.value; S.touch(); }
    if (t.id === 'diFecha' && t.value) { s.fecha = t.value; S.touch(); }
  });
  // al cerrar, la hoja refleja lo apuntado («Para recordar»)
  root.addEventListener('close', () => S.emit('diario'));
}
