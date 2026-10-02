// Ficha de un conjuro: texto con realce y enlaces al glosario, nivel al que lanzarlo, ritual y tablas.
import { esc, norm } from '../../core/util.js';
import { perfil, magiaPara } from '../../domain/reglas/reglas2024.js';
import { srdFor, srdAsSpell, manualFor, tiradasConjuro, nombresConjuros } from '../../domain/conjuros/catalogo.js';
import { estadosRegex, claveDeForma, termino } from '../../domain/libros/terminos.js';
import { biblioteca, criaturaImportada } from '../../domain/libros/biblioteca.js';
import { realzador, porTexto } from '../../domain/presentacion/realce.js';
import { lanzadorTira } from '../../domain/combate/efectos.js';
import { gi } from '../componentes/tema.js';
import { openRoll, iconoDano } from './tiradas.js';
import { openArea } from './area.js';
import { parseArea, describir } from '../../domain/combate/area.js';
import { $, on } from '../componentes/dom.js';
import { freeOf, isPrepared, schoolKey, slotsOf } from '../../domain/conjuros/espacios.js';
import { openSheet, closeSheet } from '../componentes/dialog.js';
import { toast, undoBtn } from '../componentes/toast.js';
import { cast } from '../../app/acciones.js';
import { confirmar } from '../componentes/modal.js';
import { notasConjuro } from '../../domain/criaturas/bestiario.js';
import { openBestiario } from './diario.js';
import { haptic } from '../../platform/native.js';
import { CAR_TXT, ESPIRITUS, PERFILES, caracteristicas, criaturasDe, perfilDe } from '../../domain/criaturas/criaturas.js';
import { formasPosibles } from '../../domain/criaturas/monstruos.js';
import { openFormas } from './formas.js';

let S, SP = null;
const dlg = () => $('#spellDlg');

const enlazar = h => { const e = estadosRegex(); return e ? porTexto(h, t => t.replace(e.re, (m, pre, w) => { const k = claveDeForma(w); return k ? `${pre}<button type="button" class="term${termino(k)?.cat === 'Estado' ? ' est' : ''}" data-term="${k}">${w}</button>` : m; })) : h; };
export { porTexto };
export const realzar = realzador({ icono: gi, conjuros: nombresConjuros });
// Un texto corto de la app (sin markdown) con el mismo realce y los enlaces al glosario
export const rico = t => enlazar(realzar(esc(t)));
const cabecilla = t => t.replace(/^([A-ZÁÉÍÓÚÑ][^.:]{1,38}[.:])(\s)/, (m, a, sp) => (a.split(/\s+/).length <= 5 ? `<b class="lead">${a}</b>${sp}` : m));
const DADO_CAB = /^(\d{0,2})d(\d{1,3})$/i;
const enLinea = t => enlazar(realzar(cabecilla(esc(t))))
  .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>').replace(/\*\*_?(.+?)_?\*\*/g, '<b>$1</b>').replace(/(^|\W)_(.+?)_(?=\W|$)/g, '$1<i>$2</i>');
