import { esc } from '../../core/util.js';
import { perfil, sgn, nivelTotal, magiaPara } from '../../domain/reglas2024.js';
import { manualFor, srdFor, tiradasConjuro } from '../../domain/catalogo.js';
import { conObjetivos, objetivosNuevos } from '../../domain/concentracion.js';
import { dadosPara, media } from '../../domain/tiradas.js';
import { modsTirada, resolverModo, fmtMod } from '../../domain/efectos.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { openSheet } from '../dialog.js';
import { burstFrom, reducedMotion } from '../fx.js';
import { haptic } from '../../platform/native.js';
import { md } from './conjuro.js';

let S, R = null;
const dlg = () => $('#rollDlg');
const d = caras => { const a = new Uint32Array(1); crypto.getRandomValues(a); return 1 + (a[0] % caras); };
export const ICONO_DANO = { 'ácido': 'acido', contundente: 'contundente', cortante: 'cortante', 'frío': 'frio', fuego: 'fuego', fuerza: 'fuerza', 'necrótico': 'necrotico',
  perforante: 'perforante', 'psíquico': 'psiquico', radiante: 'radiante', 'relámpago': 'relampago', trueno: 'trueno', veneno: 'veneno', 'curación': 'curacion' };
export const iconoDano = (tipo, cls = '') => `<span class="dmg dmg-${ICONO_DANO[tipo] || 'fuerza'} ${cls}" title="${esc(tipo)}">${gi(ICONO_DANO[tipo] || 'fuerza')}</span>`;
export const danoDe = tipo => (/^(psíquico|necrótico|radiante|contundente|cortante|perforante)$/.test(tipo) ? `daño ${tipo}` : `daño de ${tipo}`);
const datos = () => { const ch = S.cur(), e = ch.book[R.bi], s = S.db.catalog[e.sid]; return { ch, s, P: magiaPara(perfil(ch), e.fuente), t: tiradasConjuro(s) }; };
const fmtMedia = v => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','));
const mediaTxt = (n, caras, bono, mitad) => (n >= 2 ? `media ${fmtMedia(media(n, caras, bono))}${mitad ? `; ${fmtMedia(media(n, caras, bono) / 2)} si supera` : ''}` : '');
const TS_TXT = { falla: 'Ha fallado', supera: 'Ha superado', varios: 'Varios objetivos' };

