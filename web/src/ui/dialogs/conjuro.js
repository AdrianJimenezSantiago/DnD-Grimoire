/** Ficha del conjuro: lectura completa, opciones de lanzamiento y edición de textos. */
import { esc } from '../../core/util.js';
import { perfil } from '../../domain/reglas2024.js';
import { srdFor, srdAsSpell, manualFor, estadosRegex, claveDeForma, tiradasConjuro } from '../../domain/catalogo.js';
import { tieneTiradas } from '../../domain/tiradas.js';
import { gi } from '../tema.js';
import { openRoll, iconoDano } from './tiradas.js';
import { openArea } from './area.js';
import { parseArea, describir } from '../../domain/area.js';
import { $, on } from '../dom.js';
import { freeOf, isPrepared, schoolKey, slotsOf } from '../sheet.js';
import { openSheet, closeSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { cast, undoBtn } from '../../app/acciones.js';
import { confirmar } from '../modal.js';

let S, SP = null;   // {mode:'book'|'preview', bi, item, edit, onAdd}
const dlg = () => $('#spellDlg');

/* Aplica una transformación solo al texto, nunca dentro de etiquetas ya puestas. */
const porTexto = (html, fn) => html.split(/(<[^>]+>)/).map(p => (p.startsWith('<') ? p : fn(p))).join('');
const enlazar = h => { const e = estadosRegex(); return e ? porTexto(h, t => t.replace(e.re, (m, pre, w) => { const k = claveDeForma(w); return k ? `${pre}<button type="button" class="term" data-term="${k}">${w}</button>` : m; })) : h; };
const TIPOS = { 'ácido': 'acido', contundente: 'contundente', cortante: 'cortante', 'frío': 'frio', fuego: 'fuego', fuerza: 'fuerza', 'necrótico': 'necrotico',
  perforante: 'perforante', 'psíquico': 'psiquico', radiante: 'radiante', 'relámpago': 'relampago', trueno: 'trueno', veneno: 'veneno' };
/* Resalta lo que se busca de un vistazo en mesa: dados, tipos de daño, salvaciones, ataques y distancias. */
const realzar = h => porTexto(h, t => t
  .replace(/\b(\d+d\d+(?:\s*\+\s*\d+)?)\b/g, '<span class="k-dice">$1</span>')
  .replace(/(de daño )(?:(de |por ))?(ácido|contundente|cortante|frío|fuego|fuerza|necrótico|perforante|psíquico|radiante|relámpago|trueno|veneno)\b/gi,
    (m, a, b, tipo) => `${a}${b || ''}<span class="k-dmg dmg-${TIPOS[tipo.toLowerCase()] || 'fuerza'}">${gi(TIPOS[tipo.toLowerCase()] || 'fuerza')}${tipo}</span>`)
  .replace(/(tirada de salvación de (?:Fuerza|Destreza|Constitución|Inteligencia|Sabiduría|Carisma))/g, '<span class="k-save">$1</span>')
  .replace(/(ataque de conjuro (?:a distancia|cuerpo a cuerpo))/g, '<span class="k-atk">$1</span>')
  .replace(/\b(\d+(?:,\d+)?\s?(?:m|km))\b(?![\p{L}])/gu, '<span class="k-dist">$1</span>'));
/* Encabezado corto al inicio de un párrafo («Sonido.», «Efecto sensorial.») en negrita. */
const cabecilla = t => t.replace(/^([A-ZÁÉÍÓÚÑ][^.:]{1,38}[.:])(\s)/, (m, a, sp) => (a.split(/\s+/).length <= 5 ? `<b class="lead">${a}</b>${sp}` : m));
export function md(t) {
  return String(t || '').trim().split(/\n{2,}/).map(p => '<p>' + enlazar(realzar(cabecilla(esc(p))))
    .replace(/\*\*\*(.+?)\*\*\*/g, '<b><i>$1</i></b>').replace(/\*\*_?(.+?)_?\*\*/g, '<b>$1</b>').replace(/(^|\W)_(.+?)_(?=\W|$)/g, '$1<i>$2</i>')
    .replace(/\n/g, '<br>') + '</p>').join('');
}
function data() {
  if (SP.mode === 'book') { const ch = S.cur(), e = ch.book[SP.bi], s = S.db.catalog[e.sid]; return { s, x: srdFor(s), e }; }
  const it = SP.item; if (it.src === 'cat') return { s: it.s, x: srdFor(it.s) };
  return { s: srdAsSpell(it.x), x: it.x };
}
export function openSpell(bi, opt = {}) { SP = { mode: 'book', bi, edit: !!opt.edit }; render(); openSheet(dlg()); }
export function previewSpell(item, opt = {}) { SP = { mode: 'preview', item, onAdd: opt.onAdd }; render(); openSheet(dlg()); }

function castOptions(bi) {
  const ch = S.cur(), e = ch.book[bi], s = S.db.catalog[e.sid], P = perfil(ch);
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
    // Prioridad: texto propio > manual importado > traducción incluida > SRD en inglés
    const man = manualFor(x), propio = s.desc && !(x && s.desc === x.dEs);
    let desc = '', sup = '', en = false, fuente = '';
    if (propio) { desc = s.desc; sup = s.sup; }
    else if (man) { desc = man.d; sup = man.h; fuente = 'Manual del Jugador (importado de tu PDF)'; }
    else if (s.desc) { desc = s.desc; sup = s.sup; }
    else if (x?.d) { desc = x.d; sup = x.h; en = true; }
    if (fuente) h += `<p class="srcnote">${fuente}</p>`;
    if (desc) h += `<section class="sp-text ${en ? 'en' : ''}" ${en ? 'lang="en"' : ''}>${md(desc)}</section>`;
    else h += `<p class="note">Aún no hay descripción. Impórtala desde tu manual (Más → Manual del jugador) o escríbela con «Editar texto».</p>`;
    if (en) h += `<p class="note">Texto original del SRD en inglés. Importa tu manual para verlo en español, o escríbelo con «Editar texto».</p>`;
    if (sup) h += `<section class="sp-text ${en ? 'en' : ''}"><h3>${s.level === 0 ? 'Mejora del truco' : 'Con espacios de nivel superior'}</h3>${md(sup)}</section>`;
    { const man = manualFor(x), textos = [man?.d, s.desc, x?.dEs, x?.d].filter(Boolean), ar = parseArea(textos.join(' '), s.alcance);
      if (ar) h += `<button type="button" class="rl-open ar-open" data-areaopen><span class="ar-ico" aria-hidden="true"></span><span><b>Ver área en la cuadrícula</b><small>${esc(describir(ar))}</small></span></button>`; }
    if (SP.mode === 'book') { const t = tiradasConjuro(s); if (tieneTiradas(t)) h += `<section class="sp-cast"><h3>Tiradas</h3><button type="button" class="rl-open" data-rollopen>${t.danos[0] ? iconoDano(t.danos[0].tipo) : t.curacion ? iconoDano('curación') : ''}<span><b>${t.ataque ? 'Atacar y tirar daño' : t.curacion && !t.danos.length ? 'Tirar curación' : 'Tirar daño'}</b><small>${[t.ataque ? 'ataque ' + t.ataque : '', t.salvacion ? 'salvación de ' + t.salvacion : ''].filter(Boolean).join(', ') || 'dados del conjuro'}</small></span></button></section>`; h += castOptions(SP.bi); }
    if (x && en) h += `<p class="credit">Texto del System Reference Document 5.2 de Wizards of the Coast, licencia CC-BY 4.0.</p>`;
  }
  $('#spBody').innerHTML = h; $('#spBody').scrollTop = 0;
  const canEdit = SP.mode === 'book' || SP.item?.src === 'cat';
  $('#spFoot').innerHTML = SP.edit
    ? `<button type="button" data-sp="canceledit">Cancelar</button><span class="spacer"></span><button type="button" class="primary" data-sp="save">Guardar texto</button>`
    : `${canEdit ? '<button type="button" data-sp="edit">Editar texto</button>' : ''}<span class="spacer"></span><button type="button" data-sp="close">Cerrar</button>${SP.mode === 'preview' && SP.onAdd ? '<button type="button" class="gold" data-sp="add">Añadir al libro</button>' : ''}`;
}
const catalogEntry = () => (SP.mode === 'book' ? S.db.catalog[S.cur().book[SP.bi].sid] : SP.item.src === 'cat' ? SP.item.s : null);

export function init(store) {
  S = store;
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
