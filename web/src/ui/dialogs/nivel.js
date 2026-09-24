/**
 * Subida de nivel guiada. Máquina de pasos: cada paso se decide a partir de lo que cambia
 * (subclase, mejora, libro, experto, preparados, trucos) y nada se guarda hasta confirmar.
 */
import { clone, esc, joinY, norm } from '../../core/util.js';
import { ABILS, ABIL_NAME, CLASES, perfil, sgn, clasesDe, vistaClase, nivelTotal, REQ_MULTICLASE, requisitosMulticlase } from '../../domain/reglas2024.js';
import { anadirPendientes, conjurosPendientes, esMejora, featuresAt, levelDiff, savantSchool } from '../../domain/progresion.js';
import { allSpellItems, biblioteca, compendio, itemMeta, itemToSid, listFilter } from '../../domain/catalogo.js';
import { $, on } from '../dom.js';
import { openSheet, closeSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { ascend } from '../fx.js';
import { haptic } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';
import { previewSpell } from './conjuro.js';
import { tarjetasSubclase } from '../subclases.js';
import { gi } from '../tema.js';

let S, LV = null;
const dlg = () => $('#lvlDlg');
const TITLE = { clase: 'En qué clase subes', resumen: 'Qué ganas', subclase: 'Subclase', mejora: 'Mejora o dote', experto: 'Conjuro gratis de tu escuela', libro: 'Conjuros para el libro', preparados: 'Nuevos conjuros preparados', trucos: 'Trucos nuevos', confirmar: 'Confirmar' };
const char = () => S.db.chars.find(c => c.id === LV.id);
/** La clase en la que se sube: la principal, una de multiclase o una nueva (nivel 0 → 1). */
const objetivo = () => { const ch = char(), c = clasesDe(ch).find(x => x.clase === LV.clase); return c || { clase: LV.clase, subclase: '', nivel: 0, principal: false, nueva: true }; };
/** Lista de conjuros de la clase en la que se sube (el Caballero y el Embaucador arcanos usan la de mago). */
const listaDe = (clase, subclase) => { const cls = CLASES[clase] || {}; return cls.cast ? clase : cls.subCast && cls.subCast.re.test(subclase || '') ? 'Mago' : ''; };

function draft() {
  const d = clone(char()), o = objetivo();
  if (o.principal) { d.nivel = LV.to; d.subclase = LV.subclase; }
  else { d.multiclase = d.multiclase || []; const m = d.multiclase.find(x => x.clase === o.clase); if (m) Object.assign(m, { nivel: LV.to, subclase: LV.subclase }); else d.multiclase.push({ clase: o.clase, subclase: LV.subclase, nivel: LV.to }); }
  const a = LV.asi, up = (k, n) => { if (k) d.stats[k] = Math.min(20, d.stats[k] + n); };
  if (a.modo === 'dos') up(a.a, 2);
  if (a.modo === 'uno') { up(a.a, 1); if (a.b !== a.a) up(a.b, 1); }
  return d;
}
function plan() {
  const ch = char(), d = draft(), A = perfil(ch), B = perfil(d), to = LV.to, o = objetivo(), cls = CLASES[o.clase] || {};
  const steps = [...(LV.elegirClase ? ['clase'] : []), 'resumen'];
  if (to === 3 && (cls.subs || []).length) steps.push('subclase');
  if (esMejora(o.clase, to) || to === 19) steps.push('mejora');
  const vista = vistaClase(d, { clase: o.clase, subclase: LV.subclase, nivel: to }), sch = savantSchool(vista);
  Object.assign(LV, { A, B, d, sch,
    o, vista, lista: listaDe(o.clase, LV.subclase),
    // un mago nuevo (también por multiclase) empieza con 6 conjuros en el libro; después, 2 por nivel
    nLibro: o.clase === 'Mago' ? (to === 1 ? 6 : 2) : 0,
    nSavant: !sch ? 0 : (to === 3 ? 2 : (B.maxSlot > A.maxSlot ? 1 : 0)),
    savantMax: to === 3 ? 2 : B.maxSlot, savantExact: to !== 3,
    nPrep: (B.c && o.clase !== 'Mago') ? Math.max(0, B.maxPrep - A.maxPrep) : 0,
    nTrucos: Math.max(0, B.maxCant - A.maxCant) });
  if (LV.nSavant) steps.push('experto');
  if (LV.nLibro) steps.push('libro');
  if (LV.nPrep) steps.push('preparados');
  if (LV.nTrucos) steps.push('trucos');
  steps.push('confirmar');
  LV.steps = steps;
  LV.libro = LV.libro.slice(0, LV.nLibro); LV.savant = LV.savant.slice(0, LV.nSavant); LV.prep = LV.prep.slice(0, LV.nPrep); LV.trucos = LV.trucos.slice(0, LV.nTrucos);
}
export function openLevelUp() {
  const ch = S.cur(); if (!ch || nivelTotal(ch) >= 20) return;
  LV = { id: ch.id, i: 0, elegirClase: (ch.multiclase || []).length > 0, libro: [], savant: [], prep: [], trucos: [], q: {} };
  elegirClase(ch.clase);
  render(); openSheet(dlg());
}
/** Cambia la clase en la que se sube y reinicia lo que depende de ella. */
function elegirClase(clase) {
  LV.clase = clase; const o = objetivo();
  Object.assign(LV, { to: o.nivel + 1, subclase: o.subclase || '', asi: { modo: o.nivel + 1 === 19 ? 'dote' : 'dos', a: '', b: '', dote: '' }, libro: [], savant: [], prep: [], trucos: [] });
}
function chooser(key, n, filterFn, hint) {
  const chosen = LV[key], others = new Set(['libro', 'savant', 'prep', 'trucos'].filter(k => k !== key).flatMap(k => LV[k]));
  const have = new Set(char().book.map(e => 'c:' + e.sid)), q = norm(LV.q[key] || '');
  const items = allSpellItems(S.db).filter(it => !have.has(it.id) && !others.has(it.id) && filterFn(it) && (!q || norm(it.es).includes(q) || norm(it.en).includes(q)))
    .sort((a, b) => (chosen.includes(b.id) - chosen.includes(a.id)) || b.l - a.l || a.es.localeCompare(b.es, 'es'));
  const full = chosen.length >= n;
  return `<div class="chooser"><div class="ch-head"><span>${hint}</span><b class="ch-count ${full ? 'ok' : ''}">${chosen.length} de ${n}</b></div>
    <input type="search" data-chq="${key}" placeholder="Buscar" value="${esc(LV.q[key] || '')}" aria-label="Buscar conjuro">
    <div>${items.length ? items.map(it => { const onx = chosen.includes(it.id);
      return `<div class="pitem ${onx ? 'on' : ''}"><label class="pmain"><input type="checkbox" data-chk="${key}" value="${esc(it.id)}" ${onx ? 'checked' : ''} ${!onx && full ? 'disabled' : ''}>
        <span class="pl">${it.l}</span><span><span class="pn">${esc(it.es)}</span><span class="pm">${itemMeta(it)}</span></span></label>
        <button type="button" class="pview" data-lvview="${esc(it.id)}">Ver</button></div>`; }).join('')
      : '<p class="pempty">No hay conjuros que encajen. Si falta alguno de otro manual, créalo después con «Añadir conjuro».</p>'}</div></div>`;
}
function names(key) { const all = allSpellItems(S.db); return LV[key].map(id => all.find(i => i.id === id)?.es).filter(Boolean); }
function render() {
  plan();
  const ch = char(), step = LV.steps[LV.i], { A, B, d, to } = { ...LV, to: LV.to };
  const total = nivelTotal(ch), o = LV.o, multi = LV.elegirClase || !o.principal;
  $('#lvTitle').textContent = `${ch.nombre} sube a nivel ${total + 1}`;
  $('#lvSub').textContent = `Paso ${LV.i + 1} de ${LV.steps.length}: ${TITLE[step]}`;
  $('#lvSteps').innerHTML = LV.steps.map((s, i) => `<i class="${i < LV.i ? 'done' : i === LV.i ? 'now' : ''}"></i>`).join('');
  let h = '';
  if (step === 'clase') {
    const mias = clasesDe(ch), nuevas = Object.keys(CLASES).filter(k => !mias.some(c => c.clase === k));
    const req = k => (REQ_MULTICLASE[k] || []).filter(alts => !alts.some(a => (ch.stats[a] || 0) >= 13)).map(alts => alts.map(a => ABIL_NAME[a]).join(' o ') + ' 13');
    h = `<p class="note">Subes un nivel de personaje en una de tus clases o empiezas una nueva (multiclase). Los rasgos, recursos y conjuros de cada clase van a su propio nivel.</p>
      <div class="opts">${mias.map(c => `<button type="button" data-lvclase="${esc(c.clase)}" aria-pressed="${LV.clase === c.clase}">${esc(c.clase)} ${c.nivel} → ${c.nivel + 1}${c.subclase ? `<small>${esc(c.subclase)}</small>` : ''}</button>`).join('')}</div>
      <label class="f wide" style="margin-top:14px">O empieza una clase nueva<select id="lvNueva"><option value="">Elige una clase</option>${nuevas.map(k => `<option value="${esc(k)}" ${LV.clase === k ? 'selected' : ''}>${esc(k)}${req(k).length ? ` (pide ${req(k).join(', ')})` : ''}</option>`).join('')}</select>
      <span class="hint">Para la multiclase, el manual pide 13 en la característica principal de cada clase. La app lo avisa pero no lo impide: tu mesa decide.</span></label>
      ${LV.clase && !mias.some(c => c.clase === LV.clase) ? `<button type="button" class="ghost" data-verclase="${esc(LV.clase)}">${gi('libro')}Ver qué aprende ${esc(LV.clase)}</button>` : ''}`;
  }
  if (step === 'resumen') {
    const feats = featuresAt(LV.vista, { subclase: LV.subclase }, to), diff = levelDiff(A, B, ch, d), auto = conjurosPendientes(S.db, d, compendio()).map(c => c.x.es);
    h = `<div class="lv-big" aria-hidden="true"><span>${total}</span><i>→</i><b>${total + 1}</b></div><div class="fsum"><p><b>${esc(o.clase)}, nivel ${to}${multi ? ` (nivel de personaje ${total + 1})` : ''}.</b> Competencia ${sgn(B.pb)}${B.pb > A.pb ? ' (sube)' : ''}.</p>
      ${diff ? `<p>${esc(diff.replace(/^Al subir de nivel gana: /, 'Ganas: '))}</p>` : '<p>Sin cambios en espacios, preparados ni trucos.</p>'}
      ${feats.length ? `<p>Rasgos de este nivel: ${esc(joinY(feats))}.</p>` : ''}
      ${auto.length ? `<p>Siempre preparados desde ahora: ${esc(joinY(auto))}.</p>` : ''}</div>
      <p class="note">Puntos de golpe: suma la media o tira el dado de golpe, como indique tu DJ; esta app no los lleva. La progresión completa está en Rasgos.</p>
      <p class="note">Los siguientes pasos te piden solo lo que cambia. Nada se guarda hasta el último.</p>
      ${LV.elegirClase ? '' : `<button type="button" class="ghost" data-lvmulti>${'¿Multiclase? Subir en otra clase'}</button>`}`;
  }
  if (step === 'subclase') {
    h = `<p class="note">A nivel 3 eliges la subclase. Puedes escribir otra si tu mesa usa más manuales.</p>
      <div class="scp-grid" role="listbox" aria-label="Subclases de ${esc(o.clase)}">${tarjetasSubclase(o.clase, LV.subclase, 'data-lvsub')}</div>
      <label class="f wide" style="margin-top:14px">Subclase<input id="lvSubIn" value="${esc(LV.subclase)}" autocomplete="off"></label>`;
  }
  if (step === 'mejora') {
    const a = LV.asi, sel = (id, v, skip) => `<select id="${id}"><option value="">Elige</option>${ABILS.filter(([k]) => k !== skip).map(([k, n]) => `<option value="${k}" ${v === k ? 'selected' : ''} ${ch.stats[k] >= 20 ? 'disabled' : ''}>${n} (${ch.stats[k]})</option>`).join('')}</select>`;
    h = `<p class="note">${to === 19 ? 'A nivel 19 ganas un Don épico (una dote especial). ' : ''}La mejora de característica es una dote: +2 a una o +1 a dos, sin pasar de 20. También puedes elegir otra dote.</p>
      <div class="radios">
        <label class="chk-line"><input type="radio" name="lvasi" value="dos" ${a.modo === 'dos' ? 'checked' : ''}> +2 a una característica</label>${a.modo === 'dos' ? `<div class="frow">${sel('lvA', a.a)}</div>` : ''}
        <label class="chk-line"><input type="radio" name="lvasi" value="uno" ${a.modo === 'uno' ? 'checked' : ''}> +1 a dos características</label>${a.modo === 'uno' ? `<div class="frow">${sel('lvA', a.a)}${sel('lvB', a.b, a.a)}</div>` : ''}
        <label class="chk-line"><input type="radio" name="lvasi" value="dote" ${a.modo === 'dote' ? 'checked' : ''}> ${to === 19 ? 'Don épico u otra dote' : 'Otra dote'}</label>
        ${a.modo === 'dote' ? `<label class="f wide">Nombre de la dote<input id="lvDote" list="lvDotes" value="${esc(a.dote)}" autocomplete="off" placeholder="Por ejemplo, Iniciado en la magia"><datalist id="lvDotes">${biblioteca().dotes.filter(x => x.cat !== 'Origen' || to !== 19).map(x => `<option value="${esc(x.nombre)}">`).join('')}</datalist><span class="hint">Aparecerá en «En juego». Si da conjuros o cambia características, añádelos luego en la ficha y en la hoja.</span></label>` : ''}
      </div>${B.apKey && B.mod !== A.mod ? `<div class="fsum" style="margin-top:14px">Tu ${ABIL_NAME[B.apKey]} pasa a ${sgn(B.mod)}: CD ${B.cd} y ataque ${sgn(B.atk)}.</div>` : ''}`;
  }
  const escL = LV.sch.toLowerCase();
  if (step === 'experto') h = chooser('savant', LV.nSavant, it => it.l > 0 && (LV.savantExact ? it.l === LV.savantMax : it.l <= LV.savantMax) && it.esc === LV.sch && listFilter(it, 'Mago'),
    to === 3 ? `Experto en ${escL}: 2 conjuros de mago de ${escL}, de nivel 2 o inferior, gratis.` : `Experto en ${escL}: acabas de acceder a espacios de nivel ${LV.savantMax}; añade gratis un conjuro de ${escL} de ese nivel.`);
  if (step === 'libro') h = chooser('libro', LV.nLibro, it => it.l > 0 && it.l <= B.maxSlot && listFilter(it, 'Mago'), (to === 1 ? `Tu libro de conjuros empieza con 6 conjuros de mago de nivel 1.` : `Cada nivel de mago añade 2 conjuros de mago al libro, de nivel ${B.maxSlot} o inferior.`));
  const lista = LV.lista || B.lista;
  if (step === 'preparados') h = chooser('prep', LV.nPrep, it => it.l > 0 && it.l <= B.maxSlot && listFilter(it, lista), `Ahora preparas ${B.maxPrep} conjuros (antes ${A.maxPrep}). Elige los nuevos de la lista de ${lista.toLowerCase()}, de nivel ${B.maxSlot} o inferior. Es opcional.`);
  if (step === 'trucos') h = chooser('trucos', LV.nTrucos, it => it.l === 0 && listFilter(it, lista), `Aprendes ${LV.nTrucos === 1 ? 'un truco nuevo' : LV.nTrucos + ' trucos nuevos'} de la lista de ${(lista || o.clase).toLowerCase()}.`);
  if (step === 'confirmar') {
    const L = [multi ? `${o.clase} ${o.nivel} → ${to} (nivel de personaje ${total + 1}).` : `Nivel ${ch.nivel} → ${to}.`];
    if (LV.subclase !== (o.subclase || '')) L.push(`Subclase: ${LV.subclase || 'ninguna'}.`);
    if (LV.steps.includes('mejora')) {
      const a = LV.asi;
      if (a.modo === 'dote') L.push(a.dote ? `Dote: ${a.dote}.` : 'Dote sin nombre: puedes anotarla después en la ficha.');
      else { const bits = ABILS.filter(([k]) => d.stats[k] !== ch.stats[k]).map(([k, n]) => `${n} ${ch.stats[k]} → ${d.stats[k]}`); L.push(bits.length ? `Mejora de característica: ${bits.join(', ')}.` : 'Mejora de característica sin elegir.'); }
    }
    if (LV.libro.length) L.push(`Al libro: ${names('libro').join(', ')}.`);
    if (LV.savant.length) L.push(`Gratis por Experto en ${escL}: ${names('savant').join(', ')}.`);
    if (LV.prep.length) L.push(`Nuevos preparados: ${names('prep').join(', ')}.`);
    if (LV.trucos.length) L.push(`Trucos: ${names('trucos').join(', ')}.`);
    const pend = []; if (LV.libro.length < LV.nLibro) pend.push(`${LV.nLibro - LV.libro.length} conjuro(s) de libro`); if (LV.savant.length < LV.nSavant) pend.push(`${LV.nSavant - LV.savant.length} de Experto`); if (LV.trucos.length < LV.nTrucos) pend.push(`${LV.nTrucos - LV.trucos.length} truco(s)`);
    h = `<div class="fsum">${L.map(t => `<p>${esc(t)}</p>`).join('')}</div>
      ${pend.length ? `<p class="note">Quedan por elegir: ${esc(pend.join(', '))}. Puedes añadirlos más tarde desde «Añadir conjuro».</p>` : ''}
      ${o.clase === 'Mago' && B.maxPrep > A.maxPrep ? `<p class="note">Ahora preparas ${B.maxPrep}: marca los nuevos con ◆ en la hoja.</p>` : ''}
      <p class="note">Todo queda anotado en «Dotes y notas» de la ficha, y se puede deshacer.</p>`;
  }
  $('#lvBody').innerHTML = h;
  $('#lvBack').hidden = LV.i === 0;
  $('#lvNext').textContent = LV.i === LV.steps.length - 1 ? `Subir a nivel ${total + 1}` : 'Siguiente';
}
function apply() {
  const ch = char(), d = draft(), to = LV.to, o = objetivo(), notes = [], total = nivelTotal(ch) + 1;
  if (!o.principal) notes.push(o.nueva ? `multiclase: ${o.clase} 1` : `${o.clase} ${to}`);
  if (LV.subclase !== (o.subclase || '')) notes.push(`subclase ${LV.subclase}`);
  if (LV.steps.includes('mejora')) {
    if (LV.asi.modo === 'dote') { if (LV.asi.dote) notes.push(`dote ${LV.asi.dote}`); }
    else { const bits = ABILS.filter(([k]) => d.stats[k] !== ch.stats[k]).map(([k, n]) => `${n} +${d.stats[k] - ch.stats[k]}`); if (bits.length) notes.push(`mejora de característica (${bits.join(', ')})`); }
  }
  const B = perfil(d), all = allSpellItems(S.db), picks = { libro: LV.libro, savant: LV.savant, prep: LV.prep, trucos: LV.trucos }, sch = LV.sch;
  const h = S.act(`Sube a nivel ${total}${notes.length ? ': ' + notes.join('; ') : ''}`, (db, c) => {
    const add = (ids, rel) => ids.forEach(id => { const it = all.find(x => x.id === id); if (!it) return; const sid = itemToSid(db, it);
      if (!c.book.some(e => e.sid === sid)) c.book.push({ sid, prep: false, always: false, gratis: '', used: false, ...rel }); });
    add(picks.libro, { fuente: 'Libro' });
    add(picks.savant, { fuente: `Experto en ${sch.toLowerCase()}` });
    add(picks.prep, { fuente: B.listaNombre, prep: true });
    add(picks.trucos, { fuente: `${LV.lista ? (LV.lista === 'Mago' && o.clase !== 'Mago' ? B.listaNombre : o.clase) : (B.listaNombre || c.clase)} (nivel ${to})` });
    c.nivel = d.nivel; c.subclase = d.subclase; c.multiclase = d.multiclase || []; c.stats = d.stats;
    if (LV.steps.includes('mejora') && LV.asi.modo === 'dote' && LV.asi.dote && !(c.dotes || []).includes(LV.asi.dote)) c.dotes = [...(c.dotes || []), LV.asi.dote];
    const auto = anadirPendientes(db, c, conjurosPendientes(db, c, compendio()));
    if (auto.length) notes.push(`siempre preparados ${auto.join(', ')}`);
    if (notes.length) c.notas = `${(c.notas || '').trim()}\nNivel ${total}: ${notes.join('; ')}.`.trim();
  });
  closeSheet(dlg()); window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => { ascend($('#hero h1')); haptic('heavy'); }, 260);
  toast(`<b>${esc(ch.nombre)}</b> ya es nivel ${total}${o.principal ? '' : ` (${esc(o.clase)} ${to})`}.`, [undoBtn(S, h)]);
}