export function openRoll(bi, nivelEspacio) {
  const ch = S.cur(), s = S.db.catalog[ch.book[bi].sid], P = perfil(ch);
  const mods = modsTirada(ch, { sobre: 'ataque' });
  R = { bi, nivel: s.level === 0 ? 0 : Math.max(s.level, nivelEspacio || s.level), modo: resolverModo(mods), mods, critico: false, ts: null, ultimo: null };
  if (s.level > 0 && !nivelEspacio) R.nivel = Math.max(s.level, Math.min(P.maxSlot || s.level, s.level));
  render(); openSheet(dlg());
}
function render() {
  const { ch, s, P, t } = datos();
  const dados = t ? dadosPara(t, { nivelPj: nivelTotal(ch), nivelEspacio: s.level ? R.nivel : null, nivelConjuro: s.level }) : [];
  const conTS = !!t?.salvacion && (dados.some(x => x.via === 'salvacion') || t.falla || t.extras.length);
  $('#rlTitle').innerHTML = `${gi('d20', 'rl-d20')} ${esc(s.es)}`;
  $('#rlSub').textContent = s.level === 0 ? `Truco, nivel de personaje ${nivelTotal(ch)}` : `Conjuro de nivel ${s.level}${R.nivel > s.level ? `, lanzado con espacio de nivel ${R.nivel}` : ''}`;
  let h = '';
  const x = srdFor(s);
  if (ch.play.conc === s.es && conObjetivos(s, [manualFor(x)?.d, s.desc, x?.dEs, x?.d])) {
    h += `<section class="rl-step rl-obj"><p class="rl-q">Concentración: ¿sobre quién?</p><div class="objt-list">${ch.play.concObj.map((o, i) => `<button type="button" class="obj-chip" data-rlobjdel="${i}" aria-label="Quitar ${esc(o)}">${esc(o)}<span aria-hidden="true">×</span></button>`).join('')}
      <input class="obj-in" id="rlObj" placeholder="${ch.play.concObj.length ? 'Añadir otro…' : 'Escribe y pulsa Intro (opcional)'}" autocomplete="off" enterkeyhint="done" aria-label="Objetivo de la concentración"></div></section>`;
  }
  if (t?.escala?.tipo === 'espacio' && s.level > 0) {
    const niveles = []; for (let L = s.level; L <= 9; L++) niveles.push(L);
    h += `<label class="f rl-lvl">Espacio de nivel<select id="rlNivel">${niveles.map(L => `<option ${L === R.nivel ? 'selected' : ''}>${L}</option>`).join('')}</select></label>`;
  }
  if (t?.salvacion) {
    h += `<section class="rl-step"><div class="rl-save">${gi('ojo')}<span>El objetivo hace una <b>tirada de salvación de ${esc(t.salvacion)}</b> contra tu CD <b class="k-num">${P.cd ?? '—'}</b>.</span></div>`;
    if (conTS) {
      h += `<p class="rl-q">¿Qué ha sacado el objetivo?</p><div class="seg seg-ts" role="radiogroup" aria-label="Resultado de la salvación">${Object.entries(TS_TXT).map(([k, v]) => `<button type="button" role="radio" aria-checked="${R.ts === k}" data-ts="${k}">${v}</button>`).join('')}</div>`;
      if (R.ts === 'falla') h += `<div class="rl-efecto falla"><b>Si falla</b>${t.falla ? md(t.falla) : '<p>Sufre el efecto completo del conjuro.</p>'}</div>`;
      if (R.ts === 'supera') h += `<div class="rl-efecto supera"><b>Si supera</b>${t.supera ? md(t.supera) : `<p>${t.mitad ? 'Sufre la mitad del daño.' : 'El conjuro no le afecta.'}</p>`}</div>`;
      if (R.ts === 'varios') h += `<div class="rl-efecto"><b>Varios objetivos</b><p>Tira el daño una vez: la app te da el total para quien falle${t.mitad ? ' y la mitad para quien la supere' : ' (quien la supere no sufre daño)'}.</p></div>`;
    }
    h += '</section>';
  }
  if (t?.ataque) {
    h += `<section class="rl-step">${R.mods.length ? `<div class="da-mods-ap"><span class="da-mods-t">Se aplica</span>${R.mods.map(m => `<button type="button" class="da-mod ${m.mal ? 'mal' : 'bien'} ${m.on ? '' : 'off'}" data-rlmod="${esc(m.id)}" aria-pressed="${m.on}"><b>${esc(fmtMod(m))}</b><span>${esc(m.fuente)}</span>${m.cond ? `<small>${esc(m.cond)}</small>` : ''}</button>`).join('')}</div>` : ''}<div class="seg" role="radiogroup" aria-label="Tirada de ataque">${['desventaja', 'normal', 'ventaja'].map(m => `<button type="button" role="radio" aria-checked="${R.modo === m}" data-modo="${m}">${m === 'normal' ? 'Normal' : m.charAt(0).toUpperCase() + m.slice(1)}</button>`).join('')}</div>
      <div class="rl-btns"><button type="button" class="rl-btn" data-roll="ataque">${gi('d20')}<span><b>Ataque ${P.atk == null ? '' : sgn(P.atk)}</b><small>ataque de conjuro ${esc(t.ataque)}</small></span></button></div></section>`;
  }
  const btns = [];
  dados.forEach((dd, i) => {
    const cura = dd.tipo === 'curación', bono = dd.bono + (cura && t.curacion?.mod ? (P.mod || 0) : 0);
    let nota = cura ? 'curación' : dd.via === 'auto' ? 'automático: sin ataque ni salvación' : dd.via === 'ataque' ? 'si el ataque impacta' : 'depende de la salvación';
    let off = false;
    if (dd.via === 'salvacion' && conTS) {
      if (!R.ts) { nota = 'elige antes el resultado de la salvación'; off = true; }
      else if (R.ts === 'supera' && !t.mitad) { nota = 'sin daño al superar la salvación'; off = true; }
      else if (R.ts === 'supera') nota = 'mitad del daño al superar la salvación';
      else if (R.ts === 'varios') nota = t.mitad ? 'total si falla, mitad si supera' : 'solo quien falle';
    }
    if (dd.via === 'ataque' && R.critico) nota += ', crítico: dados dobles';
    const nDados = dd.n * (dd.via === 'ataque' && R.critico ? 2 : 1), med = mediaTxt(nDados, dd.caras, bono, dd.via === 'salvacion' && t.mitad && (R.ts === 'supera' || R.ts === 'varios'));
    btns.push(`<button type="button" class="rl-btn ${dd.cond ? 'alt' : ''}" data-roll="dano" data-i="${i}" ${off ? 'disabled' : ''}>${iconoDano(dd.tipo)}<span><b>${cura ? 'Curación' : 'Daño'} ${dd.n}d${dd.caras}${bono ? sgn(bono) : ''} ${cura ? '' : esc(dd.tipo)}</b>${dd.cond ? `<em>solo si ${esc(dd.cond)}</em>` : ''}<small>${esc(nota)}</small></span>${med ? `<i class="rl-avg" title="Resultado medio esperado">${med}</i>` : ''}</button>`);
  });
  (t?.extras || []).forEach((x, i) => {
    const off = conTS && R.ts !== 'falla' && R.ts !== 'varios' && t.falla.includes(x.frase.slice(0, 30));
    const k = x.frase.search(new RegExp(`\\b${x.n}d${x.caras}\\b`)), ini = Math.max(0, ...[', ', ' y ', '; '].map(sep => { const v = x.frase.lastIndexOf(sep, k); return v < 0 ? 0 : v + sep.length; }));
    let trozo = x.frase.slice(ini).trim().replace(/^(y|e|o)\s+/, ''); trozo = trozo.charAt(0).toUpperCase() + trozo.slice(1);
    const med = mediaTxt(x.n, x.caras, x.bono);
    btns.push(`<button type="button" class="rl-btn extra" data-roll="extra" data-i="${i}" ${off ? 'disabled' : ''}>${gi('dados')}<span><b>Tirar ${x.n}d${x.caras}${x.bono ? sgn(x.bono) : ''}</b><small>${esc(trozo.length > 110 ? trozo.slice(0, 108) + '…' : trozo)}</small></span>${med ? `<i class="rl-avg" title="Resultado medio esperado">${med}</i>` : ''}</button>`);
  });
  if (btns.length) h += `<section class="rl-step"><div class="rl-btns">${btns.join('')}</div>${t?.ataque ? `<label class="chk-line"><input type="checkbox" id="rlCrit" ${R.critico ? 'checked' : ''}> Crítico: se tiran el doble de dados de daño del ataque</label>` : ''}</section>`;
  if (!t || (!t.ataque && !dados.length && !t.extras.length)) h += `<p class="note">No encuentro dados de ataque ni de daño en el texto de este conjuro.${t?.salvacion ? '' : ' Importa tu manual para mejores resultados.'}</p>`;
  h += `<div class="rl-out" id="rlOut" aria-live="polite">${R.ultimo || '<p class="note">El resultado aparecerá aquí.</p>'}</div>`;
  $('#rlBody').innerHTML = h;
}
function contar(el, total) {
  if (reducedMotion()) { el.textContent = total; return; }
  const t0 = performance.now(), dur = 520;
  const paso = now => { const k = Math.min(1, (now - t0) / dur); el.textContent = k < 1 ? d(Math.max(total + 6, 20)) : total; if (k < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}
const comparaMedia = (valor, n, caras, bono) => { if (n < 2) return ''; const m = media(n, caras, bono), d = valor - m;
  return ` <span class="rl-vsmedia ${d > 0 ? 'sube' : d < 0 ? 'baja' : ''}">media ${fmtMedia(m)} · ${Math.abs(d) < 0.01 ? 'justo en la media' : d > 0 ? 'por encima' : 'por debajo'}</span>`; };
const dadosHtml = (vals, caras) => vals.map(v => `<b class="die ${v === caras ? 'max' : v === 1 ? 'min' : ''}">${v}</b>`).join('');
function tirar(tipo, i) {
  const { ch, s, P, t } = datos();
  let html = '', texto = '', total = 0, clase = '';
  if (tipo === 'ataque') {
    const a = d(20), b = d(20), usa = R.modo === 'ventaja' ? Math.max(a, b) : R.modo === 'desventaja' ? Math.min(a, b) : a;
    const act = R.mods.filter(m => m.on), extras = act.filter(m => m.efecto === 'dado').map(m => { const neg = String(m.valor).startsWith('-'), [n, c] = String(m.valor).replace(/^[+-]/, '').split('d').map(x => parseInt(x || '1', 10)), vals = Array.from({ length: n }, () => d(c)); return { m, neg, vals, t: vals.reduce((a2, b2) => a2 + b2, 0) }; });
    const planos = act.filter(m => m.efecto === 'plano'), mas = extras.reduce((a2, x) => a2 + (x.neg ? -x.t : x.t), 0) + planos.reduce((a2, m) => a2 + m.valor, 0);
    total = usa + (P.atk || 0) + mas; clase = usa === 20 ? 'crit' : usa === 1 ? 'pifia' : '';
    const extraHtml = extras.map(x => ` <span class="da-extra ${x.m.mal ? 'mal' : 'bien'}">${x.neg ? '−' : '+'} ${x.vals.map(v => `<b class="die">${v}</b>`).join('')}<small>${esc(x.m.fuente)}</small></span>`).join('') + planos.map(m => ` <span class="da-extra ${m.mal ? 'mal' : 'bien'}">${sgn(m.valor)}<small>${esc(m.fuente)}</small></span>`).join('');
    if (usa === 20) R.critico = true;
    html = `<div class="rl-total ${clase}"><span class="rl-num">${total}</span><span class="rl-lbl">para impactar</span></div>
      <div class="rl-det">d20 <b class="die">${usa}</b>${R.modo !== 'normal' ? ` <span class="rl-alt">(${a} y ${b}, ${R.modo})</span>` : ''} ${sgn(P.atk || 0)}${extraHtml}${usa === 20 ? ' <b class="tag-crit">¡Crítico! Los dados de daño se doblan.</b>' : usa === 1 ? ' <b class="tag-pifia">Pifia: falla siempre.</b>' : ''}</div>`;
    texto = `${s.es}: ataque ${total} (d20 ${usa}${R.modo !== 'normal' ? ', ' + R.modo : ''} ${sgn(P.atk || 0)})${usa === 20 ? ', crítico' : ''}`;
  } else if (tipo === 'extra') {
    const x = t.extras[i], vals = Array.from({ length: x.n }, () => d(x.caras)); total = vals.reduce((p, q) => p + q, 0) + x.bono;
    html = `<div class="rl-total">${gi('dados', 'rl-big')}<span class="rl-num">${total}</span><span class="rl-lbl">${x.n}d${x.caras}${x.bono ? sgn(x.bono) : ''}</span></div>
      <div class="rl-det">${dadosHtml(vals, x.caras)}${comparaMedia(total, x.n, x.caras, x.bono)}</div><div class="rl-ctx">${md(x.frase)}</div>`;
    texto = `${s.es}: ${x.n}d${x.caras} = ${total}`;
  } else {
    const dd = dadosPara(t, { nivelPj: nivelTotal(ch), nivelEspacio: s.level ? R.nivel : null, nivelConjuro: s.level })[i];
    const cura = dd.tipo === 'curación', crit = dd.via === 'ataque' && R.critico, n = dd.n * (crit ? 2 : 1);
    const vals = Array.from({ length: n }, () => d(dd.caras)), bono = dd.bono + (cura && t.curacion?.mod ? (P.mod || 0) : 0);
    const bruto = vals.reduce((p, q) => p + q, 0) + bono;
    const ts = dd.via === 'salvacion' ? R.ts : null, mitad = Math.floor(bruto / 2);
    total = ts === 'supera' ? mitad : bruto; clase = cura ? 'cura' : '';
    const lbl = cura ? 'puntos de golpe' : `de ${danoDe(esc(dd.tipo))}`;
    html = `<div class="rl-total ${clase}">${iconoDano(dd.tipo, 'big')}<span class="rl-num">${total}</span><span class="rl-lbl">${lbl}${ts === 'supera' ? ' (mitad por superar la salvación)' : ''}</span></div>
      ${ts === 'varios' ? `<div class="rl-split"><span>Quien falle: <b>${bruto}</b></span><span>Quien supere: <b>${t.mitad ? mitad : 0}</b></span></div>` : ''}
      <div class="rl-det">${n}d${dd.caras}: ${dadosHtml(vals, dd.caras)}${bono ? ` ${sgn(bono)}` : ''}${crit ? ' <b class="tag-crit">crítico</b>' : ''}${comparaMedia(bruto, n, dd.caras, bono)}${dd.cond ? `<br><em>solo si ${esc(dd.cond)}</em>` : ''}</div>`;
    texto = `${s.es}: ${ts === 'varios' ? `${bruto} (${t.mitad ? mitad : 0} si supera)` : total} ${cura ? 'de curación' : 'de ' + danoDe(dd.tipo)} (${n}d${dd.caras}${bono ? sgn(bono) : ''}${s.level && R.nivel > s.level ? ', espacio ' + R.nivel : ''}${crit ? ', crítico' : ''}${ts === 'supera' ? ', mitad' : ''})`;
    if (crit) R.critico = false;
  }
  R.ultimo = html; S.note(texto); render(); haptic(clase === 'crit' ? 'heavy' : 'light');
  const num = $('#rlOut .rl-num'); if (num) { contar(num, total); if (clase === 'crit') burstFrom(num, { n: 40, speed: 4.5, life: 1200 }); }
  $('#rlOut')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
export function init(store) {
  S = store;
  const body = $('#rlBody');
  on(body, 'click', '[data-roll]', (e, b) => { if (!b.disabled) tirar(b.dataset.roll, +b.dataset.i || 0); });
  on(body, 'click', '[data-modo]', (e, b) => { R.modo = b.dataset.modo; render(); });
  on(body, 'click', '[data-rlmod]', (e, b) => { const m = R.mods.find(x => x.id === b.dataset.rlmod); if (!m) return; m.on = !m.on; R.modo = resolverModo(R.mods); render(); });
  on(body, 'click', '[data-ts]', (e, b) => { R.ts = b.dataset.ts; R.ultimo = null; render(); haptic(); });
  const anotar = inp => { const ch = S.cur(), nuevos = objetivosNuevos(inp.value, ch.play.concObj); inp.value = ''; if (!nuevos.length) return;
    S.act(`${ch.play.conc}: sobre ${nuevos.join(', ')}`, (db, c) => { c.play.concObj.push(...nuevos); }); render(); haptic('light'); $('#rlObj')?.focus(); };
  body.addEventListener('keydown', e => { if (e.target.id === 'rlObj' && e.key === 'Enter') { e.preventDefault(); anotar(e.target); } });
  body.addEventListener('focusout', e => { if (e.target.id === 'rlObj' && e.target.value.trim()) anotar(e.target); });
  on(body, 'click', '[data-rlobjdel]', (e, b) => { S.act('Objetivo quitado', (db, c) => { c.play.concObj.splice(+b.dataset.rlobjdel, 1); }); render(); });
  body.addEventListener('change', e => {
    if (e.target.id === 'rlNivel') { R.nivel = +e.target.value; render(); }
    if (e.target.id === 'rlCrit') { R.critico = e.target.checked; render(); }
  });
}
