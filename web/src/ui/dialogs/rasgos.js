/** Rasgos y recursos: lista con plantillas, editor de rasgos propios y recuperación de espacios. */
import { clone, esc, uid } from '../../core/util.js';
import { ABILS, SCHOOLS, perfil } from '../../domain/reglas2024.js';
import { maxFrom, recState, reglas, ruleSummary, TIPO_TXT } from '../../domain/rasgos.js';
import { $, on } from '../dom.js';
import { claseLinea, freeOf, usedOf } from '../sheet.js';
import { openSheet, closeSheet } from '../dialog.js';
import { toast } from '../toast.js';
import { slotFx } from '../fx.js';
import { haptic } from '../../platform/native.js';
import { undoBtn } from '../../app/acciones.js';
import { confirmar } from '../modal.js';

let S, RD = null, REC = null;

/* ---------------- lista ---------------- */
function renderRules() {
  const ch = S.cur(), all = reglas(ch, true), tpl = all.filter(r => r.tpl), own = all.filter(r => !r.tpl);
  $('#rulesSub').textContent = `${ch.nombre}: ${claseLinea(ch)}. Los recursos aparecen en la hoja, bajo el nombre, y se reinician con los descansos.`;
  const row = r => `<div class="rrow ${r.off ? 'off' : ''}">
    <label class="switch"><input type="checkbox" ${r.tpl ? `data-tploff="${r.id}"` : `data-ownoff="${r.id}"`} ${r.off ? '' : 'checked'} aria-label="Activar ${esc(r.nombre)}"><span></span></label>
    <div class="rtxt"><b>${esc(r.nombre)}</b><span class="rtype">${TIPO_TXT[r.tipo]}</span><span class="rsum">${esc(ruleSummary(r))}</span></div>
    <div class="racts">${r.tpl ? `<button type="button" data-rcustom="${r.id}">Personalizar</button>` : `<button type="button" data-redit="${r.id}">Editar</button><button type="button" class="warn" data-rdel="${r.id}">Borrar</button>`}</div></div>`;
  $('#rulesBody').innerHTML =
    `<section class="fsec"><h3>De tu clase y subclase</h3>${tpl.length ? tpl.map(row).join('') : '<p class="note">Tu clase no tiene recursos que la app lleve por ti a este nivel.</p>'}
      <p class="note">Se ajustan solos al subir de nivel. Desactiva los que no quieras ver; «Personalizar» crea una copia tuya que puedes cambiar.</p></section>
     <section class="fsec"><h3>Añadidos por ti</h3>${own.length ? own.map(row).join('') : '<p class="note">Rasgos de dotes, objetos o reglas de tu mesa. Por ejemplo, 3 cargas de una varita que se recargan con un descanso largo, o un aviso cada vez que lanzas un conjuro de nigromancia.</p>'}</section>`;
}
export function openRules() { renderRules(); openSheet($('#rulesDlg')); }