export function init(store) {
  S = store;
  const body = $('#lvBody');
  body.addEventListener('input', ev => {
    const t = ev.target;
    if (t.dataset.chq) { LV.q[t.dataset.chq] = t.value; const pos = t.selectionStart; render(); const n = body.querySelector(`[data-chq="${t.dataset.chq}"]`); n?.focus(); n?.setSelectionRange(pos, pos); return; }
    if (t.id === 'lvSubIn') { LV.subclase = t.value.trim(); body.querySelectorAll('[data-lvsub]').forEach(b => { b.classList.toggle('on', b.dataset.lvsub === LV.subclase); b.setAttribute('aria-selected', b.dataset.lvsub === LV.subclase); }); plan();
      $('#lvSub').textContent = `Paso ${LV.i + 1} de ${LV.steps.length}: ${TITLE[LV.steps[LV.i]]}`; return; }
    if (t.id === 'lvDote') LV.asi.dote = t.value.trim();
  });
  body.addEventListener('change', ev => {
    const t = ev.target;
    if (t.name === 'lvasi') { LV.asi = { ...LV.asi, modo: t.value, a: '', b: '' }; return render(); }
    if (t.id === 'lvA') { LV.asi.a = t.value; if (LV.asi.b === t.value) LV.asi.b = ''; return render(); }
    if (t.id === 'lvB') { LV.asi.b = t.value; return render(); }
    if (t.dataset.chk) { const k = t.dataset.chk; LV[k] = t.checked ? [...new Set([...LV[k], t.value])] : LV[k].filter(x => x !== t.value);
      const y = body.scrollTop; render(); body.scrollTop = y; haptic(); }
  });
  on(body, 'click', '[data-lvclase]', (ev, b) => { elegirClase(b.dataset.lvclase); render(); });
  on(body, 'click', '[data-lvmulti]', () => { LV.elegirClase = true; LV.i = 0; render(); body.scrollTop = 0; });
  body.addEventListener('change', ev => { if (ev.target.id === 'lvNueva' && ev.target.value) { elegirClase(ev.target.value); render(); } });
  on(body, 'click', '[data-lvsub],[data-lvview]', (ev, b) => {
    if (b.dataset.lvsub) { LV.subclase = b.dataset.lvsub; return render(); }
    const it = allSpellItems(S.db).find(x => x.id === b.dataset.lvview); if (it) previewSpell(it);
  });
  $('#lvNext').addEventListener('click', () => {
    const step = LV.steps[LV.i];
    if (step === 'mejora' && LV.asi.modo !== 'dote' && !LV.asi.a) { toast('Elige qué característica mejora, o marca «Otra dote».'); return; }
    if (step === 'clase' && !LV.clase) { toast('Elige la clase en la que subes.'); return; }
    if (LV.i === LV.steps.length - 1) return apply();
    LV.i++; render(); body.scrollTop = 0;
  });
  $('#lvBack').addEventListener('click', () => { if (LV.i > 0) { LV.i--; render(); } });
}
