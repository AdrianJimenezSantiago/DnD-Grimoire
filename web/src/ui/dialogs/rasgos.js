// Rasgos y recursos del personaje: plantillas de clase, rasgos propios, usos y lo que se recupera al descansar.
import { clone, esc, uid } from '../../core/util.js';
import { ABILS, SCHOOLS, perfil, clasesDe, vistaClase } from '../../domain/reglas/reglas2024.js';
import { dadoRecarga, maxFrom, recState, reglas, ruleSummary, TIPO_TXT } from '../../domain/clases/rasgos.js';
import { conjurosAutomaticos, escalas, progresion, subclaseDe } from '../../domain/clases/clases2024.js';
import { anadirPendientes, conjurosPendientes } from '../../domain/clases/progresion.js';
import { compendio } from '../../domain/conjuros/catalogo.js';
import { $, on } from '../componentes/dom.js';
import { claseLinea } from '../../domain/personaje/descripcion.js';
import { freeOf, usedOf } from '../../domain/conjuros/espacios.js';
import { openSheet, closeSheet } from '../componentes/dialog.js';
import { toast, undoBtn } from '../componentes/toast.js';
import { slotFx } from '../animaciones/fx.js';
import { haptic } from '../../platform/native.js';
import { confirmar } from '../componentes/modal.js';
import { icon } from '../componentes/icons.js';

let S, RD = null, REC = null, PESTANA = 'progresion';

