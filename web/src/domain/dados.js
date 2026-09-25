export const rngCripto = caras => { const a = new Uint32Array(1); crypto.getRandomValues(a); return 1 + (a[0] % caras); };

export function parsear(expr) {
  const t = String(expr || '').toLowerCase().replace(/\s+/g, '').replace(/−/g, '-');
  if (!t || !/^[+-]?(\d*d\d+|\d+)([+-](\d*d\d+|\d+))*$/.test(t)) return null;
  const grupos = [], partes = t.match(/[+-]?[^+-]+/g) || [];
  let bono = 0;
  for (const p of partes) {
    const signo = p.startsWith('-') ? -1 : 1, x = p.replace(/^[+-]/, ''), m = /^(\d*)d(\d+)$/.exec(x);
    if (m) {
      const n = parseInt(m[1] || '1', 10), caras = parseInt(m[2], 10);
      if (n < 1 || n > 100 || caras < 2 || caras > 1000) return null;
      grupos.push({ n, caras, signo });
    } else bono += signo * parseInt(x, 10);
  }
  return grupos.length || bono ? { grupos, bono } : null;
}
export const esD20Simple = p => !!p && p.grupos.length === 1 && p.grupos[0].n === 1 && p.grupos[0].caras === 20 && p.grupos[0].signo === 1;
export function texto(p) {
  if (!p) return '';
  const g = p.grupos.map((x, i) => `${i && x.signo > 0 ? '+' : x.signo < 0 ? '−' : ''}${x.n}d${x.caras}`).join('');
  return g + (p.bono ? `${p.bono > 0 ? (g ? '+' : '') : '−'}${Math.abs(p.bono)}` : '');
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
    const n = g.n * (critico && g.caras !== 20 ? 2 : 1), vals = Array.from({ length: n }, () => rng(g.caras));
    grupos.push({ ...g, n, vals }); total += g.signo * vals.reduce((a, b) => a + b, 0);
  }
  const natural = esD20Simple(p) ? grupos[0].vals[0] : null;
  return { total, grupos, bono: p.bono, d20, natural };
}
export const media = p => (p ? p.grupos.reduce((s, g) => s + g.signo * g.n * (g.caras + 1) / 2, 0) + p.bono : 0);
