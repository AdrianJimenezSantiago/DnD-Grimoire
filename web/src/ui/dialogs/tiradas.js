import { esc, norm } from '../../core/util.js';
import { perfil, sgn, nivelTotal, magiaPara } from '../../domain/reglas2024.js';
import { manualFor, srdFor, tiradasConjuro } from '../../domain/catalogo.js';
import { conObjetivos } from '../../domain/concentracion.js';
import { dadosPara } from '../../domain/tiradas.js';
import { parsear, resolver, distribucion, maxDist } from '../../domain/dados.js';
import { modsTirada, resolverModo, fmtMod, efectoDeConjuro } from '../../domain/efectos.js';
import { esYo } from '../../domain/vida.js';
import { botonYo } from '../avatar.js';
import { anadirObjetivos, quitarObjetivo, alternarYo } from '../../app/acciones.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { openSheet } from '../dialog.js';
import { burst, reducedMotion } from '../fx.js';
import { fxImpacto, nivelImpacto } from '../impacto.js';
import { haptic } from '../../platform/native.js';
import { fmt, dado, op, dadosDe, sello, probHtml, rodar, sellar, centro, fxNatural } from '../dadosVista.js';
import { md } from './conjuro.js';

let S, R = null, TOKEN = 0;
const RECIENTES = new Map(), MAX_RECIENTES = 8;
const dlg = () => $('#rollDlg');
export const ICONO_DANO = { 'ácido': 'acido', contundente: 'contundente', cortante: 'cortante', 'frío': 'frio', fuego: 'fuego', fuerza: 'fuerza', 'necrótico': 'necrotico',
  perforante: 'perforante', 'psíquico': 'psiquico', radiante: 'radiante', 'relámpago': 'relampago', trueno: 'trueno', veneno: 'veneno', 'curación': 'curacion' };
export const iconoDano = (tipo, cls = '') => `<span class="dmg dmg-${ICONO_DANO[tipo] || 'fuerza'} ${cls}" title="${esc(tipo)}">${gi(ICONO_DANO[tipo] || 'fuerza')}</span>`;
export const danoDe = tipo => (/^(psíquico|necrótico|radiante|contundente|cortante|perforante)$/.test(tipo) ? `daño ${tipo}` : `daño de ${tipo}`);
const claveDano = tipo => ICONO_DANO[tipo] || 'fuerza';
const ESC_ICO = { abj: 'esc_abj', adi: 'esc_adi', con: 'esc_con', enc: 'esc_enc', evo: 'esc_evo', ilu: 'esc_ilu', nig: 'esc_nig', tra: 'esc_tra' };
const MODOS = [['desventaja', 'Desventaja', 'el menor de 2d20'], ['normal', 'Normal', '1d20'], ['ventaja', 'Ventaja', 'el mayor de 2d20']];
const TS = [['falla', 'Ha fallado', 'efecto completo'], ['supera', 'Ha superado', 'se libra o mitad'], ['varios', 'Varios', 'unos sí y otros no']];

const datos = () => { const ch = S.cur(), e = ch.book[R.bi], s = S.db.catalog[e.sid]; return { ch, s, P: magiaPara(perfil(ch), e.fuente), t: tiradasConjuro(s) }; };
const dadosActuales = ({ ch, s, t }) => (t ? dadosPara(t, { nivelPj: nivelTotal(ch), nivelEspacio: s.level ? R.nivel : null, nivelConjuro: s.level }) : []);
const conSalvacion = (t, dados) => !!t?.salvacion && (dados.some(x => x.via === 'salvacion') || t.falla || t.extras.length);
const bonoDe = (dd, t, P) => dd.bono + ((dd.tipo === 'curación' && t.curacion?.mod) || dd.mod ? (P.mod || 0) : 0);
const exprDe = (n, caras, bono) => `${n}d${caras}${bono ? sgn(bono) : ''}`;
const idxDe = (lista, k) => Math.max(0, lista.findIndex(m => m[0] === k));