const celdas = f => f.trim().replace(/^\|/, '').replace(/\|$/, '').split(' | ').map(c => c.trim());
function tablaHtml(lineas) {
  const filas = lineas.map(celdas), cab = filas[0], cuerpo = filas.slice(1), n = Math.max(...filas.map(f => f.length));
  const esRot = c => /^\d{1,3}(?:\s*[–-]\s*\d{1,3})?\.?$/.test(c);
  const dado = DADO_CAB.exec(cab[0] || ''), numerada = dado || cuerpo.filter(f => esRot(f[0])).length >= cuerpo.length * 0.7;
  const td = (c, k, th) => { const t = th ? 'th' : 'td'; return `<${t}${k === 0 && numerada ? ' class="tb-n"' : ''}>${c ? (th ? esc(c) : enLinea(c)) : ''}</${t}>`; };
  const pad = f => [...f, ...Array(n - f.length).fill('')];
  const tirar = dado ? `<button type="button" class="tb-roll" data-tbroll="${esc(cab[0])}" aria-label="Tirar ${esc(cab[0])} en esta tabla">${gi('d20')}<span>Tirar ${esc(cab[0])}</span></button>` : '';
  return `<figure class="tb ${numerada ? 'numerada' : ''} ${n > 2 ? 'ancha' : ''}">${tirar}<div class="tb-scroll"><table>
    <thead><tr>${pad(cab).map((c, k) => td(c, k, true)).join('')}</tr></thead>
    <tbody>${cuerpo.map(f => `<tr${numerada && esRot(f[0]) ? ` data-rot="${esc(f[0].replace(/\.$/, ''))}"` : ''}>${pad(f).map((c, k) => td(c, k)).join('')}</tr>`).join('')}</tbody></table></div></figure>`;
}
// El mismo texto sin botones del glosario, para meterlo dentro de otro botón (una tarjeta que se elige)
export const mdPlano = t => md(t).replace(/<button type="button" class="term[^"]*"[^>]*>(.*?)<\/button>/g, '<b class="term-plano">$1</b>');
export function md(t) {
  const bloques = String(t || '').trim().split(/\n{2,}/).filter(b => b.trim());
  let h = '', lista = [];
  const cierraLista = () => { if (lista.length) h += `<ul class="md-ul">${lista.map(x => `<li>${enLinea(x)}</li>`).join('')}</ul>`; lista = []; };
  for (const b of bloques) {
    const lineas = b.split('\n');
    if (lineas.length >= 2 && lineas.every(l => /^\|.*\|?\s*$/.test(l.trim()) && l.trim().startsWith('|'))) { cierraLista(); h += tablaHtml(lineas); continue; }
    if (/^###\s/.test(b)) { cierraLista(); h += `<h4 class="md-h">${esc(b.replace(/^###\s*/, ''))}</h4>`; continue; }
    if (/^•\s/.test(b)) { lista.push(b.replace(/^•\s*/, '')); continue; }
    cierraLista();
    h += '<p>' + enLinea(b).replace(/\n/g, '<br>') + '</p>';
  }
  cierraLista();
  return h;
}
export function tirarTabla(btn) {
  const m = DADO_CAB.exec(btn.dataset.tbroll || ''); if (!m) return;
  const n = +(m[1] || 1), caras = +m[2];
  const v = Array.from({ length: n }, () => 1 + Math.floor(Math.random() * caras)).reduce((a, b) => a + b, 0);
  const fig = btn.closest('.tb'); let hit = null;
  fig.querySelectorAll('tr[data-rot]').forEach(tr => {
    tr.classList.remove('hit');
    const r = /^(\d{1,3})(?:\s*[–-]\s*(\d{1,3}))?$/.exec(tr.dataset.rot); if (!r) return;
    const a = r[1] === '00' ? 100 : +r[1], z = r[2] == null ? a : (r[2] === '00' ? 100 : +r[2]);
    if (v >= a && v <= z) hit = tr;
  });
  btn.querySelector('span').innerHTML = `${esc(btn.dataset.tbroll)}: <b>${v}</b>`;
  btn.classList.remove('rolled'); void btn.offsetWidth; btn.classList.add('rolled');
  if (hit) { void hit.offsetWidth; hit.classList.add('hit'); hit.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  return v;
}
function data() {
  if (SP.mode === 'book') { const ch = S.cur(), e = ch.book[SP.bi], s = S.db.catalog[e.sid]; return { s, x: srdFor(s), e }; }
  const it = SP.item; if (it.src === 'cat') return { s: it.s, x: srdFor(it.s) };
  return { s: srdAsSpell(it.x), x: it.x };
}
export function openSpell(bi, opt = {}) { SP = { mode: 'book', bi, edit: !!opt.edit }; render(); openSheet(dlg()); }
export function previewSpell(item, opt = {}) { SP = { mode: 'preview', item, onAdd: opt.onAdd }; render(); openSheet(dlg()); }

function castOptions(bi) {
  const ch = S.cur(), e = ch.book[bi], s = S.db.catalog[e.sid], P = magiaPara(perfil(ch), e.fuente);
  if (s.level === 0) return '';
  let o = '';
  if (e.gratis) o += `<button type="button" data-opt="free" ${e.used ? 'disabled' : ''}>Uso gratis <small>${e.used ? 'ya gastado' : esc(e.gratis)}</small></button>`;
  if (s.ritual && (isPrepared(e) || P.ritualLibro)) o += `<button type="button" data-opt="ritual">Como ritual <small>sin espacio, +10 min</small></button>`;
  for (let L = s.level; L <= P.maxSlot; L++) { if (!slotsOf(P, L)) continue;
    const pact = P.pact && L === P.pact.level;
    o += `<button type="button" data-opt="slot:${L}" ${freeOf(ch, P, L) ? '' : 'disabled'}>${pact ? 'Espacio de pacto, nivel ' + L : 'Espacio de nivel ' + L}${L > s.level && !pact ? ' (potenciado)' : ''} <small>${freeOf(ch, P, L)} de ${slotsOf(P, L)} libres</small></button>`; }
  return `<section class="sp-cast"><h3>Lanzar${!isPrepared(e) ? ' <small>(no está preparado)</small>' : ''}</h3><div class="opts">${o || '<p class="note">No hay espacios de este nivel ni usos gratis.</p>'}</div></section>`;
}
function render() {
  const { s, x } = data();
  $('#spTitle').textContent = s.es || s.en;
  const sk = schoolKey(s.escuela);
  dlg().style.setProperty('--sc', `var(--sc-${sk || 'none'})`);
  $('#spSub').innerHTML = (s.en && s.en !== s.es ? `<i>${esc(s.en)}</i>` : '')
    + `<div class="sp-kind" style="--sc:var(--sc-${sk || 'none'})"><span>${s.level === 0 ? 'Truco' : 'Nivel ' + s.level}</span>${s.escuela ? `<span class="school">${esc(s.escuela)}</span>` : ''}${s.ritual ? '<span>Ritual</span>' : ''}${s.conc ? '<span>Concentración</span>' : ''}</div>`;
  let h = '';
  if (SP.edit) {
    h = `<label class="f wide">Resumen para la mesa<textarea id="spEf" rows="2" placeholder="Una línea con lo esencial">${esc(s.efecto)}</textarea></label>
      <label class="f wide" style="margin-top:14px">Descripción<textarea id="spDe" rows="10" placeholder="El texto completo del conjuro">${esc(s.desc)}</textarea></label>
      <label class="f wide" style="margin-top:14px">${s.level === 0 ? 'Mejora del truco' : 'Con espacios de nivel superior'}<textarea id="spSu" rows="3">${esc(s.sup)}</textarea></label>
      ${x && (x.d || manualFor(x)) ? `<div class="row-btns" style="justify-content:flex-start"><button type="button" id="spFromEn">${manualFor(x) ? 'Partir del texto del manual' : 'Partir del texto original en inglés'}</button></div>` : ''}
      <p class="note">Separa los párrafos con una línea en blanco; **así** se escribe en negrita. Estos textos se comparten con todos los personajes que tengan el conjuro.</p>`;
  } else {
    if (s.efecto) h += `<p class="sp-sum">${esc(s.efecto)}</p>`;
    const props = [['Lanzamiento', s.tiempo], ['Alcance', s.alcance], ['Duración', s.duracion], ['Componentes', s.comp], ['Material', s.coste]].filter(p => p[1]);
    h += `<dl class="sp-props">${props.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
    const man = manualFor(x), propio = s.desc && !(x && s.desc === x.dEs);
    let desc = '', sup = '', en = false, fuente = '';
    if (propio) { desc = s.desc; sup = s.sup; }
    else if (man) { desc = man.d; sup = man.h; fuente = `${x?.fuente || 'Manual del Jugador'} (importado de tu PDF)`; }
    else if (s.desc) { desc = s.desc; sup = s.sup; }
    else if (x?.d) { desc = x.d; sup = x.h; en = true; }
    if (fuente) h += `<p class="srcnote">${fuente}</p>`;
    if (desc) h += `<section class="sp-text ${en ? 'en' : ''}" ${en ? 'lang="en"' : ''}>${md(desc)}</section>`;
    else h += `<p class="note">Aún no hay descripción. Impórtala desde tu manual (Más → Manual del jugador) o escríbela con «Editar texto».</p>`;
    if (en) h += `<p class="note">Texto original del SRD en inglés. Importa tu manual para verlo en español, o escríbelo con «Editar texto».</p>`;
    if (sup) h += `<section class="sp-text ${en ? 'en' : ''}"><h3>${s.level === 0 ? 'Mejora del truco' : 'Con espacios de nivel superior'}</h3>${md(sup)}</section>`;
    { const man = manualFor(x), textos = [man?.d, s.desc, x?.dEs, x?.d].filter(Boolean), ar = parseArea(textos.join(' '), s.alcance);
      if (ar) h += `<button type="button" class="rl-open ar-open" data-areaopen><span class="ar-ico" aria-hidden="true"></span><span><b>Ver área en la cuadrícula</b><small>${esc(describir(ar))}</small></span></button>`; }
    if (SP.mode === 'book') { const t = tiradasConjuro(s); if (lanzadorTira(s.es, t)) h += `<section class="sp-cast"><h3>Tiradas</h3><button type="button" class="rl-open" data-rollopen>${t.danos[0] ? iconoDano(t.danos[0].tipo) : t.curacion ? iconoDano('curación') : ''}<span><b>${t.ataque ? 'Atacar y tirar daño' : t.curacion && !t.danos.length ? 'Tirar curación' : 'Tirar daño'}</b><small>${[t.ataque ? 'ataque ' + t.ataque : '', t.salvacion ? 'salvación de ' + t.salvacion : ''].filter(Boolean).join(', ') || 'dados del conjuro'}</small></span></button></section>`; h += castOptions(SP.bi); }
    h += criaturasHtml(s);
    h += pieBestiario(s);
    if (x && en) h += `<p class="credit">Texto del System Reference Document 5.2 de Wizards of the Coast, licencia CC-BY 4.0.</p>`;
  }
  $('#spBody').innerHTML = h; $('#spBody').scrollTop = 0;
  const canEdit = SP.mode === 'book' || SP.item?.src === 'cat';
  $('#spFoot').innerHTML = SP.edit
    ? `<button type="button" data-sp="canceledit">Cancelar</button><span class="spacer"></span><button type="button" class="primary" data-sp="save">Guardar texto</button>`
    : `${canEdit ? '<button type="button" data-sp="edit">Editar texto</button>' : ''}<span class="spacer"></span><button type="button" data-sp="close">Cerrar</button>${SP.mode === 'preview' && SP.onAdd ? '<button type="button" class="gold" data-sp="add">Añadir al libro</button>' : ''}`;
}
const signo = n => (n >= 0 ? '+' : '−') + Math.abs(n);
export function bloqueHtml(p) {
  const sec = (t, filas) => (filas?.length ? `<h5>${t}</h5>${filas.map(([n, d]) => `<p>${n ? `<b><i>${esc(n)}.</i></b> ` : ''}${realzar(esc(d)).replace(/\n/g, '<br>')}</p>`).join('')}` : '');
  const linea = (k, v) => (v ? `<p class="sb-ln"><b>${k}</b> ${esc(v)}</p>` : '');
  return `<article class="sb" aria-label="Perfil de ${esc(p.nombre)}"><header><h4>${esc(p.nombre)}</h4><p class="sb-tipo">${esc(p.tipo)}</p></header>
    <div class="sb-base"><span><b>CA</b> ${p.ca ?? '—'}</span>${p.ini != null ? `<span><b>Iniciativa</b> ${signo(p.ini)}</span>` : ''}<span><b>PG</b> ${esc(p.pg)}</span><span><b>Velocidad</b> ${esc(p.vel)}</span></div>
    <div class="sb-car">${caracteristicas(p).map(c => `<div><b>${CAR_TXT[c.k]}</b><span>${c.v}</span><small>${signo(c.mod)}${c.salv !== c.mod ? ` · salv. ${signo(c.salv)}` : ''}</small></div>`).join('')}</div>
    ${linea('Habilidades', p.hab)}${linea('Vulnerabilidades', p.vul)}${linea('Resistencias', p.res)}${linea('Inmunidades', p.inm)}${linea('Equipo', p.equipo)}
    ${linea('Sentidos', p.sentidos)}${linea('Idiomas', p.idiomas || 'ninguno')}${linea('VD', p.vd)}
    ${sec('Atributos', p.rasgos)}${sec('Acciones', p.acciones)}${sec('Acciones adicionales', p.adicionales)}${sec('Reacciones', p.reacciones)}${sec('Acciones legendarias', p.legendarias)}</article>`;
}
function criaturasHtml(s) {
  const cr = criaturasDe(s.es); if (!cr) return '';
  const ch = S.cur(), P = ch ? perfil(ch) : null, mem = ch?.invocaciones?.[s.es] || {};
  if (SP.cria === undefined) SP.cria = SP.mode === 'book' && (PERFILES[mem.id] || String(mem.id || '').startsWith('mm:')) ? mem.id : null;
  const perfilDeId = id => (String(id).startsWith('mm:') ? criaturaImportada(id.slice(3)) : PERFILES[id] ? perfilDe(id) : null);
  const chip = id => { const p = perfilDeId(id); if (!p) return ''; return `<button type="button" class="cr-chip ${SP.cria === id ? 'on' : ''} ${mem.id === id ? 'mio' : ''}" data-cria="${esc(id)}" aria-pressed="${SP.cria === id}">${esc(p.nombre)}${mem.id === id ? '<small>tuyo</small>' : ''}</button>`; };
  const importadas = biblioteca().criaturas.length > 0;
  let h = `<section class="sp-cria"><h3>${cr.espiritu ? 'Perfil de la criatura' : cr.familiar ? 'Formas del familiar' : 'Criaturas'}</h3>`;
  if (cr.familiar) {
    h += `<p class="note">Es un espíritu con forma animal: celestial, feérico o infernal (lo eliges al lanzarlo). No puede atacar, pero sí hacer otras acciones.</p><div class="cr-chips">${cr.familiar.map(chip).join('')}</div>`;
    if (cr.otrasVd0) {
      const otras = formasPosibles(biblioteca().criaturas, { vd: 0 })
        .filter(c => { const n = norm(c.nombre); return !cr.familiar.some(id => { const f = norm(PERFILES[id].nombre); return n === f || n.slice(1) === f; }); });
      h += otras.length ? `<p class="cr-grupo">Otras bestias de VD 0 <small>de tus libros importados</small></p><div class="cr-chips">${otras.map(c => chip('mm:' + c.clave)).join('')}</div>`
        : importadas ? '' : '<p class="note">El conjuro admite cualquier otra bestia de VD 0 (su perfil está en el Manual de Monstruos).</p>';
    }
    if (ch?.clase === 'Brujo') h += `<p class="cr-grupo">Pacto de la cadena <small>si tienes esta invocación: puede atacar con tu reacción cuando renuncias a uno de tus ataques</small></p><div class="cr-chips">${cr.cadena.map(chip).join('')}</div>`;
  }
  if (cr.fijos) h += `${cr.nota ? `<p class="note">${esc(cr.nota)}</p>` : ''}<div class="cr-chips">${cr.fijos.map(chip).join('')}</div>`;
  if (cr.importadas) {
    const ids = cr.importadas.map(n => criaturaImportada(n)).filter(Boolean).map(c => 'mm:' + c.clave);
    h += `${cr.nota ? `<p class="note">${esc(cr.nota)}</p>` : ''}${ids.length ? `<div class="cr-chips">${ids.map(chip).join('')}</div>` : '<p class="note">Sus perfiles están en el Manual de Monstruos: anótalos a mano en el bestiario si los necesitas.</p>'}`;
  }
  if (cr.formas) {
    h += `<p class="note">${cr.formas === 'polimorfar' ? 'El objetivo se convierte en una bestia con un VD igual o inferior al suyo (o a su nivel).' : 'Cualquier criatura con un VD igual o inferior al nivel del objetivo.'}</p>
      <button type="button" class="rl-open" data-formas="${cr.formas}">${gi('criatura')}<span><b>Elegir forma</b><small>${importadas ? 'Filtra por VD las criaturas de tus libros y consulta su perfil' : 'Las bestias del Manual del Jugador importado, filtradas por VD'}</small></span></button>`;
    return h + '</section>';
  }
  if (cr.espiritu) {
    const e = ESPIRITUS[cr.espiritu], n = Math.max(e.base, SP.nivelCria || mem.n || Math.max(s.level, e.base)), v = SP.varCria || mem.v || e.variantes[0];
    const p = perfilDe(cr.espiritu, { n, v, atk: P?.atk ?? 0, cd: P?.cd ?? 10 });
    h += `<div class="cr-ctl">${e.variantes.length ? `<div class="seg" role="radiogroup" aria-label="Variante">${e.variantes.map(x => `<button type="button" role="radio" aria-checked="${x === v}" data-crvar="${esc(x)}">${esc(x.charAt(0).toUpperCase() + x.slice(1))}</button>`).join('')}</div>` : ''}
      <label class="f cr-niv">Espacio de nivel<select data-crniv>${Array.from({ length: 10 - e.base }, (_, i) => e.base + i).map(L => `<option ${L === n ? 'selected' : ''}>${L}</option>`).join('')}</select></label></div>
      ${P?.atk != null ? `<p class="note">Con tu ataque de conjuro ${signo(P.atk)} y tu CD ${P.cd}. Su bonificador por competencia es el tuyo (${signo(P.pb)}).</p>` : ''}${bloqueHtml(p)}`;
  } else if (SP.cria && perfilDeId(SP.cria)) {
    h += bloqueHtml(perfilDeId(SP.cria));
    if (SP.mode === 'book' && ch) h += `<div class="row-btns" style="justify-content:flex-start"><button type="button" data-crmio="${SP.cria}">${mem.id === SP.cria ? 'Es tu forma actual' : 'Marcar como la mía'}</button></div>`;
  } else h += '<p class="note">Toca una forma para ver su perfil.</p>';
  return h + '</section>';
}
function pieBestiario(s) {
  const ch = S.cur(); if (!ch || !ch.bestiario?.criaturas?.length) return '';
  const t = tiradasConjuro(s), sid = SP.mode === 'book' ? s.id : SP.item?.src === 'cat' ? SP.item.s.id : null;
  const notas = notasConjuro(ch, { sid, tipos: (t?.danos || []).map(d => d.tipo) }); if (!notas.length) return '';
  const REL = { vul: 'vulnerable', res: 'resiste', inm: 'inmune', eficaz: 'funcionó', ineficaz: 'no funcionó' };
  const max = 4, vis = notas.slice(0, max);
  return `<aside class="bx-foot" aria-label="Según tu bestiario">${gi('bestia')}<span class="bx-foot-l">Tu bestiario</span>
    ${vis.map(n => `<button type="button" class="bx-chip rel-${n.rel} ${n.c.estado !== 'viva' ? 'apagada' : ''}" data-bxopen="${n.c.id}" title="${esc(n.motivo)}">${esc(n.c.nombre || 'Sin nombre')}<em>${REL[n.rel]}</em></button>`).join('')}
    ${notas.length > max ? `<span class="bx-foot-mas">y ${notas.length - max} más</span>` : ''}</aside>`;
}
const catalogEntry = () => (SP.mode === 'book' ? S.db.catalog[S.cur().book[SP.bi].sid] : SP.item.src === 'cat' ? SP.item.s : null);

export function init(store) {
  S = store;
  on($('#spBody'), 'click', '[data-bxopen]', (e, b) => openBestiario(b.dataset.bxopen));
  const recuerda = cambios => { const { s } = data(), ch = S.cur(); if (SP.mode !== 'book' || !ch) return;
    S.edit((db, c) => { c.invocaciones ||= {}; c.invocaciones[s.es] = { ...(c.invocaciones[s.es] || {}), ...cambios }; }); };
  const repinta = () => { const y = $('#spBody').scrollTop; render(); $('#spBody').scrollTop = y; };
  on($('#spBody'), 'click', '[data-formas]', (e, b) => openFormas(b.dataset.formas));
  on($('#spBody'), 'click', '[data-cria],[data-crvar],[data-crmio]', (e, b) => {
    if (b.dataset.cria) SP.cria = SP.cria === b.dataset.cria ? null : b.dataset.cria;
    if (b.dataset.crvar) { SP.varCria = b.dataset.crvar; recuerda({ v: SP.varCria }); }
    if (b.dataset.crmio) { const id = b.dataset.crmio, p = String(id).startsWith('mm:') ? criaturaImportada(id.slice(3)) : PERFILES[id]; recuerda({ id }); toast(`${esc(p?.nombre || '')}: la forma que usas ahora.`); }
    repinta(); haptic('light');
  });
  $('#spBody').addEventListener('change', e => { if (e.target.dataset.crniv !== undefined) { SP.nivelCria = +e.target.value; recuerda({ n: SP.nivelCria }); repinta(); } });
  on(document, 'click', '[data-tbroll]', (e, b) => { tirarTabla(b); haptic('light'); });
  on($('#spBody'), 'click', '[data-areaopen]', () => { const { s, x } = data(), man = manualFor(x); openArea(s, [man?.d, s.desc, x?.dEs, x?.d].filter(Boolean)); });
  on($('#spBody'), 'click', '[data-rollopen]', () => { const bi = SP.bi; closeSheet(dlg()); setTimeout(() => openRoll(bi), 150); });
  on($('#spBody'), 'click', '#spFromEn,[data-opt]', async (ev, b) => {
    if (b.id === 'spFromEn') { const { x } = data(), man = manualFor(x); if ($('#spDe').value.trim() && !(await confirmar({ titulo: '¿Sustituir lo escrito?', texto: 'El texto que has escrito se reemplaza por el original.', ok: 'Sustituir' }))) return;
      $('#spDe').value = man ? man.d : x.d; $('#spSu').value = (man ? man.h : x.h) || ''; $('#spDe').focus(); return; }
    if (b.disabled) return;
    const bi = SP.bi, [m, L] = b.dataset.opt.split(':');
    closeSheet(dlg()); setTimeout(() => cast(S, bi, m, L ? +L : undefined), 120);
  });
  on($('#spFoot'), 'click', '[data-sp]', (ev, a) => {
    const act = a.dataset.sp;
    if (act === 'close') return closeSheet(dlg());
    if (act === 'edit' || act === 'canceledit') { SP.edit = act === 'edit'; return render(); }
    if (act === 'save') {
      const s = catalogEntry(), ef = $('#spEf').value.trim(), de = $('#spDe').value.trim(), su = $('#spSu').value.trim();
      const h = S.edit(db => { const t = db.catalog[s.id]; t.efecto = ef; t.desc = de; t.sup = su; });
      if (SP.item?.src === 'cat') SP.item.s = S.db.catalog[s.id];
      SP.edit = false; render(); toast(`Texto de <b>${esc(s.es)}</b> guardado.`, [undoBtn(S, h)]); return;
    }
    if (act === 'add') { const f = SP.onAdd; closeSheet(dlg()); f?.(); }
  });
}
