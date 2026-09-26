import { esc } from '../../core/util.js';
import { sgn } from '../../domain/reglas2024.js';
import { parsear, texto, esD20Simple, media, rango, resolver, distribucion, probMenor, probAlMenos, mediaDist, maxDist } from '../../domain/dados.js';
import { modsTirada, resolverModo, falloAutomatico, fmtMod } from '../../domain/efectos.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { icon } from '../icons.js';
import { openSheet } from '../dialog.js';
import { burst, reducedMotion } from '../fx.js';
import { haptic } from '../../platform/native.js';

let S, V = null, SEQ = 0, TOKEN = 0, agitar = null;
const CRONICA = new Map(), MAX_CRONICA = 30, VISIBLES = 5;
const CARAS = [4, 6, 8, 10, 12, 20, 100];
const MODOS = [['desventaja', 'Desventaja', 'el menor de 2d20'], ['normal', 'Normal', '1d20'], ['ventaja', 'Ventaja', 'el mayor de 2d20']];
const D20 = ['prueba', 'salvacion', 'ataque', 'iniciativa', 'muerte'];
const SOBRE = { prueba: 'prueba', salvacion: 'salvacion', muerte: 'salvacion', ataque: 'ataque', iniciativa: 'iniciativa' };
const dlg = () => $('#dadosDlg');
const cronica = () => { const k = S.cur()?.id ?? '_'; if (!CRONICA.has(k)) CRONICA.set(k, []); return CRONICA.get(k); };

// ---- Entradas ----
export function openDados() {
  V = { tipo: 'libre', expr: V?.tipo === 'libre' ? V.expr : '1d20', modo: 'normal', critico: false, res: null };
  montar(); abrir();
}
// cd: dificultad a superar (colorea el resultado y da la probabilidad de éxito).
// alTirar: se llama una vez por tirada con el resultado. Si no es «repetible» (aplica cambios
// en la ficha), cambiar ventaja o modificadores después no recalcula: vale para la siguiente.
// siguiente: { texto, fn(critico) } para encadenar otra tirada, como el daño tras un ataque.
export function tirarPrueba({ titulo, sub = '', bono = 0, tipo = 'prueba', ab = '', hab = '', cd = null, alTirar = null, repetible = false, siguiente = null }) {
  const mods = S.cur() ? modsTirada(S.cur(), { sobre: SOBRE[tipo] || 'prueba', ab, hab }) : [];
  V = { tipo, titulo, sub, bono, ab, hab, cd: tipo === 'muerte' ? 10 : cd, mods, modo: resolverModo(mods), modoAuto: true, alTirar, repetible, siguiente, res: null };
  montar(); abrir(); lanzar();
}
export function tirarDano({ titulo, sub = '', expr, critico = false, extras = [] }) {
  V = { tipo: 'dano', titulo, sub, expr, critico, res: null, mods: extras.map((x, i) => ({ id: 'e' + i, fuente: x.fuente, efecto: 'dado', valor: x.valor, on: true })) };
  montar(); abrir(); lanzar();
}
function abrir() { openSheet(dlg()); armarAgitar(); }

const esD20 = () => D20.includes(V.tipo);
const exprActual = () => (esD20() ? `1d20${V.bono ? sgn(V.bono) : ''}` : V.expr);
const conModo = p => esD20() || (V.tipo === 'libre' && esD20Simple(p));
const fijo = () => !!V.alTirar && !V.repetible;
const fmt = v => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','));
const pct = x => { const n = x * 100; return `${n > 0 && n < 1 ? '<1' : n > 99 && n < 100 ? '>99' : Math.round(n)} %`; };

// ---- Dados poliédricos ----
const FORMAS = {
  d4: '<polygon class="c" points="20,3 37.5,34.5 2.5,34.5"/><path class="f" d="M20 3 20 25M2.5 34.5 20 25 37.5 34.5"/>',
  d6: '<rect class="c" x="4.5" y="4.5" width="31" height="31" rx="7"/><rect class="f" x="9" y="9" width="22" height="22" rx="4"/>',
  d8: '<polygon class="c" points="20,2 37.5,20 20,38 2.5,20"/><path class="f" d="M2.5 20h35"/>',
  d10: '<polygon class="c" points="20,2 37.5,16.5 20,38 2.5,16.5"/><path class="f" d="M2.5 16.5 20 23 37.5 16.5M20 23v15"/>',
  d12: '<polygon class="c" points="20,2 38,15 31,37.5 9,37.5 2,15"/><polygon class="f" points="20,9 30,16.5 26.5,29 13.5,29 10,16.5"/>',
  d20: '<polygon class="c" points="20,2 36,11 36,29 20,38 4,29 4,11"/><polygon class="f" points="20,10 30.5,27 9.5,27"/>',
  dx: '<circle class="c" cx="20" cy="20" r="17"/><circle class="f" cx="20" cy="20" r="12"/>',
};
const formaDe = c => (FORMAS['d' + c] ? 'd' + c : 'dx');
const forma = c => `<svg viewBox="0 0 40 40" aria-hidden="true">${FORMAS[formaDe(c)]}</svg>`;
function dado(c, v, { fuera = false, fresco = false, cls = '' } = {}) {
  const k = [cls, v === c ? 'max' : v === 1 ? 'min' : '', fuera ? 'fuera' : '', fresco ? 'rueda' : ''].filter(Boolean).join(' ');
  return `<span class="dd ${k}" data-f="${formaDe(c)}"${fresco ? ` data-v="${v}" data-c="${c}"` : ''} title="d${c}">${forma(c)}<b>${v}</b></span>`;
}
const op = s => `<i class="dd-op">${s < 0 ? '−' : '+'}</i>`;

