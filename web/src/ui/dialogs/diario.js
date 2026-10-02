// Diario de campaña (sesiones y notas) y bestiario (lo que se sabe de cada criatura).
import { campoElegible, ponerValor, elegirCriatura } from '../selectores/elecciones.js';
import { esc } from '../../core/util.js';
import { TIPOS, diarioDe, nuevaSesion, nuevaNota, paraRecordar, buscarDiario, fechaLarga } from '../../domain/personaje/diario.js';
import { $, on } from '../componentes/dom.js';
import { avatarHtml } from '../componentes/avatar.js';
import { icon } from '../componentes/icons.js';
import { abrirDialogo } from '../componentes/dialog.js';
import { toast, botonDeshacer } from '../componentes/toast.js';
import { confirmar } from '../componentes/modal.js';
import { vibrar } from '../../platform/native.js';
import { gi } from '../componentes/tema.js';
import { iconoDano } from './tiradas.js';
import { tiradasConjuro } from '../../domain/conjuros/catalogo.js';
import { biblioteca, criaturaImportada } from '../../domain/libros/biblioteca.js';
import { aBestiario, vdTexto } from '../../domain/criaturas/monstruos.js';
import { abrirCriatura } from './biblioteca.js';
import { TIPOS_CRIATURA, DANOS, ESTADOS, SALVACIONES, AMENAZAS, ESTADO_CRIATURA, REL_DANO, CICLO_DANO, bestiarioDe, nuevaCriatura, criatura, buscarCriaturas } from '../../domain/criaturas/bestiario.js';
import { marcarNota, quemar } from '../animaciones/magia.js';

