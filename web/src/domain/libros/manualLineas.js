// Reconstruye las líneas y columnas de una página del PDF a partir de los trozos de texto con posición.
export function gutterOf(items, pageWidth) {
  const count = new Map();
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const x = Math.round(it.transform[4]);
    if (x > pageWidth * 0.38 && x < pageWidth * 0.66) count.set(x, (count.get(x) || 0) + 1);
  }
  const win = x => { let c = 0; for (let d = -2; d <= 2; d++) c += count.get(x + d) || 0; return c; };
  const best = Math.max(0, ...[...count.keys()].map(win));
  if (best < 6) return pageWidth / 2;
  const at = Math.min(...[...count.keys()].filter(x => win(x) >= Math.max(6, best * 0.2)));
  return at - 8;
}
export function pageToColumns(items, pageWidth) {
  const mid = gutterOf(items, pageWidth);
  const cols = [[], []];
  for (const it of items) {
    if (!it.str) continue;
    const esp = !it.str.trim();
    if (!esp && /^\s*\d{1,3}\s*$/.test(it.str) && it.transform[5] < 75) continue;
    const x = it.transform[4], y = it.transform[5], h = Math.abs(it.transform[3]) || it.height || 10;
    const rotulo = !esp && x < mid && x > mid - pageWidth * 0.075 && /^\s*\d[\d\s–-]{0,6}$/.test(it.str);
    cols[x < mid && !rotulo ? 0 : 1].push({ x, y, h, w: esp ? 0 : it.width || 0, s: esp ? ' ' : it.str, esp });
  }
  return cols.map(col => {
    col.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    for (const it of col) {
      const tol = h => Math.max(2, h * 0.45);
      let dest = null;
      for (let k = lines.length - 1; k >= 0 && k >= lines.length - 3; k--) {
        const L = lines[k];
        if (Math.abs(L.y - it.y) >= tol(Math.min(L.h, it.h))) continue;
        const m = Math.min(L.h, it.h) * 0.6;
        if (!it.esp && L.items.some(o => !o.esp && it.x < o.x + o.w - m && it.x + it.w > o.x + m)) continue;
        dest = L; break;
      }
      if (dest) { dest.items.push(it); if (!it.esp) dest.h = Math.max(dest.h, it.h); }
      else if (!it.esp) lines.push({ y: it.y, h: it.h, items: [it] });
    }
    return lines.map(L => {
      L.items.sort((a, b) => a.x - b.x);
      let s = '', fin = -Infinity;
      const cells = [];
      for (const it of L.items) {
        if (it.esp) { if (s && !s.endsWith(' ')) s += ' '; if (cells.length) cells[cells.length - 1].s += ' '; continue; }
        const hueco = it.x - fin;
        if (!cells.length || hueco > Math.max(it.h * 1.6, 16)) cells.push({ x: it.x, s: '' });
        const c = cells[cells.length - 1];
        c.s += (c.s && hueco > it.h * 0.06 && !c.s.endsWith(' ') && !it.s.startsWith(' ') ? ' ' : '') + it.s;
        s += (s && hueco > it.h * 0.06 && !s.endsWith(' ') && !it.s.startsWith(' ') ? ' ' : '') + it.s; fin = it.x + it.w;
      }
      const segs = L.items.filter(it => !it.esp).map(it => ({ x: it.x, w: it.w, s: it.s }));
      return { x: L.items[0].x, y: L.y, h: L.h, s: s.replace(/\s+/g, ' ').trim(), segs, cells: cells.map(c => ({ x: c.x, s: c.s.replace(/\s+/g, ' ').trim() })).filter(c => c.s) };
    });
  });
}
