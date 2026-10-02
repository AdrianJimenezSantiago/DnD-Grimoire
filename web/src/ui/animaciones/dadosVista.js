// Piezas visuales compartidas por las ventanas de tiradas: dados poliédricos, sello del total,
// histograma de probabilidades y animación de dados que ruedan hasta posarse.
import { probMenor, probAlMenos, mediaDist, maxDist } from '../../domain/reglas/dados.js';
import { chispas, movimientoReducido } from './fx.js';

export const fmt = v => (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ','));
export const pct = x => { const n = x * 100; return `${n > 0 && n < 1 ? '<1' : n > 99 && n < 100 ? '>99' : Math.round(n)} %`; };

const FORMAS = {
  d4: '<polygon class="c" points="20,3 37.5,34.5 2.5,34.5"/><path class="f" d="M20 3 20 25M2.5 34.5 20 25 37.5 34.5"/>',
  d6: '<rect class="c" x="4.5" y="4.5" width="31" height="31" rx="7"/><rect class="f" x="9" y="9" width="22" height="22" rx="4"/>',
  d8: '<polygon class="c" points="20,2 37.5,20 20,38 2.5,20"/><path class="f" d="M2.5 20h35"/>',
  d10: '<polygon class="c" points="20,2 37.5,16.5 20,38 2.5,16.5"/><path class="f" d="M2.5 16.5 20 23 37.5 16.5M20 23v15"/>',
  d12: '<polygon class="c" points="20,2 38,15 31,37.5 9,37.5 2,15"/><polygon class="f" points="20,9 30,16.5 26.5,29 13.5,29 10,16.5"/>',
  d20: '<polygon class="c" points="20,2 36,11 36,29 20,38 4,29 4,11"/><polygon class="f" points="20,10 30.5,27 9.5,27"/>',
  dx: '<circle class="c" cx="20" cy="20" r="17"/><circle class="f" cx="20" cy="20" r="12"/>',
};
export const formaDe = c => (FORMAS['d' + c] ? 'd' + c : 'dx');
export const forma = c => `<svg viewBox="0 0 40 40" aria-hidden="true">${FORMAS[formaDe(c)]}</svg>`;
export function dado(c, v, { fuera = false, fresco = false, cls = '' } = {}) {
  const k = [cls, v === c ? 'max' : v === 1 ? 'min' : '', fuera ? 'fuera' : '', fresco ? 'rueda' : ''].filter(Boolean).join(' ');
  return `<span class="dd ${k}" data-f="${formaDe(c)}"${fresco ? ` data-v="${v}" data-c="${c}"` : ''} title="d${c}">${forma(c)}<b>${v}</b></span>`;
}
export const op = s => `<i class="dd-op">${s < 0 ? '−' : '+'}</i>`;
// Los dados de un resultado de tirar(): con ventaja, los dos d20 y el descartado tachado.
export function dadosDe(r, modo = 'normal', cls = '') {
  if (r.d20) {
    const [fa, fb] = r.frescos?.[0] || [false, false], usaA = r.d20.usa === r.d20.a;
    return `<span class="dd-par ${modo}" title="${modo === 'ventaja' ? 'Ventaja: cuenta el mayor' : 'Desventaja: cuenta el menor'}">${dado(20, r.d20.a, { fuera: !usaA, fresco: fa, cls })}${dado(20, r.d20.b, { fuera: usaA, fresco: fb, cls })}<small>${modo}</small></span>`;
  }
  return r.grupos.map((g, k) => `${k || g.signo < 0 ? op(g.signo) : ''}<span class="dd-grupo">${g.vals.map((v, i) => dado(g.caras, v, { fuera: g.quita?.includes(i), fresco: r.frescos?.[k]?.[i], cls })).join('')}</span>`).join('');
}

