/** Vista de la hoja. Solo pinta: los eventos viven en app/eventos.js. */
import { esc, norm } from '../core/util.js';
import { ABIL_NAME, perfil, sgn } from '../domain/reglas2024.js';
import { castSchools, castTriggerDesc, reglas, recState, RECARGA_CORTA, schoolMatch, usosGastados } from '../domain/rasgos.js';
import { $, patch, patchKeyed } from './dom.js';
import { icon, ASTROLABE } from './icons.js';
import { pop } from './fx.js';

/* ---------- consultas de la hoja ---------- */
export const slotsOf = (P, n) => P.slots[n] || 0;
export const usedOf = (ch, P, n) => Math.min(ch.play.used[n] || 0, slotsOf(P, n));
export const freeOf = (ch, P, n) => slotsOf(P, n) - usedOf(ch, P, n);
export function firstFreeFrom(ch, P, n) { for (let L = Math.max(1, n); L <= 9; L++) if (freeOf(ch, P, L) > 0) return L; return 0; }
export const isPrepared = e => !!(e.prep || e.always);
export const prepCount = (db, ch) => ch.book.filter(e => { const s = db.catalog[e.sid]; return s && s.level > 0 && e.prep && !e.always; }).length;
export const cantCount = (db, ch) => ch.book.filter(e => { const s = db.catalog[e.sid]; return s && s.level === 0 && !e.always; }).length;
export const claseLinea = ch => `${ch.clase}${ch.subclase ? ` (${ch.subclase})` : ''}, nivel ${ch.nivel}`;
export const origenLinea = ch => [ch.especie, ch.trasfondo].filter(Boolean).join(', ');
const SC = { abj: 'abj', adi: 'adi', con: 'con', enc: 'enc', evo: 'evo', ilu: 'ilu', nig: 'nig', tra: 'tra' };
export const schoolKey = esc2 => SC[norm(esc2).slice(0, 3)] || '';
const lemaHtml = t => esc(t).replace(/_(.+?)_/g, '<span class="u">$1</span>');

/* ---------- piezas ---------- */
function candles(ch, P, L) {
  const s = slotsOf(P, L), free = freeOf(ch, P, L); let h = '';
  for (let i = 0; i < s; i++) {
    const spent = i >= free;
    h += `<button type="button" class="slotbtn ${spent ? 'spent' : ''}" style="--i:${i}" data-slotbtn="${L}:${i}" aria-label="Espacio de nivel ${L}: ${spent ? 'gastado, toca para recuperarlo' : 'libre, toca para gastarlo'}"><span class="flame"></span></button>`;
  }
  return h;
}
function ce(val, attrs, editing) { return `<span ${editing ? 'contenteditable="true"' : ''} ${attrs}>${esc(val)}</span>`; }

function heroHtml(ch, P) {
  const mods = P.apKey ? `${ABIL_NAME[P.apKey]} ${sgn(P.mod)}, competencia ${sgn(P.pb)}` : `Competencia ${sgn(P.pb)}`;
  return `${ASTROLABE}
    <h1>${esc(ch.nombre)}<svg class="underline" viewBox="0 0 300 14" preserveAspectRatio="none" aria-hidden="true"><path d="M3 9 C 60 3, 120 12, 180 7 S 270 5, 297 8"/></svg></h1>
    <div class="clase">${esc(ch.clase)}${ch.subclase ? ` <span class="sub">· ${esc(ch.subclase)}</span>` : ''}, nivel ${ch.nivel}${origenLinea(ch) ? `<span class="sub">. ${esc(origenLinea(ch))}</span>` : ''}</div>
    <div class="mods">${mods}</div>
    ${ch.lema ? `<div class="motto">${lemaHtml(ch.lema)}</div>` : ''}
    <div class="chips">
      <button type="button" class="chip" data-cmd="editchar">${icon('user')}Editar personaje</button>
      <button type="button" class="chip" data-cmd="rules">${icon('sliders')}Rasgos</button>
      ${ch.nivel < 20 ? `<button type="button" class="chip gold" data-cmd="levelup">${icon('star')}Subir a nivel ${ch.nivel + 1}</button>` : ''}
    </div>`;
}
function statsHtml(db, ch, P) {
  const pc = prepCount(db, ch), cc = cantCount(db, ch);
  const st = (v, l, cls = '') => `<div class="stat ${cls}"><b>${v}</b><span>${l}</span></div>`;
  return st(P.cd ?? '—', 'CD de salvación', 'key') + st(P.atk == null ? '—' : sgn(P.atk), 'Ataque de conjuro', 'key')
    + st(P.c?.cant ? `${cc}/${P.maxCant}` : cc, 'Trucos', P.c?.cant && cc > P.maxCant ? 'over' : '')
    + st(P.c ? `${pc}/${P.maxPrep}` : pc, 'Preparados', P.c && pc > P.maxPrep ? 'over' : '');
}

