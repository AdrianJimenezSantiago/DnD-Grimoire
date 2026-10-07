// Bandeja de dados: cualquier tirada con ventaja o desventaja, expresiones como «2d6+3» y las últimas tiradas.
import { esc } from '../../core/util.js';
import { minimoD20Habilidad, totalMinimoFuerza } from '../../domain/combate/automatismos.js';
import { abDe } from '../../domain/reglas/habilidades.js';
import { especieBase } from '../../domain/origen/especies.js';
import { sgn } from '../../domain/reglas/reglas2024.js';
import { parsear, texto, esD20Simple, media, rango, resolver, distribucion, maxDist, rngCripto } from '../../domain/reglas/dados.js';
import { fmt, formaDe, forma, dado, op, dadosDe, sello, probHtml, rodar, sellar, centro, fxNatural, narracion, fraseHtml } from '../animaciones/dadosVista.js';
import { categoriaTirada, tramoD20, tramoDano } from '../../domain/presentacion/frases.js';
import { modsTirada, resolverModo, falloAutomatico, fmtMod } from '../../domain/combate/efectos.js';
import { $, on } from '../componentes/dom.js';
import { gi } from '../componentes/tema.js';
import { icon } from '../componentes/icons.js';
import { abrirDialogo } from '../componentes/dialog.js';
import { chispas, movimientoReducido } from '../animaciones/fx.js';
import { fxImpacto, nivelImpacto } from '../animaciones/impacto.js';
import { vibrar } from '../../platform/native.js';

let S, V = null, SEQ = 0, TOKEN = 0, agitar = null;
const CRONICA = new Map(), MAX_CRONICA = 30, VISIBLES = 5;
const CARAS = [4, 6, 8, 10, 12, 20, 100];
const MODOS = [['desventaja', 'Desventaja', 'el menor de 2d20'], ['normal', 'Normal', '1d20'], ['ventaja', 'Ventaja', 'el mayor de 2d20']];
const D20 = ['prueba', 'salvacion', 'ataque', 'iniciativa', 'muerte'];
const SOBRE = { prueba: 'prueba', salvacion: 'salvacion', muerte: 'salvacion', ataque: 'ataque', iniciativa: 'iniciativa' };
const dlg = () => $('#dadosDlg');
const cronica = () => { const k = S.cur()?.id ?? '_'; if (!CRONICA.has(k)) CRONICA.set(k, []); return CRONICA.get(k); };

// ---- Entradas ----
export function abrirDados() {
  V = { tipo: 'libre', expr: V?.tipo === 'libre' ? V.expr : '1d20', modo: 'normal', critico: false, res: null };
  montar(); abrir();
}
// cd: dificultad a superar (colorea el resultado y da la probabilidad de éxito).
// alTirar: se llama una vez por tirada con el resultado. Si no es «repetible» (aplica cambios
// en la ficha), cambiar ventaja o modificadores después no recalcula: vale para la siguiente.
// siguiente: { texto, fn(critico) } para encadenar otra tirada, como el daño tras un ataque.
export function tirarPrueba({ titulo, sub = '', bono = 0, tipo = 'prueba', ab = '', hab = '', cd = null, alTirar = null, repetible = false, siguiente = null, impacto = null, motivo = '', critMin = 20, minD20 = 0, minFuente = '' }) {
  const mods = S.cur() ? modsTirada(S.cur(), { sobre: SOBRE[tipo] || 'prueba', ab, hab, motivo: motivo || (tipo === 'muerte' ? 'muerte' : '') }) : [];
  if (!minD20 && hab && tipo === 'prueba' && S.cur() && minimoD20Habilidad(S.cur(), hab)) { minD20 = minimoD20Habilidad(S.cur(), hab); minFuente = 'Talentos fiables'; }
  const minTotal = (tipo === 'prueba' || tipo === 'salvacion') && S.cur() ? totalMinimoFuerza(S.cur(), ab || (hab ? abDe(hab) : '')) : 0;
  V = { minTotal, tipo, titulo, sub, bono, ab, hab, motivo, cd: tipo === 'muerte' ? 10 : cd, mods, modo: resolverModo(mods), modoAuto: true, alTirar, repetible, siguiente, impacto, critMin, minD20, minFuente, res: null };
  montar(); abrir(); lanzar();
}
const CLAVES = ['cortante', 'contundente', 'perforante', 'fuego', 'frio', 'relampago', 'trueno', 'acido', 'veneno', 'necrotico', 'radiante', 'psiquico', 'fuerza', 'curacion'];
const claveDe = t => { const n = String(t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); return CLAVES.find(k => n.includes(k)) || ''; };
export function tirarDano({ titulo, sub = '', expr, critico = false, extras = [], clave = '', aviso = '' }) {
  V = { tipo: 'dano', titulo, sub, expr, critico, clave, aviso, res: null, mods: extras.map((x, i) => ({ id: 'e' + i, fuente: x.fuente, efecto: 'dado', valor: x.valor, on: true })) };
  montar(); abrir(); lanzar();
}
function abrir() { abrirDialogo(dlg()); armarAgitar(); }

