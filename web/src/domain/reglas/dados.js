// Expresiones de dados («2d6+3», «4d6kh3»): parsear, tirar, ventaja y desventaja, y distribución de probabilidad.
export const rngCripto = caras => { const a = new Uint32Array(1); crypto.getRandomValues(a); return 1 + (a[0] % caras); };

// Un término es «2d6», «4d6kh3» (se queda los 3 mayores), «2d20kl1» (el menor) o un número.
const TERM = '(?:\\d*d\\d+(?:k[hl]?\\d+)?|\\d+)';
const RE_EXPR = new RegExp(`^[+-]?${TERM}(?:[+-]${TERM})*$`);
export function parsear(expr) {
  const t = String(expr || '').toLowerCase().replace(/\s+/g, '').replace(/−/g, '-');
  if (!t || !RE_EXPR.test(t)) return null;
  const grupos = [], partes = t.match(/[+-]?[^+-]+/g) || [];
  let bono = 0;
  for (const p of partes) {
    const signo = p.startsWith('-') ? -1 : 1, x = p.replace(/^[+-]/, ''), m = /^(\d*)d(\d+)(?:k([hl]?)(\d+))?$/.exec(x);
    if (m) {
      const n = parseInt(m[1] || '1', 10), caras = parseInt(m[2], 10);
      if (n < 1 || n > 100 || caras < 2 || caras > 1000) return null;
      const g = { n, caras, signo };
      if (m[4] != null) { const k = parseInt(m[4], 10); if (k < 1) return null; if (k < n) g.keep = { n: k, alto: m[3] !== 'l' }; }
      grupos.push(g);
    } else bono += signo * parseInt(x, 10);
  }
  // Un bono de cuatro cifras o una pila de grupos ya no es una tirada de mesa
  if (Math.abs(bono) > 1000 || grupos.length > 12) return null;
  return grupos.length || bono ? { grupos, bono } : null;
}
export const esD20Simple = p => !!p && p.grupos.length === 1 && p.grupos[0].n === 1 && p.grupos[0].caras === 20 && p.grupos[0].signo === 1 && !p.grupos[0].keep;
export function texto(p) {
  if (!p) return '';
  const g = p.grupos.map((x, i) => `${i && x.signo > 0 ? '+' : x.signo < 0 ? '−' : ''}${x.n}d${x.caras}${x.keep ? `k${x.keep.alto ? 'h' : 'l'}${x.keep.n}` : ''}`).join('');
  return g + (p.bono ? `${p.bono > 0 ? (g ? '+' : '') : '−'}${Math.abs(p.bono)}` : '');
}
// Índices de los dados que se descartan en un grupo «kh/kl».
function descartes(vals, keep) {
  if (!keep) return [];
  const orden = vals.map((v, i) => i).sort((a, b) => (keep.alto ? vals[b] - vals[a] : vals[a] - vals[b]) || a - b);
  return orden.slice(keep.n).sort((a, b) => a - b);
}

export function tirar(p, { modo = 'normal', critico = false, rng = rngCripto } = {}) {
  if (!p) return null;
  let total = p.bono; const grupos = []; let d20 = null;
  if (esD20Simple(p) && modo !== 'normal') {
    const a = rng(20), b = rng(20), usa = modo === 'ventaja' ? Math.max(a, b) : Math.min(a, b);
    d20 = { a, b, usa }; total += usa;
    grupos.push({ n: 1, caras: 20, signo: 1, vals: [usa] });
    return { total, grupos, bono: p.bono, d20, natural: usa };
  }
  for (const g of p.grupos) {
    const x = critico && g.caras !== 20 ? 2 : 1, n = g.n * x, keep = g.keep && { ...g.keep, n: g.keep.n * x };
    const vals = Array.from({ length: n }, () => rng(g.caras)), quita = descartes(vals, keep);
    const suma = vals.reduce((a, v, i) => a + (quita.includes(i) ? 0 : v), 0);
    grupos.push({ ...g, n, ...(keep ? { keep, quita } : {}), vals }); total += g.signo * suma;
  }
  const natural = esD20Simple(p) ? grupos[0].vals[0] : null;
  return { total, grupos, bono: p.bono, d20, natural };
}

// Generador que reutiliza los dados de una tirada anterior (por número de caras) y solo
// tira de verdad los que faltan. Así, pasar a ventaja añade un segundo d20 en vez de
// repetirlo todo, y marcar un crítico suma los dados nuevos a los que ya estaban.
export function rngReusa(previas = [], base = rngCripto) {
  const pool = new Map(), log = [];
  const mete = (c, vs) => { if (!pool.has(c)) pool.set(c, []); pool.get(c).push(...vs); };
  for (const r of previas.filter(Boolean)) {
    if (r.d20) mete(20, [r.d20.a, r.d20.b]);
    else for (const g of r.grupos) mete(g.caras, g.vals);
  }
  const rng = c => { const q = pool.get(c); if (q?.length) { log.push(false); return q.shift(); } log.push(true); return base(c); };
  return { rng, log };
}
// Qué dados salieron nuevos en esta tirada, con la misma forma que r.grupos[i].vals (o [a, b] con ventaja).
function frescos(r, log) {
  if (r.d20) return [[log[0] !== false, log[1] !== false]];
  let i = 0; return r.grupos.map(g => g.vals.map(() => log[i++] !== false));
}

