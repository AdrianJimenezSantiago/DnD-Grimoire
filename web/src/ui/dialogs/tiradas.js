/**
 * Bandeja de dados: ataque de conjuro (con ventaja/desventaja), daño o curación escalados
 * al nivel del personaje o del espacio, y críticos. Las tiradas se anotan en el historial.
 */
import { esc } from '../../core/util.js';
import { perfil, sgn } from '../../domain/reglas2024.js';
import { tiradasConjuro } from '../../domain/catalogo.js';
import { dadosPara } from '../../domain/tiradas.js';
import { $, on } from '../dom.js';
import { gi } from '../tema.js';
import { openSheet } from '../dialog.js';
import { burstFrom, reducedMotion } from '../fx.js';
import { haptic } from '../../platform/native.js';

let S, R = null;   // {bi, nivel, modo:'normal'|'ventaja'|'desventaja', critico, ultimo}
const dlg = () => $('#rollDlg');
const d = caras => { const a = new Uint32Array(1); crypto.getRandomValues(a); return 1 + (a[0] % caras); };
export const ICONO_DANO = { 'ácido': 'acido', contundente: 'contundente', cortante: 'cortante', 'frío': 'frio', fuego: 'fuego', fuerza: 'fuerza', 'necrótico': 'necrotico',
  perforante: 'perforante', 'psíquico': 'psiquico', radiante: 'radiante', 'relámpago': 'relampago', trueno: 'trueno', veneno: 'veneno', 'curación': 'curacion' };
export const iconoDano = (tipo, cls = '') => `<span class="dmg dmg-${ICONO_DANO[tipo] || 'fuerza'} ${cls}" title="${esc(tipo)}">${gi(ICONO_DANO[tipo] || 'fuerza')}</span>`;