export function openRoll(bi, nivelEspacio) {
  const ch = S.cur(), s = S.db.catalog[ch.book[bi].sid], P = perfil(ch);
  const mods = modsTirada(ch, { sobre: 'ataque' });
  R = { bi, sid: ch.book[bi].sid, nivel: s.level === 0 ? 0 : Math.max(s.level, nivelEspacio || s.level), modo: resolverModo(mods), modoAuto: true, mods, critico: false, ts: null, res: null };
  // Sin nivel pedido, el espacio más bajo que aún tenga huecos libres.
  if (s.level > 0 && !nivelEspacio) for (let L = s.level; L <= 9; L++) { const tot = P.slots?.[L] || 0; if (tot - Math.min(ch.play.used?.[L] || 0, tot) > 0) { R.nivel = L; break; } }
  const k = norm(s.escuela || '').slice(0, 3);
  dlg().style.setProperty('--esc', ESC_ICO[k] ? `var(--sc-${k})` : 'var(--gold)');
  pintarCtl(); pintarOut(); pintarRecientes(); openSheet(dlg());
}

// ---- Controles ----
function pintarCtl(tsAntes = R.ts) {
  const D = datos(), { ch, s, P, t } = D, dados = dadosActuales(D), conTS = conSalvacion(t, dados);
  const k = norm(s.escuela || '').slice(0, 3);
  $('#rlTitle').innerHTML = `${gi(ESC_ICO[k] || 'd20', 'rl-d20 cj-esc-ico')} ${esc(s.es)}`;
  $('#rlSub').textContent = s.level === 0 ? `Truco, nivel de personaje ${nivelTotal(ch)}` : `Conjuro de nivel ${s.level}${R.nivel > s.level ? `, lanzado con espacio de nivel ${R.nivel}` : ''}`;
  let h = '';
  const x = srdFor(s);
  if (ch.play.conc === s.es && conObjetivos(s, [manualFor(x)?.d, s.desc, x?.dEs, x?.d])) {
    h += `<section class="cj-paso cj-obj"><p class="rl-q">Concentración: ¿sobre quién?</p><div class="objt-list">${efectoDeConjuro(s.es)?.bueno ? botonYo(ch, ch.play.concObj, 'data-rlyo') : ''}${ch.play.concObj.map((o, i) => `<button type="button" class="obj-chip ${efectoDeConjuro(s.es)?.bueno && esYo(ch, o) ? 'yo' : ''}" data-rlobjdel="${i}" aria-label="Quitar ${esc(o)}">${esc(o)}<span aria-hidden="true">×</span></button>`).join('')}
      <input class="obj-in" id="rlObj" placeholder="${ch.play.concObj.length ? 'Añadir otro…' : 'Escribe y pulsa Intro (opcional)'}" autocomplete="off" enterkeyhint="done" aria-label="Objetivo de la concentración"></div></section>`;
  }
  const fichas = [s.escuela ? `<span class="cj-chip esc">${esc(s.escuela)}</span>` : '', t?.salvacion ? `<span class="cj-chip">CD <b>${P.cd ?? '—'}</b></span>` : '', t?.ataque ? `<span class="cj-chip">Ataque <b>${P.atk == null ? '—' : sgn(P.atk)}</b></span>` : ''].filter(Boolean);
  if (fichas.length) h += `<div class="cj-fichas">${fichas.join('')}</div>`;
  if ((t?.escala?.tipo === 'espacio' || (t?.veces?.desde)) && s.level > 0) {
    const pills = []; for (let L = s.level; L <= 9; L++) {
      const tot = P.slots?.[L] || 0, libres = Math.max(0, tot - Math.min(ch.play.used?.[L] || 0, tot));
      pills.push(`<button type="button" role="radio" aria-checked="${L === R.nivel}" data-rlnivel="${L}" class="${tot ? '' : 'sin'}" title="${tot ? `${libres} de ${tot} libres` : 'No tienes espacios de este nivel'}"><b>${L}</b>${tot ? `<i class="${libres ? '' : 'agotado'}">${'●'.repeat(Math.min(libres, 4))}${libres > 4 ? '+' : ''}${libres ? '' : '○'}</i>` : ''}</button>`);
    }
    h += `<div class="cj-espacios"><span class="cj-lbl">Espacio</span><div role="radiogroup" aria-label="Espacio de nivel">${pills.join('')}</div></div>`;
  }
  if (t?.ataque) {
    h += `<section class="cj-paso"><header>${gi('d20')}<span><b>Tirada de ataque</b><small>ataque de conjuro ${esc(t.ataque)}</small></span><em>${P.atk == null ? '' : sgn(P.atk)}</em></header>
      ${R.mods.length ? `<div class="da-mods-ap"><span class="da-mods-t">Se aplica</span>${R.mods.map(m => `<button type="button" class="da-mod ${m.mal ? 'mal' : 'bien'} ${m.on ? '' : 'off'}" data-rlmod="${esc(m.id)}" aria-pressed="${m.on}"><b>${esc(fmtMod(m))}</b><span>${esc(m.fuente)}</span>${m.cond ? `<small>${esc(m.cond)}</small>` : ''}</button>`).join('')}</div>` : ''}
      <div class="dd-modo" role="radiogroup" aria-label="Tirada de ataque" data-modo="${R.modo}" style="--i:${idxDe(MODOS, R.modo)}">${MODOS.map(([m, tt, sub]) => `<button type="button" role="radio" aria-checked="${R.modo === m}" data-modo="${m}"><b>${tt}</b><small>${sub}</small></button>`).join('')}</div>
      <button type="button" class="gold dd-tirar cj-tirar" data-roll="ataque">${gi('dados')}Tirar ataque</button></section>`;
  }
  if (t?.salvacion) {
    h += `<section class="cj-paso"><header>${gi('ojo')}<span><b>Salvación de ${esc(t.salvacion)}</b><small>el objetivo tira contra tu CD</small></span><em>CD ${P.cd ?? '—'}</em></header>`;
    if (conTS) {
      h += `<div class="dd-modo cj-ts" role="radiogroup" aria-label="Resultado de la salvación" data-ts="${tsAntes || ''}" style="--i:${idxDe(TS, tsAntes)}">${TS.map(([k2, tt, sub]) => `<button type="button" role="radio" aria-checked="${tsAntes === k2}" data-ts="${k2}"><b>${tt}</b><small>${sub}</small></button>`).join('')}</div>`;
      if (R.ts === 'falla') h += `<div class="rl-efecto falla cj-efecto"><b>Si falla</b>${t.falla ? md(t.falla) : '<p>Sufre el efecto completo del conjuro.</p>'}</div>`;
      if (R.ts === 'supera') h += `<div class="rl-efecto supera cj-efecto"><b>Si supera</b>${t.supera ? md(t.supera) : `<p>${t.mitad ? 'Sufre la mitad del daño.' : 'El conjuro no le afecta.'}</p>`}</div>`;
      if (R.ts === 'varios') h += `<div class="rl-efecto cj-efecto"><b>Varios objetivos</b><p>Tira el daño una vez: la app te da el total para quien falle${t.mitad ? ' y la mitad para quien la supere' : ' (quien la supere no sufre daño)'}.</p></div>`;
    }
    h += '</section>';
  }
  const btns = dados.map((dd, i) => {
    const cura = dd.tipo === 'curación', bono = bonoDe(dd, t, P);
    let nota = cura ? 'curación' : dd.via === 'auto' ? 'automático: sin ataque ni salvación' : dd.via === 'ataque' ? 'si el ataque impacta' : 'depende de la salvación', off = false;
    if (dd.via === 'salvacion' && conTS) {
      if (!R.ts) { nota = 'elige antes el resultado de la salvación'; off = true; }
      else if (R.ts === 'supera' && !t.mitad) { nota = 'sin daño al superar la salvación'; off = true; }
      else if (R.ts === 'supera') nota = 'mitad del daño al superar la salvación';
      else if (R.ts === 'varios') nota = t.mitad ? 'total si falla, mitad si supera' : 'solo quien falle';
    }
    const crit = dd.via === 'ataque' && R.critico, n = dd.n * (crit ? 2 : 1);
    if (crit) nota += ', crítico: dados dobles';
    if (dd.veces > 1) nota = `${dd.veces} ${dd.via === 'ataque' ? 'ataques, cada uno con su tirada' : 'veces, una por proyectil'} · ${nota}`;
    return botonDados({ roll: 'dano', i, ico: gi(claveDano(dd.tipo)), clave: claveDano(dd.tipo), titulo: `${cura ? 'Curación' : 'Daño'} ${exprDe(n, dd.caras, bono)}${cura ? '' : ` ${esc(dd.tipo)}`}${dd.veces > 1 ? ` ×${dd.veces}` : ''}`, cond: dd.cond, nota, n, caras: dd.caras, bono, off, crit,
      mitad: dd.via === 'salvacion' && t.mitad && (R.ts === 'supera' || R.ts === 'varios') });
  });
  (t?.extras || []).forEach((xx, i) => {
    const off = conTS && R.ts !== 'falla' && R.ts !== 'varios' && t.falla.includes(xx.frase.slice(0, 30));
    const kk = xx.frase.search(new RegExp(`\\b${xx.n}d${xx.caras}\\b`)), ini = Math.max(0, ...[', ', ' y ', '; '].map(sep => { const v = xx.frase.lastIndexOf(sep, kk); return v < 0 ? 0 : v + sep.length; }));
    let trozo = xx.frase.slice(ini).trim().replace(/^(y|e|o)\s+/, ''); trozo = trozo.charAt(0).toUpperCase() + trozo.slice(1);
    btns.push(botonDados({ roll: 'extra', i, ico: gi('dados'), clave: 'extra', titulo: `Tirar ${exprDe(xx.n, xx.caras, xx.bono)}`, nota: trozo.length > 110 ? trozo.slice(0, 108) + '…' : trozo, n: xx.n, caras: xx.caras, bono: xx.bono, off }));
  });
  if (btns.length) {
    const titulo = dados.length && dados.every(dd => dd.tipo === 'curación') ? 'Curación' : dados.length ? 'Daño' : 'Dados';
    h += `<section class="cj-paso"><header>${gi(dados[0] ? claveDano(dados[0].tipo) : 'dados')}<span><b>${titulo}</b><small>${s.level && t?.escala?.tipo === 'espacio' ? 'cambia el espacio y los dados se ajustan' : dados.length ? 'toca para tirar' : 'otros dados del conjuro'}</small></span></header>
      <div class="cj-btns">${btns.join('')}</div>
      ${t?.ataque && dados.some(dd => dd.via === 'ataque') ? `<label class="dd-crit"><input type="checkbox" id="rlCrit" ${R.critico ? 'checked' : ''}><span class="dd-sw" aria-hidden="true"></span><span><b>Crítico</b><small>Se tiran el doble de dados de daño del ataque. Con un 20 natural se marca solo.</small></span></label>` : ''}</section>`;
  }
  if (!t || (!t.ataque && !dados.length && !t.extras.length)) h += `<p class="note">No encuentro dados de ataque ni de daño en el texto de este conjuro.${t?.salvacion ? '' : ' Importa tu manual para mejores resultados.'}</p>`;
  $('#rlCtl').innerHTML = h;
}
function botonDados({ roll, i, ico, clave, titulo, cond = '', nota, n, caras, bono, off = false, crit = false, mitad = false }) {
  const med = n * (caras + 1) / 2 + bono, visibles = Math.min(n, 8);
  const mini = Array.from({ length: visibles }, () => dado(caras, '', { cls: 'mini' })).join('') + (n > visibles ? `<i>+${n - visibles}</i>` : '');
  return `<button type="button" class="cj-dados dmg-${clave} ${cond ? 'alt' : ''} ${crit ? 'crit' : ''}" data-roll="${roll}" data-i="${i}" ${off ? 'disabled' : ''}>
    <span class="cj-dados-ico">${ico}</span>
    <span class="cj-dados-t"><b>${titulo}</b>${cond ? `<em>solo si ${esc(cond)}</em>` : ''}<small>${esc(nota)}</small><span class="cj-mini" aria-hidden="true">${mini}</span></span>
    ${n >= 2 || bono ? `<span class="cj-dados-m" title="Resultado medio esperado"><b>${fmt(med)}</b><small>${mitad ? `media · ${fmt(med / 2)} si supera` : 'media'}</small></span>` : ''}</button>`;
}
function sincSeg(sel, lista, k, attr) {
  const g = $(`#rlCtl ${sel}`); if (!g) return;
  g.dataset[attr] = k || ''; g.style.setProperty('--i', idxDe(lista, k));
  g.querySelectorAll(`[data-${attr}]`).forEach(b => b.setAttribute('aria-checked', String(b.dataset[attr] === k)));
}

