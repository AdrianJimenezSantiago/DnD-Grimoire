/**
 * Reconstrucción de líneas a partir de los fragmentos de texto de pdf.js.
 * Separa las dos columnas de la página y ordena de arriba abajo. Puro: se prueba en Node y se usa en la app.
 */
/** Margen de la columna derecha: la x donde más fragmentos empiezan dentro de la franja central. */
export function gutterOf(items, pageWidth) {
  const count = new Map();
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const x = Math.round(it.transform[4]);
    if (x > pageWidth * 0.38 && x < pageWidth * 0.66) count.set(x, (count.get(x) || 0) + 1);
  }
  // se suman vecinos (±2) para tolerar pequeñas variaciones
  const win = x => { let c = 0; for (let d = -2; d <= 2; d++) c += count.get(x + d) || 0; return c; };
  const best = Math.max(0, ...[...count.keys()].map(win));
  if (best < 6) return pageWidth / 2;
  // el margen de la columna es el grupo significativo más a la izquierda (las tablas laterales quedan más a la derecha)
  const at = Math.min(...[...count.keys()].filter(x => win(x) >= Math.max(6, best * 0.2)));
  return at - 8;
}
export function pageToColumns(items, pageWidth) {
  const mid = gutterOf(items, pageWidth);
  const cols = [[], []];
  for (const it of items) {
    if (!it.str || !it.str.trim()) continue;
    const x = it.transform[4], y = it.transform[5], h = Math.abs(it.transform[3]) || it.height || 10;
    cols[x < mid ? 0 : 1].push({ x, y, h, w: it.width || 0, s: it.str });
  }
  return cols.map(col => {
    col.sort((a, b) => b.y - a.y || a.x - b.x);
    const lines = [];
    for (const it of col) {
      const last = lines[lines.length - 1];
      if (last && Math.abs(last.y - it.y) < Math.max(2, Math.min(it.h, last.h) * 0.45) && it.x > last.x + 1) {
        const gap = it.x - last.xEnd;
        last.s += (gap > it.h * 0.15 && !last.s.endsWith(' ') && !it.s.startsWith(' ') ? ' ' : '') + it.s;
        last.xEnd = it.x + it.w; last.h = Math.max(last.h, it.h);
      } else lines.push({ x: it.x, xEnd: it.x + it.w, y: it.y, h: it.h, s: it.s });
    }
    return lines.map(l => ({ x: l.x, y: l.y, h: l.h, s: l.s.replace(/\s+/g, ' ').trim() }));
  });
}