const MARCAS = Array.from({ length: 36 }, (_, i) => `<line x1="70" y1="3" x2="70" y2="${i % 3 ? 7 : 10}" transform="rotate(${i * 10} 70 70)"/>`).join('');
const ROMBOS = Array.from({ length: 8 }, (_, i) => `<rect x="67.5" y="13.5" width="5" height="5" transform="rotate(${i * 45} 70 70) rotate(45 70 16)"/>`).join('');
// Cada anillo que gira es un <svg> propio: así la GPU lo rota sin repintar el sello en cada fotograma.
export const ANILLO = `<span class="dd-anillo" aria-hidden="true"><svg viewBox="0 0 140 140"><circle class="a1" cx="70" cy="70" r="66" pathLength="100"/><circle class="a3" cx="70" cy="70" r="46" pathLength="100"/></svg><svg class="gira-marcas" viewBox="0 0 140 140"><g class="a-marcas">${MARCAS}</g></svg><svg class="gira-rombos" viewBox="0 0 140 140"><g class="a-rombos">${ROMBOS}</g></svg><svg class="gira-a2" viewBox="0 0 140 140"><circle class="a2" cx="70" cy="70" r="54"/></svg></span>`;
export const GRIETA = '<svg class="dd-grieta" viewBox="0 0 140 140" aria-hidden="true"><path d="M46 14 60 46 51 64 75 80 67 104 82 128" pathLength="1"/><path d="M60 46 38 54M75 80 99 88M67 104 52 112" pathLength="1"/></svg>';
// Sello con el total: rayos para el 20 natural, grieta para el 1, y un icono opcional encima.
export const sello = (total, { n = null, ico = '' } = {}) => `<div class="dd-sello">${n === 20 ? '<i class="dd-rayos" aria-hidden="true"></i>' : ''}${ANILLO}${ico ? `<span class="dd-ico" aria-hidden="true">${ico}</span>` : ''}<span class="dd-num" aria-hidden="true">${total}</span>${n === 1 ? GRIETA : ''}</div>`;

// Histograma con la probabilidad de cada total; marca la tirada (t) y, si la hay, la CD.
export function probHtml(d, t, { cd = null, r = 1 } = {}) {
  if (!d || d.p.length < 2) return '';
  const L = d.p.length, nb = Math.min(L, 44), w = L / nb, bins = [];
  for (let b = 0; b < nb; b++) {
    const i0 = Math.floor(b * w), i1 = Math.max(i0, Math.floor((b + 1) * w) - 1);
    let s = 0; for (let i = i0; i <= i1; i++) s += d.p[i];
    bins.push({ lo: d.min + i0, hi: d.min + i1, s });
  }
  const top = Math.max(...bins.map(b => b.s)), W = 6;
  const bars = bins.map((b, i) => {
    const h = 3 + 33 * (b.s / top), tu = t >= b.lo && t <= b.hi;
    const k = tu ? 'tu' : cd != null ? (b.lo >= cd ? 'pasa' : 'no') : b.hi < t ? 'bajo' : 'alto';
    return `<rect class="${k}" x="${i * W + 1}" y="${38 - h}" width="${W - 2}" height="${h}" rx="1.2" style="--i:${i}"/>`;
  }).join('');
  const cdX = cd != null && cd > d.min && cd <= maxDist(d) ? ((cd - d.min) / w) * W : null;
  const lineaCd = cdX != null ? `<line class="cd" x1="${cdX}" y1="0" x2="${cdX}" y2="40"/>` : '';
  const menor = probMenor(d, t), mx = maxDist(d);
  const frase = t >= mx ? '<b>El mejor resultado posible</b>' : t <= d.min ? '<b>El peor resultado posible</b>' : `Mejor que el <b>${pct(menor)}</b> de las tiradas`;
  const extra = [`media ${fmt(Math.round(mediaDist(d) * 10) / 10)}`, cd != null ? `${pct(probAlMenos(d, cd))} de superar la CD` : ''].filter(Boolean).join(' · ');
  return `<figure class="dd-prob dd-rev" style="--r:${r}"><svg viewBox="0 0 ${nb * W} 40" preserveAspectRatio="none" role="img" aria-label="Probabilidad de cada resultado, de ${d.min} a ${mx}">${bars}${lineaCd}</svg>${cdX != null ? `<span class="dd-cdmarca" style="left:${(cdX / (nb * W)) * 100}%">CD ${cd}</span>` : ''}
    <figcaption><span>${d.min}</span><span class="c"><span>${frase}</span><small>${extra}</small></span><span>${mx}</span></figcaption></figure>`;
}