// ---- Tirar ----
const DIST = new Map();
function distDe(p, { modo = 'normal', critico = false, res = null } = {}) {
  const extras = (res?.extras || []).map(x => ({ p: parsear(String(x.m.valor).replace(/^[+-]/, '')), signo: x.neg ? -1 : 1 })).filter(x => x.p);
  const plano = (res?.planos || []).reduce((s2, m) => s2 + (Number(m.valor) || 0), 0);
  const key = [JSON.stringify(p), modo, critico, extras.map(x => x.signo + JSON.stringify(x.p)).join(), plano].join('|');
  if (!DIST.has(key)) { if (DIST.size > 40) DIST.clear(); DIST.set(key, distribucion(p, { modo, critico, extras, plano })); }
  return DIST.get(key);
}
// nuevo = false recalcula la última tirada conservando sus dados (cambio de ventaja, crítico, espacio o salvación).
function tirar(tipo, i, nuevo = true) {
  const D = datos(), { s, P, t } = D, antes = R.res;
  const previo = !nuevo && antes?.tipo === tipo && antes.i === i ? antes.res : null;
  let x;
  if (tipo === 'ataque') {
    const p = parsear(`1d20${P.atk ? sgn(P.atk) : ''}`), res = resolver({ p, modo: R.modo, mods: R.mods, previo }), nat = res.r.natural;
    R.critico = nat === 20;
    x = { tipo, i, p, res, total: res.total, nat, crit: nat === 20, pifia: nat === 1, modo: R.modo, lbl: 'para impactar', dist: distDe(p, { modo: R.modo, res }),
      texto: `${s.es}: ataque ${res.total} (d20 ${nat}${R.modo !== 'normal' ? ', ' + R.modo : ''} ${sgn(P.atk || 0)})${nat === 20 ? ', crítico' : ''}` };
  } else if (tipo === 'extra') {
    const xx = t.extras[i], p = parsear(exprDe(xx.n, xx.caras, xx.bono)), res = resolver({ p, previo });
    x = { tipo, i, p, res, total: res.total, lbl: exprDe(xx.n, xx.caras, xx.bono), ctx: xx.frase, dist: distDe(p), texto: `${s.es}: ${exprDe(xx.n, xx.caras, xx.bono)} = ${res.total}` };
  } else {
    const dd = dadosActuales(D)[i]; if (!dd) return;
    const cura = dd.tipo === 'curación', crit = dd.via === 'ataque' && R.critico, bono = bonoDe(dd, t, P);
    const p = parsear(exprDe(dd.n, dd.caras, bono)), res = resolver({ p, critico: crit, previo });
    const ts = dd.via === 'salvacion' ? R.ts : null, bruto = res.total, mitad = Math.floor(bruto / 2);
    const total = ts === 'supera' ? mitad : bruto, n = dd.n * (crit ? 2 : 1);
    x = { tipo, i, p, res, total, bruto, mitad: t.mitad ? mitad : 0, ts, crit, cura, dano: dd.tipo, clave: claveDano(dd.tipo), cond: dd.cond,
      lbl: `${cura ? 'puntos de golpe' : `de ${danoDe(dd.tipo)}`}${ts === 'supera' ? ' (mitad por superar la salvación)' : ''}`, dist: distDe(p, { critico: crit }),
      texto: `${s.es}: ${ts === 'varios' ? `${bruto} (${t.mitad ? mitad : 0} si supera)` : total} ${cura ? 'de curación' : 'de ' + danoDe(dd.tipo)} (${exprDe(n, dd.caras, bono)}${s.level && R.nivel > s.level ? ', espacio ' + R.nivel : ''}${crit ? ', crítico' : ''}${ts === 'supera' ? ', mitad' : ''})` };
  }
  x.nuevo = nuevo || !previo; x.antes = x.nuevo ? null : antes.total;
  R.res = x;
  if (x.nuevo) { S.note(x.texto); recordar(x); }
  else { const log = S.cur()?.play?.log, ult = log?.[log.length - 1]; if (ult && ult.x === R.logTxt) { ult.x = x.texto; S.save(); } recordar(x, true); }
  R.logTxt = x.texto;
  if (tipo === 'ataque') pintarCtl();
  pintarOut(true); pintarRecientes(x.nuevo);
  if (x.nuevo) $('#rlOut')?.scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
}
function recordar(x, reemplaza = false) {
  if (!RECIENTES.has(R.sid)) RECIENTES.set(R.sid, []);
  const L = RECIENTES.get(R.sid), e = { total: x.total, tipo: x.tipo, clave: x.tipo === 'ataque' ? 'd20' : x.clave || 'dados', nat: x.nat, t: Date.now() };
  if (reemplaza && L.length) L[0] = e; else { L.unshift(e); if (L.length > MAX_RECIENTES) L.pop(); }
}
// Si el último resultado depende del estado (crítico, espacio o salvación), se recalcula con los mismos dados.
function reajustar() {
  const x = R.res; if (!x || x.tipo === 'extra') return;
  if (x.tipo === 'dano' && dadosActuales(datos())[x.i]) tirar('dano', x.i, false);
  if (x.tipo === 'ataque') tirar('ataque', 0, false);
}

