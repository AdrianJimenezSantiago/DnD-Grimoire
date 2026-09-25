import { esc } from '../../core/util.js';
import { sgn } from '../../domain/reglas2024.js';
import { parsear, tirar, texto, esD20Simple, media } from '../../domain/dados.js';
import { modsTirada, resolverModo, falloAutomatico, fmtMod } from '../../domain/efectos.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { icon } from '../icons.js';
import { openSheet } from '../dialog.js';
import { burstFrom, reducedMotion } from '../fx.js';
import { haptic } from '../../platform/native.js';

let S, V = null;
const HIST = [];
const CARAS = [4, 6, 8, 10, 12, 20, 100];
const dlg = () => $('#dadosDlg');
const MODOS = [['desventaja', 'Desventaja'], ['normal', 'Normal'], ['ventaja', 'Ventaja']];

export function openDados() {
  V = { tipo: 'libre', expr: V?.tipo === 'libre' ? V.expr : '1d20', modo: 'normal', critico: false, ultimo: null };
  render(); openSheet(dlg());
}
const SOBRE = { prueba: 'prueba', salvacion: 'salvacion', muerte: 'salvacion', ataque: 'ataque', iniciativa: 'iniciativa' };
export function tirarPrueba({ titulo, sub = '', bono = 0, tipo = 'prueba', ab = '', hab = '', alTirar = null }) {
  const mods = S.cur() ? modsTirada(S.cur(), { sobre: SOBRE[tipo] || 'prueba', ab, hab }) : [];
  V = { tipo, titulo, sub, bono, ab, hab, mods, modo: resolverModo(mods), modoAuto: true, alTirar, ultimo: null };
  lanzar(); openSheet(dlg());
}
export function tirarDano({ titulo, sub = '', expr, critico = false, extras = [] }) {
  V = { tipo: 'dano', titulo, sub, expr, critico, ultimo: null, mods: extras.map((x, i) => ({ id: 'e' + i, fuente: x.fuente, efecto: 'dado', valor: x.valor, on: true })) };
  lanzar(); openSheet(dlg());
}

const esD20 = () => ['prueba', 'salvacion', 'ataque', 'iniciativa', 'muerte'].includes(V.tipo);
const exprActual = () => (esD20() ? `1d20${V.bono ? sgn(V.bono) : ''}` : V.expr);

function render() {
  const d20 = esD20(), libre = V.tipo === 'libre', p = parsear(exprActual());
  $('#daTitle').innerHTML = `${gi(libre ? 'cubilete' : V.tipo === 'muerte' ? 'muerte' : V.tipo === 'dano' ? 'dados' : 'd20', 'rl-d20')} ${esc(libre ? 'Dados' : V.titulo)}`;
  $('#daSub').textContent = libre ? 'Toca los dados para sumarlos, o escribe la tirada.' : V.sub;
  const pie = dlg().querySelector('[data-cmd="dadoslibres"]'); if (pie) pie.hidden = libre;
  let h = '';
  if (libre) {
    h += `<div class="da-caras" role="group" aria-label="Añadir dados">${CARAS.map(c => `<button type="button" class="da-cara" data-dacara="${c}" aria-label="Añadir 1d${c}">${c === 100 ? '<b>%</b>' : `<b>d${c}</b>`}</button>`).join('')}</div>
      <div class="da-expr"><input id="daExpr" value="${esc(V.expr)}" inputmode="text" autocomplete="off" spellcheck="false" aria-label="Tirada" placeholder="2d6+3">
        <span class="da-mods"><button type="button" data-damod="-1" aria-label="Restar 1">−1</button><button type="button" data-damod="1" aria-label="Sumar 1">+1</button><button type="button" data-dalimpiar aria-label="Vaciar">${icon('reset')}</button></span></div>
      <p class="da-ayuda" id="daAyuda">${p ? `Media ${fmt(media(p))}` : 'Escribe algo como 1d20+5, 2d6+3 o 4d6.'}</p>`;
  }
  if (V.mods?.length) h += `<div class="da-mods-ap" role="group" aria-label="Lo que se aplica"><span class="da-mods-t">Se aplica</span>${V.mods.map(m => `<button type="button" class="da-mod ${m.mal ? 'mal' : 'bien'} ${m.on ? '' : 'off'}" data-damodt="${esc(m.id)}" aria-pressed="${m.on}" title="${m.cond ? `Solo ${esc(m.cond)}. Tócalo si no se aplica.` : 'Tócalo si no se aplica'}"><b>${esc(fmtMod(m))}</b><span>${esc(m.fuente)}</span>${m.cond ? `<small>${esc(m.cond)}</small>` : ''}</button>`).join('')}</div>`;
  const falla = V.mods && falloAutomatico(V.mods);
  if (falla) h += `<p class="da-falla">${gi('muerte')}Por <b>${esc(falla.fuente.toLowerCase())}</b> fallas esta salvación automáticamente.</p>`;
  if (d20 || (libre && esD20Simple(p))) h += `<div class="seg da-modo" role="radiogroup" aria-label="Ventaja">${MODOS.map(([k, t]) => `<button type="button" role="radio" aria-checked="${V.modo === k}" data-damodo="${k}">${t}</button>`).join('')}</div>`;
  if (V.tipo === 'dano') h += `<label class="chk-line"><input type="checkbox" id="daCrit" ${V.critico ? 'checked' : ''}> Crítico: se tiran el doble de dados</label>`;
  h += `<div class="da-acciones"><button type="button" class="gold da-tirar" data-datirar>${gi('dados')}${V.ultimo ? 'Volver a tirar' : 'Tirar'}</button>
</div>`;
  h += `<div class="rl-out da-out" id="daOut" aria-live="polite">${V.ultimo?.html || '<p class="note">El resultado aparecerá aquí.</p>'}</div>`;
  if (HIST.length) h += `<section class="da-hist"><h3>Últimas tiradas</h3><ol>${HIST.slice(0, 10).map((x, i) => `<li><button type="button" data-dahist="${i}"><span>${esc(x.que)}</span><b>${x.total}</b></button></li>`).join('')}</ol></section>`;
  $('#daBody').innerHTML = h;
}
const fmt = v => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','));
const dadosHtml = g => g.vals.map(v => `<b class="die ${v === g.caras ? 'max' : v === 1 ? 'min' : ''}">${v}</b>`).join('');