function recursoHtml(ch, r) {
  const used = usosGastados(ch, r), left = r.max - used;
  const ctl = r.max <= 10
    ? `<span class="rticks">${Array.from({ length: r.max }, (_, i) => `<button type="button" class="rtick ${i >= left ? 'on' : ''}" data-rtick="${r.id}|${i}" aria-label="${esc(r.nombre)}: uso ${i + 1} ${i >= left ? 'gastado' : 'disponible'}"></button>`).join('')}</span>`
    : `<span class="rstep"><button type="button" data-rstep="${r.id}|1" aria-label="Gastar 1 de ${esc(r.nombre)}">−</button><button type="button" class="rleft" data-rset="${r.id}" aria-label="Cambiar lo que queda">${left}<small> / ${r.max}</small></button><button type="button" data-rstep="${r.id}|-1" aria-label="Recuperar 1 de ${esc(r.nombre)}">+</button></span>`;
  return `<div class="res rr ${left === 0 ? 'empty-res' : ''}"><strong>${esc(r.nombre)}</strong>${ctl}<span class="rnote">${esc(RECARGA_CORTA[r.recarga] || RECARGA_CORTA.largo)}${r.nota ? '. ' + esc(r.nota) : ''}</span></div>`;
}
function dadosHtml(ch, r) {
  const st = recState(ch, r.id), sides = parseInt(String(r.dado || 'd20').slice(1), 10) || 20; let h = '';
  for (let i = 0; i < r.max; i++) {
    const d = (st.dice || [])[i] || { v: '', used: false };
    h += `<span class="pdie ${d.used ? 'used' : ''}"><input type="text" inputmode="numeric" maxlength="${String(sides).length}" placeholder="${esc(r.dado || 'd20')}" data-dv="${r.id}|${i}|${sides}" value="${esc(d.v)}" ${d.used ? 'readonly' : ''} aria-label="${esc(r.nombre)}: dado ${i + 1}">`
      + `<button type="button" class="tick ${d.used ? 'on' : ''}" data-dused="${r.id}|${i}" aria-pressed="${!!d.used}" aria-label="${esc(r.nombre)}: dado ${i + 1} usado"></button></span>`;
  }
  return `<div class="res pres"><strong>${esc(r.nombre)}</strong>${h}<span class="rnote">Anota ${r.max}${esc(r.dado || 'd20')} al terminar un descanso largo. ${esc(r.nota || '')} Marca la casilla al usar uno.</span></div>`;
}
function recuperarHtml(ch, r) {
  const st = recState(ch, r.id);
  return `<div class="res rr"><strong>${esc(r.nombre)}</strong><button type="button" class="ruse ${st.used ? 'on' : ''}" data-recuse="${r.id}" aria-pressed="${!!st.used}">${st.used ? 'Usada hoy' : 'Usar'}</button>
    <span class="rnote">Hasta ${r.max} niveles de espacios (ninguno de nivel ${(r.nivMax || 5) + 1}+). ${esc(r.nota || '')}</span></div>`;
}
function alLanzarHtml(db, ch, r) {
  let list = '';
  if (r.escuela) {
    const items = [];
    ch.book.forEach(e => {
      const s = db.catalog[e.sid]; if (!s || s.level < 1 || !schoolMatch(s, r.escuela)) return;
      const notes = []; if (r.espacioMin && s.level < r.espacioMin) notes.push(`solo con espacio de nivel ${r.espacioMin}+`); if (r.soloEspacio && s.ritual) notes.push('no como ritual');
      items.push(`<li><span class="aa-lv">${s.level}</span><span><span class="aa-nm">${esc(s.es)}</span>${notes.length ? `<span class="aa-note">${notes.join(', ')}</span>` : ''}</span></li>`);
    });
    list = items.length ? `<ul class="aa-list">${items.join('')}</ul>` : `<div class="aa-note">Aún no hay conjuros de ${esc(r.escuela.toLowerCase())} de nivel 1 o superior en el libro.</div>`;
  }
  return `<div class="res wide"><strong>${esc(r.nombre)}</strong><span class="rnote" style="font-size:var(--fs-s);color:var(--ink)">${esc(castTriggerDesc(r))}</span><div style="flex-basis:100%">${list}</div></div>`;
}
function resourcesHtml(db, ch, P) {
  let h = '';
  if (P.pact) h += `<div class="res"><strong>Magia de pacto</strong><span class="rnote">${P.pact.n} ${P.pact.n > 1 ? 'espacios' : 'espacio'} de nivel ${P.pact.level}; se recuperan con un descanso corto o largo.</span></div>`;
  reglas(ch).forEach(r => { h += r.tipo === 'recurso' ? recursoHtml(ch, r) : r.tipo === 'dados' ? dadosHtml(ch, r) : r.tipo === 'recuperar' ? recuperarHtml(ch, r) : alLanzarHtml(db, ch, r); });
  return h ? `<div class="resources">${h}</div>` : '';
}
function legendHtml(ch, P, schools) {
  const ritualTxt = P.ritualLibro ? 'se lanza desde el libro sin preparar (+10 min)' : 'si está preparado, sin gastar espacio (+10 min)';
  return `<span class="howto"><b>Toca</b> un conjuro para lanzarlo. <b>Mantén pulsado</b> para leerlo y elegir nivel, ritual o uso gratis. Las velas encendidas son espacios libres.</span>
    <details><summary>Símbolos de la hoja ${icon('chevron')}</summary><div class="keys">
      <span><b>◆</b> preparado</span><span><b style="color:var(--gold)">◆</b> siempre preparado, no cuenta</span>
      <span><b>R</b> ritual: ${ritualTxt}</span><span><b>C</b> concentración</span>
      <span>Subrayado dorado: uso gratis sin espacio</span><span>Barra de color: escuela de magia</span>
      ${schools.length ? '<span><b style="color:var(--gold)">Escuela en dorado</b>: activa un rasgo al lanzar</span>' : ''}</div></details>`;
}