const datos = () => { const ch = S.cur(), e = ch.book[R.bi], s = S.db.catalog[e.sid]; return { ch, s, P: perfil(ch), t: tiradasConjuro(s) }; };
export function openRoll(bi, nivelEspacio) {
  const ch = S.cur(), s = S.db.catalog[ch.book[bi].sid], P = perfil(ch);
  R = { bi, nivel: s.level === 0 ? 0 : Math.max(s.level, nivelEspacio || s.level), modo: 'normal', critico: false, ultimo: null };
  if (s.level > 0 && !nivelEspacio) R.nivel = Math.max(s.level, Math.min(P.maxSlot || s.level, s.level));
  render(); openSheet(dlg());
}
function render() {
  const { ch, s, P, t } = datos();
  const dados = t ? dadosPara(t, { nivelPj: ch.nivel, nivelEspacio: s.level ? R.nivel : null, nivelConjuro: s.level }) : [];
  const esc2 = t?.escala?.tipo === 'espacio' && s.level > 0;
  $('#rlTitle').innerHTML = `${gi('d20', 'rl-d20')} ${esc(s.es)}`;
  $('#rlSub').textContent = s.level === 0 ? `Truco, nivel de personaje ${ch.nivel}` : `Conjuro de nivel ${s.level}`;
  const niveles = []; for (let L = s.level; L <= Math.max(s.level, P.maxSlot, 9) && L <= 9; L++) niveles.push(L);
  let h = '';
  if (t?.salvacion) h += `<div class="rl-save">${gi('ojo')}<span>El objetivo tira una <b>salvación de ${esc(t.salvacion)}</b> contra tu CD <b>${P.cd ?? '—'}</b>.</span></div>`;
  if (esc2) h += `<label class="f rl-lvl">Espacio de nivel<select id="rlNivel">${niveles.map(L => `<option ${L === R.nivel ? 'selected' : ''}>${L}</option>`).join('')}</select></label>`;
  if (t?.ataque) h += `<div class="seg" role="radiogroup" aria-label="Tirada de ataque">${['desventaja', 'normal', 'ventaja'].map(m => `<button type="button" role="radio" aria-checked="${R.modo === m}" data-modo="${m}">${m === 'normal' ? 'Normal' : m.charAt(0).toUpperCase() + m.slice(1)}</button>`).join('')}</div>`;
  h += '<div class="rl-btns">';
  if (t?.ataque) h += `<button type="button" class="rl-btn" data-roll="ataque">${gi('d20')}<span><b>Ataque ${P.atk == null ? '' : sgn(P.atk)}</b><small>${esc(t.ataque)}</small></span></button>`;
  dados.forEach((dd, i) => { h += `<button type="button" class="rl-btn" data-roll="dano" data-i="${i}">${iconoDano(dd.tipo)}<span><b>${dd.tipo === 'curación' ? 'Curación' : 'Daño'} ${dd.n}d${dd.caras}${dd.bono ? '+' + dd.bono : ''}${t.curacion?.mod && dd.tipo === 'curación' ? ' ' + sgn(P.mod ?? 0) : ''}</b><small>${esc(dd.tipo)}${R.critico && dd.tipo !== 'curación' ? ', crítico (dados dobles)' : ''}</small></span></button>`; });
  h += '</div>';
  if (dados.some(x => x.tipo !== 'curación')) h += `<label class="chk-line"><input type="checkbox" id="rlCrit" ${R.critico ? 'checked' : ''}> Crítico: se tiran el doble de dados de daño</label>`;
  if (!t || (!t.ataque && !dados.length)) h += `<p class="note">No encuentro dados de ataque ni de daño en el texto de este conjuro.${t?.salvacion ? '' : ' Importa tu manual para mejores resultados.'}</p>`;
  h += `<div class="rl-out" id="rlOut" aria-live="polite">${R.ultimo || '<p class="note">Elige una tirada.</p>'}</div>`;
  $('#rlBody').innerHTML = h;
}
function contar(el, total) {
  if (reducedMotion()) { el.textContent = total; return; }
  const t0 = performance.now(), dur = 520;
  const paso = now => { const k = Math.min(1, (now - t0) / dur); el.textContent = k < 1 ? d(Math.max(total + 6, 20)) : total; if (k < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}
function tirar(tipo, i) {
  const { ch, s, P, t } = datos();
  let html = '', texto = '', total = 0, clase = '';
  if (tipo === 'ataque') {
    const a = d(20), b = d(20), usa = R.modo === 'ventaja' ? Math.max(a, b) : R.modo === 'desventaja' ? Math.min(a, b) : a;
    total = usa + (P.atk || 0);
    clase = usa === 20 ? 'crit' : usa === 1 ? 'pifia' : '';
    if (usa === 20) R.critico = true;
    const dobles = R.modo !== 'normal' ? ` <span class="rl-alt">(${a} y ${b}, ${R.modo})</span>` : '';
    html = `<div class="rl-total ${clase}"><span class="rl-num">${total}</span><span class="rl-lbl">Ataque</span></div>
      <div class="rl-det">d20 <b class="die">${usa}</b>${dobles} ${sgn(P.atk || 0)}${usa === 20 ? ' <b class="tag-crit">¡Crítico!</b>' : usa === 1 ? ' <b class="tag-pifia">Pifia</b>' : ''}</div>`;
    texto = `${s.es}: ataque ${total} (d20 ${usa}${R.modo !== 'normal' ? ', ' + R.modo : ''} ${sgn(P.atk || 0)})${usa === 20 ? ', crítico' : ''}`;
  } else {
    const dd = dadosPara(t, { nivelPj: ch.nivel, nivelEspacio: s.level ? R.nivel : null, nivelConjuro: s.level })[i];
    const cur = dd.tipo === 'curación', n = dd.n * (R.critico && !cur ? 2 : 1);
    const tiradas = Array.from({ length: n }, () => d(dd.caras));
    const bono = dd.bono + (cur && t.curacion?.mod ? (P.mod || 0) : 0);
    total = tiradas.reduce((x, y) => x + y, 0) + bono;
    clase = cur ? 'cura' : '';
    html = `<div class="rl-total ${clase}">${iconoDano(dd.tipo, 'big')}<span class="rl-num">${total}</span><span class="rl-lbl">${cur ? 'puntos de golpe' : 'de daño de ' + esc(dd.tipo)}</span></div>
      <div class="rl-det">${n}d${dd.caras}: ${tiradas.map(v => `<b class="die ${v === dd.caras ? 'max' : v === 1 ? 'min' : ''}">${v}</b>`).join('')}${bono ? ` ${sgn(bono)}` : ''}${R.critico && !cur ? ' <b class="tag-crit">crítico</b>' : ''}</div>`;
    texto = `${s.es}: ${total} ${cur ? 'de curación' : 'de daño de ' + dd.tipo} (${n}d${dd.caras}${bono ? sgn(bono) : ''}${s.level && R.nivel > s.level ? ', espacio ' + R.nivel : ''}${R.critico && !cur ? ', crítico' : ''})`;
    if (!cur) R.critico = false;
  }
  R.ultimo = html; S.note(texto); render(); haptic(clase === 'crit' ? 'heavy' : 'light');
  const num = $('#rlOut .rl-num'); if (num) { contar(num, total); if (clase === 'crit') burstFrom(num, { n: 40, speed: 4.5, life: 1200 }); }
}
export function init(store) {
  S = store;
  const body = $('#rlBody');
  on(body, 'click', '[data-roll]', (e, b) => tirar(b.dataset.roll, +b.dataset.i || 0));
  on(body, 'click', '[data-modo]', (e, b) => { R.modo = b.dataset.modo; render(); });
  body.addEventListener('change', e => {
    if (e.target.id === 'rlNivel') { R.nivel = +e.target.value; render(); }
    if (e.target.id === 'rlCrit') { R.critico = e.target.checked; render(); }
  });
}