/* ---------------- editor ---------------- */
function openRuleForm(r, fromTpl) {
  RD = r ? clone(r) : { id: uid('r'), tipo: 'recurso', nombre: '', nota: '', maxBase: 'fijo', maxN: 1, maxAb: 'car', recarga: 'largo', dado: 'd20', nivMax: 5, escuela: '', espacioMin: 0, soloEspacio: true, efecto: 'aviso', efectoN: 5, texto: '' };
  RD._nuevo = !r || !!fromTpl; RD._tpl = fromTpl ? r.desde : null;
  $('#ruleTitle').textContent = fromTpl ? `Personalizar ${r.nombre}` : r ? `Editar ${r.nombre}` : 'Nuevo rasgo';
  $('#ruleErr').textContent = ''; renderForm(); openSheet($('#ruleDlg'));
}
const preview = () => ({ ...RD, max: maxFrom(S.cur(), RD.tipo === 'dados' ? { ...RD, maxBase: 'fijo' } : RD) });
function renderForm() {
  const r = RD, opt = (v, c, t) => `<option value="${v}" ${String(v) === String(c) ? 'selected' : ''}>${t}</option>`;
  let h = `<div class="frow"><label class="f">Tipo<select data-rf="tipo">${Object.entries(TIPO_TXT).map(([k, t]) => opt(k, r.tipo, t)).join('')}</select></label>
    <label class="f">Nombre<input data-rf="nombre" value="${esc(r.nombre)}" autocomplete="off" placeholder="${r.tipo === 'recurso' ? 'Cargas de la varita' : r.tipo === 'al_lanzar' ? 'Aviso de nigromancia' : 'Nombre del rasgo'}"></label></div>`;
  if (r.tipo === 'recurso' || r.tipo === 'recuperar') {
    const bases = r.tipo === 'recurso'
      ? [['fijo', 'Número fijo'], ['nivel', 'Tu nivel'], ['nivelx', 'Tu nivel × N'], ['mitad', 'Mitad de tu nivel, redondeando arriba'], ['mod', 'Modificador de característica (mín. 1)'], ['comp', 'Bonificador de competencia']]
      : [['mitad', 'Mitad de tu nivel, redondeando arriba'], ['fijo', 'Número fijo']];
    h += `<div class="frow" style="margin-top:12px"><label class="f">${r.tipo === 'recurso' ? 'Usos máximos' : 'Niveles de espacios que recupera'}<select data-rf="maxBase">${bases.map(([k, t]) => opt(k, r.maxBase, t)).join('')}</select></label>
      ${['fijo', 'nivelx'].includes(r.maxBase) ? `<label class="f">${r.maxBase === 'nivelx' ? 'N' : 'Número'}<input data-rf="maxN" type="number" inputmode="numeric" min="0" value="${esc(r.maxN)}"></label>` : ''}
      ${r.maxBase === 'mod' ? `<label class="f">Característica<select data-rf="maxAb">${ABILS.map(([k, n]) => opt(k, r.maxAb, n)).join('')}</select></label>` : ''}</div>`;
    h += r.tipo === 'recurso'
      ? `<div class="frow" style="margin-top:12px"><label class="f wide">Se recuperan<select data-rf="recarga">${opt('largo', r.recarga, 'Con un descanso largo')}${opt('corto', r.recarga, 'Con un descanso corto o largo')}${opt('corto1', r.recarga, 'Uno con descanso corto; todos con uno largo')}</select></label></div>`
      : `<div class="frow" style="margin-top:12px"><label class="f">Nivel máximo de espacio<input data-rf="nivMax" type="number" inputmode="numeric" min="1" max="9" value="${esc(r.nivMax)}"></label></div>`;
  }
  if (r.tipo === 'dados') h += `<div class="frow" style="margin-top:12px"><label class="f">Cuántos dados<input data-rf="maxN" type="number" inputmode="numeric" min="1" max="6" value="${esc(r.maxN)}"></label>
      <label class="f">Dado<select data-rf="dado">${['d4', 'd6', 'd8', 'd10', 'd12', 'd20'].map(d => opt(d, r.dado, d)).join('')}</select></label></div>`;
  if (r.tipo === 'al_lanzar') h += `<div class="frow" style="margin-top:12px"><label class="f">Escuela<select data-rf="escuela">${opt('', r.escuela, 'Cualquiera')}${SCHOOLS.map(s => opt(s, r.escuela, s)).join('')}</select></label>
      <label class="f">Espacio mínimo<select data-rf="espacioMin">${opt(0, r.espacioMin, 'Cualquiera')}${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => opt(n, r.espacioMin, 'Nivel ' + n)).join('')}</select></label></div>
      <label class="chk-line"><input type="checkbox" data-rf="soloEspacio" ${r.soloEspacio ? 'checked' : ''}> Solo si gastas un espacio (no como ritual ni con usos gratis)</label>
      <div class="frow" style="margin-top:12px"><label class="f">Efecto<select data-rf="efecto">${opt('aviso', r.efecto, 'Mostrar un aviso')}${opt('recuperar', r.efecto, 'Recuperar un espacio de nivel inferior')}</select></label>
      ${r.efecto === 'recuperar' ? `<label class="f">Hasta el nivel<input data-rf="efectoN" type="number" inputmode="numeric" min="1" max="8" value="${esc(r.efectoN)}"></label>` : `<label class="f wide">Texto del aviso<textarea data-rf="texto" rows="2">${esc(r.texto)}</textarea></label>`}</div>`;
  if (r.tipo !== 'al_lanzar') h += `<div class="frow" style="margin-top:12px"><label class="f wide">Nota<input data-rf="nota" value="${esc(r.nota)}" autocomplete="off" placeholder="Opcional: cuándo se usa, qué dado…"></label></div>`;
  h += `<div class="fsum" style="margin-top:16px"><p>${esc(ruleSummary(preview()))}</p></div>`;
  $('#ruleForm').innerHTML = h;
}
function saveRule() {
  RD.nombre = (RD.nombre || '').trim();
  if (!RD.nombre) { $('#ruleErr').textContent = 'Falta el nombre.'; return; }
  if (RD.tipo === 'dados') RD.maxBase = 'fijo';
  ['maxN', 'nivMax', 'espacioMin', 'efectoN'].forEach(k => { RD[k] = parseInt(RD[k], 10) || 0; });
  if (RD.tipo === 'recuperar' && !RD.nivMax) RD.nivMax = 5;
  const { _tpl: tpl, _nuevo: nuevo, ...rule } = RD;
  const h = S.edit((db, ch) => {
    const i = ch.rasgos.findIndex(x => x.id === rule.id);
    if (i >= 0) ch.rasgos[i] = rule; else ch.rasgos.push(rule);
    if (tpl) { ch.rasgosOff = [...new Set([...ch.rasgosOff, tpl])]; if (ch.play.rec[tpl]) ch.play.rec[rule.id] = ch.play.rec[tpl]; }
  });
  closeSheet($('#ruleDlg')); renderRules();
  toast(`«${esc(rule.nombre)}» ${nuevo ? 'añadido' : 'guardado'}.${tpl ? ' La plantilla original queda desactivada.' : ''}`, [undoBtn(S, h)]);
}