// Los dados nuevos ruedan y muestran caras al azar hasta posarse; el total se sella al final.
// vivo(): false si otra tirada ha sustituido a esta. fin(): se llama una vez posado todo.
export function rodar(el, { total, antes = null, lo = 1, hi = 20, nuevo = true, vivo = () => true, fin }) {
  if (movimientoReducido()) { sellar(el, total, false); fin?.(); return; }
  const dados = [...el.querySelectorAll('.dd.rueda')], num = el.querySelector('.dd-num'), hero = el.querySelector('.dd-hero');
  const paso = dados.length ? Math.min(70, 480 / dados.length) : 0, dur = nuevo ? 460 : 320;
  dados.forEach((d, i) => d.style.setProperty('--d', `${Math.round(i * paso)}ms`));
  const hasta = dados.length ? dur + (dados.length - 1) * paso : nuevo ? 420 : 260;
  const azar = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  hero?.classList.add('girando');
  const t0 = performance.now(); let ult = 0;
  const frame = now => {
    if (!vivo() || !el.isConnected) return;
    const e = now - t0, cambia = now - ult > 55; if (cambia) ult = now;
    dados.forEach((d, i) => {
      if (d.dataset.ok) return;
      if (e >= i * paso + dur * 0.78) { d.querySelector('b').textContent = d.dataset.v; d.dataset.ok = '1'; d.classList.add('posado'); }
      else if (cambia) d.querySelector('b').textContent = azar(1, +d.dataset.c);
    });
    if (e < hasta) {
      if (cambia && num) num.textContent = antes != null ? Math.round(antes + (total - antes) * (e / hasta)) : azar(lo, hi);
      requestAnimationFrame(frame);
    } else { sellar(el, total, true); fin?.(); }
  };
  requestAnimationFrame(frame);
}
export function sellar(el, total, anim) {
  const num = el.querySelector('.dd-num'), hero = el.querySelector('.dd-hero');
  if (num) num.textContent = total;
  hero?.classList.remove('girando');
  el.querySelectorAll('.dd.rueda b').forEach(b => { b.textContent = b.parentElement.dataset.v; });
  el.classList.add('listo'); if (anim) hero?.classList.add('sella');
}
export function centro(el) { const s = el?.getBoundingClientRect(); return s ? [s.left + s.width / 2, s.top + s.height / 2] : [0, 0]; }
export function fxNatural(el, n, sacudir) {
  if (movimientoReducido()) return;
  const [cx, cy] = centro(el.querySelector('.dd-sello'));
  if (n === 20) {
    chispas(cx, cy, { color: '#F4D27A', n: 70, speed: 5.5, up: 1.4, life: 1500, size: 2.6, gravity: 0.01 });
    setTimeout(() => chispas(cx, cy, { color: '#FFF3C8', n: 30, speed: 3, up: 2.5, life: 1200, size: 1.8, gravity: -0.03 }), 240);
  } else {
    chispas(cx, cy, { color: '#FF5A45', n: 26, speed: 3.2, up: -0.4, life: 1100, size: 2.4, gravity: 0.14 });
    chispas(cx, cy, { color: '#6b6f7d', n: 18, speed: 2.4, up: 0.4, life: 1300, size: 3, gravity: 0.18 });
    if (sacudir) { sacudir.classList.remove('dd-sacude'); void sacudir.offsetWidth; sacudir.classList.add('dd-sacude'); setTimeout(() => sacudir.classList.remove('dd-sacude'), 700); }
  }
}