const PESTANAS = [['progresion', 'star', 'Progresión'], ['recursos', 'sliders', 'Recursos']];
function renderRules() {
  const ch = S.cur(), all = reglas(ch, true), tpl = all.filter(r => r.tpl), own = all.filter(r => !r.tpl);
  $('#rulesSub').textContent = `${ch.nombre}: ${claseLinea(ch)}.`;
  $('#rulesTabs').innerHTML = PESTANAS.map(([k, ic, t]) => `<button type="button" role="tab" aria-selected="${PESTANA === k}" data-rtab="${k}">${icon(ic)}${t}</button>`).join('');
  $('#ruleNew').hidden = PESTANA !== 'recursos';
  const guia = PESTANA === 'progresion'
    ? '<p class="note rules-guia">Lo que te da tu clase nivel a nivel, para consultar. Para <b>usar</b> tus rasgos en la partida, mira «En juego» en la hoja.</p>'
    : '<p class="note rules-guia">Lo que la hoja cuenta por ti: usos, dados y avisos. Se recuperan solos con los descansos. El interruptor solo decide si se <b>ve</b> en la hoja: oculto, sigue funcionando.</p>';
  if (PESTANA === 'progresion') {
    $('#rulesBody').innerHTML = guia + clasesDe(ch).map(c => progresionHtml(vistaClase(ch, c), clasesDe(ch).length > 1)).join('');
    return;
  }
  const row = r => `<div class="rrow ${r.oculto || r.sustituida ? 'off' : ''}">
    ${r.sustituida ? '<span class="switch-hueco" aria-hidden="true"></span>' : `<label class="switch" title="${r.oculto ? 'Oculto en la hoja; sigue funcionando' : 'Visible en la hoja'}"><input type="checkbox" ${r.tpl ? `data-tploff="${r.id}"` : `data-ownoff="${r.id}"`} ${r.oculto ? '' : 'checked'} aria-label="Mostrar ${esc(r.nombre)} en la hoja"><span></span></label>`}
    <div class="rtxt"><b>${esc(r.nombre)}</b><span class="rtype">${TIPO_TXT[r.tipo]}${r.sustituida ? ' · sustituido por tu versión' : r.oculto ? ' · oculto en la hoja' : ''}</span><span class="rsum">${esc(ruleSummary(r))}</span></div>
    <div class="racts">${r.tpl ? (r.sustituida ? '' : `<button type="button" data-rcustom="${r.id}">Personalizar</button>`) : `<button type="button" data-redit="${r.id}">Editar</button><button type="button" class="warn" data-rdel="${r.id}">Borrar</button>`}</div></div>`;
  $('#rulesBody').innerHTML = guia +
    `<section class="fsec"><h3>De tu clase y subclase</h3>${tpl.length ? tpl.map(row).join('') : '<p class="note">Tu clase no tiene recursos que la app lleve por ti a este nivel.</p>'}
      <p class="note">Se ajustan solos al subir de nivel. Oculta los que no quieras ver en la hoja: siguen contando y recuperándose igual. «Personalizar» crea una copia tuya que puedes cambiar y que sustituye a la original.</p></section>
     <section class="fsec"><h3>Añadidos por ti</h3>${own.length ? own.map(row).join('') : '<p class="note">Rasgos de dotes, objetos o reglas de tu mesa. Por ejemplo, 3 cargas de una varita que se recargan con un descanso largo, o un aviso cada vez que lanzas un conjuro de nigromancia.</p>'}</section>`;
}
function progresionHtml(ch, multi = false) {
  const vals = escalas(ch); if (!vals.length) return '';
  const prog = progresion(ch), sc = subclaseDe(ch), auto = conjurosAutomaticos(ch), deEsta = new Set(auto.map(c => c.nombre));
  const pend = conjurosPendientes(S.db, S.cur(), compendio()).filter(c => deEsta.has(c.nombre));
  const faltan = new Set(pend.map(c => c.nombre));
  const porNivel = prog.reduce((m, r) => ((m[r.nivel] ||= []).push(r), m), {});
  return `<section class="fsec prog"><h3>${multi ? `${esc(ch.clase)} a nivel ${ch.nivel}` : `Tu clase a nivel ${ch.nivel}`}</h3>
      <dl class="prog-vals">${vals.map(v => `<div><dt>${esc(v.nombre)}</dt><dd>${esc(v.valor)}${v.nota ? `<small>${esc(v.nota)}</small>` : ''}</dd></div>`).join('')}</dl>
      <ol class="prog-lvls">${Object.entries(porNivel).map(([L, rs]) => `<li><b>${L}</b><span>${rs.map(r => `<span class="${r.origen === 'subclase' ? 'sub' : ''}">${esc(r.nombre)}</span>`).join(' · ')}</span></li>`).join('')}</ol>
      <p class="note">${sc ? `Resaltados, los rasgos de ${esc(sc.nombre)} (${esc(sc.libro)}).` : ch.nivel >= 3 ? 'Escribe una subclase del manual en la ficha para ver también sus rasgos.' : 'La subclase llega a nivel 3.'}</p>
      ${auto.length ? `<h3>Conjuros de tu clase y subclase</h3><p class="prog-conj">${auto.map(c => `<span class="${faltan.has(c.nombre) ? 'falta' : ''}">${esc(c.nombre)}<small>${esc(c.fuente)}${c.ritual ? ', solo ritual' : ''}</small></span>`).join('')}</p>
        ${pend.length ? `<button type="button" data-rauto>Añadir los ${pend.length} que faltan al libro</button>` : '<p class="note">Todos están en tu libro, siempre preparados.</p>'}` : ''}
    </section>`;
}
export function openRules(pestana) { if (pestana) PESTANA = pestana; renderRules(); openSheet($('#rulesDlg')); }

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
      ? `<div class="frow" style="margin-top:12px"><label class="f wide">Se recuperan<select data-rf="recarga">${opt('largo', r.recarga, 'Todos con un descanso largo')}${opt('corto', r.recarga, 'Todos con un descanso corto o largo')}${opt('corto1', r.recarga, 'Uno con descanso corto; todos con uno largo')}${opt('dado', r.recarga, 'Tirando dados (p. ej. 1d3 cargas al amanecer)')}${opt('nunca', r.recarga, 'No se recuperan (consumible)')}</select></label></div>
        ${r.recarga === 'dado' ? `<div class="frow" style="margin-top:12px"><label class="f">Dados<input data-rf="recDado" value="${esc(r.recDado || '1d3')}" placeholder="1d3" autocomplete="off"><span class="hint">Por ejemplo 1d3, 1d6 o 2d4.</span></label>
          <label class="f">Suma<input data-rf="recBono" type="number" inputmode="numeric" value="${esc(r.recBono || 0)}"><span class="hint">1d6+1 → dados 1d6, suma 1.</span></label>
          <label class="f">Cuándo<select data-rf="recMomento">${opt('largo', r.recMomento, 'Al amanecer (descanso largo)')}${opt('corto', r.recMomento, 'Con cada descanso, corto o largo')}</select></label></div>` : ''}`
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
export function errorRasgo(r) {
  if ((r.tipo === 'recurso' && ['fijo', 'nivelx'].includes(r.maxBase)) && !(parseInt(r.maxN, 10) >= 1)) return 'Tiene que tener al menos un uso.';
  if (r.tipo === 'dados' && !(parseInt(r.maxN, 10) >= 1 && parseInt(r.maxN, 10) <= 6)) return 'Entre 1 y 6 dados.';
  if (r.tipo === 'recuperar' && r.maxBase === 'fijo' && !(parseInt(r.maxN, 10) >= 1)) return 'Tiene que recuperar al menos un nivel de espacio.';
  if (r.tipo === 'recuperar' && !(r.nivMax >= 1 && r.nivMax <= 9)) return 'El nivel máximo de espacio va de 1 a 9.';
  if (r.tipo === 'al_lanzar' && r.efecto === 'recuperar' && !(r.efectoN >= 1 && r.efectoN <= 8)) return 'El nivel que recupera va de 1 a 8.';
  if (r.tipo === 'al_lanzar' && r.efecto === 'aviso' && !String(r.texto || '').trim()) return 'Escribe el texto del aviso.';
  if (r.tipo === 'recurso' && r.recarga === 'dado' && !dadoRecarga(r)) return 'Escribe los dados de recarga como 1d3, 1d6 o 2d4.';
  return '';
}
function saveRule() {
  RD.nombre = (RD.nombre || '').trim();
  if (!RD.nombre) { $('#ruleErr').textContent = 'Falta el nombre.'; return; }
  if (RD.tipo === 'dados') RD.maxBase = 'fijo';
  ['maxN', 'nivMax', 'espacioMin', 'efectoN'].forEach(k => { RD[k] = parseInt(RD[k], 10) || 0; });
  if (RD.tipo === 'recuperar' && !RD.nivMax) RD.nivMax = 5;
  const err = errorRasgo(RD); if (err) { $('#ruleErr').textContent = err; return; }
  const { _tpl: tpl, _nuevo: nuevo, ...rule } = RD;
  const h = S.edit((db, ch) => {
    const i = ch.rasgos.findIndex(x => x.id === rule.id);
    if (i >= 0) ch.rasgos[i] = rule; else ch.rasgos.push(rule);
    if (tpl) { ch.rasgosOff = [...new Set([...ch.rasgosOff, tpl])]; if (ch.play.rec[tpl]) ch.play.rec[rule.id] = ch.play.rec[tpl]; }
  });
  closeSheet($('#ruleDlg')); renderRules();
  toast(`«${esc(rule.nombre)}» ${nuevo ? 'añadido' : 'guardado'}.${tpl ? ' La plantilla original queda sustituida por tu versión.' : ''}`, [undoBtn(S, h)]);
}

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
  const h = S.act(txt, (db, c) => { Object.entries(pick).forEach(([L, n]) => { if (n) c.play.used[L] = usedOf(c, P, +L) - n; }); recState(c, id).used = 1;
    // Canción de la hoja: recuperas un uso al emplear Recuperación arcana
    if (id === 'tpl:mago.recuperacion') { const st = c.play.rec?.['tpl:hojacantante.cancion']; if (st?.used) st.used -= 1; } });
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
      if (t.dataset.tploff) { const s = new Set(ch.rasgosOcultos); t.checked ? s.delete(t.dataset.tploff) : s.add(t.dataset.tploff); ch.rasgosOcultos = [...s]; }
      else { const r = ch.rasgos.find(x => x.id === t.dataset.ownoff); r.off = !t.checked; }
    });
    renderRules();
  });
  on($('#rulesBody'), 'click', '[data-rcustom],[data-redit],[data-rdel]', async (ev, b) => {
    const ch = S.cur();
    if (b.dataset.redit) return openRuleForm(ch.rasgos.find(x => x.id === b.dataset.redit));
    if (b.dataset.rdel) { const r = ch.rasgos.find(x => x.id === b.dataset.rdel); if (!(await confirmar({ titulo: `¿Borrar «${r.nombre}»?`, texto: 'Se quita de este personaje. Puedes deshacerlo justo después.', ok: 'Borrar', peligro: true }))) return;
      const h = S.edit((db, c) => { c.rasgos = c.rasgos.filter(x => x.id !== r.id); if (r.desde) c.rasgosOff = c.rasgosOff.filter(x => x !== r.desde); }); renderRules(); toast(`«${esc(r.nombre)}» borrado.`, [undoBtn(S, h)]); return; }
    const t = reglas(ch, true).find(x => x.id === b.dataset.rcustom);
    openRuleForm({ id: uid('r'), tipo: t.tipo, nombre: t.nombre, nota: t.nota || '', maxBase: 'fijo', maxN: t.max, maxAb: 'car', recarga: t.recarga || 'largo', dado: t.dado || 'd20', nivMax: t.nivMax || 5,
      escuela: t.escuela || '', espacioMin: t.espacioMin || 0, soloEspacio: !!t.soloEspacio, efecto: t.efecto || 'aviso', efectoN: t.efectoN || 5, texto: t.texto || '', desde: t.id }, true);
  });
  on($('#rulesBody'), 'click', '[data-rauto]', () => {
    let nombres = []; const h = S.edit((db, c) => { nombres = anadirPendientes(db, c, conjurosPendientes(db, c, compendio())); });
    renderRules(); toast(`Añadidos siempre preparados: ${esc(nombres.join(', '))}.`, [undoBtn(S, h)]);
  });
  $('#ruleNew').addEventListener('click', () => openRuleForm(null));
  on($('#rulesTabs'), 'click', '[data-rtab]', (ev, b) => { PESTANA = b.dataset.rtab; renderRules(); $('#rulesBody').scrollTop = 0; });
  $('#rulesJuego').addEventListener('click', () => {
    closeSheet($('#rulesDlg'));
    const lanza = !!perfil(S.cur()).c;
    if (lanza && !S.cur().enJuego?.abierto) S.edit((db, c) => { c.enJuego ||= {}; c.enJuego.abierto = true; });
    setTimeout(() => $('#enjuego')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 220);
  });
  $('#ruleForm').addEventListener('input', ev => {
    const t = ev.target, k = t.dataset.rf; if (!k) return;
    RD[k] = t.type === 'checkbox' ? t.checked : t.value;
    if (['tipo', 'maxBase', 'efecto', 'recarga'].includes(k)) { if (k === 'tipo') { RD.maxBase = RD.tipo === 'recuperar' ? 'mitad' : 'fijo'; RD.soloEspacio = true; } renderForm(); }
    else { const p = $('#ruleForm .fsum p'); if (p) p.textContent = ruleSummary(preview()); }
  });
  $('#ruleSave').addEventListener('click', saveRule);
  on($('#recBody'), 'click', '[data-recp]', (ev, b) => { if (b.disabled) return; const [L, d] = b.dataset.recp.split('|').map(Number); REC.pick[L] = Math.max(0, (REC.pick[L] || 0) + d); renderRecovery(); haptic(); });
  $('#recOk').addEventListener('click', applyRecovery);
}