function rowHtml(db, ch, P, e, s, bi, schools, editing) {
  const L = s.level, k = `data-bi="${bi}"`;
  let prep;
  if (L === 0) prep = `<div class="prep none ${e.always ? 'gold' : ''}" title="${e.always ? 'De otra fuente, no cuenta' : ''}">–</div>`;
  else if (e.always) prep = `<div class="prep always" title="Siempre preparado" aria-label="Siempre preparado"></div>`;
  else prep = `<button type="button" class="prep ${e.prep ? 'on' : ''}" data-prep="${bi}" aria-pressed="${!!e.prep}" aria-label="Preparado: ${esc(s.es)}"></button>`;
  const free = e.gratis ? `<span class="free-use"><button type="button" class="tick ${e.used ? 'on' : ''}" data-used="${bi}" aria-pressed="${!!e.used}" aria-label="Uso gratis gastado"></button>${ce(e.gratis, `${k} data-k="gratis"`, editing)} gratis</span>`
    : (editing ? `<span class="free-use">${ce('', `${k} data-k="gratis"`, editing)} <small style="font-weight:400;color:var(--ink-2)">uso gratis (p. ej. 1/DL)</small></span>` : '');
  const trig = L > 0 && schools.includes(norm(s.escuela || '').slice(0, 5));
  const castable = L === 0 || (e.gratis && !e.used) || (s.ritual && (isPrepared(e) || P.ritualLibro)) || firstFreeFrom(ch, P, L) > 0;
  const ritualOnly = ch.play.onlyPrep && L > 0 && !isPrepared(e) && s.ritual && P.ritualLibro;
  const lvlSel = editing ? `<label>nivel <select data-lvl="${bi}">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<option value="${n}" ${n === L ? 'selected' : ''}>${n === 0 ? 'truco' : n}</option>`).join('')}</select></label>` : '';
  const cell = (cls, v, key) => `<span class="${cls}">${editing || v ? ce(v, `${k} data-k="${key}"`, editing) : ''}</span>`;
  return `<div class="spell ${castable ? '' : 'dim'}" id="sp-${bi}" data-sc="${schoolKey(s.escuela)}">
    <div class="c-prep">${prep}</div>
    <div class="c-name"><div class="castzone" data-cast="${bi}" ${editing ? '' : 'role="button" tabindex="0"'} aria-label="${editing ? '' : 'Lanzar ' + esc(s.es)}">
      <span class="nm ${e.gratis ? (e.used ? 'spentfree' : 'free') : ''}">${ce(s.es, `${k} data-k="es"`, editing)}</span><span class="badges">
      <span class="bd ${s.ritual ? '' : 'off'}" data-flag="ritual" ${k} title="Ritual">R</span><span class="bd ${s.conc ? '' : 'off'}" data-flag="conc" ${k} title="Concentración">C</span></span>${ritualOnly ? '<span class="tag">solo ritual</span>' : ''}
      <div class="en">${ce(s.en, `${k} data-k="en"`, editing)}</div></div>
      ${editing ? `<div class="flags edit-only"><label><input type="checkbox" data-always ${k} ${e.always ? 'checked' : ''}> ${L === 0 ? 'de otra fuente, no cuenta' : 'siempre preparado'}</label>${lvlSel}<button type="button" data-text="${bi}">Texto</button><button type="button" class="warn" data-del="${bi}">Quitar</button></div>` : ''}
    </div>
    <div class="meta">${cell(`c-school ${trig ? 'trig' : ''}`, s.escuela, 'escuela')}${cell('c-time', s.tiempo, 'tiempo')}${cell('c-range', s.alcance, 'alcance')}${cell('c-dur', s.duracion, 'duracion')}${cell('c-comp', s.comp, 'comp')}${cell('c-cost', s.coste, 'coste')}</div>
    <div class="c-src">${ce(e.fuente, `${k} data-k="fuente"`, editing)}${free}</div>
  </div>`;
}
function levelHtml(db, ch, P, L, rows, schools, editing) {
  let slot;
  if (L === 0) slot = 'A voluntad';
  else if (slotsOf(P, L)) slot = `<span class="lbl">${P.pact && L === P.pact.level ? 'Pacto' : ''}</span>${candles(ch, P, L)}`;
  else if (P.pact && L < P.pact.level) slot = `Con espacios de pacto (nivel ${P.pact.level})`;
  else slot = 'Sin espacios de este nivel';
  const vis = rows.filter(({ e, s }) => editing || !ch.play.onlyPrep || L === 0 || isPrepared(e) || (s.ritual && P.ritualLibro));
  const body = vis.map(({ e, s, bi }) => rowHtml(db, ch, P, e, s, bi, schools, editing)).join('')
    || `<div class="empty-row">${rows.length ? 'Nada preparado de este nivel.' : 'Aún no hay conjuros de este nivel. Añádelos con «Añadir».'}</div>`;
  return `<div class="lvl-head"><span class="lvl-num">${L}</span><span class="lvl-title">${L === 0 ? 'Trucos' : 'Nivel ' + L}</span>
      <button class="addrow" type="button" data-add="${L}">${icon('plus')}Añadir</button><span class="lvl-slots">${slot}</span></div>
    <div class="list"><div class="list-head"><span>Conjuro</span><span>Escuela</span><span>Lanzamiento</span><span>Alcance</span><span>Duración</span><span>Comp.</span><span>Material</span><span>Fuente y usos</span></div>${body}</div>`;
}

/* ---------- render principal ---------- */
let lastChar = null;
export function renderBar(S) {
  const ch = S.cur();
  const dockLbl = (id, ic, t) => patch($(id), `${icon(ic)}<span>${t}</span>`);
  const deskLbl = (id, ic, t) => patch($(id), `${icon(ic)}${t}`);
  dockLbl('#dRest', 'moon', 'Descansar'); dockLbl('#dFilter', 'book', 'Preparados'); dockLbl('#dEdit', 'quill', S.editing ? 'Terminar' : 'Editar');
  dockLbl('#dAdd', 'plus', 'Añadir'); dockLbl('#dHist', 'hourglass', 'Historial');
  deskLbl('#bRest', 'moon', 'Descansar'); deskLbl('#bFilter', 'book', 'Solo preparados'); deskLbl('#bEdit', 'quill', S.editing ? 'Terminar edición' : 'Editar hoja');
  deskLbl('#bAdd', 'plus', 'Añadir conjuro'); deskLbl('#bHist', 'hourglass', 'Historial');
  patch($('#btnMore'), icon('dots'));
  ['#dFilter', '#bFilter'].forEach(id => $(id).setAttribute('aria-pressed', !!ch?.play.onlyPrep));
  $('#dAdd').hidden = !S.editing;
  if (!ch) { patch($('#whoChip'), `<span class="monogram">?</span><span class="nm">Sin personaje</span>`); patch($('#sbar'), ''); return; }
  const P = perfil(ch);
  patch($('#whoChip'), `<span class="monogram">${esc((ch.nombre || '?').trim().charAt(0).toUpperCase())}</span><span><span class="nm">${esc(ch.nombre)}</span><br><span class="lv">${esc(ch.clase)}, nivel ${ch.nivel}</span></span>${icon('chevron')}`);
  let h = '';
  Object.keys(P.slots).map(Number).sort((a, b) => a - b).forEach(L => { h += `<span class="sb-l"><b>${L}</b>${candles(ch, P, L)}</span>`; });
  if (ch.play.conc) h += `<span class="conc">Concentrado en <strong>${esc(ch.play.conc)}</strong><button type="button" data-cmd="endconc" aria-label="Terminar concentración">Terminar</button></span>`;
  patch($('#sbar'), h);
  document.documentElement.style.setProperty('--appbar-h', `${Math.round($('#appbar').getBoundingClientRect().height - (parseFloat(getComputedStyle($('#appbar')).paddingTop) || 0))}px`);
}

export function renderSheet(S) {
  const db = S.db, ch = S.cur(), editing = S.editing;
  document.body.classList.toggle('editing', editing);
  if (!ch) {
    patch($('#hero'), `<div class="nochar"><h2>Ningún grimorio abierto</h2><p>Crea un personaje para empezar su libro de conjuros. Los conjuros del catálogo y del compendio se añaden con un toque.</p><button type="button" class="gold" data-cmd="newchar">Nuevo personaje</button></div>`);
    ['#stats', '#res', '#legend', '#levels', '#foot'].forEach(id => patch($(id), ''));
    return;
  }
  const P = perfil(ch), schools = castSchools(ch);
  const heroChanged = patch($('#hero'), heroHtml(ch, P));
  if (lastChar !== ch.id) {
    lastChar = ch.id; pop($('#hero'), 'fx-enter');
    $('#hero .underline path')?.classList.add('fx-draw');
  } else if (heroChanged) $('#hero .underline path')?.classList.remove('fx-draw');
  patch($('#stats'), statsHtml(db, ch, P));
  patch($('#res'), resourcesHtml(db, ch, P));
  patch($('#legend'), legendHtml(ch, P, schools));
  const byL = {};
  ch.book.forEach((e, bi) => { const s = db.catalog[e.sid]; if (s) (byL[s.level] ||= []).push({ e, s, bi }); });
  const levels = new Set([0, ...Object.keys(byL).map(Number)]);
  for (let L = 1; L <= P.maxSlot; L++) levels.add(L);
  patchKeyed($('#levels'), [...levels].sort((a, b) => a - b).map(L => ({ key: 'L' + L, cls: 'level', html: levelHtml(db, ch, P, L, byL[L] || [], schools, editing) })));
  const foot = [ch.campana, P.c ? 'Componentes sin coste: los cubre el foco de lanzamiento' : ''].filter(Boolean);
  patch($('#foot'), foot.map(t => `<span>${esc(t)}</span>`).join(''));
}