/* ---------------- recuperar espacios ---------------- */
export function openRecovery(id) {
  const ch = S.cur(), r = reglas(ch).find(x => x.id === id); if (!r) return;
  if (recState(ch, id).used) {
    const h = S.act(`${r.nombre}: marcada como disponible`, (db, c) => { recState(c, id).used = 0; });
    toast(`${esc(r.nombre)} vuelve a estar disponible.`, [undoBtn(S, h)]); return;
  }
  REC = { id, pick: {} }; renderRecovery(); openSheet($('#recDlg'));
}
function renderRecovery() {
  const ch = S.cur(), P = perfil(ch), r = reglas(ch).find(x => x.id === REC.id);
  const total = Object.entries(REC.pick).reduce((a, [L, n]) => a + L * n, 0);
  let rows = '';
  for (let L = 1; L <= Math.min(r.nivMax || 5, P.maxSlot); L++) {
    const u = usedOf(ch, P, L); if (!u) continue; const n = REC.pick[L] || 0;
    rows += `<div class="recrow"><span>Nivel ${L}<small>${u} gastado${u > 1 ? 's' : ''}</small></span><span class="rstep">
      <button type="button" data-recp="${L}|-1" ${n ? '' : 'disabled'} aria-label="Uno menos de nivel ${L}">−</button><b>${n}</b>
      <button type="button" data-recp="${L}|1" ${n < u && total + L <= r.max ? '' : 'disabled'} aria-label="Uno más de nivel ${L}">+</button></span></div>`;
  }
  $('#recTitle').textContent = r.nombre;
  $('#recSub').textContent = `Elige qué espacios recuperas. Suman como máximo ${r.max} niveles.`;
  $('#recBody').innerHTML = rows ? rows + `<p class="rectotal"><b>${total}</b> de ${r.max} niveles</p>` : `<p class="note">No tienes espacios gastados de nivel ${r.nivMax || 5} o inferior. Puedes marcarla como usada igualmente.</p>`;
  $('#recOk').textContent = total ? `Recuperar ${total} ${total === 1 ? 'nivel' : 'niveles'}` : 'Marcar como usada';
}
function applyRecovery() {
  const ch = S.cur(), P = perfil(ch), r = reglas(ch).find(x => x.id === REC.id), bits = [], fxs = [];
  Object.entries(REC.pick).forEach(([L, n]) => { if (n) { bits.push(`${n} de nivel ${L}`); const f = freeOf(ch, P, +L); for (let k = 0; k < n; k++) fxs.push([+L, f + k]); } });
  const txt = bits.length ? `${r.nombre}: recupera ${bits.join(' y ')}` : `${r.nombre}: usada`;
  const pick = { ...REC.pick }, id = REC.id;
  const h = S.act(txt, (db, c) => { Object.entries(pick).forEach(([L, n]) => { if (n) c.play.used[L] = usedOf(c, P, +L) - n; }); recState(c, id).used = 1; });
  closeSheet($('#recDlg'));
  setTimeout(() => fxs.forEach(([L, i], k) => setTimeout(() => slotFx(L, i, 'ignite'), k * 90)), 150);
  haptic(); toast(esc(txt) + '.', [undoBtn(S, h)]);
}

