// Fusión de dos lecturas OCR de la misma página. La base (la capa de texto del PDF) conserva líneas, columnas y orden;
// la segunda lectura (otro motor) solo se usa donde las dos no coinciden, y solo si arregla palabras que en la base no
// son palabras: «uua» → «una», «beoeficios» → «beneficios», «1nteligencía» → «Inteligencia».
//   const lineas = fusionar(lineasBase, textoOtro, voc)
import { plausible } from './corrector.js';

const clave = t => t.toLowerCase().replace(/[^\p{L}\d]/gu, '');
const sinSignos = t => t.replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, '');
// ¿Es una palabra de verdad? Letras: el vocabulario la conoce o es una forma de una conocida. Cifras: un número o una tirada.
function valida(t, voc) {
  const s = sinSignos(t);
  if (!s) return true;
  if (/\d/.test(s)) return /^(?:\d+(?:[.,]\d+)?|\d*d\d+|\d+[-–]\d+|[+-]\d+|\d+\/\d+)$/.test(s);
  if (/^\p{Lu}(?:[,&/]\p{Lu}){1,3}$/u.test(s)) return true; // «C,M», «D&D», «C,R»
  return /^\p{L}+$/u.test(s) && plausible(s.toLowerCase(), voc);
}
function lev(a, b) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) { const cur = [i]; for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[b.length];
}

// Alineación por palabras (programación dinámica): devuelve tramos [i0, i1, j0, j1] donde las dos lecturas difieren
function tramos(a, b) {
  const n = a.length, m = b.length, D = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) D[i][j] = a[i] === b[j] ? D[i + 1][j + 1] + 1 : Math.max(D[i + 1][j], D[i][j + 1]);
  const out = [];
  let i = 0, j = 0, i0 = 0, j0 = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { if (i > i0 || j > j0) out.push([i0, i, j0, j]); i++; j++; i0 = i; j0 = j; }
    else if (D[i + 1][j] >= D[i][j + 1]) i++; else j++;
  }
  if (i0 < n || j0 < m) out.push([i0, n, j0, m]);
  return out;
}

export function fusionar(lineas, otro, voc) {
  const toks = [];
  lineas.forEach((l, li) => l.split(' ').filter(Boolean).forEach((t, ti) => toks.push({ t, li, ti })));
  const otros = String(otro).split(/\s+/).filter(Boolean);
  const a = toks.map(x => clave(x.t)), b = otros.map(clave);
  const nuevas = lineas.map(l => l.split(' ').filter(Boolean));
  for (const [i0, i1, j0, j1] of tramos(a, b)) {
    const nb = i1 - i0, no = j1 - j0;
    if (!nb || !no || nb > 3 || no > 3) continue;
    const base = toks.slice(i0, i1), alt = otros.slice(j0, j1);
    if (base.every(x => valida(x.t, voc))) continue;
    // Mismo número de palabras: se cambian una a una, solo las que en la base no son palabras («Dote: 1niciado» → «Dote: Iniciado»)
    if (nb === no && nb > 1) {
      base.forEach((x, k) => { if (!valida(x.t, voc) && valida(alt[k], voc)) cambiar([x], [alt[k]]); });
      continue;
    }
    // Distinto número (palabras pegadas o partidas): solo si ninguna palabra de la base es válida
    if (base.some(x => valida(x.t, voc)) || !alt.every(t => valida(t, voc))) continue;
    cambiar(base, alt);
  }
  return nuevas.map(ws => ws.filter(w => w !== null).join(' '));

  function cambiar(base, alt) {
    const nb = base.length;
    // Las dos lecturas tienen que parecerse: es el mismo texto mal leído, no otro trozo de la página
    const ka = base.map(x => clave(x.t)).join(''), kb = alt.map(clave).join('');
    if (!ka || lev(ka, kb) > Math.max(1, Math.round(Math.max(ka.length, kb.length) * 0.34))) return;
    // Un tramo partido entre dos líneas no se toca (corte de palabra con guion, final de columna)
    if (base.some(x => x.li !== base[0].li)) return;
    const { li, ti } = base[0], pre = base[0].t.match(/^[^\p{L}\d]*/u)[0], suf = base[nb - 1].t.match(/[^\p{L}\d]*$/u)[0];
    // Respeta las mayúsculas de la base: «MACIOS» → «MAGOS», «1nteligencía» → «Inteligencia»
    const letrasBase = base.map(x => x.t).join('').replace(/[^\p{L}]/gu, ''), mayus = letrasBase.length > 1 && letrasBase === letrasBase.toUpperCase();
    const capital = /^[^\p{L}]*(?:\p{Lu}|\d)/u.test(sinSignos(base[0].t));
    const forma = (t, k) => (mayus ? t.toUpperCase() : k === 0 && capital ? t.replace(/\p{L}/u, c => c.toUpperCase()) : t);
    const texto = alt.map((t, k) => (k === 0 ? forma(t, k).replace(/^[^\p{L}\d]*/u, pre) : forma(t, k))).join(' ');
    const conSuf = suf ? texto.replace(/[^\p{L}\d]*$/u, suf) : texto;
    nuevas[li].splice(ti, nb, conSuf, ...Array(nb - 1).fill(null));
    if (voc.traza) voc.traza.push(['fusión', base.map(x => x.t).join(' '), conSuf]);
  }
}