function lanzar() {
  const p = parsear(exprActual()); if (!p) { V.ultimo = null; render(); $('#daExpr')?.focus(); return; }
  const r = tirar(p, { modo: V.modo || 'normal', critico: !!V.critico });
  const act = (V.mods || []).filter(m => m.on), extras = act.filter(m => m.efecto === 'dado').map(m => { const neg = String(m.valor).startsWith('-'), q = parsear(String(m.valor).replace(/^[+-]/, '')), t = tirar(q, { critico: !!V.critico }); return { m, neg, t }; });
  const planos = act.filter(m => m.efecto === 'plano'), falla = falloAutomatico(V.mods || []);
  const total = r.total + extras.reduce((s, x) => s + (x.neg ? -x.t.total : x.t.total), 0) + planos.reduce((s, m) => s + m.valor, 0);
  const nat = r.natural, crit = esD20() && nat === 20, pifia = esD20() && nat === 1;
  let lbl = V.tipo === 'ataque' ? 'para impactar' : V.tipo === 'dano' ? V.sub || 'de daño' : V.tipo === 'iniciativa' ? 'de iniciativa' : V.tipo === 'muerte' ? '' : V.tipo === 'libre' ? texto(p) : 'en la tirada';
  let efecto = '';
  if (falla) { lbl = 'fallo automático'; }
  if (V.tipo === 'muerte' && V.alTirar) efecto = V.alTirar(nat, total) || '';
  else if (V.alTirar) efecto = V.alTirar(total, nat) || '';
  if (V.tipo === 'muerte') lbl = nat === 20 ? '¡Vuelves con 1 PG!' : nat === 1 ? 'Dos fallos' : total >= 10 ? 'Éxito' : 'Fallo';
  const det = r.grupos.map(g => `${g.signo < 0 ? '− ' : ''}${g.n}d${g.caras}: ${dadosHtml(g)}`).join(' ')
    + (r.d20 ? ` <span class="rl-alt">(${r.d20.a} y ${r.d20.b}, ${V.modo})</span>` : '')
    + (r.bono ? ` ${sgn(r.bono)}` : '')
    + extras.map(x => ` <span class="da-extra ${x.m.mal ? 'mal' : 'bien'}">${x.neg ? '−' : '+'} ${x.t.grupos.map(g => dadosHtml(g)).join('')}<small>${esc(x.m.fuente)}</small></span>`).join('')
    + planos.map(m => ` <span class="da-extra ${m.mal ? 'mal' : 'bien'}">${sgn(m.valor)}<small>${esc(m.fuente)}</small></span>`).join('')
    + (crit ? ` <b class="tag-crit">${V.tipo === 'ataque' ? '¡Crítico! Los dados de daño se doblan.' : '¡20 natural!'}</b>` : pifia ? ` <b class="tag-pifia">${V.tipo === 'ataque' ? 'Pifia: falla siempre.' : '1 natural'}</b>` : '')
    + (V.tipo === 'dano' && !V.critico && p.grupos.some(g => g.n > 1) ? ` <span class="rl-alt">media ${fmt(media(p))}</span>` : '');
  const clase = falla ? 'pifia' : crit ? 'crit' : pifia ? 'pifia' : '';
  V.ultimo = { total, html: `<div class="rl-total ${clase}"><span class="rl-num">${total}</span><span class="rl-lbl">${esc(lbl)}</span></div><div class="rl-det">${det}</div>${efecto ? `<div class="da-efecto">${efecto}</div>` : ''}` };
  const que = V.tipo === 'libre' ? texto(p) + (r.d20 ? ` (${V.modo})` : '') : `${V.titulo}${V.tipo === 'dano' ? '' : ` ${sgn(V.bono || 0)}`}${r.d20 ? `, ${V.modo}` : ''}${act.length ? `, ${act.map(m => m.fuente).join(', ')}` : ''}${V.critico ? ', crítico' : ''}${falla ? ', fallo automático' : ''}`;
  HIST.unshift({ que, total, estado: { ...V, ultimo: null } }); if (HIST.length > 20) HIST.pop();
  S.note(`${que}: ${total}${r.d20 ? ` (d20 ${r.d20.usa})` : nat != null ? ` (d20 ${nat})` : ''}`);
  if (V.tipo === 'dano') V.critico = false;
  render(); haptic(crit ? 'heavy' : 'light');
  const num = $('#daOut .rl-num'); if (num) { contar(num, total); if (crit) burstFrom(num, { n: 40, speed: 4.5, life: 1200 }); }
}
function contar(el, total) {
  if (reducedMotion()) { el.textContent = total; return; }
  const t0 = performance.now(), dur = 480, tope = Math.max(Math.abs(total) + 6, 20);
  const paso = now => { const k = Math.min(1, (now - t0) / dur); el.textContent = k < 1 ? 1 + Math.floor(Math.random() * tope) : total; if (k < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}

export function init(store) {
  S = store;
  const body = $('#daBody');
  on(body, 'click', '[data-datirar]', () => { if (V.tipo === 'libre') V.expr = $('#daExpr').value.trim() || V.expr; lanzar(); });
  on(body, 'click', '[data-damodt]', (e, b) => { const m = V.mods.find(x => x.id === b.dataset.damodt); if (!m) return; m.on = !m.on; if (V.modoAuto) V.modo = resolverModo(V.mods); V.ultimo = null; lanzar(); });
  on(body, 'click', '[data-damodo]', (e, b) => { V.modo = b.dataset.damodo; V.modoAuto = false; if (V.tipo === 'libre') V.expr = $('#daExpr').value.trim() || V.expr; if (V.ultimo && V.tipo !== 'libre') lanzar(); else render(); });
  on(body, 'click', '[data-dacara]', (e, b) => {
    const c = +b.dataset.dacara, p = parsear($('#daExpr').value) || { grupos: [], bono: 0 }, g = p.grupos.find(x => x.caras === c && x.signo > 0);
    if (g) g.n = Math.min(100, g.n + 1); else p.grupos.push({ n: 1, caras: c, signo: 1 });
    V.expr = texto(p).replace(/−/g, '-'); V.ultimo = null; render(); haptic('light');
  });
  on(body, 'click', '[data-damod]', (e, b) => { const p = parsear($('#daExpr').value) || { grupos: [], bono: 0 }; p.bono += +b.dataset.damod; V.expr = texto(p).replace(/−/g, '-') || '0'; render(); });
  on(body, 'click', '[data-dalimpiar]', () => { V.expr = ''; V.ultimo = null; render(); $('#daExpr')?.focus(); });
  on(body, 'click', '[data-dahist]', (e, b) => { const x = HIST[+b.dataset.dahist]; if (!x) return; V = { ...x.estado }; lanzar(); });
  body.addEventListener('input', e => { if (e.target.id !== 'daExpr') return; V.expr = e.target.value; const p = parsear(V.expr);
    $('#daAyuda').textContent = p ? `Media ${fmt(media(p))}` : 'Escribe algo como 1d20+5, 2d6+3 o 4d6.';
    const conModo = !!body.querySelector('.da-modo'); if (conModo !== esD20Simple(p)) { const pos = e.target.selectionStart; render(); const i = $('#daExpr'); i.focus(); i.setSelectionRange(pos, pos); } });
  body.addEventListener('keydown', e => { if (e.target.id === 'daExpr' && e.key === 'Enter') { e.preventDefault(); V.expr = e.target.value.trim(); lanzar(); } });
  body.addEventListener('change', e => { if (e.target.id === 'daCrit') { V.critico = e.target.checked; render(); } });
}