export function init(store) {
  S = store;
  $('#rulesBody').addEventListener('change', ev => {
    const t = ev.target;
    if (!t.dataset.tploff && !t.dataset.ownoff) return;
    S.edit((db, ch) => {
      if (t.dataset.tploff) { const s = new Set(ch.rasgosOff); t.checked ? s.delete(t.dataset.tploff) : s.add(t.dataset.tploff); ch.rasgosOff = [...s]; }
      else { const r = ch.rasgos.find(x => x.id === t.dataset.ownoff); r.off = !t.checked; }
    });
    renderRules();
  });
  on($('#rulesBody'), 'click', '[data-rcustom],[data-redit],[data-rdel]', async (ev, b) => {
    const ch = S.cur();
    if (b.dataset.redit) return openRuleForm(ch.rasgos.find(x => x.id === b.dataset.redit));
    if (b.dataset.rdel) { const r = ch.rasgos.find(x => x.id === b.dataset.rdel); if (!(await confirmar({ titulo: `¿Borrar «${r.nombre}»?`, texto: 'Se quita de este personaje. Puedes deshacerlo justo después.', ok: 'Borrar', peligro: true }))) return;
      const h = S.edit((db, c) => { c.rasgos = c.rasgos.filter(x => x.id !== r.id); }); renderRules(); toast(`«${esc(r.nombre)}» borrado.`, [undoBtn(S, h)]); return; }
    const t = reglas(ch, true).find(x => x.id === b.dataset.rcustom);
    openRuleForm({ id: uid('r'), tipo: t.tipo, nombre: t.nombre, nota: t.nota || '', maxBase: 'fijo', maxN: t.max, maxAb: 'car', recarga: t.recarga || 'largo', dado: t.dado || 'd20', nivMax: t.nivMax || 5,
      escuela: t.escuela || '', espacioMin: t.espacioMin || 0, soloEspacio: !!t.soloEspacio, efecto: t.efecto || 'aviso', efectoN: t.efectoN || 5, texto: t.texto || '', desde: t.id }, true);
  });
  $('#ruleNew').addEventListener('click', () => openRuleForm(null));
  $('#ruleForm').addEventListener('input', ev => {
    const t = ev.target, k = t.dataset.rf; if (!k) return;
    RD[k] = t.type === 'checkbox' ? t.checked : t.value;
    if (['tipo', 'maxBase', 'efecto'].includes(k)) { if (k === 'tipo') { RD.maxBase = RD.tipo === 'recuperar' ? 'mitad' : 'fijo'; RD.soloEspacio = true; } renderForm(); }
    else { const p = $('#ruleForm .fsum p'); if (p) p.textContent = ruleSummary(preview()); }
  });
  $('#ruleSave').addEventListener('click', saveRule);
  on($('#recBody'), 'click', '[data-recp]', (ev, b) => { if (b.disabled) return; const [L, d] = b.dataset.recp.split('|').map(Number); REC.pick[L] = Math.max(0, (REC.pick[L] || 0) + d); renderRecovery(); haptic(); });
  $('#recOk').addEventListener('click', applyRecovery);
}