// Resuelve una tirada completa con sus modificadores (dados extra y bonos planos).
// «previo» es la resolución anterior: sus dados se reutilizan en lugar de volver a tirar.
export function resolver({ p, modo = 'normal', critico = false, mods = [], previo = null, rng = rngCripto }) {
  if (!p) return null;
  const principal = rngReusa(previo ? [previo.r] : [], rng);
  const r = tirar(p, { modo, critico, rng: principal.rng }); r.frescos = frescos(r, principal.log);
  const cache = { ...(previo?.cache || {}) }, act = mods.filter(m => m.on);
  const extras = act.filter(m => m.efecto === 'dado').map(m => {
    const neg = String(m.valor).startsWith('-'), q = parsear(String(m.valor).replace(/^[+-]/, ''));
    if (!q) return null;
    const f = rngReusa([cache[m.id]], rng), t = tirar(q, { critico, rng: f.rng }); t.frescos = frescos(t, f.log);
    cache[m.id] = t; return { m, neg, t };
  }).filter(Boolean);
  const planos = act.filter(m => m.efecto === 'plano');
  const total = r.total + extras.reduce((s, x) => s + (x.neg ? -x.t.total : x.t.total), 0) + planos.reduce((s, m) => s + (Number(m.valor) || 0), 0);
  return { r, extras, planos, total, cache };
}

// ---- Probabilidades exactas ----
// Una distribución es { min, p } con p[i] = probabilidad de que el total valga min + i.
const LIMITE = 6000;
function sumaUniforme(d, c, signo) {
  const n = d.p.length, out = new Float64Array(n + c - 1);
  let s = 0;
  for (let i = 0; i < out.length; i++) { if (i < n) s += d.p[i]; if (i - c >= 0) s -= d.p[i - c]; out[i] = s / c; }
  return { min: d.min + (signo > 0 ? 1 : -c), p: out };
}
function convolucion(a, b) {
  const out = new Float64Array(a.p.length + b.p.length - 1);
  for (let i = 0; i < a.p.length; i++) { const x = a.p[i]; if (x) for (let j = 0; j < b.p.length; j++) out[i + j] += x * b.p[j]; }
  return { min: a.min + b.min, p: out };
}
// Grupo «kh/kl»: se enumeran todas las combinaciones si son pocas.
function distKeep(g) {
  const { n, caras: c, keep } = g;
  if (c ** n > 250000) return null;
  const k = keep.n, sums = new Map(), vals = new Array(n).fill(1);
  for (;;) {
    const s = [...vals].sort((a, b) => (keep.alto ? b - a : a - b)).slice(0, k).reduce((a, v) => a + v, 0);
    sums.set(s, (sums.get(s) || 0) + 1);
    let i = 0; while (i < n && vals[i] === c) vals[i++] = 1;
    if (i === n) break; vals[i]++;
  }
  const total = c ** n, min = k, p = new Float64Array(k * c - k + 1);
  for (const [s, f] of sums) p[s - min] = f / total;
  return g.signo > 0 ? { min, p } : { min: -(k * c), p: p.reverse() };
}
function d20Modo(modo) {
  const p = new Float64Array(20);
  for (let k = 1; k <= 20; k++) p[k - 1] = (modo === 'ventaja' ? 2 * k - 1 : 2 * (21 - k) - 1) / 400;
  return { min: 1, p };
}
function sumaExpr(d, p, { modo = 'normal', critico = false, signo = 1 } = {}) {
  if (esD20Simple(p) && modo !== 'normal') { const m = d20Modo(modo), c = convolucion(d, signo > 0 ? m : { min: -20, p: m.p.slice().reverse() }); return { min: c.min + signo * p.bono, p: c.p }; }
  for (const g of p.grupos) {
    const x = critico && g.caras !== 20 ? 2 : 1, s = g.signo * signo;
    if (g.keep) { const k = distKeep({ ...g, n: g.n * x, keep: { ...g.keep, n: g.keep.n * x }, signo: s }); if (!k) return null; d = convolucion(d, k); }
    else for (let i = 0; i < g.n * x; i++) { d = sumaUniforme(d, g.caras, s); if (d.p.length > LIMITE) return null; }
    if (d.p.length > LIMITE) return null;
  }
  return { min: d.min + signo * p.bono, p: d.p };
}
// extras: [{ p, signo }] (dados de Bendición, Guía…); plano: suma de bonos fijos.
export function distribucion(p, { modo = 'normal', critico = false, extras = [], plano = 0 } = {}) {
  if (!p) return null;
  let d = sumaExpr({ min: 0, p: Float64Array.of(1) }, p, { modo, critico });
  for (const x of extras) { if (!d) return null; d = sumaExpr(d, x.p, { critico, signo: x.signo }); }
  if (!d) return null;
  return { min: d.min + plano, p: d.p };
}
export const maxDist = d => d.min + d.p.length - 1;
export const probMenor = (d, t) => { let s = 0; for (let i = 0; i < d.p.length && d.min + i < t; i++) s += d.p[i]; return Math.min(1, s); };
export const probAlMenos = (d, t) => Math.max(0, 1 - probMenor(d, t));
export const mediaDist = d => d.p.reduce((s, x, i) => s + x * (d.min + i), 0);

export function media(p) {
  if (!p) return 0;
  if (p.grupos.some(g => g.keep)) { const d = distribucion(p); if (d) return mediaDist(d); }
  return p.grupos.reduce((s, g) => s + g.signo * (g.keep ? g.keep.n : g.n) * (g.caras + 1) / 2, 0) + p.bono;
}
export const rango = p => (p ? p.grupos.reduce(([lo, hi], g) => { const k = g.keep ? g.keep.n : g.n; return g.signo > 0 ? [lo + k, hi + k * g.caras] : [lo - k * g.caras, hi - k]; }, [p.bono, p.bono]) : [0, 0]);