// ---- Resultado ----
function pintarOut(anim = false) {
  const el = $('#rlOut'), x = R.res, tok = ++TOKEN;
  if (!x) { el.className = 'dd-out vacio'; el.innerHTML = `<div class="dd-espera">${dado(20, '?', { cls: 'flota' })}<p>Tira el ataque o el daño y el resultado aparecerá aquí.</p></div>`; return; }
  let clase = '', h = '';
  if (x.tipo === 'ataque') {
    const n = x.crit ? 20 : x.pifia ? 1 : null;
    clase = x.crit ? 'crit n20' : x.pifia ? 'pifia n1' : '';
    const partes = [dadosDe(x.res.r, x.modo)];
    if (x.res.r.bono) partes.push(`${op(x.res.r.bono)}<span class="dd-bono">${Math.abs(x.res.r.bono)}</span>`);
    for (const e of x.res.extras) partes.push(`${op(e.neg ? -1 : 1)}<span class="dd-fx ${e.m.mal ? 'mal' : 'bien'}">${e.t.grupos.map((g, k) => g.vals.map((v, j) => dado(g.caras, v, { cls: 'mini', fresco: e.t.frescos[k][j] })).join('')).join('')}<small>${esc(e.m.fuente)}</small></span>`);
    for (const m of x.res.planos) partes.push(`${op(m.valor)}<span class="dd-fx ${m.mal ? 'mal' : 'bien'}"><span class="dd-bono">${Math.abs(m.valor)}</span><small>${esc(m.fuente)}</small></span>`);
    if (partes.length > 1) partes.push(`<span class="dd-igual"><i class="dd-op">=</i><b class="dd-res">${x.total}</b></span>`);
    const iDano = dadosActuales(datos()).findIndex(dd => dd.via === 'ataque');
    h = `<div class="dd-hero">${sello(x.total, { n })}<div class="dd-lbl">${x.lbl}</div></div>
      ${n ? `<div class="dd-nat n${n} dd-rev" style="--r:0"><b>${n === 20 ? '¡Crítico!' : '¡Pifia!'}</b><small>${n === 20 ? 'Impacto crítico: los dados de daño se tiran dos veces.' : 'Fallo automático, sea cual sea el total.'}</small></div>` : ''}
      <div class="dd-ec">${partes.join('')}</div>${probHtml(x.dist, x.total)}
      ${iDano >= 0 && !x.pifia ? `<button type="button" class="dd-sig dd-rev ${x.crit ? 'crit' : ''}" style="--r:3" data-roll="dano" data-i="${iDano}">${gi(claveDano(dadosActuales(datos())[iDano].tipo))}Tirar daño${x.crit ? ' crítico' : ''}</button>` : ''}`;
  } else {
    const dano = x.tipo === 'dano';
    clase = dano ? `dano ${x.cura ? 'cura' : ''} dmg-${x.clave} el-${x.clave}` : '';
    const partes = [dadosDe(x.res.r)];
    if (x.res.r.bono) partes.push(`${op(x.res.r.bono)}<span class="dd-bono">${Math.abs(x.res.r.bono)}</span>`);
    const piezas = x.res.r.grupos.reduce((a, g) => a + g.vals.length, 0) + (x.res.r.bono ? 1 : 0);
    if (piezas > 1 || x.ts === 'supera') partes.push(`<span class="dd-igual"><i class="dd-op">=</i><b class="dd-res">${x.bruto ?? x.total}</b>${x.ts === 'supera' ? `<i class="dd-op">÷ 2 →</i><b class="dd-res">${x.total}</b>` : ''}</span>`);
    if (x.crit) partes.push('<span class="cj-tag crit">crítico · dados dobles</span>');
    h = `<div class="dd-hero">${sello(x.total, { ico: dano ? gi(x.clave) : gi('dados') })}<div class="dd-lbl">${esc(x.lbl)}</div></div>
      ${x.ts === 'varios' ? `<div class="cj-split dd-rev" style="--r:0"><span class="falla"><small>Quien falle</small><b>${x.bruto}</b></span><span class="supera"><small>Quien supere</small><b>${x.mitad}</b></span></div>` : ''}
      <div class="dd-ec">${partes.join('')}</div>${x.cond ? `<p class="cj-cond">Solo si ${esc(x.cond)}.</p>` : ''}${probHtml(x.dist, x.bruto ?? x.total)}
      ${x.ctx ? `<div class="rl-ctx dd-rev" style="--r:2">${md(x.ctx)}</div>` : ''}`;
  }
  el.className = `dd-out ${clase}`;
  el.innerHTML = h;
  if (!anim) { sellar(el, x.total, false); return; }
  dlg().classList.add('rodando');
  rodar(el, { total: x.total, antes: x.antes, lo: x.dist ? x.dist.min : 1, hi: x.dist ? maxDist(x.dist) : Math.max(20, x.total), nuevo: x.nuevo, vivo: () => tok === TOKEN, fin: () => asentar(el, x) });
}
// Partículas del tipo de daño al posarse el resultado.
const FX_DANO = {
  fuego: [{ color: '#FF7A3D', n: 34, speed: 2.6, up: 2.4, gravity: -0.06, life: 1300, size: 2.2 }, { color: '#FFD27A', n: 14, speed: 1.6, up: 3, gravity: -0.08, life: 900, size: 1.4 }],
  frio: [{ color: '#A8DEFF', n: 30, speed: 2.4, up: 0.3, gravity: 0.02, life: 1800, size: 1.8 }, { color: '#FFFFFF', n: 10, speed: 1.2, up: 0.5, gravity: 0.01, life: 2000, size: 1.2 }],
  relampago: [{ color: '#F5E36B', n: 44, speed: 6.5, up: 0.4, gravity: 0, life: 420, size: 1.3 }, { color: '#FFFFFF', n: 12, speed: 4, up: 0, gravity: 0, life: 300, size: 1.8 }],
  trueno: [{ color: '#A78BFA', n: 40, speed: 5.2, up: 0, gravity: 0, life: 700, size: 2 }],
  acido: [{ color: '#9BE15D', n: 26, speed: 2, up: 0.8, gravity: 0.17, life: 1300, size: 2.3 }],
  veneno: [{ color: '#5FCB7A', n: 26, speed: 1.4, up: 1.2, gravity: -0.02, life: 1700, size: 2.8 }],
  necrotico: [{ color: '#8FA07F', n: 26, speed: 1.4, up: -0.4, gravity: 0.05, life: 1700, size: 2.8 }, { color: '#3b4a38', n: 14, speed: 1, up: 0, gravity: 0.03, life: 1600, size: 3.4 }],
  radiante: [{ color: '#FFE08A', n: 44, speed: 4, up: 1.4, gravity: -0.02, life: 1300, size: 2 }],
  fuerza: [{ color: '#C38BFF', n: 34, speed: 4.4, up: 0.6, gravity: 0, life: 900, size: 2 }],
  psiquico: [{ color: '#F28BD2', n: 30, speed: 3, up: 1, gravity: -0.03, life: 1400, size: 1.8 }],
  curacion: [{ color: '#6ECB9D', n: 36, speed: 1.8, up: 2.6, gravity: -0.05, life: 1500, size: 2 }, { color: '#E9FFF3', n: 10, speed: 1.2, up: 3, gravity: -0.06, life: 1200, size: 1.3 }],
  contundente: [{ color: '#C9D0DE', n: 18, speed: 3.5, up: 0.4, gravity: 0.12, life: 700, size: 1.6 }],
};
FX_DANO.cortante = FX_DANO.perforante = FX_DANO.contundente;
function asentar(el, x) {
  dlg().classList.remove('rodando');
  $('#rlVivo').textContent = `${x.total} ${x.lbl}${x.ts === 'varios' ? `; ${x.mitad} para quien supere` : ''}${x.crit && x.tipo === 'ataque' ? ', crítico' : x.pifia ? ', pifia' : ''}.`;
  haptic(x.crit || x.pifia || (x.dist && x.total >= maxDist(x.dist)) ? 'heavy' : 'light');
  if (reducedMotion()) return;
  if (x.tipo === 'ataque' && (x.crit || x.pifia)) { fxNatural(el, x.crit ? 20 : 1, $('#rlBody')); return; }
  if (!x.nuevo) return;
  if (x.tipo === 'dano') fxImpacto(el.querySelector('.dd-hero'), { clave: x.clave, cura: x.cura, nivel: nivelImpacto(x.total, x.dist), caja: $('#rlBody') });
  const [cx, cy] = centro(el.querySelector('.dd-sello')), max = x.dist && x.total >= maxDist(x.dist);
  for (const o of FX_DANO[x.clave] || [{ color: getComputedStyle(dlg()).getPropertyValue('--esc').trim() || '#E7B85F', n: 12, speed: 2, up: 1.2, life: 700, size: 1.7 }])
    burst(cx, cy, { ...o, color: /^#/.test(o.color) ? o.color : '#E7B85F', n: Math.round(o.n * (max ? 1.8 : 1)) });
  if (x.clave === 'trueno' || (x.clave === 'fuerza' && max)) { const b = $('#rlBody'); b.classList.remove('dd-sacude'); void b.offsetWidth; b.classList.add('dd-sacude'); setTimeout(() => b.classList.remove('dd-sacude'), 700); }
}
function pintarRecientes(recien = false) {
  const el = $('#rlRec'), L = RECIENTES.get(R.sid) || [];
  el.hidden = L.length < 2; if (el.hidden) { el.innerHTML = ''; return; }
  el.innerHTML = `<span class="cj-lbl">Antes</span>${L.slice(1).map((e, i) => `<span class="cj-rec dmg-${e.clave} ${e.nat === 20 ? 'crit' : e.nat === 1 ? 'pifia' : ''} ${recien && i === 0 ? 'nuevo' : ''}" title="${e.tipo === 'ataque' ? 'Ataque' : 'Daño'}">${gi(e.clave === 'd20' ? 'd20' : e.clave === 'extra' ? 'dados' : e.clave)}<b>${e.total}</b></span>`).join('')}`;
}

export function init(store) {
  S = store;
  const body = $('#rlBody');
  body.innerHTML = '<div id="rlCtl"></div><div class="dd-out" id="rlOut"></div><p class="visually-hidden" id="rlVivo" aria-live="polite"></p><div class="cj-recientes" id="rlRec" hidden></div>';
  on(body, 'click', '[data-roll]', (e, b) => { if (!b.disabled) tirar(b.dataset.roll, +b.dataset.i || 0); });
  on(body, 'click', '[data-modo]', (e, b) => {
    if (b.dataset.modo === R.modo) return;
    R.modo = b.dataset.modo; R.modoAuto = false; sincSeg('.dd-modo[data-modo]', MODOS, R.modo, 'modo'); haptic('light');
    if (R.res?.tipo === 'ataque') tirar('ataque', 0, false);
  });
  on(body, 'click', '[data-rlmod]', (e, b) => {
    const m = R.mods.find(x => x.id === b.dataset.rlmod); if (!m) return;
    m.on = !m.on; b.classList.toggle('off', !m.on); b.setAttribute('aria-pressed', String(m.on)); haptic('light');
    if (R.modoAuto) { R.modo = resolverModo(R.mods); sincSeg('.dd-modo[data-modo]', MODOS, R.modo, 'modo'); }
    if (R.res?.tipo === 'ataque') tirar('ataque', 0, false);
  });
  on(body, 'click', '[data-ts]', (e, b) => {
    if (b.dataset.ts === R.ts) return;
    const antes = R.ts; R.ts = b.dataset.ts; haptic('light'); pintarCtl(antes);
    requestAnimationFrame(() => sincSeg('.cj-ts', TS, R.ts, 'ts'));
    if (R.res?.tipo === 'dano' && R.res.ts !== undefined && dadosActuales(datos())[R.res.i]?.via === 'salvacion') reajustar();
  });
  on(body, 'click', '[data-rlnivel]', (e, b) => { const L = +b.dataset.rlnivel; if (L === R.nivel) return; R.nivel = L; haptic('light'); pintarCtl(); reajustar(); });
  const anotar = inp => { const t = inp.value; inp.value = ''; if (!anadirObjetivos(S, 'conc', t)) return; pintarCtl(); haptic('light'); $('#rlObj')?.focus(); };
  body.addEventListener('keydown', e => { if (e.target.id === 'rlObj' && e.key === 'Enter') { e.preventDefault(); anotar(e.target); } });
  body.addEventListener('focusout', e => { if (e.target.id === 'rlObj' && e.target.value.trim()) anotar(e.target); });
  on(body, 'click', '[data-rlobjdel]', (e, b) => { quitarObjetivo(S, 'conc', +b.dataset.rlobjdel); pintarCtl(); });
  on(body, 'click', '[data-rlyo]', () => { alternarYo(S, 'conc'); pintarCtl(); });
  body.addEventListener('change', e => {
    if (e.target.id !== 'rlCrit') return;
    R.critico = e.target.checked; haptic('light'); pintarCtl();
    if (R.res?.tipo === 'dano' && dadosActuales(datos())[R.res.i]?.via === 'ataque') reajustar();
  });
}