const esD20 = () => D20.includes(V.tipo);
const exprActual = () => (esD20() ? `1d20${V.bono ? sgn(V.bono) : ''}` : V.expr);
const conModo = p => esD20() || (V.tipo === 'libre' && esD20Simple(p));
const fijo = () => !!V.alTirar && !V.repetible;
// ---- Montaje ----
function montar() {
  const libre = V.tipo === 'libre', body = $('#daBody');
  $('#daTitle').innerHTML = `${gi(libre ? 'cubilete' : V.tipo === 'muerte' ? 'muerte' : V.tipo === 'dano' ? 'dados' : 'd20', 'rl-d20')} ${esc(libre ? 'Dados' : V.titulo)}`;
  $('#daSub').textContent = libre ? 'Toca los dados para sumarlos, o escribe la tirada.' : V.sub;
  const pie = dlg().querySelector('[data-cmd="dadoslibres"]'); if (pie) pie.hidden = libre;
  body.innerHTML = `<div id="daCtl"></div><div class="dd-out" id="daOut"></div><p class="visually-hidden" id="daVivo" aria-live="polite"></p><section class="dd-cron" id="daHist" aria-label="Crónica de tiradas"></section>`;
  if (dlg().open && !movimientoReducido()) { body.classList.remove('dd-cambia'); void body.offsetWidth; body.classList.add('dd-cambia'); }
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
  let res = resolver({ p, modo, critico: !!V.critico, mods: V.mods || [], previo });
  // Fortuna (mediano): un 1 en una prueba con d20 se repite y vale el nuevo resultado
  let fortuna = !previo && conModo(p) && V.tipo !== 'dano' && V.tipo !== 'libre' && res.r.natural === 1 && S.cur() && especieBase(S.cur()) === 'mediano';
  if (fortuna) res = resolver({ p, modo, critico: !!V.critico, mods: V.mods || [] });
  else if (!!previo && antes?.fortuna) fortuna = true;
  const d20 = conModo(p), nat = res.r.natural, falla = falloAutomatico(V.mods || []);
  // Crítico mejorado del campeón: el ataque es crítico con 19 o 18
  const crit = d20 && (nat === 20 || ((V.tipo === 'ataque' || V.tipo === 'muerte') && nat >= (V.critMin || 20))), pifia = d20 && nat === 1;
  // Talentos fiables: un 9 o menos en el d20 cuenta como 10
  const fiable = d20 && V.minD20 && nat < V.minD20 ? V.minD20 - nat : 0;
  // En una prueba de característica, un 20 natural no baja de 20 aunque los modificadores resten.
  const tope = V.tipo === 'prueba' && crit && res.total < 20, total0 = tope ? 20 : res.total + fiable, poderio = V.minTotal && total0 < V.minTotal, total = poderio ? V.minTotal : total0;
  let lbl = V.tipo === 'ataque' ? 'para impactar' : V.tipo === 'dano' ? V.sub || 'de daño' : V.tipo === 'iniciativa' ? 'de iniciativa' : V.tipo === 'libre' ? texto(p) : 'en la tirada';
  if (poderio) lbl = `${lbl} (Poderío indómito: usas tu Fuerza, ${V.minTotal})`;
  if (fortuna) lbl = `${lbl} (Fortuna: repetiste un 1)`;
  if (fiable) lbl = `${lbl} (${V.minFuente || 'mínimo'}: el ${nat} cuenta como ${V.minD20})`;
  if (falla) lbl = 'fallo automático';
  if (V.tipo === 'muerte') lbl = crit ? '¡Vuelves con 1 PG!' : nat === 1 ? 'Dos fallos' : total >= 10 ? 'Éxito' : 'Fallo';
  let efecto = !nuevo && antes ? antes.efecto : '';
  if (nuevo || V.repetible) efecto = V.alTirar ? (V.tipo === 'muerte' ? V.alTirar(nat, total) : V.alTirar(total, nat)) || '' : '';
  const cd = V.cd ?? null;
  // En pruebas y salvaciones con CD manda el total; en ataques y salvaciones contra muerte, el dado natural.
  const porDado = V.tipo === 'ataque' || V.tipo === 'muerte' || cd == null;
  const estado = falla ? 'pifia' : porDado && crit ? 'crit' : porDado && pifia ? 'pifia' : cd != null ? (total >= cd ? 'exito' : 'fallo') : '';
  V.res = { fortuna, p, res, total, tope, antes: antes && !nuevo ? antes.total : null, nat, crit, pifia, falla, lbl, efecto, cd, estado, modo, nuevo, firma: firmaMods(),
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
  const imp = V.tipo === 'ataque' && V.impacto && !x.falla && !x.decidido, rozar = V.impacto?.maestria?.alFallar;
  const sig = imp ? `<div class="dd-impacto dd-rev" style="--r:3">${x.pifia ? '' : `<button type="button" class="dd-sig ${x.crit ? 'crit' : ''}" data-daimpacta>${gi('cortante')}<span>Impacta${x.crit ? ' · crítico' : ''}<small>${V.siguiente ? 'y tirar daño' : 'aplicar efectos'}</small></span></button>`}
      <button type="button" class="dd-falla" data-dafalla>${gi('muerte')}<span>Falla${rozar ? `<small>${esc(V.impacto.maestria.nombre)} se activa</small>` : ''}</span></button></div>`
    : V.siguiente && !x.falla && !x.decidido && !(V.tipo === 'ataque' && x.pifia)
    ? `<button type="button" class="dd-sig dd-rev ${x.crit ? 'crit' : ''}" style="--r:3" data-dasig>${gi('cortante')}${esc(V.siguiente.texto)}${x.crit ? ' crítico' : ''}</button>` : '';
  if (x.frase === undefined) { // una por tirada: repintar no la cambia
    const cat = categoriaTirada({ tipo: V.tipo, hab: V.hab, ab: V.ab, motivo: V.motivo, clave: V.clave || claveDe(V.sub), cura: /curaci/i.test(V.sub || '') });
    x.tramo = V.tipo === 'dano' ? tramoDano(x.total, x.dist) : x.falla ? 'mal' : tramoD20({ nat: n, total: x.total, cd: x.cd, tipo: V.tipo });
    x.frase = narracion(cat, x.tramo);
  }
  const aviso = x.aviso || V.aviso ? `<div class="da-maes dd-rev" style="--r:1">${x.aviso || V.aviso}</div>` : '';
  el.className = `dd-out ${x.estado} ${n ? `n${n}` : ''} ${x.viejo ? 'viejo' : ''}`;
  el.innerHTML = `<div class="dd-hero">${sello(x.total, { n })}
      <div class="dd-lbl">${esc(x.lbl)}${cdTxt}</div></div>
    ${fraseHtml(x.frase, x.tramo)}${nat}<div class="dd-ec">${ecuacion(x)}</div>${x.falla ? '' : probHtml(x.dist, x.tope ? x.res.total : x.total, { cd: x.cd })}
    ${x.efecto ? `<div class="da-efecto dd-rev" style="--r:2">${x.efecto}</div>` : ''}${aviso}${sig}`;
  if (!anim) { sellar(el, x.total, false); asentar(el, x, false); return; }
  dlg().classList.add('rodando');
  rodar(el, { total: x.total, antes: x.antes, lo: x.dist ? x.dist.min : 1, hi: x.dist ? maxDist(x.dist) : Math.max(20, x.total), nuevo: x.nuevo, vivo: () => tok === TOKEN, fin: () => asentar(el, x, true) });
}

function ecuacion(x) {
  const { r, extras, planos } = x.res, out = [];
  out.push(dadosDe(r, x.modo));
  if (r.bono) out.push(`${op(r.bono)}<span class="dd-bono">${Math.abs(r.bono)}</span>`);
  for (const e of extras) out.push(`${op(e.neg ? -1 : 1)}<span class="dd-fx ${e.m.mal ? 'mal' : 'bien'}">${e.t.grupos.map((g, k) => g.vals.map((v, i) => dado(g.caras, v, { cls: 'mini', fresco: e.t.frescos[k][i] })).join('')).join('')}<small>${esc(e.m.fuente)}</small></span>`);
  for (const m of planos) out.push(`${op(m.valor)}<span class="dd-fx ${m.mal ? 'mal' : 'bien'}"><span class="dd-bono">${Math.abs(m.valor)}</span><small>${esc(m.fuente)}</small></span>`);
  if (x.precision) out.push(`${op(1)}<span class="dd-fx bien"><span class="dd-bono">${x.precision}</span><small>${esc(V.impacto?.precision?.nombre || 'Ataque de precisión')}</small></span>`);
  const piezas = r.grupos.reduce((s, g) => s + g.vals.length, 0) + (r.d20 ? 1 : 0) + (r.bono ? 1 : 0) + extras.length + planos.length;
  if (x.tope) out.push(`<span class="dd-igual"><i class="dd-op">=</i><s class="dd-tachado">${x.res.total}</s><i class="dd-op">→</i><b class="dd-res">${x.total}</b></span><small class="dd-tope">Un 20 natural en una prueba no baja de 20.</small>`);
  else if (piezas > 1) out.push(`<span class="dd-igual"><i class="dd-op">=</i><b class="dd-res">${x.total}</b></span>`);
  return out.join('');
}

function asentar(el, x, anim) {
  dlg().classList.remove('rodando');
  $('#daVivo').textContent = `${x.total}${x.lbl ? ` ${x.lbl}` : ''}${x.cd != null && !x.falla ? `, CD ${x.cd} ${x.total >= x.cd ? 'superada' : 'fallada'}` : ''}${x.crit ? ', 20 natural' : x.pifia ? ', 1 natural' : ''}.`;
  if (!anim) return;
  vibrar(x.crit || x.pifia ? 'heavy' : 'light');
  if (movimientoReducido()) return;
  if (x.crit || x.pifia) { fxNatural(el, x.crit ? 20 : 1, $('#daBody')); return; }
  if (!x.nuevo) return;
  if (V.tipo === 'dano') fxImpacto(el.querySelector('.dd-hero'), { clave: V.clave || claveDe(V.sub), cura: /curaci/i.test(V.sub || ''), nivel: nivelImpacto(x.total, x.dist), caja: $('#daBody') });
  const [cx, cy] = centro(el.querySelector('.dd-sello')), max = x.dist && x.total >= maxDist(x.dist);
  const col = x.estado === 'exito' ? '#6ECB9D' : x.estado === 'fallo' ? '#F2826F' : getComputedStyle(el).getPropertyValue('--gold').trim();
  chispas(cx, cy, { color: /^#/.test(col) ? col : '#E7B85F', n: max ? 40 : 12, speed: max ? 4 : 2, up: 1.2, life: max ? 1200 : 700, size: 1.7 });
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
  if (movimientoReducido() || !desde || !hasta || !desde.animate) return;
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
    const fallaAntes = !!falloAutomatico(V.mods); m.on = !m.on; vibrar('light');
    if (V.modoAuto) V.modo = resolverModo(V.mods);
    if (fallaAntes !== !!falloAutomatico(V.mods)) pintarCtl();
    else { b.classList.toggle('off', !m.on); b.setAttribute('aria-pressed', String(m.on)); sincModo(); }
    if (V.res && !fijo()) lanzar(false); else actualizarBoton();
  });
  on(body, 'click', '[data-damodo]', (e, b) => {
    if (b.dataset.damodo === V.modo) return;
    V.modo = b.dataset.damodo; V.modoAuto = false; sincModo(); vibrar('light');
    if (V.tipo === 'libre') V.expr = $('#daExpr').value.trim() || V.expr;
    if (V.res && !fijo() && (V.tipo !== 'libre' || !V.res.viejo)) lanzar(false); else actualizarBoton();
  });
  on(body, 'click', '[data-dacara]', (e, b) => {
    const c = +b.dataset.dacara, p = parsear($('#daExpr').value) || { grupos: [], bono: 0 }, g = p.grupos.find(x => x.caras === c && x.signo > 0 && !x.keep);
    if (g) g.n = Math.min(100, g.n + 1); else p.grupos.push({ n: 1, caras: c, signo: 1 });
    V.expr = texto(p).replace(/−/g, '-'); caducar(); sincLibre(); vibrar('light');
    b.classList.remove('pulso'); void b.offsetWidth; b.classList.add('pulso'); volar(b, $('#daExpr'));
  });
  on(body, 'click', '[data-daquita]', (e, b) => {
    const p = parsear($('#daExpr').value); if (!p) return; const g = p.grupos[+b.dataset.daquita]; if (!g) return;
    if (g.n > 1 && !(g.keep && g.keep.n >= g.n - 1)) g.n--; else if (g.n > 1) { g.n--; delete g.keep; } else p.grupos.splice(+b.dataset.daquita, 1);
    V.expr = texto(p).replace(/−/g, '-'); caducar(); sincLibre(); vibrar('light');
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
  const avisoMaes = (m, txt) => m && txt ? `<b>${gi('dote')}Maestría: ${esc(m.nombre)}</b><span>${esc(txt)}</span>` : '';
  on(body, 'click', '[data-daprec]', () => {
    const pr = V.impacto?.precision; if (!pr || V.res.precision) return;
    const caras = parseInt(String(pr.dado || '').slice(1), 10) || 8, r = pr.fijo ?? rngCripto(caras); pr.fn();
    V.res.precision = r; V.res.total += r; V.res.decidido = false;
    V.res.aviso = `<b>${gi('dados')}${esc(pr.nombre || 'Ataque de precisión')}: +${r}</b><span>${pr.fijo ? '' : `1${esc(pr.dado)} de supremacía. `}La tirada queda en ${V.res.total}: ¿impacta ahora?</span>`;
    vibrar('medium'); pintarOut();
  });
  on(body, 'click', '[data-daimpacta]', () => {
    const m = V.impacto?.maestria, aviso = avisoMaes(m, m?.alImpactar || m?.siempre), c = !!V.res?.crit;
    vibrar('medium'); V.impacto?.alImpactar?.();
    if (V.siguiente) return V.siguiente.fn(c, aviso);
    V.res.decidido = true; V.res.aviso = aviso || 'Impacto.'; pintarOut();
  });
  on(body, 'click', '[data-dafalla]', () => {
    const m = V.impacto?.maestria, pr = V.impacto?.precision; V.impacto?.alFallar?.();
    // Ataque de precisión (Maestro del combate): al fallar, un dado de supremacía se suma a la tirada
    const oferta = pr && !V.res.precision ? `<button type="button" class="dd-sig" data-daprec>${gi('dados')}<span>${esc(pr.nombre || 'Ataque de precisión')}<small>${esc(pr.texto || `gasta un dado de supremacía y suma 1${pr.dado} a la tirada`)} (${pr.quedan} ${pr.quedan === 1 ? 'queda' : 'quedan'})</small></span></button>` : '';
    V.res.decidido = true; V.res.aviso = (avisoMaes(m, m?.alFallar) || 'Fallo. El ataque no impacta.') + oferta; pintarOut();
    if (m?.alFallar) { const hero = $('#daOut .dd-hero'); fxImpacto(hero, { clave: V.impacto.clave, nivel: 'bueno' }); }
  });
  body.addEventListener('input', e => { if (e.target.id !== 'daExpr') return; V.expr = e.target.value; caducar(); sincLibre(false); });
  body.addEventListener('keydown', e => { if (e.target.id === 'daExpr' && e.key === 'Enter') { e.preventDefault(); V.expr = e.target.value.trim(); lanzar(true); } });
  body.addEventListener('change', e => { if (e.target.id !== 'daCrit') return; V.critico = e.target.checked; vibrar('light'); if (V.res && V.tipo === 'dano') lanzar(false); else actualizarBoton(); });
  d.addEventListener('keydown', e => {
    if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) { e.preventDefault(); tirarBoton(); }
  });
}
// En la tirada libre, al cambiar la expresión el último resultado queda atenuado hasta volver a tirar.
function caducar() { if (V.res && !V.res.viejo) { V.res.viejo = true; $('#daOut')?.classList.add('viejo'); } }