// ---- Montaje ----
function montar() {
  const libre = V.tipo === 'libre', body = $('#daBody');
  $('#daTitle').innerHTML = `${gi(libre ? 'cubilete' : V.tipo === 'muerte' ? 'muerte' : V.tipo === 'dano' ? 'dados' : 'd20', 'rl-d20')} ${esc(libre ? 'Dados' : V.titulo)}`;
  $('#daSub').textContent = libre ? 'Toca los dados para sumarlos, o escribe la tirada.' : V.sub;
  const pie = dlg().querySelector('[data-cmd="dadoslibres"]'); if (pie) pie.hidden = libre;
  body.innerHTML = `<div id="daCtl"></div><div class="dd-out" id="daOut"></div><p class="visually-hidden" id="daVivo" aria-live="polite"></p><section class="dd-cron" id="daHist" aria-label="Crónica de tiradas"></section>`;
  if (dlg().open && !reducedMotion()) { body.classList.remove('dd-cambia'); void body.offsetWidth; body.classList.add('dd-cambia'); }
  pintarCtl(); pintarOut(); pintarHist();
}

function pintarCtl() {
  const libre = V.tipo === 'libre', p = parsear(exprActual());
  let h = '';
  if (libre) h += `<div class="dd-caras" role="group" aria-label="Añadir dados">${CARAS.map(c => `<button type="button" class="dd-cara" data-dacara="${c}" aria-label="Añadir 1d${c}">${forma(c)}<b>${c === 100 ? '%' : `d${c}`}</b></button>`).join('')}</div>
    <div class="dd-expr"><input id="daExpr" value="${esc(V.expr)}" inputmode="text" autocomplete="off" spellcheck="false" aria-label="Tirada" aria-describedby="daInfo" placeholder="2d6+3">
      <span class="dd-ajuste"><button type="button" data-damod="-1" aria-label="Restar 1">−1</button><button type="button" data-damod="1" aria-label="Sumar 1">+1</button><button type="button" data-dalimpiar aria-label="Vaciar">${icon('reset')}</button></span></div>
    <div class="dd-info" id="daInfo"></div>`;
  if (V.mods?.length) h += `<div class="da-mods-ap" role="group" aria-label="Lo que se aplica"><span class="da-mods-t">Se aplica</span>${V.mods.map(m => `<button type="button" class="da-mod ${m.mal ? 'mal' : 'bien'} ${m.on ? '' : 'off'}" data-damodt="${esc(m.id)}" aria-pressed="${m.on}" title="${m.cond ? `Solo ${esc(m.cond)}. Tócalo si no se aplica.` : 'Tócalo si no se aplica'}"><b>${esc(fmtMod(m))}</b><span>${esc(m.fuente)}</span>${m.cond ? `<small>${esc(m.cond)}</small>` : ''}</button>`).join('')}</div>`;
  const falla = V.mods && falloAutomatico(V.mods);
  if (falla) h += `<p class="da-falla">${gi('muerte')}Por <b>${esc(falla.fuente.toLowerCase())}</b> fallas esta salvación automáticamente.</p>`;
  h += `<div id="daModoSlot">${conModo(p) ? modoHtml() : ''}</div>`;
  if (V.tipo === 'dano') h += `<label class="dd-crit"><input type="checkbox" id="daCrit" ${V.critico ? 'checked' : ''}><span class="dd-sw" aria-hidden="true"></span><span><b>Crítico</b><small>Se tiran el doble de dados. Los que ya salieron se quedan.</small></span></label>`;
  h += `<div class="dd-acciones"><button type="button" class="gold dd-tirar" data-datirar>${gi('dados')}<span id="daTirarT"></span></button>
    <p class="dd-pista" id="daPista"></p></div>`;
  $('#daCtl').innerHTML = h;
  if (libre) sincLibre(false);
  actualizarBoton();
}
const idxModo = k => Math.max(0, MODOS.findIndex(m => m[0] === k));
const modoHtml = () => `<div class="dd-modo" role="radiogroup" aria-label="Ventaja o desventaja" data-modo="${V.modo}" style="--i:${idxModo(V.modo)}">${MODOS.map(([k, t, s]) => `<button type="button" role="radio" aria-checked="${V.modo === k}" data-damodo="${k}"><b>${t}</b><small>${s}</small></button>`).join('')}</div>`;
function sincModo() {
  const g = $('#daModoSlot .dd-modo'); if (!g) return;
  g.dataset.modo = V.modo; g.style.setProperty('--i', idxModo(V.modo));
  g.querySelectorAll('[data-damodo]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.damodo === V.modo)));
}
// Actualiza lo que depende de la expresión libre sin volver a pintar el campo (no pierde el cursor).
function sincLibre(conValor = true) {
  const i = $('#daExpr'); if (!i) return;
  if (conValor) i.value = V.expr;
  const p = parsear(V.expr), cuenta = c => (p?.grupos || []).filter(g => g.caras === c && g.signo > 0 && !g.keep).reduce((s, g) => s + g.n, 0);
  document.querySelectorAll('#daCtl [data-dacara]').forEach(b => {
    const n = cuenta(+b.dataset.dacara); let t = b.querySelector('i');
    if (!n) t?.remove(); else { if (!t) { t = document.createElement('i'); b.append(t); } t.textContent = `×${n}`; }
  });
  i.setAttribute('aria-invalid', String(!!V.expr.trim() && !p));
  const [lo, hi] = rango(p);
  $('#daInfo').innerHTML = p
    ? `<span class="dd-bandeja">${p.grupos.map((g, k) => `<button type="button" class="dd-ficha" data-daquita="${k}" aria-label="Quitar 1d${g.caras}">${g.signo < 0 ? '−' : ''}${g.n}d${g.caras}${g.keep ? `<small>${g.keep.n} ${g.keep.alto ? 'mayores' : 'menores'}</small>` : ''}<i aria-hidden="true">×</i></button>`).join('')}</span>
       <span class="dd-ayuda">Media <b>${fmt(media(p))}</b>${lo !== hi ? ` · de ${lo} a ${hi}` : ''}</span>`
    : `<span class="dd-ayuda ${V.expr.trim() ? 'mal' : ''}">${V.expr.trim() ? 'No se entiende: prueba con 1d20+5, 2d6+3 o 4d6kh3.' : 'Escribe una tirada o toca los dados.'}</span>
       <button type="button" class="dd-ficha atajo" data-daexpr="4d6kh3">4d6, sin el menor<small>característica</small></button>`;
  const slot = $('#daModoSlot'), quiere = conModo(p);
  if (slot && quiere !== !!slot.firstElementChild) slot.innerHTML = quiere ? modoHtml() : '';
}
function actualizarBoton() {
  const t = $('#daTirarT'); if (!t) return;
  const pendiente = V.res && fijo() && (V.res.modo !== V.modo || V.res.firma !== firmaMods());
  t.textContent = !V.res ? 'Tirar' : pendiente ? `Tirar${V.modo !== 'normal' && conModo(V.res.p) ? ` con ${V.modo}` : ' de nuevo'}` : 'Volver a tirar';
  const pista = $('#daPista'); if (!pista) return;
  pista.innerHTML = pendiente ? 'Este resultado ya se ha aplicado. Los cambios valen para la próxima tirada.'
    : `<span class="dd-kbd"><kbd>R</kbd> para tirar</span>${agitar && !fijo() ? '<span class="dd-agita">o agita el móvil</span>' : ''}`;
}
const firmaMods = () => (V.mods || []).map(m => (m.on ? 1 : 0)).join('') + (V.critico ? 'c' : '');

// ---- Tirar ----
const DIST = new Map();
function distDe(p, modo, res) {
  const extras = res.extras.map(x => ({ p: parsear(String(x.m.valor).replace(/^[+-]/, '')), signo: x.neg ? -1 : 1 })).filter(x => x.p);
  const plano = res.planos.reduce((s, m) => s + (Number(m.valor) || 0), 0);
  const k = [texto(p), modo, V.critico ? 1 : 0, extras.map(x => x.signo + texto(x.p)).join(), plano].join('|');
  if (!DIST.has(k)) { if (DIST.size > 40) DIST.clear(); DIST.set(k, distribucion(p, { modo, critico: !!V.critico, extras, plano })); }
  return DIST.get(k);
}

function lanzar(nuevo = true) {
  const p = parsear(exprActual());
  if (!p) { V.res = null; pintarOut(); actualizarBoton(); $('#daExpr')?.focus(); return; }
  const modo = conModo(p) ? V.modo || 'normal' : 'normal', antes = V.res;
  const previo = !nuevo && antes && texto(antes.p) === texto(p) ? antes.res : null;
  const res = resolver({ p, modo, critico: !!V.critico, mods: V.mods || [], previo });
  const d20 = conModo(p), nat = res.r.natural, total = res.total;
  const crit = d20 && nat === 20, pifia = d20 && nat === 1, falla = falloAutomatico(V.mods || []);
  let lbl = V.tipo === 'ataque' ? 'para impactar' : V.tipo === 'dano' ? V.sub || 'de daño' : V.tipo === 'iniciativa' ? 'de iniciativa' : V.tipo === 'libre' ? texto(p) : 'en la tirada';
  if (falla) lbl = 'fallo automático';
  if (V.tipo === 'muerte') lbl = nat === 20 ? '¡Vuelves con 1 PG!' : nat === 1 ? 'Dos fallos' : total >= 10 ? 'Éxito' : 'Fallo';
  let efecto = !nuevo && antes ? antes.efecto : '';
  if (nuevo || V.repetible) efecto = V.alTirar ? (V.tipo === 'muerte' ? V.alTirar(nat, total) : V.alTirar(total, nat)) || '' : '';
  const cd = V.cd ?? null;
  // En pruebas y salvaciones con CD manda el total; en ataques y salvaciones contra muerte, el dado natural.
  const porDado = V.tipo === 'ataque' || V.tipo === 'muerte' || cd == null;
  const estado = falla ? 'pifia' : porDado && crit ? 'crit' : porDado && pifia ? 'pifia' : cd != null ? (total >= cd ? 'exito' : 'fallo') : '';
  V.res = { p, res, total, antes: antes && !nuevo ? antes.total : null, nat, crit, pifia, falla, lbl, efecto, cd, estado, modo, nuevo, firma: firmaMods(),
    dist: falla ? null : distDe(p, modo, res), id: nuevo || !antes ? ++SEQ : antes.id };
  registrar(nuevo || !antes);
  pintarOut(true); pintarHist(nuevo || !antes); actualizarBoton();
}

function registrar(nuevo) {
  const x = V.res, { r } = x.res, act = (V.mods || []).filter(m => m.on), H = cronica();
  const titulo = V.tipo === 'libre' ? texto(x.p) : V.titulo;
  const meta = [...(V.tipo !== 'libre' && V.tipo !== 'dano' && (V.bono || V.tipo !== 'muerte') ? [sgn(V.bono || 0)] : []), ...(r.d20 ? [x.modo] : []), ...act.map(m => m.fuente), ...(V.critico ? ['crítico'] : []), ...(x.falla ? ['fallo automático'] : [])];
  const e = { id: x.id, titulo, meta, total: x.total, nat: conModo(x.p) ? x.nat : null, caras: x.p.grupos[0]?.caras || 0, estado: x.estado, t: Date.now(),
    conf: { ...V, res: null, mods: V.mods?.map(m => ({ ...m })), alTirar: V.repetible ? V.alTirar : null } };
  const txt = `${titulo}${meta.length ? ` (${meta.join(', ')})` : ''}: ${x.total}${r.d20 ? ` (d20 ${r.d20.usa})` : x.nat != null ? ` (d20 ${x.nat})` : ''}`;
  if (nuevo) { H.unshift(e); if (H.length > MAX_CRONICA) H.pop(); S.note(txt); }
  else {
    const i = H.findIndex(h => h.id === x.id); if (i >= 0) H[i] = e;
    const log = S.cur()?.play?.log, ult = log?.[log.length - 1];
    if (ult && ult.x === V.logTxt) { ult.x = txt; S.save(); }
  }
  V.logTxt = txt;
}

// ---- Resultado ----
const MARCAS = Array.from({ length: 36 }, (_, i) => `<line x1="70" y1="3" x2="70" y2="${i % 3 ? 7 : 10}" transform="rotate(${i * 10} 70 70)"/>`).join('');
const ROMBOS = Array.from({ length: 8 }, (_, i) => `<rect x="67.5" y="13.5" width="5" height="5" transform="rotate(${i * 45} 70 70) rotate(45 70 16)"/>`).join('');
const ANILLO = `<svg class="dd-anillo" viewBox="0 0 140 140" aria-hidden="true"><circle class="a1" cx="70" cy="70" r="66" pathLength="100"/><g class="a-marcas">${MARCAS}</g><g class="a-rombos">${ROMBOS}</g><circle class="a2" cx="70" cy="70" r="54"/><circle class="a3" cx="70" cy="70" r="46" pathLength="100"/></svg>`;
const GRIETA = '<svg class="dd-grieta" viewBox="0 0 140 140" aria-hidden="true"><path d="M46 14 60 46 51 64 75 80 67 104 82 128" pathLength="1"/><path d="M60 46 38 54M75 80 99 88M67 104 52 112" pathLength="1"/></svg>';
const NOTA_NAT = {
  20: { ataque: 'Impacto crítico: los dados de daño se tiran dos veces.', muerte: 'Recuperas 1 punto de golpe y vuelves en ti.', otro: 'El mejor resultado posible del dado. En pruebas y salvaciones no es un éxito automático: cuenta el total.' },
  1: { ataque: 'Fallo automático, sea cual sea el total.', muerte: 'Cuenta como dos fallos.', otro: 'El peor resultado posible del dado. En pruebas y salvaciones no es un fallo automático: cuenta el total.' },
};

function pintarOut(anim = false) {
  const el = $('#daOut'), x = V.res, tok = ++TOKEN;
  if (!x) {
    el.className = 'dd-out vacio';
    el.innerHTML = `<div class="dd-espera">${dado(20, '?', { cls: 'flota' })}<p>${V.tipo === 'libre' && V.expr.trim() && !parsear(V.expr) ? 'Corrige la tirada para poder lanzarla.' : 'Toca <b>Tirar</b> y el resultado aparecerá aquí.'}</p></div>`;
    return;
  }
  const n = x.crit ? 20 : x.pifia ? 1 : null, tipoNota = V.tipo === 'ataque' ? 'ataque' : V.tipo === 'muerte' ? 'muerte' : 'otro';
  const cdTxt = x.cd != null && !x.falla ? `<span class="dd-cd ${x.total >= x.cd ? 'ok' : 'ko'}">CD ${x.cd} · ${x.total >= x.cd ? 'superada' : 'fallada'}</span>` : '';
  const nat = n ? `<div class="dd-nat n${n} dd-rev" style="--r:0"><b>${n === 20 ? (V.tipo === 'ataque' ? '¡Crítico!' : '¡20 natural!') : V.tipo === 'ataque' ? '¡Pifia!' : '1 natural'}</b><small>${esc(NOTA_NAT[n][tipoNota])}</small></div>` : '';
  const sig = V.siguiente && !x.falla && !(V.tipo === 'ataque' && x.pifia)
    ? `<button type="button" class="dd-sig dd-rev ${x.crit ? 'crit' : ''}" style="--r:3" data-dasig>${gi('cortante')}${esc(V.siguiente.texto)}${x.crit ? ' crítico' : ''}</button>` : '';
  el.className = `dd-out ${x.estado} ${n ? `n${n}` : ''} ${x.viejo ? 'viejo' : ''}`;
  el.innerHTML = `<div class="dd-hero"><div class="dd-sello">${n === 20 ? '<i class="dd-rayos" aria-hidden="true"></i>' : ''}${ANILLO}<span class="dd-num" aria-hidden="true">${x.total}</span>${n === 1 ? GRIETA : ''}</div>
      <div class="dd-lbl">${esc(x.lbl)}${cdTxt}</div></div>
    ${nat}<div class="dd-ec">${ecuacion(x)}</div>${probHtml(x)}
    ${x.efecto ? `<div class="da-efecto dd-rev" style="--r:2">${x.efecto}</div>` : ''}${sig}`;
  if (anim && !reducedMotion()) animar(el, x, tok); else asentar(el, x, anim);
}

function ecuacion(x) {
  const { r, extras, planos } = x.res, out = [];
  if (r.d20) {
    const [fa, fb] = r.frescos[0], usaA = r.d20.usa === r.d20.a;
    out.push(`<span class="dd-par ${x.modo}" title="${x.modo === 'ventaja' ? 'Ventaja: cuenta el mayor' : 'Desventaja: cuenta el menor'}">${dado(20, r.d20.a, { fuera: !usaA, fresco: fa })}${dado(20, r.d20.b, { fuera: usaA, fresco: fb })}<small>${x.modo}</small></span>`);
  } else r.grupos.forEach((g, k) => out.push(`${k || g.signo < 0 ? op(g.signo) : ''}<span class="dd-grupo">${g.vals.map((v, i) => dado(g.caras, v, { fuera: g.quita?.includes(i), fresco: r.frescos[k][i] })).join('')}</span>`));
  if (r.bono) out.push(`${op(r.bono)}<span class="dd-bono">${Math.abs(r.bono)}</span>`);
  for (const e of extras) out.push(`${op(e.neg ? -1 : 1)}<span class="dd-fx ${e.m.mal ? 'mal' : 'bien'}">${e.t.grupos.map((g, k) => g.vals.map((v, i) => dado(g.caras, v, { cls: 'mini', fresco: e.t.frescos[k][i] })).join('')).join('')}<small>${esc(e.m.fuente)}</small></span>`);
  for (const m of planos) out.push(`${op(m.valor)}<span class="dd-fx ${m.mal ? 'mal' : 'bien'}"><span class="dd-bono">${Math.abs(m.valor)}</span><small>${esc(m.fuente)}</small></span>`);
  const piezas = r.grupos.reduce((s, g) => s + g.vals.length, 0) + (r.d20 ? 1 : 0) + (r.bono ? 1 : 0) + extras.length + planos.length;
  if (piezas > 1) out.push(`<span class="dd-igual"><i class="dd-op">=</i><b class="dd-res">${x.total}</b></span>`);
  return out.join('');
}

function probHtml(x) {
  const d = x.dist; if (!d || d.p.length < 2) return '';
  const L = d.p.length, nb = Math.min(L, 44), w = L / nb, bins = [];
  for (let b = 0; b < nb; b++) {
    const i0 = Math.floor(b * w), i1 = Math.max(i0, Math.floor((b + 1) * w) - 1);
    let s = 0; for (let i = i0; i <= i1; i++) s += d.p[i];
    bins.push({ lo: d.min + i0, hi: d.min + i1, s });
  }
  const top = Math.max(...bins.map(b => b.s)), W = 6, cd = x.cd;
  const bars = bins.map((b, i) => {
    const h = 3 + 33 * (b.s / top), tu = x.total >= b.lo && x.total <= b.hi;
    const k = tu ? 'tu' : cd != null ? (b.lo >= cd ? 'pasa' : 'no') : b.hi < x.total ? 'bajo' : 'alto';
    return `<rect class="${k}" x="${i * W + 1}" y="${38 - h}" width="${W - 2}" height="${h}" rx="1.2" style="--i:${i}"/>`;
  }).join('');
  const cdX = cd != null && cd > d.min && cd <= maxDist(d) ? ((cd - d.min) / w) * W : null;
  const lineaCd = cdX != null ? `<line class="cd" x1="${cdX}" y1="0" x2="${cdX}" y2="40"/>` : '';
  const menor = probMenor(d, x.total), mx = maxDist(d);
  const frase = x.total >= mx ? '<b>El mejor resultado posible</b>' : x.total <= d.min ? '<b>El peor resultado posible</b>' : `Mejor que el <b>${pct(menor)}</b> de las tiradas`;
  const extra = [`media ${fmt(Math.round(mediaDist(d) * 10) / 10)}`, cd != null ? `${pct(probAlMenos(d, cd))} de superar la CD` : ''].filter(Boolean).join(' · ');
  return `<figure class="dd-prob dd-rev" style="--r:1"><svg viewBox="0 0 ${nb * W} 40" preserveAspectRatio="none" role="img" aria-label="Probabilidad de cada resultado, de ${d.min} a ${mx}">${bars}${lineaCd}</svg>${cdX != null ? `<span class="dd-cdmarca" style="left:${(cdX / (nb * W)) * 100}%">CD ${cd}</span>` : ''}
    <figcaption><span>${d.min}</span><span class="c"><span>${frase}</span><small>${extra}</small></span><span>${mx}</span></figcaption></figure>`;
}

// Los dados nuevos ruedan y muestran caras al azar hasta posarse; el total se sella al final.
function animar(el, x, tok) {
  const dados = [...el.querySelectorAll('.dd.rueda')], num = el.querySelector('.dd-num'), hero = el.querySelector('.dd-hero');
  const paso = dados.length ? Math.min(70, 480 / dados.length) : 0, dur = x.nuevo ? 460 : 320;
  dados.forEach((d, i) => d.style.setProperty('--d', `${Math.round(i * paso)}ms`));
  const fin = dados.length ? dur + (dados.length - 1) * paso : x.nuevo ? 420 : 260;
  const [lo, hi] = x.dist ? [x.dist.min, maxDist(x.dist)] : [1, Math.max(20, x.total)];
  const azar = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  hero.classList.add('girando'); dlg().classList.add('rodando');
  const t0 = performance.now(); let ult = 0;
  const frame = now => {
    if (tok !== TOKEN || !el.isConnected) return;
    const e = now - t0, cambia = now - ult > 55; if (cambia) ult = now;
    dados.forEach((d, i) => {
      if (d.dataset.ok) return;
      if (e >= i * paso + dur * 0.78) { d.querySelector('b').textContent = d.dataset.v; d.dataset.ok = '1'; d.classList.add('posado'); }
      else if (cambia) d.querySelector('b').textContent = azar(1, +d.dataset.c);
    });
    if (e < fin) {
      if (cambia) num.textContent = x.antes != null ? Math.round(x.antes + (x.total - x.antes) * (e / fin)) : azar(lo, hi);
      requestAnimationFrame(frame);
    } else asentar(el, x, true);
  };
  requestAnimationFrame(frame);
}
function asentar(el, x, anim) {
  const num = el.querySelector('.dd-num'), hero = el.querySelector('.dd-hero');
  num.textContent = x.total; hero.classList.remove('girando'); dlg().classList.remove('rodando');
  el.querySelectorAll('.dd.rueda b').forEach(b => { b.textContent = b.parentElement.dataset.v; });
  el.classList.add('listo'); if (anim) hero.classList.add('sella');
  $('#daVivo').textContent = `${x.total}${x.lbl ? ` ${x.lbl}` : ''}${x.cd != null && !x.falla ? `, CD ${x.cd} ${x.total >= x.cd ? 'superada' : 'fallada'}` : ''}${x.crit ? ', 20 natural' : x.pifia ? ', 1 natural' : ''}.`;
  if (!anim) return;
  haptic(x.crit || x.pifia ? 'heavy' : 'light');
  if (reducedMotion()) return;
  const s = el.querySelector('.dd-sello').getBoundingClientRect(), cx = s.left + s.width / 2, cy = s.top + s.height / 2;
  if (x.crit) {
    burst(cx, cy, { color: '#F4D27A', n: 70, speed: 5.5, up: 1.4, life: 1500, size: 2.6, gravity: 0.01 });
    setTimeout(() => burst(cx, cy, { color: '#FFF3C8', n: 30, speed: 3, up: 2.5, life: 1200, size: 1.8, gravity: -0.03 }), 240);
  } else if (x.pifia) {
    burst(cx, cy, { color: '#FF5A45', n: 26, speed: 3.2, up: -0.4, life: 1100, size: 2.4, gravity: 0.14 });
    burst(cx, cy, { color: '#6b6f7d', n: 18, speed: 2.4, up: 0.4, life: 1300, size: 3, gravity: 0.18 });
    const d = $('#daBody'); d.classList.remove('dd-sacude'); void d.offsetWidth; d.classList.add('dd-sacude'); setTimeout(() => d.classList.remove('dd-sacude'), 700);
  } else if (x.nuevo) {
    const col = x.estado === 'exito' ? '#6ECB9D' : x.estado === 'fallo' ? '#F2826F' : getComputedStyle(el).getPropertyValue('--gold').trim() || '#E7B85F';
    const max = x.dist && x.total >= maxDist(x.dist);
    burst(cx, cy, { color: /^#/.test(col) ? col : '#E7B85F', n: max ? 40 : 12, speed: max ? 4 : 2, up: 1.2, life: max ? 1200 : 700, size: 1.7 });
  }
}

// ---- Crónica ----
const hace = t => { const s = (Date.now() - t) / 1000; return s < 45 ? 'ahora' : s < 3600 ? `hace ${Math.round(s / 60)} min` : new Date(t).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }); };
function pintarHist(recien = false) {
  const el = $('#daHist'), H = cronica();
  el.hidden = !H.length; if (!H.length) { el.innerHTML = ''; return; }
  const vis = V.verTodo ? H : H.slice(0, VISIBLES), mismas = H.filter(h => h.titulo === H[0].titulo);
  const med = mismas.length >= 3 ? `<span class="dd-cron-med" title="Media de tus últimas tiradas de ${esc(H[0].titulo)}">${esc(H[0].titulo)}: media <b>${fmt(Math.round(mismas.reduce((s, h) => s + h.total, 0) / mismas.length * 10) / 10)}</b> en ${mismas.length}</span>` : '';
  el.innerHTML = `<header><h3>Crónica</h3><span class="dd-cron-n">${H.length}</span>${med}<button type="button" class="dd-cron-x" data-daborra>Borrar</button></header>
    <ol>${vis.map((h, i) => `<li class="${h.estado} ${i === 0 && recien ? 'nuevo' : ''} ${V.res?.id === h.id ? 'actual' : ''}"><button type="button" data-dahist="${i}" aria-label="Repetir ${esc(h.titulo)}: salió ${h.total}">
      ${h.nat != null ? dado(20, h.nat, { cls: 'mini' }) : `<span class="dd mini" data-f="${formaDe(h.caras)}">${forma(h.caras)}<b>${h.caras ? (h.caras === 100 ? '%' : 'd' + h.caras) : '±'}</b></span>`}
      <span class="t"><b>${esc(h.titulo)}</b>${h.meta.length ? `<small>${h.meta.map(m => `<i class="${m === 'ventaja' || m === 'desventaja' ? m : ''}">${esc(m)}</i>`).join('')}</small>` : ''}</span>
      <span class="v"><b>${h.total}</b><time>${hace(h.t)}</time></span></button></li>`).join('')}</ol>
    ${H.length > VISIBLES ? `<button type="button" class="dd-cron-mas" data-daver>${V.verTodo ? 'Ver menos' : `Ver las ${H.length}`}</button>` : ''}`;
}

// ---- Agitar el móvil para tirar ----
function armarAgitar() {
  if (agitar || typeof DeviceMotionEvent === 'undefined' || !matchMedia('(pointer: coarse)').matches) return;
  let ult = null, picos = [], espera = 0, visto = false;
  const f = e => {
    const a = e.accelerationIncludingGravity; if (!a || a.x == null) return;
    if (!visto) { visto = true; actualizarBoton(); }
    const now = performance.now();
    if (ult && now > espera) {
      const d = Math.abs(a.x - ult.x) + Math.abs(a.y - ult.y) + Math.abs(a.z - ult.z);
      if (d > 34) { picos = picos.filter(t => now - t < 700); picos.push(now);
        if (picos.length >= 3 && !fijo() && dlg().open && !dlg().classList.contains('rodando')) { picos = []; espera = now + 1400; tirarBoton(); } }
    }
    ult = { x: a.x, y: a.y, z: a.z };
  };
  agitar = f; addEventListener('devicemotion', f);
  dlg().addEventListener('close', () => { removeEventListener('devicemotion', f); agitar = null; }, { once: true });
}
function tirarBoton() {
  if (V.tipo === 'libre') { const i = $('#daExpr'); V.expr = i?.value.trim() || V.expr; }
  lanzar(true);
}
function volar(desde, hasta) {
  if (reducedMotion() || !desde || !hasta || !desde.animate) return;
  const a = desde.getBoundingClientRect(), b = hasta.getBoundingClientRect(), g = desde.querySelector('svg').cloneNode(true);
  const r = dlg().getBoundingClientRect();
  g.classList.add('dd-vuela'); Object.assign(g.style, { left: `${a.left - r.left + a.width / 2 - 14}px`, top: `${a.top - r.top + a.height / 2 - 14}px` });
  dlg().append(g);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  g.animate([{ transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 }, { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 30}px) rotate(200deg) scale(.9)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) rotate(360deg) scale(.4)`, opacity: 0 }], { duration: 480, easing: 'cubic-bezier(.3,.6,.4,1)' }).onfinish = () => g.remove();
}

export function init(store) {
  S = store;
  const body = $('#daBody'), d = dlg();
  on(body, 'click', '[data-datirar]', () => tirarBoton());
  on(body, 'click', '[data-damodt]', (e, b) => {
    const m = V.mods.find(x => x.id === b.dataset.damodt); if (!m) return;
    const fallaAntes = !!falloAutomatico(V.mods); m.on = !m.on; haptic('light');
    if (V.modoAuto) V.modo = resolverModo(V.mods);
    if (fallaAntes !== !!falloAutomatico(V.mods)) pintarCtl();
    else { b.classList.toggle('off', !m.on); b.setAttribute('aria-pressed', String(m.on)); sincModo(); }
    if (V.res && !fijo()) lanzar(false); else actualizarBoton();
  });
  on(body, 'click', '[data-damodo]', (e, b) => {
    if (b.dataset.damodo === V.modo) return;
    V.modo = b.dataset.damodo; V.modoAuto = false; sincModo(); haptic('light');
    if (V.tipo === 'libre') V.expr = $('#daExpr').value.trim() || V.expr;
    if (V.res && !fijo() && (V.tipo !== 'libre' || !V.res.viejo)) lanzar(false); else actualizarBoton();
  });
  on(body, 'click', '[data-dacara]', (e, b) => {
    const c = +b.dataset.dacara, p = parsear($('#daExpr').value) || { grupos: [], bono: 0 }, g = p.grupos.find(x => x.caras === c && x.signo > 0 && !x.keep);
    if (g) g.n = Math.min(100, g.n + 1); else p.grupos.push({ n: 1, caras: c, signo: 1 });
    V.expr = texto(p).replace(/−/g, '-'); caducar(); sincLibre(); haptic('light');
    b.classList.remove('pulso'); void b.offsetWidth; b.classList.add('pulso'); volar(b, $('#daExpr'));
  });
  on(body, 'click', '[data-daquita]', (e, b) => {
    const p = parsear($('#daExpr').value); if (!p) return; const g = p.grupos[+b.dataset.daquita]; if (!g) return;
    if (g.n > 1 && !(g.keep && g.keep.n >= g.n - 1)) g.n--; else if (g.n > 1) { g.n--; delete g.keep; } else p.grupos.splice(+b.dataset.daquita, 1);
    V.expr = texto(p).replace(/−/g, '-'); caducar(); sincLibre(); haptic('light');
  });
  on(body, 'click', '[data-daexpr]', (e, b) => { V.expr = b.dataset.daexpr; caducar(); sincLibre(); lanzar(true); });
  on(body, 'click', '[data-damod]', (e, b) => { const p = parsear($('#daExpr').value) || { grupos: [], bono: 0 }; p.bono += +b.dataset.damod; V.expr = texto(p).replace(/−/g, '-') || '0'; caducar(); sincLibre(); });
  on(body, 'click', '[data-dalimpiar]', () => { V.expr = ''; V.res = null; sincLibre(); pintarOut(); actualizarBoton(); $('#daExpr')?.focus(); });
  on(body, 'click', '[data-dahist]', (e, b) => {
    const h = cronica()[+b.dataset.dahist]; if (!h) return;
    V = { ...h.conf, mods: h.conf.mods?.map(m => ({ ...m })), res: null, verTodo: V.verTodo };
    montar(); lanzar(true);
  });
  on(body, 'click', '[data-daver]', () => { V.verTodo = !V.verTodo; pintarHist(); });
  on(body, 'click', '[data-daborra]', () => { cronica().length = 0; V.verTodo = false; pintarHist(); });
  on(body, 'click', '[data-dasig]', () => { const s = V.siguiente, c = !!V.res?.crit; if (s) s.fn(c); });
  body.addEventListener('input', e => { if (e.target.id !== 'daExpr') return; V.expr = e.target.value; caducar(); sincLibre(false); });
  body.addEventListener('keydown', e => { if (e.target.id === 'daExpr' && e.key === 'Enter') { e.preventDefault(); V.expr = e.target.value.trim(); lanzar(true); } });
  body.addEventListener('change', e => { if (e.target.id !== 'daCrit') return; V.critico = e.target.checked; haptic('light'); if (V.res && V.tipo === 'dano') lanzar(false); else actualizarBoton(); });
  d.addEventListener('keydown', e => {
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { e.preventDefault(); tirarBoton(); }
  });
}
// En la tirada libre, al cambiar la expresión el último resultado queda atenuado hasta volver a tirar.
function caducar() { if (V.res && !V.res.viejo) { V.res.viejo = true; $('#daOut')?.classList.add('viejo'); } }