let S, V = { vista: 'lista', sid: null, tipo: 'nombre', q: '', cid: null, bq: '', btipo: '' };
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
  let h = pestanas();
  if (rec.length && !V.q) h += `<section class="rec"><h3>${icon('star')} Para recordar</h3><ul class="nts">${rec.map(n => notaHtml(n, true)).join('')}</ul></section>`;
  h += `<div class="di-bar"><input type="search" id="diQ" placeholder="Buscar en el diario" value="${esc(V.q)}" aria-label="Buscar en el diario"><button type="button" class="gold" data-di="nueva">${icon('plus')}Nueva sesión</button></div>`;
  h += sesiones.length ? `<div class="ses-list">${sesiones.map(s => {
    const pend = s.notas.filter(n => !n.hecho && (n.tipo === 'pendiente' || n.fijada)).length;
    return `<button type="button" class="ses" data-abrir="${s.id}"><span class="ses-n">${s.n}</span><span class="ses-t"><b>${esc(s.titulo || 'Sesión ' + s.n)}</b>
      <small>${esc(corta(s.fecha))}${s.notas.length ? ` · ${s.notas.length} ${s.notas.length === 1 ? 'nota' : 'notas'}` : ''}${pend ? ` · ${pend} por recordar` : ''}</small>
      ${s.texto ? `<span class="ses-x">${esc(s.texto.slice(0, 120))}${s.texto.length > 120 ? '…' : ''}</span>` : ''}</span></button>`; }).join('')}</div>`
    : `<p class="pempty">${V.q ? 'Nada coincide con la búsqueda.' : 'Aún no hay sesiones. Crea la primera al empezar la partida y ve apuntando nombres, sucesos y pendientes.'}</p>`;
  $('#diBody').innerHTML = h;
  $('#diFoot').innerHTML = '<span class="spacer"></span><button type="button" data-close>Cerrar</button>';
}
function criaturasSesion(s) {
  const todas = bestiarioDe(ch()).criaturas, aqui = todas.filter(c => c.sesiones.includes(s.id)), otras = todas.filter(c => !c.sesiones.includes(s.id));
  return `<section class="bx-ses"><h3>${gi('bestia')}Criaturas</h3><div class="bx-est">${aqui.map(c => `<button type="button" class="chip sm" data-bx="${c.id}">${esc(c.nombre || 'Sin nombre')}</button>`).join('')}
    <button type="button" class="chip sm gold" data-di="nuevacr">${icon('plus')}Nueva</button>
    ${otras.length ? `<select class="chip-sel" id="bxLink" aria-label="Añadir una criatura conocida"><option value="">Ya conocida…</option>${otras.map(c => `<option value="${c.id}">${esc(c.nombre || 'Sin nombre')}</option>`).join('')}</select>` : ''}</div></section>`;
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
    ${criaturasSesion(s)}
    <label class="f wide" style="margin-top:14px">Crónica de la sesión<textarea id="diTxt" rows="9" placeholder="Qué pasó, quién apareció, qué dijo el DJ…">${esc(s.texto)}</textarea></label>`;
  $('#diFoot').innerHTML = '<button type="button" class="warn" data-di="borrar">Borrar sesión</button><span class="spacer"></span><button type="button" data-di="volver">Sesiones</button><button type="button" data-close>Cerrar</button>';
}
const pestanas = () => `<div class="seg di-seg" role="tablist" aria-label="Diario"><button type="button" role="tab" aria-selected="${V.vista === 'lista'}" data-di="lista">${icon('quill')}Sesiones</button>
  <button type="button" role="tab" aria-selected="${V.vista === 'bestiario'}" data-di="bestiario">${gi('bestia')}Bestiario<small>${bestiarioDe(ch()).criaturas.length || ''}</small></button></div>`;
const chipsRel = c => DANOS.filter(d => c.danos[d]).map(d => `<span class="bx-mini rel-${c.danos[d]}" title="${REL_DANO[c.danos[d]]} al ${d}">${iconoDano(d)}</span>`).join('');
function tarjeta(c) {
  return `<button type="button" class="bx-card ${c.estado !== 'viva' ? 'apagada' : ''}" data-bx="${c.id}"><span class="bx-emb">${gi('criatura')}</span>
    <span class="bx-t"><b>${esc(c.nombre || 'Criatura sin nombre')}</b><small>${[c.tipo, c.amenaza && 'amenaza ' + c.amenaza.toLowerCase(), c.estado !== 'viva' && ESTADO_CRIATURA[c.estado]].filter(Boolean).map(esc).join(' · ') || 'Sin clasificar'}</small>
    ${chipsRel(c) ? `<span class="bx-rels">${chipsRel(c)}</span>` : ''}</span></button>`;
}
function bestiario() {
  const c = ch(), todas = bestiarioDe(c).criaturas, lista = buscarCriaturas(c, V.bq, V.btipo).sort((a, b) => (a.estado === 'viva' ? 0 : 1) - (b.estado === 'viva' ? 0 : 1));
  $('#diHead').innerHTML = `${avatarHtml(c, 'md')}<div><h2 id="diTitle">Bestiario de ${esc(c.nombre)}</h2><div class="dsub">${todas.length ? `${todas.length} ${todas.length === 1 ? 'criatura' : 'criaturas'} anotadas` : 'Lo que sabes de lo que has encontrado'}</div></div>`;
  const tipos = [...new Set(todas.map(x => x.tipo).filter(Boolean))];
  let h = pestanas() + `<div class="di-bar"><input type="search" id="bxQ" placeholder="Buscar criatura o táctica" value="${esc(V.bq)}" aria-label="Buscar en el bestiario">
    ${tipos.length > 1 ? `<select id="bxTipo" aria-label="Tipo de criatura"><option value="">Todos</option>${tipos.map(t => `<option ${V.btipo === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>` : ''}
    <button type="button" class="gold" data-di="nuevacr">${icon('plus')}Criatura</button></div>`;
  h += lista.length ? `<div class="bx-list">${lista.map(tarjeta).join('')}</div>`
    : `<div class="bib-empty">${gi('bestia')}<p>${V.bq || V.btipo ? 'Ninguna criatura coincide.' : 'Aún no has anotado ninguna criatura.'}</p>${V.bq || V.btipo ? '' : '<p class="note">Cuando os crucéis con algo que merezca recordarse, anótalo: qué daños le hacen más o menos efecto, qué conjuros funcionaron y cómo luchó. Si vuelve a aparecer, lo tendrás a mano.</p>'}</div>`;
  $('#diBody').innerHTML = h;
  $('#diFoot').innerHTML = '<span class="spacer"></span><button type="button" data-close>Cerrar</button>';
}
function conjurosUtiles(c) {
  const out = [], vistos = new Set();
  for (const e of c.book) { const s = S.db.catalog[e.sid]; if (!s || vistos.has(s.id)) continue; vistos.add(s.id);
    const t = tiradasConjuro(s); if (!t || (!t.danos.length && !t.salvacion && !t.ataque)) continue;
    out.push({ s, tipos: [...new Set(t.danos.map(d => d.tipo).filter(x => x && x !== 'curación'))] }); }
  return out.sort((a, b) => a.s.level - b.s.level || a.s.es.localeCompare(b.s.es, 'es'));
}
function ficha() {
  const c = ch(), x = criatura(c, V.cid); if (!x) { V.vista = 'bestiario'; return bestiario(); }
  $('#diHead').innerHTML = `<button type="button" class="iconbtn" data-di="bestiario" aria-label="Volver al bestiario">‹</button><div><h2 id="diTitle">${esc(x.nombre || 'Nueva criatura')}</h2><div class="dsub">${esc([x.tipo, ESTADO_CRIATURA[x.estado]].filter(Boolean).join(' · '))}</div></div>`;
  const seg = (campo, vals, actual) => `<div class="seg sm" role="radiogroup">${vals.map(([v, t]) => `<button type="button" role="radio" aria-checked="${actual === v}" data-bxset="${campo}" data-v="${esc(v)}">${esc(t)}</button>`).join('')}</div>`;
  const utiles = conjurosUtiles(c), anotados = utiles.filter(u => x.conjuros[u.s.id]);
  const conj = u => { const rel = x.conjuros[u.s.id] || '', aviso = u.tipos.map(t => x.danos[DANOS.find(d => norm(d) === norm(t))] ).find(Boolean);
    return `<li class="bx-cj ${rel}"><span class="bx-cjn"><b>${esc(u.s.es)}</b><small>${u.s.level ? 'Nivel ' + u.s.level : 'Truco'}${u.tipos.length ? ' · ' + u.tipos.map(esc).join(', ') : ''}${aviso ? ` · <span class="rel-${aviso}">${REL_DANO[aviso].toLowerCase()}</span>` : ''}</small></span>
      <span class="seg xs">${[['eficaz', 'Funcionó'], ['ineficaz', 'No funcionó']].map(([v, t]) => `<button type="button" aria-pressed="${rel === v}" data-bxcj="${u.s.id}" data-v="${v}">${t}</button>`).join('')}</span></li>`; };
  const sesiones = diarioDe(c).sesiones.filter(s => x.sesiones.includes(s.id));
  const perfiles = biblioteca().criaturas, pf = criaturaImportada(x.perfil || x.nombre);
  const perfilHtml = pf ? `<div class="bx-perfil">${gi('criatura')}<span><b>${esc(pf.nombre)}</b><small>${esc(pf.tipo)}${pf.vdNum != null ? ` · VD ${vdTexto(pf.vdNum)}` : ''} · CA ${pf.ca ?? '—'} · PG ${pf.pgMedia ?? '—'}</small></span>
      <button type="button" data-bxperfil="${esc(pf.clave)}">Ver perfil</button>${x.perfil === pf.clave ? '' : `<button type="button" class="gold" data-bxrellenar="${esc(pf.clave)}">Rellenar con su perfil</button>`}</div>`
    : perfiles.length ? '' : '<p class="note bx-sinperfil">Anota a mano lo que sepas. Con el Manual del Jugador importado, al escribir el nombre de una criatura de su apéndice la app rellena tipo, CA, PG, daños, estados y salvaciones.</p>';
  $('#diBody').innerHTML = `
    <div class="frow">${perfiles.length ? `<div class="f"><span>Nombre</span>${campoElegible('id="bxNom" aria-label="Nombre de la criatura"', x.nombre, 'criatura', 'bestia', 'Por ejemplo: trol del puente')}</div>` : `<label class="f">Nombre<input id="bxNom" value="${esc(x.nombre)}" placeholder="Por ejemplo: trol del puente" autocomplete="off"></label>`}
      <label class="f">Tipo<select id="bxTip"><option value="">Sin clasificar</option>${TIPOS_CRIATURA.map(t => `<option ${x.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label></div>
    <div class="frow" style="margin-top:10px"><label class="f">CA aproximada<input id="bxCa" value="${esc(x.ca)}" inputmode="numeric" placeholder="¿?" autocomplete="off"></label>
      <label class="f">Puntos de golpe aprox.<input id="bxPg" value="${esc(x.pg)}" placeholder="Aguantó unos 60" autocomplete="off"></label></div>
    ${perfilHtml}
    <div class="bx-sec"><h3>Amenaza</h3>${seg('amenaza', [['', 'Sin valorar'], ...AMENAZAS.map(a => [a, a])], x.amenaza)}</div>
    <div class="bx-sec"><h3>Situación</h3>${seg('estado', Object.entries(ESTADO_CRIATURA), x.estado)}</div>
    <div class="bx-sec"><h3>Daños <small>Toca para marcar: vulnerable, resistente, inmune</small></h3>
      <div class="bx-danos">${DANOS.map(d => { const r = x.danos[d] || ''; return `<button type="button" class="bx-d ${r ? 'rel-' + r : ''}" data-bxdano="${d}" aria-label="${d}: ${r ? REL_DANO[r] : 'sin anotar'}">${iconoDano(d)}<span>${d}</span><em>${r ? REL_DANO[r] : ''}</em></button>`; }).join('')}</div></div>
    <div class="bx-sec"><h3>Inmune a estados</h3><div class="bx-est">${ESTADOS.map(e => `<button type="button" class="chip sm" aria-pressed="${x.estados.includes(e)}" data-bxest="${e}">${e}</button>`).join('')}</div></div>
    <div class="bx-sec"><h3>Salvaciones <small>Toca: débil o fuerte</small></h3><div class="bx-salv">${SALVACIONES.map(([k, n]) => { const v = x.salv[k] || ''; return `<button type="button" class="bx-s ${v}" data-bxsalv="${k}"><b>${n.slice(0, 3)}</b><small>${v === 'debil' ? 'Débil' : v === 'fuerte' ? 'Fuerte' : '—'}</small></button>`; }).join('')}</div></div>
    <div class="bx-sec"><h3>Conjuros de ${esc(c.nombre)}</h3>
      ${utiles.length ? `${anotados.length ? `<ul class="bx-cjs">${anotados.map(conj).join('')}</ul>` : ''}
        <details class="bx-mas" ${anotados.length ? '' : 'open'}><summary>${anotados.length ? 'Anotar otro conjuro' : 'Anota cuáles funcionaron'}</summary><ul class="bx-cjs">${utiles.filter(u => !x.conjuros[u.s.id]).map(conj).join('')}</ul></details>`
        : '<p class="note">Los conjuros de daño o con salvación del libro aparecerán aquí para anotar si funcionaron.</p>'}</div>
    <label class="f wide bx-sec">Tácticas y comportamiento<textarea id="bxTac" rows="4" placeholder="Cómo luchó, qué la hizo huir, qué funcionó…">${esc(x.tacticas)}</textarea></label>
    <label class="f wide bx-sec">Notas<textarea id="bxNot" rows="3" placeholder="Dónde vive, quién la controla, qué dijo el DJ…">${esc(x.notas)}</textarea></label>
    ${sesiones.length ? `<div class="bx-sec"><h3>Vista en</h3><div class="bx-est">${sesiones.map(s => `<button type="button" class="chip sm" data-abrir="${s.id}">Sesión ${s.n}${s.titulo ? ': ' + esc(s.titulo) : ''}</button>`).join('')}</div></div>` : ''}`;
  $('#diFoot').innerHTML = '<button type="button" class="warn" data-di="borrarcr">Borrar criatura</button><span class="spacer"></span><button type="button" data-di="bestiario">Bestiario</button><button type="button" data-close>Cerrar</button>';
}
const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const render = () => ({ sesion, bestiario, criatura: ficha }[V.vista] || lista)();
export function abrirBestiario(cid) { if (!ch()) return; V = { ...V, vista: cid ? 'criatura' : 'bestiario', cid: cid || null, bq: '' }; render(); abrirDialogo(dlg()); }
export function abrirDiario(sid) { if (!ch()) return; V = { ...V, vista: sid ? 'sesion' : 'lista', sid: sid || null, q: '' }; render(); abrirDialogo(dlg()); }

function anadir() {
  const inp = $('#diNota'), t = inp.value.trim(); if (!t) { inp.focus(); return; }
  const nt = nuevaNota(V.tipo, t);
  S.edit(() => { ses().notas.unshift(nt); }); vibrar();
  sesion(); $('#diNota').focus(); marcarNota(nt.id, 'nueva');
}
export function accionNota(store, sid, nid, act) {
  let activa = false;
  store.edit((db, c) => { const s = diarioDe(c).sesiones.find(x => x.id === sid), n = s?.notas.find(x => x.id === nid); if (!n) return;
    if (act === 'tachar') activa = n.hecho = !n.hecho; if (act === 'subrayar') activa = n.fijada = !n.fijada; });
  vibrar(); if (activa) marcarNota(nid, act);
}
export function init(store) {
  S = store;
  const root = dlg();
  on(root, 'click', '[data-di]', async (e, b) => {
    const a = b.dataset.di;
    if (a === 'nueva') { let s; S.edit((db, c) => { s = nuevaSesion(c); }); V.vista = 'sesion'; V.sid = s.id; sesion(); $('#diTit')?.focus(); }
    if (a === 'volver' || a === 'lista') { V.vista = 'lista'; lista(); }
    if (a === 'bestiario') { V.vista = 'bestiario'; bestiario(); root.querySelector('.dbody').scrollTop = 0; }
    if (a === 'nuevacr') { let c; const desde = V.vista === 'sesion' ? V.sid : null; S.edit((db, x) => { c = nuevaCriatura(x, '', desde); }); V.vista = 'criatura'; V.cid = c.id; ficha(); root.querySelector('.dbody').scrollTop = 0; $('#bxNom')?.focus(); }
    if (a === 'borrarcr') { const c = criatura(ch(), V.cid); if (!(await confirmar({ titulo: `¿Borrar ${c.nombre || 'esta criatura'}?`, texto: 'Se borra del bestiario con todo lo anotado. Podrás deshacerlo justo después.', ok: 'Borrar', peligro: true }))) return;
      const h = S.edit((db, x) => { const b = bestiarioDe(x); b.criaturas = b.criaturas.filter(y => y.id !== c.id); }); V.vista = 'bestiario'; bestiario(); toast(`${esc(c.nombre || 'Criatura')} borrada del bestiario.`, [botonDeshacer(S, h)]); }
    if (a === 'anadir') anadir();
    if (a === 'borrar') { const s = ses(); if (!(await confirmar({ titulo: `¿Borrar la sesión ${s.n}?`, texto: 'Se borran su crónica y sus notas. Podrás deshacerlo justo después.', ok: 'Borrar', peligro: true }))) return;
      const h = S.edit((db, c) => { const d = diarioDe(c); d.sesiones = d.sesiones.filter(x => x.id !== s.id); }); V.vista = 'lista'; lista(); toast(`Sesión ${s.n} borrada.`, [botonDeshacer(S, h)]); }
  });
  on(root, 'click', '[data-bxperfil]', (e, b) => abrirCriatura(b.dataset.bxperfil));
  on(root, 'click', '[data-bxrellenar]', (e, b) => {
    const pf = criaturaImportada(b.dataset.bxrellenar); if (!pf) return;
    const d = aBestiario(pf);
    conCriatura(x => { x.perfil = pf.clave; x.tipo ||= d.tipo; x.ca ||= d.ca; x.pg ||= d.pg; x.danos = { ...d.danos, ...x.danos }; x.estados = [...new Set([...x.estados, ...d.estados])]; x.salv = { ...d.salv, ...x.salv }; });
    toast(`${esc(pf.nombre)}: tipo, CA, PG, daños, estados y salvaciones rellenados con su perfil.`);
  });
  on(root, 'click', '[data-bx]', (e, b) => { V.vista = 'criatura'; V.cid = b.dataset.bx; ficha(); root.querySelector('.dbody').scrollTop = 0; });
  const conCriatura = fn => { S.edit((db, c) => { const x = criatura(c, V.cid); if (x) fn(x); }); vibrar(); const y = root.querySelector('.dbody').scrollTop; ficha(); root.querySelector('.dbody').scrollTop = y; };
  on(root, 'click', '[data-bxdano]', (e, b) => conCriatura(x => { const d = b.dataset.bxdano, n = CICLO_DANO[x.danos[d] || '']; if (n) x.danos[d] = n; else delete x.danos[d]; }));
  on(root, 'click', '[data-bxest]', (e, b) => conCriatura(x => { const v = b.dataset.bxest; x.estados = x.estados.includes(v) ? x.estados.filter(y => y !== v) : [...x.estados, v]; }));
  on(root, 'click', '[data-bxsalv]', (e, b) => conCriatura(x => { const k = b.dataset.bxsalv, v = { '': 'debil', debil: 'fuerte', fuerte: '' }[x.salv[k] || '']; if (v) x.salv[k] = v; else delete x.salv[k]; }));
  on(root, 'click', '[data-bxset]', (e, b) => conCriatura(x => { x[b.dataset.bxset] = b.dataset.v; }));
  on(root, 'click', '[data-bxcj]', (e, b) => conCriatura(x => { const k = b.dataset.bxcj; if (x.conjuros[k] === b.dataset.v) delete x.conjuros[k]; else x.conjuros[k] = b.dataset.v; }));
  on(root, 'click', '[data-elegir="criatura"]', async (e, b) => { const inp = b.closest('.elg').querySelector('input'), v = await elegirCriatura(inp.value); if (v != null) ponerValor(inp, v); });
  root.addEventListener('change', e => {
    if (e.target.id === 'bxLink' && e.target.value) { const id = e.target.value; S.edit((db, c) => { const x = criatura(c, id); if (x && !x.sesiones.includes(V.sid)) x.sesiones.push(V.sid); }); sesion(); }
    if (e.target.id === 'bxTipo') { V.btipo = e.target.value; bestiario(); }
    if (e.target.id === 'bxNom' && V.vista === 'criatura') { const y = root.querySelector('.dbody').scrollTop; ficha(); root.querySelector('.dbody').scrollTop = y; }
    if (e.target.id === 'bxTip') { const x = criatura(ch(), V.cid); if (x) { x.tipo = e.target.value; S.touch(); } }
  });
  on(root, 'click', '[data-abrir]', (e, b) => { V.vista = 'sesion'; V.sid = b.dataset.abrir; sesion(); root.querySelector('.dbody').scrollTop = 0; });
  on(root, 'click', '[data-tipo]', (e, b) => { V.tipo = b.dataset.tipo; const t = $('#diNota').value; sesion(); $('#diNota').value = t; $('#diNota').focus(); });
  on(root, 'click', '[data-ntact]', async (e, b) => {
    const li = b.closest('[data-nt]'), a = b.dataset.ntact, id = li.dataset.nt; let activa = false;
    if (a === 'borrar') await quemar(li);
    S.edit((db, c) => {
      const s = diarioDe(c).sesiones.find(x => x.id === li.dataset.ses), n = s?.notas.find(x => x.id === id); if (!n) return;
      if (a === 'tachar') activa = n.hecho = !n.hecho;
      if (a === 'subrayar') activa = n.fijada = !n.fijada;
      if (a === 'borrar') s.notas = s.notas.filter(x => x !== n);
    });
    vibrar(); render(); if (activa) marcarNota(id, a);
  });
  root.addEventListener('keydown', e => { if (e.target.id === 'diNota' && e.key === 'Enter') { e.preventDefault(); anadir(); } });
  root.addEventListener('input', e => {
    const t = e.target, s = ses();
    if (t.id === 'diQ') { V.q = t.value; const pos = t.selectionStart; lista(); const q = $('#diQ'); q.focus(); q.setSelectionRange(pos, pos); return; }
    if (t.id === 'bxQ') { V.bq = t.value; const pos = t.selectionStart; bestiario(); const q = $('#bxQ'); q.focus(); q.setSelectionRange(pos, pos); return; }
    if (V.vista === 'criatura') { const x = criatura(ch(), V.cid); if (!x) return;
      const campo = { bxNom: 'nombre', bxCa: 'ca', bxPg: 'pg', bxTac: 'tacticas', bxNot: 'notas' }[t.id]; if (campo) { x[campo] = t.value; S.touch(); if (campo === 'nombre') $('#diTitle').textContent = t.value || 'Nueva criatura'; } return; }
    if (!s) return;
    if (t.id === 'diTit') { s.titulo = t.value; S.touch(); }
    if (t.id === 'diTxt') { s.texto = t.value; S.touch(); }
    if (t.id === 'diFecha' && t.value) { s.fecha = t.value; S.touch(); }
  });
  root.addEventListener('close', () => S.emit('diario'));
}
